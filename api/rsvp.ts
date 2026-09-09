/**
 * Confirmación de asistencia.
 *
 * Función serverless: recibe el nombre, lo valida, y manda un correo con la
 * confirmación. No hay base de datos — el correo ES el registro.
 *
 * La clave de Resend vive solo aquí, en `process.env`. Nunca sale al navegador:
 * el frontend únicamente hace `POST` a esta ruta.
 *
 * Se usa la API REST de Resend con `fetch` en vez del SDK, para no añadir una
 * dependencia al proyecto por una sola llamada HTTP.
 */

import { event } from "../src/config/event.config.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const MIN_NOMBRE = 2;
const MAX_NOMBRE = 100;

/** El formulario no puede enviarse antes de este tiempo: los bots sí lo hacen. */
const MIN_MS_EN_FORMULARIO = 1500;

/** Ventana y tope del limitador por IP. */
const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 5;

type Fallo = "INVALID_NAME" | "TOO_FAST" | "RATE_LIMITED" | "SERVER_ERROR";

interface Cuerpo {
  nombre?: unknown;
  /** Trampa: invisible para las personas, irresistible para los bots. */
  website?: unknown;
  /** Marca de tiempo de cuando se pintó el formulario. */
  abierto?: unknown;
}

/**
 * Deja el nombre en su forma canónica: sin espacios sobrantes ni dobles, y
 * compuesto en NFC para que las tildes y la Ñ viajen como un solo carácter.
 */
export function normalizaNombre(valor: string): string {
  return valor.normalize("NFC").replace(/\s+/gu, " ").trim();
}

/**
 * Acepta nombres reales: tildes, Ñ, apellidos compuestos, guiones y apóstrofos.
 * Rechaza dígitos, signos raros y cualquier cosa que huela a inyección.
 */
export function nombreValido(nombre: string): boolean {
  if (nombre.length < MIN_NOMBRE || nombre.length > MAX_NOMBRE) return false;
  return /^[\p{L}\p{M}][\p{L}\p{M} '’.‐-―-]*$/u.test(nombre);
}

/* -------------------------------------------------------------------------- */
/* Limitador por IP                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Memoria del proceso, a propósito.
 *
 * Basta para frenar un envío repetido desde la misma conexión sin montar una
 * base de datos ni un servicio aparte. Vercel puede levantar varias instancias,
 * así que esto es un freno, no una garantía; la trampa del honeypot y el tiempo
 * mínimo cubren el resto.
 */
const visitas = new Map<string, number[]>();

function demasiadasVeces(ip: string): boolean {
  const ahora = Date.now();
  const previas = (visitas.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  previas.push(ahora);
  visitas.set(ip, previas);

  // Poda perezosa para que el mapa no crezca sin fin.
  if (visitas.size > 500) {
    for (const [clave, marcas] of visitas) {
      if (marcas.every((t) => ahora - t >= VENTANA_MS)) visitas.delete(clave);
    }
  }

  return previas.length > MAX_POR_VENTANA;
}

/* -------------------------------------------------------------------------- */
/* Respuestas                                                                  */
/* -------------------------------------------------------------------------- */

function json(cuerpo: unknown, status: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const ok = () => json({ success: true }, 200);
const error = (codigo: Fallo, status: number) =>
  json({ success: false, error: codigo }, status);

/* -------------------------------------------------------------------------- */
/* Correo                                                                      */
/* -------------------------------------------------------------------------- */

function cuerpoDelCorreo(nombre: string): string {
  return [
    "Nueva confirmación de asistencia",
    "",
    "Nombre:",
    nombre,
    "",
    "Evento:",
    `${event.occasion} — ${event.babyName}`,
    "",
    "Fecha:",
    event.dateLabel,
    "",
    "Hora:",
    event.timeLabel,
  ].join("\n");
}

async function enviaCorreo(nombre: string): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  const para = process.env["RSVP_TO_EMAIL"];
  const desde = process.env["RSVP_FROM_EMAIL"];
  const copia = process.env["RSVP_CC_EMAIL"];

  if (!apiKey || !para || !desde) {
    throw new Error(
      "Faltan RESEND_API_KEY, RSVP_TO_EMAIL o RSVP_FROM_EMAIL en el entorno.",
    );
  }

  const respuesta = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: desde,
      to: [para],
      ...(copia ? { cc: [copia] } : {}),
      subject: `Nueva confirmación de asistencia — ${event.babyName}`,
      text: cuerpoDelCorreo(nombre),
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`Resend respondió ${respuesta.status}: ${detalle}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Manejador                                                                   */
/* -------------------------------------------------------------------------- */

export async function manejaRsvp(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ success: false, error: "SERVER_ERROR" }, 405);
  }

  let cuerpo: Cuerpo;
  try {
    cuerpo = (await request.json()) as Cuerpo;
  } catch {
    return error("INVALID_NAME", 400);
  }

  // Honeypot: si viene relleno es un bot. Se responde con éxito para no
  // enseñarle qué le delató, pero no se manda ningún correo.
  if (typeof cuerpo.website === "string" && cuerpo.website.trim() !== "") {
    return ok();
  }

  // Nadie escribe su nombre completo en menos de segundo y medio.
  const abierto = Number(cuerpo.abierto);
  if (Number.isFinite(abierto) && Date.now() - abierto < MIN_MS_EN_FORMULARIO) {
    return error("TOO_FAST", 429);
  }

  if (typeof cuerpo.nombre !== "string") return error("INVALID_NAME", 400);
  const nombre = normalizaNombre(cuerpo.nombre);
  if (!nombreValido(nombre)) return error("INVALID_NAME", 400);

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "desconocida";
  if (demasiadasVeces(ip)) return error("RATE_LIMITED", 429);

  try {
    await enviaCorreo(nombre);
  } catch (e) {
    // El motivo se queda en los registros del servidor; al invitado solo le
    // llega que no se pudo, para no filtrar nada del entorno.
    console.error("[rsvp] fallo al enviar el correo:", e);
    return error("SERVER_ERROR", 500);
  }

  return ok();
}

export default manejaRsvp;

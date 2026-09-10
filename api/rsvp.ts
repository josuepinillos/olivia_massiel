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
 *
 * Firma Node de Vercel: `(req, res)`. La respuesta se ESCRIBE en `res`; lo que
 * devuelva la funcion se ignora. Una version anterior devolvia un `Response` al
 * estilo web y Vercel nunca lo miraba, asi que la peticion se quedaba abierta
 * hasta agotar los 300 s de la funcion. Ahora todas las ramas terminan llamando
 * a `responde`.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { event } from "../src/config/event.config.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const MIN_NOMBRE = 2;
const MAX_NOMBRE = 100;

/** El formulario no puede enviarse antes de este tiempo: los bots sí lo hacen. */
const MIN_MS_EN_FORMULARIO = 1500;

/** Ventana y tope del limitador por IP. */
const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 5;

/**
 * Corte para la llamada a Resend.
 *
 * Sin el, un proveedor que no contesta mantiene viva la funcion hasta el limite
 * de la plataforma. Con el, el invitado ve el mensaje de reintento en segundos.
 */
const RESEND_TIMEOUT_MS = 10_000;

type Fallo = "INVALID_NAME" | "TOO_FAST" | "RATE_LIMITED" | "SERVER_ERROR";

/** Lo que Vercel entrega en el runtime de Node, con el cuerpo ya parseado. */
export interface PeticionVercel extends IncomingMessage {
  body?: unknown;
}

/** `status()` y `json()` son los ayudantes que Vercel anade a la respuesta. */
export interface RespuestaVercel extends ServerResponse {
  status(codigo: number): RespuestaVercel;
  json(cuerpo: unknown): void;
}

interface Cuerpo {
  nombre?: unknown;
  /** Trampa: invisible para las personas, irresistible para los bots. */
  website?: unknown;
  /** Marca de tiempo de cuando se pintó el formulario. */
  abierto?: unknown;
}

/* -------------------------------------------------------------------------- */
/* Validación                                                                  */
/* -------------------------------------------------------------------------- */

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

/**
 * Unica salida del endpoint. Todas las ramas pasan por aqui, y se comprueba
 * `headersSent` para que un segundo intento de responder no reviente la funcion
 * despues de haber contestado ya.
 */
function responde(res: RespuestaVercel, codigo: number, cuerpo: unknown): void {
  if (res.headersSent) return;
  res.status(codigo).json(cuerpo);
}

const ok = (res: RespuestaVercel) => responde(res, 200, { success: true });
const fallo = (res: RespuestaVercel, codigo: Fallo, estado: number) =>
  responde(res, estado, { success: false, error: codigo });

/* -------------------------------------------------------------------------- */
/* Cuerpo de la petición                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Vercel suele entregar `req.body` ya parseado, pero no siempre: depende de la
 * cabecera y del runtime. Si no viene, se lee del flujo. Un cuerpo ilegible se
 * trata como vacio y la validacion posterior lo rechaza.
 */
async function leeCuerpo(req: PeticionVercel): Promise<Cuerpo> {
  if (req.body && typeof req.body === "object") return req.body as Cuerpo;

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as Cuerpo;
    } catch {
      return {};
    }
  }

  const trozos: Buffer[] = [];
  for await (const trozo of req) trozos.push(trozo as Buffer);
  if (trozos.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(trozos).toString("utf8")) as Cuerpo;
  } catch {
    return {};
  }
}

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
    signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`Resend respondió ${respuesta.status}: ${detalle}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Manejador                                                                   */
/* -------------------------------------------------------------------------- */

export default async function handler(
  req: PeticionVercel,
  res: RespuestaVercel,
): Promise<void> {
  // Red de seguridad: pase lo que pase ahi dentro, el cliente recibe respuesta.
  // Es lo que evita que la peticion se quede abierta hasta el timeout.
  try {
    if (req.method !== "POST") {
      fallo(res, "SERVER_ERROR", 405);
      return;
    }

    const cuerpo = await leeCuerpo(req);

    // Honeypot: si viene relleno es un bot. Se responde con éxito para no
    // enseñarle qué le delató, pero no se manda ningún correo.
    if (typeof cuerpo.website === "string" && cuerpo.website.trim() !== "") {
      ok(res);
      return;
    }

    // Nadie escribe su nombre completo en menos de segundo y medio.
    const abierto = Number(cuerpo.abierto);
    if (Number.isFinite(abierto) && Date.now() - abierto < MIN_MS_EN_FORMULARIO) {
      fallo(res, "TOO_FAST", 429);
      return;
    }

    if (typeof cuerpo.nombre !== "string") {
      fallo(res, "INVALID_NAME", 400);
      return;
    }
    const nombre = normalizaNombre(cuerpo.nombre);
    if (!nombreValido(nombre)) {
      fallo(res, "INVALID_NAME", 400);
      return;
    }

    const reenviada = req.headers["x-forwarded-for"];
    const ip =
      (Array.isArray(reenviada) ? reenviada[0] : reenviada)
        ?.split(",")[0]
        ?.trim() ||
      (req.headers["x-real-ip"] as string | undefined) ||
      "desconocida";
    if (demasiadasVeces(ip)) {
      fallo(res, "RATE_LIMITED", 429);
      return;
    }

    try {
      await enviaCorreo(nombre);
    } catch (e) {
      // El motivo se queda en los registros del servidor; al invitado solo le
      // llega que no se pudo, para no filtrar nada del entorno.
      console.error("[rsvp] fallo al enviar el correo:", e);
      fallo(res, "SERVER_ERROR", 500);
      return;
    }

    ok(res);
  } catch (e) {
    console.error("[rsvp] error inesperado:", e);
    fallo(res, "SERVER_ERROR", 500);
  }
}

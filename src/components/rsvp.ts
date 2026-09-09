/**
 * Confirmación de asistencia.
 *
 * El invitado deja su nombre, se envía a la función serverless y se le responde
 * con un pequeño mensaje flotante. Sin recargar, sin salir de la invitación y
 * sin pedirle nada más que su nombre.
 *
 * El sonido de la página no participa aquí: esta sección no emite ninguna nota.
 */

import { rsvp, copy } from "../config/event.config";

const MIN_NOMBRE = 2;
const MAX_NOMBRE = 100;

/** Los mismos caracteres que acepta el servidor: letras, espacio, guion, apóstrofo. */
const NOMBRE = /^[\p{L}\p{M}][\p{L}\p{M} '’.‐-―-]*$/u;

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled])";

/** Deja el nombre en su forma canónica, igual que hace el servidor. */
function normaliza(valor: string): string {
  return valor.normalize("NFC").replace(/\s+/gu, " ").trim();
}

/** Para el saludo del mensaje: «María Fernanda Rodríguez» → «María». */
function primerNombre(nombre: string): string {
  return nombre.split(" ")[0] ?? nombre;
}

export function initRsvp(): void {
  const form = document.querySelector<HTMLFormElement>("[data-rsvp-form]");
  const input = document.querySelector<HTMLInputElement>("[data-rsvp-input]");
  const trap = document.querySelector<HTMLInputElement>("[data-rsvp-trap]");
  const submit = document.querySelector<HTMLButtonElement>("[data-rsvp-submit]");
  const message = document.querySelector<HTMLElement>("[data-rsvp-message]");
  const modal = document.querySelector<HTMLElement>("[data-rsvp-modal]");
  const panel = document.querySelector<HTMLElement>("[data-rsvp-modal-panel]");
  const titulo = document.querySelector<HTMLElement>("#rsvp-modal-titulo");
  const cerrar = document.querySelector<HTMLButtonElement>(
    "[data-rsvp-modal-close]",
  );
  const scrim = document.querySelector<HTMLElement>("[data-rsvp-modal-scrim]");
  if (!form || !input || !submit || !message || !modal || !panel || !titulo || !cerrar) {
    return;
  }

  /** Momento en que se pintó el formulario: el servidor descarta envíos instantáneos. */
  const abierto = Date.now();
  let enviando = false;
  let ultimoFoco: HTMLElement | null = null;

  /* --- Mensajes bajo el formulario -------------------------------------- */

  const muestra = (texto: string) => {
    message.textContent = texto;
    message.hidden = false;
  };
  const limpia = () => {
    message.textContent = "";
    message.hidden = true;
  };

  /* --- El mensaje flotante ----------------------------------------------- */

  const abre = (nombre: string) => {
    titulo.textContent = copy.rsvpSection.modalTitle.replace(
      "{nombre}",
      primerNombre(nombre),
    );
    ultimoFoco = (document.activeElement as HTMLElement | null) ?? submit;
    modal.hidden = false;
    // Deja que el navegador aplique `hidden:false` antes de animar la entrada.
    requestAnimationFrame(() => modal.classList.add("is-open"));
    document.documentElement.classList.add("has-modal-open");
    cerrar.focus();
  };

  const cierra = () => {
    modal.classList.remove("is-open");
    modal.hidden = true;
    document.documentElement.classList.remove("has-modal-open");
    // Vuelta al estado inicial: el campo queda limpio y listo para otra persona.
    input.value = "";
    limpia();
    (ultimoFoco ?? submit).focus();
    ultimoFoco = null;
  };

  const onKeydown = (e: KeyboardEvent) => {
    if (modal.hidden) return;

    if (e.key === "Escape") {
      e.preventDefault();
      cierra();
      return;
    }

    if (e.key !== "Tab") return;

    // Mientras el mensaje está abierto, el teclado no debe alcanzar la página
    // que queda detrás.
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length === 0) return;
    const primero = focusables[0]!;
    const ultimo = focusables[focusables.length - 1]!;
    const activo = document.activeElement;

    if (e.shiftKey && activo === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && activo === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  };

  cerrar.addEventListener("click", cierra);
  scrim?.addEventListener("click", cierra);
  document.addEventListener("keydown", onKeydown);

  /* --- Envío -------------------------------------------------------------- */

  const bloquea = (activo: boolean) => {
    enviando = activo;
    submit.disabled = activo;
    input.readOnly = activo;
    submit.textContent = activo
      ? copy.rsvpSection.sending
      : copy.rsvpSection.cta;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (enviando) return; // corta el doble clic y el doble Enter

    const nombre = normaliza(input.value);
    if (nombre === "") {
      muestra(copy.rsvpSection.errorEmpty);
      input.focus();
      return;
    }
    if (nombre.length < MIN_NOMBRE || nombre.length > MAX_NOMBRE || !NOMBRE.test(nombre)) {
      muestra(copy.rsvpSection.errorInvalid);
      input.focus();
      return;
    }

    limpia();
    bloquea(true);

    try {
      const respuesta = await fetch(rsvp.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nombre,
          website: trap?.value ?? "",
          abierto,
        }),
      });
      const datos = (await respuesta.json()) as { success?: boolean };
      if (!respuesta.ok || datos.success !== true) throw new Error("rechazado");

      abre(nombre);
    } catch {
      // Da igual el motivo —red, servidor, validación—: al invitado le basta
      // con saber que puede volver a intentarlo sin perder lo escrito.
      muestra(copy.rsvpSection.errorSend);
    } finally {
      bloquea(false);
    }
  });
}

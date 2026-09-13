/**
 * Boton «Guardar mi nombre» y su aviso.
 *
 * Solo interfaz: pide la imagen a composeKeepsake, lanza la descarga y cuenta
 * al invitado lo que ha pasado. La seccion le dice cual es el nombre vigente y
 * cuando cambia.
 */

import { copy } from "../config/event.config";
import { composeKeepsake } from "./composeKeepsake";
import { keepsakeFileName, startDownload } from "./downloadBlob";
import { shareableFile, shareFile } from "./shareFile";

export interface KeepsakeElements {
  readonly button: HTMLButtonElement;
  readonly status: HTMLElement;
  readonly statusText: HTMLElement;
  readonly again: HTMLAnchorElement;
  /** «Compartir mi recuerdo». Opcional: sin el, solo hay descarga. */
  readonly share: HTMLButtonElement | null;
}

export interface KeepsakeControl {
  /** Nombre ya compuesto en pantalla, o null si no hay ninguno. */
  setName(name: string | null): void;
}

export function bindKeepsake(elements: KeepsakeElements): KeepsakeControl {
  const { button, status, statusText, again, share } = elements;
  const text = copy.nameMelody;

  let name: string | null = null;
  let busy = false;
  /** URL del ultimo PNG, para «descargar de nuevo». Se libera al sustituirla. */
  let fileUrl: string | null = null;
  /** El mismo PNG, listo para el menu de compartir, si el navegador lo admite. */
  let sharedFile: File | null = null;

  const releaseFile = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    fileUrl = null;
    sharedFile = null;
    again.hidden = true;
    again.removeAttribute("href");
    again.removeAttribute("download");
    if (share) share.hidden = true;
  };

  const say = (message: string | null) => {
    status.hidden = message === null;
    statusText.textContent = message ?? "";
  };

  const setBusy = (value: boolean) => {
    busy = value;
    button.disabled = value || name === null;
    button.setAttribute("aria-busy", String(value));
    button.textContent = value ? text.saving : text.save;
    button.setAttribute("aria-label", value ? text.saving : text.saveLabel);
  };

  button.addEventListener("click", async () => {
    if (busy || name === null) return;
    const current = name;
    setBusy(true);
    say(null);

    try {
      const blob = await composeKeepsake(current);
      // Si mientras tanto se compuso otro nombre, este recuerdo ya no vale.
      if (current !== name) return;

      releaseFile();
      const fileName = keepsakeFileName(current);
      fileUrl = startDownload(blob, fileName);

      // Alternativa por si el navegador bloqueo la descarga automatica.
      again.href = fileUrl;
      again.download = fileName;
      again.hidden = false;
      say(text.saved);

      // Compartir usa exactamente el mismo PNG. Solo se ofrece si el navegador
      // confirma que puede compartir ese archivo; si no, el boton no aparece.
      sharedFile = shareableFile(blob, fileName);
      if (share) share.hidden = sharedFile === null;
    } catch (error) {
      if (import.meta.env.DEV) console.error("[recuerdo] no se pudo generar:", error);
      say(text.saveError);
    } finally {
      setBusy(false);
    }
  });

  // navigator.share exige un gesto del usuario, por eso el menu se abre desde
  // su propio boton y con el archivo ya generado: sin esperas entre medias.
  share?.addEventListener("click", async () => {
    if (!sharedFile) return;
    const result = await shareFile(sharedFile);
    if (result === "error") say(text.shareError);
  });

  return {
    setName(next) {
      name = next;
      releaseFile();
      say(null);
      button.hidden = next === null;
      setBusy(busy);
    },
  };
}

/**
 * Compartir el recuerdo con el menu nativo del dispositivo (Web Share API).
 *
 * No hay integracion con Instagram ni con ninguna otra red: el sistema ofrece
 * sus propias opciones (Instagram, WhatsApp, Guardar imagen...) y el archivo
 * viaja directamente a la aplicacion elegida. Nada pasa por un servidor.
 */

/**
 * El PNG envuelto como `File`, o null si este navegador no puede compartirlo.
 *
 * Se comprueba todo antes de ofrecer la opcion: que existan `navigator.share`
 * y `navigator.canShare`, y que `canShare` acepte este archivo concreto. En
 * escritorio y en navegadores antiguos devuelve null sin lanzar nada.
 */
export function shareableFile(blob: Blob, fileName: string): File | null {
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") {
    return null;
  }
  try {
    const file = new File([blob], fileName, { type: "image/png" });
    return navigator.canShare({ files: [file] }) ? file : null;
  } catch {
    // Safari antiguo lanza al construir File o al consultar canShare con archivos.
    return null;
  }
}

export type ShareResult = "shared" | "cancelled" | "error";

/**
 * Abre el menu de compartir con el archivo. Cerrar el menu sin elegir nada no
 * es un error: se devuelve "cancelled" y no se avisa al invitado.
 */
export async function shareFile(file: File): Promise<ShareResult> {
  try {
    await navigator.share({ files: [file] });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    if (import.meta.env.DEV) console.error("[recuerdo] no se pudo compartir:", error);
    return "error";
  }
}

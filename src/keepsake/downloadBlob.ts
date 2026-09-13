/**
 * Descarga local de un archivo generado en el navegador.
 */

/**
 * `olivia-massiel-maria-fernanda.png`: minusculas, sin tildes ni eñes, con
 * guiones en lugar de espacios y sin nada que un sistema de archivos pueda
 * rechazar. Si no queda nada utilizable, `olivia-massiel-recuerdo.png`.
 */
export function keepsakeFileName(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `olivia-massiel-${slug || "recuerdo"}.png`;
}

/**
 * Crea la URL del archivo y lanza la descarga con un enlace temporal.
 *
 * Devuelve la URL para poder ofrecer «descargar de nuevo» si el navegador
 * bloqueo la primera. Quien la recibe es responsable de liberarla con
 * `URL.revokeObjectURL` cuando ya no haga falta.
 */
export function startDownload(blob: Blob, fileName: string): string {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  return url;
}

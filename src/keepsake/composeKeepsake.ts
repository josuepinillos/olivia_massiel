/**
 * El recuerdo para historias: 1080 x 1920, PNG, generado en el navegador.
 *
 * La plantilla es la aprobada (assets/reference/recuerdo-plantilla-aprobada.png),
 * escalada a 1080 x 1920 y retocada solo con sus propios pixeles:
 *
 * - sin el nombre de ejemplo ni su firma tipografica, rellenando esas franjas
 *   con el lino de la propia plantilla;
 * - «By» se conserva con su letra original, centrado en su linea;
 * - «BABY SHOWER» pasa a «BABYSHOWER» acercando SHOWER a BABY con el mismo
 *   interletrado del resto de la palabra.
 *
 * Trae ya todo lo fijo en su sitio: lino, marco pespunteado, lazo, texto
 * superior, OLIVIA MASSIEL, flor, «By», fecha, BABYSHOWER y flor inferior.
 * Encima se dibuja lo bordado, con los WebP reales del alfabeto: el nombre del
 * invitado y, debajo de «By», la firma «Olivia Massiel».
 *
 * Nada sale del navegador: ni la imagen ni el nombre.
 */

import { layoutLine, layoutName, resolveWords, type Box } from "./nameLayout";

export const KEEPSAKE_WIDTH = 1080;
export const KEEPSAKE_HEIGHT = 1920;

const TEMPLATE_SRC = "images/recuerdo/plantilla-recuerdo.webp";

/**
 * Caja del nombre, en pixeles del lienzo.
 *
 * Medida sobre la plantilla: la flor superior termina en y = 634 y «By»
 * empieza en y = 1027. La caja deja 46 px bajo la flor y 61 px sobre «By»: el
 * nombre se apoya en la firma, como en la plantilla, pero sin amontonarse
 * (con 32 px, Valentina o Maximiliano quedaban pegados). En
 * horizontal, 150 px de margen a cada lado: holgura de sobra respecto del marco
 * ondulado, que a esa altura queda entre x = 70 y x = 1010.
 */
export const NAME_BOX: Box = { x: 150, y: 680, width: 780, height: 286 };

/**
 * Firma bordada bajo «By».
 *
 * «By» ocupa y = 1027-1077 en la plantilla; la firma cuelga 15 px por debajo,
 * pegada a el, y queda a mas de 100 px de la fecha. Es secundaria: nunca pasa
 * de 0,28 (la mayuscula a unos 60 px) ni del 62 % de la escala del nombre del
 * invitado, de modo que un nombre largo y reducido sigue siendo el protagonista.
 */
export const SIGNATURE = "Olivia Massiel";
const SIGNATURE_TOP = 1092;
const SIGNATURE_MAX_SCALE = 0.28;
const SIGNATURE_RATIO = 0.62;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

/**
 * Compone la pieza y la devuelve como PNG.
 *
 * Todas las imagenes se cargan antes de dibujar la primera: si falla una, no
 * se genera nada. Lo mismo si falta una pieza del alfabeto (MissingGlyphError).
 */
export async function composeKeepsake(name: string): Promise<Blob> {
  const layout = layoutName(resolveWords(name), NAME_BOX);
  if (layout.glyphs.length === 0) throw new Error("El nombre no tiene letras.");

  const signature = layoutLine(
    resolveWords(SIGNATURE),
    KEEPSAKE_WIDTH / 2,
    SIGNATURE_TOP,
    Math.min(SIGNATURE_MAX_SCALE, layout.scale * SIGNATURE_RATIO),
  );
  const pieces = [...layout.glyphs, ...signature.glyphs];

  const sources = [TEMPLATE_SRC, ...new Set(pieces.map((glyph) => glyph.src))];
  const images = new Map(
    await Promise.all(sources.map(async (src) => [src, await loadImage(src)] as const)),
  );

  const canvas = document.createElement("canvas");
  canvas.width = KEEPSAKE_WIDTH;
  canvas.height = KEEPSAKE_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D no disponible.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(images.get(TEMPLATE_SRC)!, 0, 0, KEEPSAKE_WIDTH, KEEPSAKE_HEIGHT);
  for (const glyph of pieces) {
    context.drawImage(images.get(glyph.src)!, glyph.x, glyph.y, glyph.width, glyph.height);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob no devolvio imagen."))),
      "image/png",
    );
  });
}

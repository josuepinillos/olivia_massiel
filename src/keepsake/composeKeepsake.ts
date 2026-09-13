/**
 * El recuerdo para historias: 1080 x 1920, PNG, generado en el navegador.
 *
 * La plantilla es la aprobada (assets/reference/recuerdo-plantilla-aprobada.png),
 * escalada a 1080 x 1920 y retocada solo con sus propios pixeles:
 *
 * - sin el nombre de ejemplo ni la firma «By Olivia Massiel», rellenando esas
 *   franjas con el lino de la propia plantilla;
 * - «BABY SHOWER» pasa a «BABYSHOWER» acercando SHOWER a BABY con el mismo
 *   interletrado del resto de la palabra.
 *
 * Trae ya todo lo fijo en su sitio: lino, marco pespunteado, lazo, texto
 * superior, OLIVIA MASSIEL, flor, fecha, BABYSHOWER y flor inferior. Encima se
 * dibuja lo unico que cambia: el nombre del invitado, con los WebP reales del
 * alfabeto, como unico protagonista.
 *
 * Nada sale del navegador: ni la imagen ni el nombre.
 */

import { layoutName, resolveWords, type Box } from "./nameLayout";

export const KEEPSAKE_WIDTH = 1080;
export const KEEPSAKE_HEIGHT = 1920;

const TEMPLATE_SRC = "images/recuerdo/plantilla-recuerdo.webp";

/**
 * Caja del nombre, en pixeles del lienzo.
 *
 * Sin firma debajo, el nombre ya no se apoya en nada: se centra en el hueco
 * que queda entre la flor superior (termina en y = 634) y el divisor de la
 * fecha (empieza en y = 1275). Su centro va en y = 935, unos 20 px por encima
 * del centro exacto, que es donde el ojo lo percibe equilibrado. Tamaño de la
 * caja sin cambios (780 x 286), asi que la escala de cada nombre es la misma
 * que antes. En horizontal, 150 px de margen a cada lado: holgura de sobra
 * respecto del marco ondulado, que a esa altura queda entre x = 70 y x = 1010.
 */
export const NAME_BOX: Box = { x: 150, y: 792, width: 780, height: 286 };

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

  const sources = [TEMPLATE_SRC, ...new Set(layout.glyphs.map((glyph) => glyph.src))];
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
  for (const glyph of layout.glyphs) {
    context.drawImage(images.get(glyph.src)!, glyph.x, glyph.y, glyph.width, glyph.height);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob no devolvio imagen."))),
      "image/png",
    );
  });
}

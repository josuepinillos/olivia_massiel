/**
 * El alfabeto bordado: nota y asset de cada letra.
 *
 * La asignacion es determinista: la A suena siempre igual, la B tambien. Nada
 * es aleatorio. La secuencia es pentatonica mayor de Do, la misma que usa el
 * hero, de modo que toda la pagina suena al mismo instrumento y cualquier
 * combinacion de letras resulta consonante.
 */

/** Alfabeto español, con la Ñ en su sitio. */
export const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

/** Do5 · Re5 · Mi5 · Sol5 · La5 · Do6 · Re6, repetidos a lo largo del alfabeto. */
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];

/**
 * Letras sin pieza utilizable. Hoy no hay ninguna: el alfabeto esta completo.
 *
 * Se conserva el mecanismo porque la sustitucion de un asset puede volver a
 * dejar una letra fuera de juego, y es preferible una pieza de espera anunciada
 * a una imagen rota.
 *
 * Historia, por si vuelve a pasar: el paquete original se troceo con un paso de
 * 470 px sobre baldosas de 512, asi que las ultimas letras quedaron partidas
 * entre archivos contiguos. La X y la Y se recompusieron juntando sus mitades
 * con ese mismo paso. La Z se recorto de `public/images/alfabeto.png`, la lamina
 * completa, separandola del fondo por difusion desde los bordes.
 */
export const UNAVAILABLE = new Set<string>();

/**
 * Acentos que se pisan solo para localizar el asset. El texto que se muestra
 * conserva los suyos: JOSUÉ se sigue escribiendo con tilde, pero busca `E.webp`.
 * La Ñ no entra aqui: es una letra propia y tiene su asset.
 */
const FOLD: Record<string, string> = {
  Á: "A", À: "A", Ä: "A", Â: "A",
  É: "E", È: "E", Ë: "E", Ê: "E",
  Í: "I", Ì: "I", Ï: "I", Î: "I",
  Ó: "O", Ò: "O", Ö: "O", Ô: "O",
  Ú: "U", Ù: "U", Ü: "U", Û: "U",
};

/**
 * Normaliza un caracter para buscar su asset.
 *
 * Primero se compone a NFC: segun el teclado, la Ñ puede llegar como un solo
 * caracter o como N mas tilde suelta, y sin componer no encontrariamos `Ñ.webp`.
 */
export function foldLetter(character: string): string {
  const upper = character.normalize("NFC").toUpperCase();
  return FOLD[upper] ?? upper;
}

/** True si el caracter es una letra del alfabeto (ya plegada). */
export function isLetter(folded: string): boolean {
  return ALPHABET.includes(folded);
}

/** Frecuencia de la letra, en Hz. Siempre la misma para la misma letra. */
export function noteFor(folded: string): number {
  const index = ALPHABET.indexOf(folded);
  const safe = index >= 0 ? index : 0;
  return PENTATONIC[safe % PENTATONIC.length]!;
}

/** Ruta del WebP, o null si esa letra todavia no tiene pieza utilizable. */
export function assetFor(folded: string): string | null {
  if (!isLetter(folded) || UNAVAILABLE.has(folded)) return null;
  // encodeURIComponent por la Ñ, que viaja como %C3%91.
  return `images/embroidered-letters/${encodeURIComponent(folded)}.webp`;
}

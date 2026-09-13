/**
 * El alfabeto bordado: nota y asset de cada letra.
 *
 * La asignacion es determinista: la A suena siempre igual, la a tambien, y
 * nunca igual que la otra. Nada es aleatorio.
 */

import { LOWERCASE_GLYPHS, UPPERCASE_GLYPHS } from "./letterGlyphs";

/** Alfabeto español, con la Ñ en su sitio. */
export const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

/**
 * Frecuencia de cada caracter, en Hz. Una distinta para cada uno de los 54.
 *
 * Afinacion temperada (La4 = 440 Hz), 54 semitonos seguidos: es el minimo
 * posible para que ninguna letra repita nota. El reparto no es alfabetico:
 *
 * - Minusculas, el grueso de cualquier nombre: registro de caja de musica,
 *   Do5-Re7. Las mas frecuentes en espanol (e a o s r n i d l) ocupan la
 *   pentatonica de Do, la misma escala del hero, asi que casi cualquier
 *   nombre suena consonante. Las raras (k w x j) se quedan con los semitonos.
 * - Mayusculas, que abren cada palabra: una octava por debajo, Mi3-Si4, como
 *   la nota grave con la que arranca una melodia. Las iniciales habituales
 *   (M J A O C L) tambien van a la pentatonica.
 * - Las siete iniciales rarisimas (K Z U W X Q Ñ) usan las notas agudas que
 *   sobran, Re#7-La7, para no bajar a graves que un movil no reproduce.
 *
 * La frecuencia de uso es una estimacion: letras del espanol para las
 * minusculas e iniciales de nombres para las mayusculas.
 */
const NOTE_FREQUENCIES: Readonly<Record<string, number>> = {
  "A": 329.63, // Mi4
  "B": 277.18, // Do#4
  "C": 261.63, // Do4
  "D": 196.00, // Sol3
  "E": 246.94, // Si3
  "F": 415.30, // Sol#4
  "G": 174.61, // Fa3
  "H": 207.65, // Sol#3
  "I": 311.13, // Re#4
  "J": 440.00, // La4
  "K": 2637.02, // Mi7
  "L": 349.23, // Fa4
  "M": 392.00, // Sol4
  "N": 466.16, // La#4
  "Ñ": 3322.44, // Sol#7
  "O": 293.66, // Re4
  "P": 369.99, // Fa#4
  "Q": 2959.96, // Fa#7
  "R": 493.88, // Si4
  "S": 220.00, // La3
  "T": 233.08, // La#3
  "U": 3520.00, // La7
  "V": 164.81, // Mi3
  "W": 2793.83, // Fa7
  "X": 2489.02, // Re#7
  "Y": 185.00, // Fa#3
  "Z": 3135.96, // Sol7
  "a": 783.99, // Sol5
  "b": 2349.32, // Re7
  "c": 698.46, // Fa5
  "d": 987.77, // Si5
  "e": 880.00, // La5
  "f": 622.25, // Re#5
  "g": 1975.53, // Si6
  "h": 1108.73, // Do#6
  "i": 1318.51, // Mi6
  "j": 554.37, // Do#5
  "k": 1864.66, // La#6
  "l": 523.25, // Do5
  "m": 1396.91, // Fa6
  "n": 587.33, // Re5
  "ñ": 1479.98, // Fa#6
  "o": 1046.50, // Do6
  "p": 2093.00, // Do7
  "q": 739.99, // Fa#5
  "r": 1174.66, // Re6
  "s": 659.26, // Mi5
  "t": 1567.98, // Sol6
  "u": 1760.00, // La6
  "v": 830.61, // Sol#5
  "w": 2217.46, // Do#7
  "x": 1661.22, // Sol#6
  "y": 932.33, // La#5
  "z": 1244.51, // Re#6
};

/**
 * Letras sin pieza utilizable. Hoy no hay ninguna: el alfabeto esta completo,
 * en mayusculas y en minusculas.
 *
 * Se conserva el mecanismo porque la sustitucion de un asset puede volver a
 * dejar una letra fuera de juego, y es preferible una pieza de espera anunciada
 * a una imagen rota. Se indexa por la letra plegada a mayuscula: si falta una
 * letra, faltan sus dos formas.
 */
export const UNAVAILABLE = new Set<string>();

/** Carpeta del alfabeto bordado definitivo, dentro de `public/`. */
const GLYPH_DIR = "images/olivia_massiel_letras_bordadas_webp";

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

/**
 * Clave de un caracter en el alfabeto bordado, respetando su caja: `M`, `m`,
 * `Ñ`, `ñ`. Las tildes se pliegan sin tocar la caja (`é` es `e`, `É` es `E`).
 * Null si no es una letra del alfabeto.
 *
 * De esta clave salen tanto la pieza como la nota, asi que las dos siempre
 * corresponden al mismo caracter.
 */
export function letterKey(character: string): string | null {
  const folded = foldLetter(character);
  if (!isLetter(folded)) return null;
  const composed = character.normalize("NFC");
  const isLower = composed !== composed.toUpperCase();
  return isLower ? folded.toLowerCase() : folded;
}

/** Frecuencia del caracter, en Hz, a partir de su clave (`letterKey`). */
export function noteFor(key: string): number {
  return NOTE_FREQUENCIES[key] ?? NOTE_FREQUENCIES["a"]!;
}

export interface Glyph {
  readonly src: string;
  /** Pixeles del WebP. */
  readonly width: number;
  readonly height: number;
  /** Cuanto baja por debajo de la linea base, en pixeles del WebP. */
  readonly descent: number;
}

/**
 * La pieza bordada de un caracter, respetando exactamente su caja.
 *
 * `M` usa la M mayuscula y `a` la a minuscula: nunca se pasa el texto entero a
 * mayusculas ni a minusculas. Las tildes se pliegan sin tocar la caja (`é`
 * busca la e minuscula, `É` la E mayuscula) y la Ñ y la ñ tienen pieza propia.
 */
export function glyphFor(character: string): Glyph | null {
  const key = letterKey(character);
  if (!key || UNAVAILABLE.has(key.toUpperCase())) return null;

  const isLower = key !== key.toUpperCase();
  const metrics = isLower ? LOWERCASE_GLYPHS[key] : UPPERCASE_GLYPHS[key];
  if (!metrics) return null;

  const [width, height, descent] = metrics;
  const folder = isLower ? "minusculas" : "mayusculas";
  // encodeURIComponent por la Ñ y la ñ, que viajan como %C3%91 y %C3%B1.
  return {
    src: `${GLYPH_DIR}/${folder}/${encodeURIComponent(key)}.webp`,
    width,
    height,
    descent,
  };
}

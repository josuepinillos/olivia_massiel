/**
 * Composicion del nombre para el recuerdo descargable.
 *
 * Todo lo de aqui es geometria pura: no carga imagenes ni toca el DOM. Recibe
 * el nombre, lo resuelve a las mismas piezas bordadas que muestra la seccion
 * (misma normalizacion, misma caja, mismas medidas) y devuelve donde va cada
 * una dentro del lienzo.
 */

import { glyphFor, letterKey, type Glyph } from "../data/letterNotes";

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PlacedGlyph {
  readonly src: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface NameLayout {
  /** Pixeles del lienzo por pixel del WebP. Igual para todas las letras. */
  readonly scale: number;
  /** Palabras de cada linea, tal y como se compusieron. */
  readonly lines: readonly string[];
  readonly glyphs: readonly PlacedGlyph[];
}

interface Word {
  readonly text: string;
  readonly glyphs: readonly Glyph[];
}

/**
 * Separaciones en pixeles del WebP, igual que en la seccion: las piezas ya
 * traen su margen transparente y se suma un respiro de 4. Entre palabras, algo
 * mas que entre letras pero sin que el nombre se lea como dos piezas sueltas.
 */
const LETTER_GAP = 4;
const WORD_GAP = 56;
/** Aire entre las dos lineas de un nombre partido, en pixeles del lienzo. */
const LINE_GAP = 26;

/**
 * Nunca por encima del tamano real del WebP: ampliarlo emborronaria el hilo.
 * Un nombre corto como Ana sale a tamano natural, con la mayuscula a unos
 * 215 px, que en la pieza de 1080 px ya es la protagonista.
 */
const MAX_SCALE = 1;

/**
 * Por debajo de esta escala, un nombre de varias palabras pasa a dos lineas.
 * Deja en una sola linea nombres como José Luis o Ana María y parte los que ya
 * no caben con dignidad, como María Fernanda.
 */
const MIN_SINGLE_LINE_SCALE = 0.45;

export class MissingGlyphError extends Error {
  constructor(readonly characters: readonly string[]) {
    super(`Faltan piezas bordadas para: ${characters.join(", ")}`);
    this.name = "MissingGlyphError";
  }
}

/**
 * Nombre -> palabras de piezas bordadas.
 *
 * Usa `letterKey` y `glyphFor`, los mismos que la seccion: `Josué` busca la e
 * minuscula, `Ñusta` la Ñ mayuscula. Los caracteres que no son letras (numeros,
 * signos) se omiten igual que en pantalla. Si una letra valida no tiene pieza,
 * se lanza un error en lugar de dejar un hueco: un recuerdo incompleto no se
 * descarga.
 */
export function resolveWords(name: string): Word[] {
  const missing = new Set<string>();
  const words: Word[] = [];

  for (const text of name.normalize("NFC").trim().split(/\s+/)) {
    const glyphs: Glyph[] = [];
    for (const character of Array.from(text)) {
      if (letterKey(character) === null) continue;
      const glyph = glyphFor(character);
      if (glyph) glyphs.push(glyph);
      else missing.add(character);
    }
    if (glyphs.length > 0) words.push({ text, glyphs });
  }

  if (missing.size > 0) throw new MissingGlyphError([...missing]);
  return words;
}

/* -------------------------------------------------------------------------- */
/* Medidas de una linea                                                        */
/* -------------------------------------------------------------------------- */

interface LineMetrics {
  readonly words: readonly Word[];
  /** Ancho en pixeles del WebP. */
  readonly width: number;
  /** Lo que sube sobre la linea base y lo que baja por debajo, en px del WebP. */
  readonly ascent: number;
  readonly descent: number;
}

function measureLine(words: readonly Word[]): LineMetrics {
  let width = 0;
  let ascent = 0;
  let descent = 0;

  words.forEach((word, w) => {
    if (w > 0) width += WORD_GAP;
    word.glyphs.forEach((glyph, g) => {
      if (g > 0) width += LETTER_GAP;
      width += glyph.width;
      ascent = Math.max(ascent, glyph.height - glyph.descent);
      descent = Math.max(descent, glyph.descent);
    });
  });

  return { words, width, ascent, descent };
}

/** La mayor escala a la que un juego de lineas cabe entero en la caja. */
function fitScale(lines: readonly LineMetrics[], box: Box): number {
  const widest = Math.max(...lines.map((line) => line.width));
  const tall = lines.reduce((sum, line) => sum + line.ascent + line.descent, 0);
  const gaps = LINE_GAP * (lines.length - 1);
  return Math.min(MAX_SCALE, box.width / widest, (box.height - gaps) / tall);
}

/** Coloca una linea centrada en `centerX`, con su linea base en `baseline`. */
function placeLine(
  line: LineMetrics,
  centerX: number,
  baseline: number,
  scale: number,
  out: PlacedGlyph[],
): void {
  let x = centerX - (line.width * scale) / 2;

  line.words.forEach((word, w) => {
    if (w > 0) x += WORD_GAP * scale;
    word.glyphs.forEach((glyph, g) => {
      if (g > 0) x += LETTER_GAP * scale;
      const width = glyph.width * scale;
      const height = glyph.height * scale;
      out.push({
        src: glyph.src,
        x,
        y: baseline - (glyph.height - glyph.descent) * scale,
        width,
        height,
      });
      x += width;
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Composicion                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Decide lineas y escala, y coloca cada pieza.
 *
 * 1. Una sola linea, lo mas grande que quepa en la caja (nunca mas que el
 *    tamano real del WebP).
 * 2. Si esa escala queda por debajo del minimo y el nombre tiene varias
 *    palabras, se prueba cada espacio como punto de corte y se queda el que
 *    permite letras mas grandes. Una palabra suelta nunca se parte.
 * 3. La escala es una sola para todo el nombre: las proporciones de cada letra
 *    no se tocan.
 * 4. Cada linea se centra en horizontal, y el bloque completo se centra en
 *    vertical dentro de la caja.
 */
export function layoutName(words: readonly Word[], box: Box): NameLayout {
  if (words.length === 0) return { scale: 0, lines: [], glyphs: [] };

  let lines = [measureLine(words)];
  let scale = fitScale(lines, box);

  if (scale < MIN_SINGLE_LINE_SCALE && words.length > 1) {
    for (let cut = 1; cut < words.length; cut += 1) {
      const candidate = [measureLine(words.slice(0, cut)), measureLine(words.slice(cut))];
      const candidateScale = fitScale(candidate, box);
      if (candidateScale > scale) {
        lines = candidate;
        scale = candidateScale;
      }
    }
  }

  // De abajo arriba, con el bloque centrado en vertical dentro de la caja.
  const glyphs: PlacedGlyph[] = [];
  const centerX = box.x + box.width / 2;
  const blockHeight =
    lines.reduce((sum, line) => sum + (line.ascent + line.descent) * scale, 0) +
    LINE_GAP * (lines.length - 1);
  let bottom = box.y + (box.height + blockHeight) / 2;

  for (let l = lines.length - 1; l >= 0; l -= 1) {
    const line = lines[l]!;
    const baseline = bottom - line.descent * scale;
    placeLine(line, centerX, baseline, scale, glyphs);
    bottom = baseline - line.ascent * scale - LINE_GAP;
  }

  return {
    scale,
    lines: lines.map((line) => line.words.map((word) => word.text).join(" ")),
    glyphs,
  };
}

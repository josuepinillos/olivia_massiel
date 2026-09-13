/**
 * Medidas del alfabeto bordado definitivo.
 *
 * Cada entrada es `[ancho, alto, descenso]` en pixeles del propio WebP, leidos
 * de `public/images/olivia_massiel_letras_bordadas_webp/`. Todas las letras
 * comparten escala: la A mide lo que mide junto a la a, asi que basta con
 * multiplicar por un unico factor para componer una palabra sin deformar nada.
 *
 * Ancho y alto van tambien a los atributos del <img>, para que el navegador
 * reserve el hueco correcto antes de descargar la pieza.
 *
 * El descenso es cuanto baja la letra por debajo de la linea base. Los WebP
 * vienen recortados al contorno, sin linea base comun, y apoyadas por abajo la
 * g, la p, la q y la y flotaban por encima del resto. Se midio a ojo sobre
 * palabras compuestas (Diego, Pepa, Gaby, Joaquin, Quique): la panza de la p y
 * la q asienta en la linea, y la g y la y alinean sus brazos con la altura de la
 * a. La Q baja solo su cola.
 */

export type GlyphMetrics = readonly [width: number, height: number, descent: number];

export const UPPERCASE_GLYPHS: Readonly<Record<string, GlyphMetrics>> = {
  "A": [210, 215, 0],
  "B": [172, 219, 0],
  "C": [199, 224, 0],
  "D": [183, 220, 0],
  "E": [175, 220, 0],
  "F": [171, 218, 0],
  "G": [196, 221, 0],
  "H": [188, 216, 0],
  "I": [122, 219, 0],
  "J": [173, 221, 0],
  "K": [188, 217, 0],
  "L": [170, 217, 0],
  "M": [215, 216, 0],
  "N": [196, 217, 0],
  "Ñ": [185, 238, 0],
  "O": [201, 213, 0],
  "P": [176, 215, 0],
  "Q": [198, 219, 6],
  "R": [178, 218, 0],
  "S": [173, 217, 0],
  "T": [192, 212, 0],
  "U": [180, 202, 0],
  "V": [216, 201, 0],
  "W": [264, 196, 0],
  "X": [192, 202, 0],
  "Y": [193, 203, 0],
  "Z": [190, 199, 0],
};

export const LOWERCASE_GLYPHS: Readonly<Record<string, GlyphMetrics>> = {
  "a": [181, 178, 0],
  "b": [177, 236, 0],
  "c": [167, 179, 0],
  "d": [186, 243, 0],
  "e": [174, 176, 0],
  "f": [162, 235, 0],
  "g": [176, 214, 38],
  "h": [173, 224, 0],
  "i": [85, 235, 0],
  "j": [127, 237, 8],
  "k": [180, 229, 0],
  "l": [123, 224, 0],
  "m": [244, 171, 0],
  "n": [178, 170, 0],
  "ñ": [177, 217, 0],
  "o": [192, 181, 0],
  "p": [181, 206, 37],
  "q": [183, 209, 34],
  "r": [155, 176, 0],
  "s": [166, 183, 0],
  "t": [153, 208, 0],
  "u": [189, 181, 0],
  "v": [198, 192, 0],
  "w": [278, 188, 0],
  "x": [190, 189, 0],
  "y": [185, 213, 36],
  "z": [195, 181, 0],
};

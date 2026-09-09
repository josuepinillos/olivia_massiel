/**
 * Zonas interactivas del hero.
 *
 * No hay recortes superpuestos sobre la fotografia: son rectangulos
 * transparentes colocados encima de los objetos reales de `hero.webp`. Al no
 * pintar nada, la fotografia se sigue viendo como una fotografia unica.
 *
 * Las coordenadas son porcentajes del lienzo original de 1024 x 1536 px. Como
 * los hotspots son hijos del mismo contenedor que la imagen, y ese contenedor
 * conserva siempre la relacion de aspecto 1024/1536, las zonas quedan pegadas a
 * los objetos en cualquier viewport sin recalcular nada en JS.
 *
 * Medidas tomadas sobre la fotografia de las letras en crochet, superponiendo
 * las cajas candidatas sobre la imagen y corrigiendolas hasta que cada una
 * encuadra su objeto. Si algun dia se sustituye la fotografia, este archivo es
 * lo unico que hay que recalibrar.
 *
 * Notas: escala pentatonica mayor de Do, sin semitonos, de modo que cualquier
 * combinacion suena consonante. Cada fila del nombre sube de izquierda a
 * derecha, asi que recorrer las letras con el dedo o el puntero dibuja un
 * arpegio ascendente.
 */

/** Familia a la que pertenece la zona. Determina en que capa se dibuja. */
export type HotspotGroup = "object" | "letter";

export interface Hotspot {
  readonly id: string;
  readonly group: HotspotGroup;
  /** Descripcion leida por lectores de pantalla. */
  readonly label: string;
  /** Porcentajes sobre el lienzo de 1024 x 1536. */
  readonly rect: { left: number; top: number; width: number; height: number };
  /** Frecuencia en Hz. */
  readonly note: number;
}

/* Pentatonica mayor de Do. */
const G4 = 392.0;
const A4 = 440.0;
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.25;
const G5 = 783.99;
const A5 = 880.0;
const C6 = 1046.5;
const D6 = 1174.66;

/** El movil y los cuatro animales que cuelgan de el. */
export const objectHotspots: readonly Hotspot[] = [
  {
    id: "movil",
    group: "object",
    label: "El móvil de la cuna",
    rect: { left: 35.0, top: 7.5, width: 30.5, height: 4.8 },
    note: D6,
  },
  {
    id: "jirafa",
    group: "object",
    label: "La jirafa del móvil",
    rect: { left: 63.3, top: 17.2, width: 7.7, height: 11.3 },
    note: C6,
  },
  {
    id: "leon",
    group: "object",
    label: "El león del móvil",
    rect: { left: 32.2, top: 18.0, width: 8.8, height: 7.7 },
    note: A5,
  },
  {
    id: "elefante",
    group: "object",
    label: "El elefante del móvil",
    rect: { left: 42.8, top: 19.5, width: 10.0, height: 6.9 },
    note: G5,
  },
  {
    id: "cebra",
    group: "object",
    label: "La cebra del móvil",
    rect: { left: 54.5, top: 20.2, width: 7.8, height: 8.2 },
    note: E5,
  },
];

/**
 * Las trece letras de crochet, una zona por letra.
 *
 * No hay una sola zona que cubra la palabra entera: cada banderin tiene la
 * suya, con su posicion, su tamano, su etiqueta y su nota.
 */
export const letterHotspots: readonly Hotspot[] = [
  // OLIVIA — fila superior, de Do5 a Do6.
  { id: "o-1", group: "letter", label: "Letra O de Olivia", rect: { left: 25.3, top: 36.6, width: 9.0, height: 6.7 }, note: C5 },
  { id: "l-1", group: "letter", label: "Letra L de Olivia", rect: { left: 34.5, top: 38.2, width: 9.0, height: 7.4 }, note: D5 },
  { id: "i-1", group: "letter", label: "Primera letra I de Olivia", rect: { left: 45.0, top: 39.2, width: 9.0, height: 7.6 }, note: E5 },
  { id: "v-1", group: "letter", label: "Letra V de Olivia", rect: { left: 55.2, top: 39.8, width: 7.3, height: 7.0 }, note: G5 },
  { id: "i-2", group: "letter", label: "Segunda letra I de Olivia", rect: { left: 62.5, top: 39.2, width: 7.5, height: 6.8 }, note: A5 },
  { id: "a-1", group: "letter", label: "Letra A de Olivia", rect: { left: 70.5, top: 37.2, width: 9.5, height: 7.8 }, note: C6 },

  // MASSIEL — fila inferior, una octava mas grave: de Sol4 a La5.
  { id: "m-1", group: "letter", label: "Letra M de Massiel", rect: { left: 25.5, top: 45.8, width: 9.2, height: 6.9 }, note: G4 },
  { id: "a-2", group: "letter", label: "Letra A de Massiel", rect: { left: 35.5, top: 46.5, width: 9.0, height: 7.5 }, note: A4 },
  { id: "s-1", group: "letter", label: "Primera letra S de Massiel", rect: { left: 44.5, top: 47.3, width: 7.3, height: 7.5 }, note: C5 },
  { id: "s-2", group: "letter", label: "Segunda letra S de Massiel", rect: { left: 52.8, top: 48.7, width: 7.0, height: 6.3 }, note: D5 },
  { id: "i-3", group: "letter", label: "Letra I de Massiel", rect: { left: 59.8, top: 48.5, width: 5.7, height: 6.3 }, note: E5 },
  { id: "e-1", group: "letter", label: "Letra E de Massiel", rect: { left: 65.5, top: 46.7, width: 8.0, height: 7.1 }, note: G5 },
  { id: "l-2", group: "letter", label: "Letra L de Massiel", rect: { left: 74.5, top: 45.5, width: 6.8, height: 6.8 }, note: A5 },
];

export const hotspots: readonly Hotspot[] = [
  ...objectHotspots,
  ...letterHotspots,
];

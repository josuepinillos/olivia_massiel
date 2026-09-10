/**
 * Fuente unica de verdad del contenido.
 *
 * Ningun componente debe llevar texto ni fechas escritos a mano: todo sale de
 * aqui. Para cambiar el evento, este es el unico archivo que hay que tocar.
 */

/* -------------------------------------------------------------------------- */
/* RSVP                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Confirmacion de asistencia.
 *
 * El formulario de la seccion envia el nombre a este endpoint, que es una
 * funcion serverless (`api/rsvp.ts`). Ahi vive la clave de Resend; al navegador
 * no llega ningun secreto.
 *
 * Sustituye a las variantes anteriores (WhatsApp, enlace externo, ancla), que
 * eran marcadores de posicion a la espera de exactamente esto.
 */
export const rsvp = {
  endpoint: "/api/rsvp",
} as const;

/* -------------------------------------------------------------------------- */
/* Evento                                                                      */
/* -------------------------------------------------------------------------- */

export const event = {
  occasion: "Baby Shower",
  babyName: "Olivia Massiel",
  /** Partido en dos lineas para el cierre editorial. */
  babyNameLines: ["Olivia", "Massiel"] as const,

  /**
   * Instante exacto del evento. El desfase -05:00 es America/Lima, que no
   * aplica horario de verano, de modo que la cuenta regresiva es correcta
   * para cualquier invitado, este donde este.
   */
  isoDate: "2026-09-19T19:30:00-05:00",
  dateLabel: "19 de setiembre de 2026",
  dateLabelShort: "19 de setiembre",
  timeLabel: "7:30 p. m.",
  timeZoneLabel: "Hora de Perú (UTC-05:00)",

  venue: "Salón Los Olivos",
  address: "Av. Los Olivos 123, Chiclayo",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Sal%C3%B3n%20Los%20Olivos%2C%20Chiclayo",

  rsvp,
} as const;

/* -------------------------------------------------------------------------- */
/* Copy                                                                        */
/* -------------------------------------------------------------------------- */

export const copy = {
  hero: {
    eyebrow: "Baby Shower",
    /** El nombre no se escribe aqui: ya existe tejido dentro de la fotografia. */
    line: "Estamos esperando con mucho amor tu llegada.",
    scrollCue: "Descubre más",
    photoAlt:
      "Cuna de madera clara con un banderín de letras de crochet que forma el nombre Olivia Massiel, y un móvil de animales de fieltro colgando sobre ella.",
  },
  invitation: {
    eyebrow: "Estás invitado",
    titleLead: "Queremos celebrar",
    titleTail: "la llegada de",
    dateTag: "Fecha",
    timeTag: "Hora",
    venueTag: "Lugar",
    cta: "Ver ubicación",
  },
  waiting: {
    eyebrow: "La espera",
    title: "Más bonita",
    paragraphs: [
      "Hay momentos que esperamos durante toda una vida…",
      "Y uno de ellos está por llegar.",
    ],
  },
  nameMelody: {
    eyebrow: "Tu nombre tiene una melodía",
    title: "Escribe tu nombre y descubre cómo suena.",
    lead: "Cada letra guarda una pequeña nota.",
    /** Puente emocional con el nombre bordado de la fotografía del hero. */
    bridge:
      "Así como Olivia Massiel ya tiene su nombre bordado, tú también puedes crear el tuyo.",
    label: "Escribe tu nombre",
    placeholder: "Tu nombre",
    cta: "Crear mi nombre",
    play: "Escuchar mi melodía",
    hintTouch: "Toca una letra para escucharla.",
    hintPointer: "Pasa el cursor sobre cada letra.",
    /** `{letras}` se sustituye por las que aún no tienen pieza. */
    pending: "Las piezas de {letras} siguen en el taller: se muestran provisionales.",
  },
  countdown: {
    eyebrow: "Faltan",
    units: { days: "Días", hours: "Horas", minutes: "Min", seconds: "Seg" },
    note: "Para celebrar su llegada",
    arrived: "Hoy celebramos su llegada",
  },
  rsvpSection: {
    eyebrow: "Confirma tu asistencia",
    title: "Nos encantará compartir este día contigo.",
    lead: "Déjanos tu nombre para saber que nos acompañarás en este momento tan especial.",
    label: "Nombre completo",
    placeholder: "Escribe tu nombre completo",
    cta: "Confirmar asistencia",
    sending: "Enviando…",
    privacy: "Tu nombre será utilizado únicamente para registrar tu asistencia.",
    errorEmpty: "Por favor, escribe tu nombre para confirmar tu asistencia.",
    errorInvalid:
      "Por favor, revisa tu nombre: solo letras, espacios, guiones y apóstrofos.",
    errorSend:
      "No hemos podido registrar tu confirmación. Por favor, inténtalo nuevamente.",
    /** `{nombre}` se sustituye por el nombre de pila de quien confirma. */
    modalTitle: "¡Gracias, {nombre}!",
    modalLine1: "Hemos registrado tu asistencia con mucho cariño.",
    modalLine2: "Nos encantará compartir este momento contigo.",
    modalClose: "Cerrar",
  },
  closing: {
    eyebrow: "Con amor,",
    line: "Te esperamos para celebrar su llegada.",
  },
  /** Credito del pie. Partido en piezas porque una de ellas va en negrita. */
  credit: {
    lead: "Created with",
    word: "love",
    tail: "by",
    name: "Sielp Solutions",
    url: "https://www.sielpsolutions.com/",
  },
  nav: {
    open: "Abrir el menú",
    close: "Cerrar el menú",
    label: "Navegación principal",
  },
  audio: {
    enable: "Activar sonido",
    disable: "Silenciar sonido",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Navegacion (decision 8)                                                     */
/* -------------------------------------------------------------------------- */

export interface NavItem {
  readonly id: string;
  readonly label: string;
}

export const navItems: readonly NavItem[] = [
  { id: "inicio", label: "Inicio" },
  { id: "invitacion", label: "La invitación" },
  { id: "espera", label: "La espera" },
  { id: "cuenta", label: "Cuenta regresiva" },
  { id: "confirmar", label: "Confirmar asistencia" },
  { id: "tu-nombre", label: "Tu nombre" },
] as const;

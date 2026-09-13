/**
 * "Tu nombre tiene una melodía".
 *
 * El visitante escribe su nombre y cada letra aparece como una pieza de
 * crochet independiente: su propio <button>, su propia zona sensible, su propio
 * estado y su propia nota. El contenedor solo coloca las piezas; nunca es el
 * que escucha los eventos.
 *
 * El audio es el que ya existe en el proyecto: un unico AudioContext perezoso,
 * el mismo interruptor de silencio y el mismo corte por movimiento reducido.
 * Aqui no se crea ningun sistema paralelo.
 */

import { playNote } from "../../audio/musicBox";
import { prefersReducedMotion } from "../../motion/reducedMotion";
import { copy } from "../../config/event.config";
import { bindKeepsake, type KeepsakeControl } from "../../keepsake/keepsakeControl";
import {
  foldLetter,
  glyphFor,
  isLetter,
  letterKey,
  noteFor,
  UNAVAILABLE,
  type Glyph,
} from "../../data/letterNotes";

const MAX_LENGTH = 24;
const MELODY_GAP_MS = 300;
const PRESS_MS = 520;

/**
 * Separacion entre piezas, en pixeles del WebP. Se suma al margen transparente
 * que ya trae cada archivo y escala con las letras, de modo que un nombre
 * reducido para caber conserva el mismo ritmo.
 */
const GLYPH_GAP = 4;

/** Ancho nominal de una pieza de espera, solo para el calculo de encaje. */
const PENDING_WIDTH = 180;

interface Piece {
  /** Como se escribio: conserva la caja y la tilde. */
  readonly shown: string;
  /** Plegada a mayuscula y sin tilde: marca las letras sin pieza. */
  readonly folded: string;
  /** Caja exacta y sin tilde (`M`, `m`, `ñ`): decide la nota. */
  readonly key: string;
  /** Pieza bordada de su misma caja, o null si falta. */
  readonly glyph: Glyph | null;
}

export function initNameMelody(): void {
  const root = document.querySelector<HTMLElement>("#tu-nombre");
  const form = root?.querySelector<HTMLFormElement>("[data-name-form]");
  const input = root?.querySelector<HTMLInputElement>("[data-name-input]");
  const stage = root?.querySelector<HTMLElement>("[data-name-pieces]");
  const hint = root?.querySelector<HTMLElement>("[data-name-hint]");
  const missing = root?.querySelector<HTMLElement>("[data-name-missing]");
  const play = root?.querySelector<HTMLButtonElement>("[data-name-play]");
  if (!root || !form || !input || !stage || !hint || !missing || !play) return;

  // Guardar el recuerdo es opcional: si faltara su marcado, la seccion sigue
  // funcionando igual.
  const saveButton = root.querySelector<HTMLButtonElement>("[data-name-save]");
  const saveStatus = root.querySelector<HTMLElement>("[data-name-saved]");
  const saveText = root.querySelector<HTMLElement>("[data-name-saved-text]");
  const saveAgain = root.querySelector<HTMLAnchorElement>("[data-name-saved-again]");
  const keepsake: KeepsakeControl | null =
    saveButton && saveStatus && saveText && saveAgain
      ? bindKeepsake({
          button: saveButton,
          status: saveStatus,
          statusText: saveText,
          again: saveAgain,
        })
      : null;

  input.maxLength = MAX_LENGTH;

  /** Timers de la melodia en curso, para poder cortarla. */
  let melodyTimers: number[] = [];
  const stopMelody = () => {
    for (const id of melodyTimers) window.clearTimeout(id);
    melodyTimers = [];
    for (const el of stage.querySelectorAll(".name-letter.is-playing")) {
      el.classList.remove("is-playing");
    }
  };

  /* --- Una pieza ---------------------------------------------------------- */

  const buildLetter = (piece: Piece, index: number): HTMLButtonElement => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "name-letter";
    button.setAttribute("aria-label", `Letra ${piece.shown}`);
    // Cada pieza se inclina un poco distinto, pero de forma estable: depende
    // de su posicion, no del azar, asi que no baila entre repintados.
    button.style.setProperty("--tilt", `${((index * 37) % 5) - 2}deg`);
    button.style.setProperty("--lift", `${((index * 23) % 3) - 1}px`);
    // El escalonado de aparicion (55 ms) lo aplica el CSS a partir de --i.
    button.style.setProperty("--i", String(index));

    const { glyph } = piece;
    if (glyph) {
      // Alto y descenso en pixeles del WebP; el CSS los multiplica por la escala
      // comun. El ancho no se fija: sale solo de la proporcion de la imagen.
      button.style.setProperty("--glyph-h", String(glyph.height));
      button.style.setProperty("--glyph-descent", String(glyph.descent));

      const img = document.createElement("img");
      img.className = "name-letter__art";
      img.src = glyph.src;
      img.alt = "";
      img.width = glyph.width;
      img.height = glyph.height;
      // Carga inmediata, no diferida: estas piezas son exactamente las que el
      // visitante acaba de pedir y estan a la vista. El ahorro del que habla el
      // brief ya se consigue de otra forma — ninguna letra se descarga hasta
      // que alguien escribe un nombre, y solo se descargan las suyas.
      img.loading = "eager";
      img.fetchPriority = "high";
      img.decoding = "async";
      img.draggable = false;
      button.append(img);
    } else {
      // Pieza de espera: no finge ser bordado, y se avisa debajo del nombre.
      const pending = document.createElement("span");
      pending.className = "name-letter__pending";
      pending.setAttribute("aria-hidden", "true");
      pending.textContent = piece.shown;
      button.append(pending);
      button.dataset.pending = "true";
    }

    const note = noteFor(piece.key);
    // Identificador propio por posicion: dos "A" del mismo nombre son piezas
    // distintas y ninguna silencia a la otra.
    const sourceId = `nombre:${index}`;

    let pressTimer = 0;
    const activate = () => {
      void playNote(note, sourceId);
      if (prefersReducedMotion()) return;
      window.clearTimeout(pressTimer);
      button.classList.remove("is-pressed");
      void button.offsetWidth;
      button.classList.add("is-pressed");
      pressTimer = window.setTimeout(
        () => button.classList.remove("is-pressed"),
        PRESS_MS,
      );
    };

    // Escritorio: una sola nota al entrar el puntero, no mientras permanece.
    button.addEventListener(
      "pointerenter",
      (e) => {
        if (e.pointerType === "touch") return;
        activate();
      },
      { passive: true },
    );
    // Movil y teclado: click cubre tap, Enter y Espacio sobre un <button>.
    button.addEventListener("click", activate);

    return button;
  };

  /* --- El nombre completo -------------------------------------------------- */

  const render = (raw: string) => {
    stopMelody();
    stage.replaceChildren();

    const words = raw
      .trim()
      .slice(0, MAX_LENGTH)
      .split(/\s+/)
      .filter(Boolean);

    let index = 0;
    const pending = new Set<string>();
    /** Ancho de la palabra mas larga, en pixeles del WebP. */
    let widestWord = 0;

    for (const word of words) {
      const group = document.createElement("span");
      group.className = "name-word";
      let wordWidth = 0;

      // NFC antes de trocear: una ñ escrita como n + tilde suelta seria dos
      // caracteres, y la tilde sola no tiene pieza.
      for (const character of Array.from(word.normalize("NFC"))) {
        const folded = foldLetter(character);
        if (!isLetter(folded)) continue; // numeros y signos no tienen pieza
        if (UNAVAILABLE.has(folded)) pending.add(folded);
        const glyph = glyphFor(character);
        const key = letterKey(character) ?? folded;
        group.append(buildLetter({ shown: character, folded, key, glyph }, index));
        wordWidth += (glyph?.width ?? PENDING_WIDTH) + (wordWidth > 0 ? GLYPH_GAP : 0);
        index += 1;
      }

      if (group.childElementCount > 0) stage.append(group);
      widestWord = Math.max(widestWord, wordWidth);
    }

    // La palabra mas larga decide si hay que reducir. Todas las del nombre
    // comparten escala, asi que OLIVIA y MASSIEL siempre miden igual de alto.
    stage.style.setProperty("--name-units", String(Math.max(widestWord, 1)));
    stage.style.setProperty("--glyph-gap", String(GLYPH_GAP));

    // La clase de entrada se pone tras insertar, no en la construccion: asi la
    // animacion arranca con las piezas ya en el documento.
    if (!prefersReducedMotion()) {
      for (const piece of stage.querySelectorAll(".name-letter")) {
        piece.classList.add("is-entering");
      }
    }

    const hasPieces = index > 0;
    root.dataset.state = hasPieces ? "listo" : "vacio";

    hint.hidden = !hasPieces;
    hint.textContent = window.matchMedia("(hover: hover)").matches
      ? copy.nameMelody.hintPointer
      : copy.nameMelody.hintTouch;

    play.hidden = !hasPieces;
    keepsake?.setName(hasPieces ? words.join(" ") : null);

    if (pending.size > 0) {
      missing.hidden = false;
      missing.textContent = copy.nameMelody.pending.replace(
        "{letras}",
        [...pending].join(", "),
      );
    } else {
      missing.hidden = true;
    }
  };

  /* --- La melodia completa ------------------------------------------------- */

  play.addEventListener("click", () => {
    stopMelody();
    const letters = [...stage.querySelectorAll<HTMLButtonElement>(".name-letter")];
    letters.forEach((letter, position) => {
      const id = window.setTimeout(() => {
        const label = letter.getAttribute("aria-label") ?? "";
        const shown = label.replace("Letra ", "");
        const key = letterKey(shown) ?? foldLetter(shown);
        // Identificador por posicion en la melodia: si el nombre repite una
        // letra, la segunda no cae dentro del enfriamiento de la primera.
        void playNote(noteFor(key), `melodia:${position}`);

        if (prefersReducedMotion()) return;
        letter.classList.add("is-playing");
        window.setTimeout(() => letter.classList.remove("is-playing"), PRESS_MS);
      }, position * MELODY_GAP_MS);
      melodyTimers.push(id);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    render(input.value);
  });

  // Cambiar el nombre borra el anterior: evita que quede una melodia sonando
  // sobre unas piezas que ya no corresponden.
  input.addEventListener("input", stopMelody);
}

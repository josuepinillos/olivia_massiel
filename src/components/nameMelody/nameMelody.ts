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
import {
  assetFor,
  foldLetter,
  isLetter,
  noteFor,
  UNAVAILABLE,
} from "../../data/letterNotes";

const MAX_LENGTH = 24;
const MELODY_GAP_MS = 300;
const PRESS_MS = 520;

interface Piece {
  /** Como se muestra: conserva la tilde. */
  readonly shown: string;
  /** Como se busca el asset: sin tilde, con Ñ intacta. */
  readonly folded: string;
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

    const src = assetFor(piece.folded);
    if (src) {
      const img = document.createElement("img");
      img.className = "name-letter__art";
      img.src = src;
      img.alt = "";
      img.width = 512;
      img.height = 512;
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

    const note = noteFor(piece.folded);
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

    for (const word of words) {
      const group = document.createElement("span");
      group.className = "name-word";

      for (const character of Array.from(word)) {
        const folded = foldLetter(character);
        if (!isLetter(folded)) continue; // numeros y signos no tienen pieza
        if (UNAVAILABLE.has(folded)) pending.add(folded);
        group.append(buildLetter({ shown: character.toUpperCase(), folded }, index));
        index += 1;
      }

      if (group.childElementCount > 0) stage.append(group);
    }

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
        const folded = foldLetter(shown);
        // Identificador por posicion en la melodia: si el nombre repite una
        // letra, la segunda no cae dentro del enfriamiento de la primera.
        void playNote(noteFor(folded), `melodia:${position}`);

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

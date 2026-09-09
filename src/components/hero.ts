/**
 * Capa interactiva del hero.
 *
 * Dos capas de zonas transparentes sobre la fotografia: los objetos del movil y
 * las trece letras de crochet. Cada zona es un boton independiente con su
 * propia etiqueta, su propia nota y su propia respuesta visual.
 *
 * Nada se superpone a la fotografia y nada la desplaza. Al tocar una zona, la
 * respuesta visual es local —un halo calido sobre ese objeto— y el parallax se
 * congela unas decimas, para que la atencion quede en el objeto tocado y no en
 * un movimiento general de la escena.
 */

import {
  objectHotspots,
  letterHotspots,
  type Hotspot,
} from "../data/hotspots";
import { playNote } from "../audio/musicBox";
import { prefersReducedMotion } from "../motion/reducedMotion";
import { createHeroParallax, type HeroParallax } from "../motion/heroParallax";

const BLOOM_MS = 760;
/** Cuanto se queda quieta la escena tras tocar un objeto. */
const FREEZE_MS = 620;
/** Lado minimo del objetivo tactil, en pixeles CSS. */
const MIN_TARGET = 44;

export function initHero(): HeroParallax | null {
  const hero = document.querySelector<HTMLElement>("#inicio");
  const stage = document.querySelector<HTMLElement>(".hero__stage");
  const layer = document.querySelector<HTMLElement>(".hero__hotspots");
  if (!hero || !stage || !layer) return null;

  const parallax = createHeroParallax(hero, stage);
  const created: Array<{ button: HTMLButtonElement; spot: Hotspot }> = [];

  const buildGroup = (name: string, spots: readonly Hotspot[]) => {
    const group = document.createElement("div");
    group.className = "hotspot-group";
    group.dataset.group = name;

    for (const spot of spots) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hotspot";
      button.dataset.hotspot = spot.id;
      button.setAttribute("aria-label", spot.label);
      button.style.left = `${spot.rect.left}%`;
      button.style.top = `${spot.rect.top}%`;
      button.style.width = `${spot.rect.width}%`;
      button.style.height = `${spot.rect.height}%`;

      let bloomTimer = 0;
      const activate = () => {
        void playNote(spot.note, spot.id);

        // La fotografia no se mueve. Lo unico que ocurre es que el parallax
        // deja de arrastrarla mientras dura la interaccion.
        parallax.freeze(FREEZE_MS);

        if (prefersReducedMotion()) return;
        window.clearTimeout(bloomTimer);
        // Se reinicia la animacion aunque ya estuviera corriendo.
        button.classList.remove("is-active");
        void button.offsetWidth;
        button.classList.add("is-active");
        bloomTimer = window.setTimeout(
          () => button.classList.remove("is-active"),
          BLOOM_MS,
        );
      };

      // Escritorio: basta con que el puntero entre. Una sola nota por entrada,
      // nunca un sonido continuo mientras el puntero permanece encima.
      button.addEventListener(
        "pointerenter",
        (e) => {
          if (e.pointerType === "touch") return;
          activate();
        },
        { passive: true },
      );

      // Movil y teclado: el click cubre tap, Enter y Espacio sobre un <button>.
      button.addEventListener("click", activate);

      group.append(button);
      created.push({ button, spot });
    }

    layer.append(group);
  };

  buildGroup("objects", objectHotspots);
  buildGroup("letters", letterHotspots);

  /**
   * Objetivo tactil minimo sin mover el centro.
   *
   * El CSS fija el suelo de 44 x 44 px, pero una caja con `left`/`top` crece
   * hacia la derecha y hacia abajo, lo que desplazaria la zona respecto al
   * objeto que hay debajo. Aqui se compensa ese crecimiento con un margen
   * negativo de la mitad, de modo que el centro sigue coincidiendo con el
   * objeto en cualquier ancho.
   *
   * El tamano natural se deduce de los porcentajes y del escenario, en vez de
   * medir la caja ya expandida, para no leer un valor contaminado por el propio
   * minimo que acabamos de aplicar.
   */
  const syncTargets = () => {
    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    if (stageWidth === 0 || stageHeight === 0) return;

    for (const { button, spot } of created) {
      const naturalWidth = (stageWidth * spot.rect.width) / 100;
      const naturalHeight = (stageHeight * spot.rect.height) / 100;
      const growX = Math.max(0, MIN_TARGET - naturalWidth);
      const growY = Math.max(0, MIN_TARGET - naturalHeight);
      button.style.marginLeft = `${-growX / 2}px`;
      button.style.marginTop = `${-growY / 2}px`;
    }
  };

  syncTargets();
  new ResizeObserver(syncTargets).observe(stage);

  return parallax;
}

/**
 * Movimiento del hero.
 *
 * El desplazamiento responde UNICAMENTE al puntero, al scroll y a la
 * inclinacion del dispositivo. Nunca a tocar un objeto: pulsar un animal o una
 * letra no mueve la fotografia ni un pixel.
 *
 * El recorrido total esta limitado a 8 px y se aplica al contenedor completo de
 * la escena, de modo que imagen y hotspots se desplazan juntos y no pueden
 * desalinearse. El contenedor sobresale del marco recortado, asi que el
 * movimiento nunca descubre un borde.
 *
 * `freeze()` congela la escena durante la interaccion con un objeto. En
 * escritorio, acercar el puntero a un animal arrastraria el parallax, y el
 * usuario percibiria que se mueve la fotografia entera en vez del objeto que
 * acaba de tocar. Congelar unas decimas y volver despues suavemente deja la
 * atencion donde debe estar: en el objeto.
 */

import { createVisibilityLoop, type Loop } from "../lib/raf";
import { prefersReducedMotion, onReducedMotionChange } from "./reducedMotion";

const MAX_OFFSET = 8;
const EASING = 0.075;

export interface HeroParallax {
  /** Congela la escena durante `ms` y luego la deja volver suavemente. */
  freeze(ms: number): void;
  destroy(): void;
}

export function createHeroParallax(
  hero: HTMLElement,
  stage: HTMLElement,
): HeroParallax {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let frozenUntil = 0;

  const isFrozen = () => performance.now() < frozenUntil;

  const setTargetFromPointer = (clientX: number, clientY: number) => {
    if (isFrozen()) return;
    const rect = hero.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const nx = (clientX - rect.left) / rect.width - 0.5;
    const ny = (clientY - rect.top) / rect.height - 0.5;
    targetX = clamp(nx * 2 * MAX_OFFSET, -MAX_OFFSET, MAX_OFFSET);
    targetY = clamp(ny * 2 * MAX_OFFSET, -MAX_OFFSET, MAX_OFFSET);
  };

  const onPointerMove = (e: PointerEvent) => {
    // El dedo ya arrastra la pagina; el parallax de puntero es cosa del raton.
    if (e.pointerType === "touch") return;
    setTargetFromPointer(e.clientX, e.clientY);
  };

  const onPointerLeave = () => {
    if (isFrozen()) return;
    targetX = 0;
    targetY = 0;
  };

  /**
   * Deriva ligadisima al hacer scroll: da sensacion de profundidad en movil,
   * donde no hay puntero. Se calcula sobre el progreso de salida del hero.
   */
  const onScroll = () => {
    if (isFrozen()) return;
    const rect = hero.getBoundingClientRect();
    const progress = clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
    targetY = clamp(progress * MAX_OFFSET, -MAX_OFFSET, MAX_OFFSET);
  };

  /**
   * Inclinacion del dispositivo como mejora progresiva. No se pide permiso a
   * proposito: en iOS `DeviceOrientationEvent.requestPermission` exige un gesto
   * y un dialogo, y el brief prohibe bloquear la experiencia tras un permiso.
   * Si el evento nunca llega, el scroll sigue haciendo su trabajo.
   */
  const onOrientation = (e: DeviceOrientationEvent) => {
    if (isFrozen()) return;
    if (e.gamma == null || e.beta == null) return;
    targetX = clamp(e.gamma * 0.28, -MAX_OFFSET, MAX_OFFSET);
    targetY = clamp((e.beta - 45) * 0.1, -MAX_OFFSET, MAX_OFFSET);
  };

  const tick = () => {
    // Congelada: se mantiene exactamente donde estaba, sin interpolar.
    if (isFrozen()) return;

    currentX += (targetX - currentX) * EASING;
    currentY += (targetY - currentY) * EASING;
    stage.style.translate = `${round(currentX)}px ${round(currentY)}px`;
  };

  const loop: Loop = createVisibilityLoop(hero, tick);

  const attach = () => {
    hero.addEventListener("pointermove", onPointerMove, { passive: true });
    hero.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("deviceorientation", onOrientation, {
      passive: true,
    });
  };

  const detach = () => {
    hero.removeEventListener("pointermove", onPointerMove);
    hero.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("deviceorientation", onOrientation);
  };

  const applyPreference = (reduced: boolean) => {
    if (reduced) {
      detach();
      loop.disable();
      targetX = targetY = currentX = currentY = 0;
      frozenUntil = 0;
      stage.style.translate = "0px 0px";
    } else {
      attach();
      loop.enable();
    }
  };

  applyPreference(prefersReducedMotion());
  const stopWatching = onReducedMotionChange(applyPreference);

  return {
    freeze(ms: number) {
      if (prefersReducedMotion()) return;
      // El objetivo se fija en la posicion actual, de modo que al descongelar
      // no haya un salto: la escena ya esta donde el lerp la quiere dejar.
      targetX = currentX;
      targetY = currentY;
      frozenUntil = performance.now() + ms;
    },
    destroy() {
      stopWatching();
      detach();
      loop.destroy();
    },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

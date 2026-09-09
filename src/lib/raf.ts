/**
 * Bucle de `requestAnimationFrame` que se puede parar de verdad.
 *
 * El bucle solo corre mientras el elemento observado esta en pantalla y la
 * pestana esta visible. Fuera de esas condiciones se cancela el frame en vez de
 * dejarlo girando en vacio, que era el problema del prototipo anterior.
 */
export interface Loop {
  /** Permite correr el bucle (si ademas es visible, arranca). */
  enable(): void;
  /** Para el bucle y cancela el frame pendiente. */
  disable(): void;
  /** Para el bucle y suelta el IntersectionObserver y los listeners. */
  destroy(): void;
}

export function createVisibilityLoop(
  target: Element,
  tick: (deltaMs: number) => void,
): Loop {
  let frame = 0;
  let last = 0;
  let onScreen = false;
  let enabled = true;

  const shouldRun = () =>
    enabled && onScreen && document.visibilityState === "visible";

  const step = (now: number) => {
    const delta = last === 0 ? 16.67 : Math.min(now - last, 64);
    last = now;
    tick(delta);
    frame = requestAnimationFrame(step);
  };

  const sync = () => {
    if (shouldRun()) {
      if (frame === 0) {
        last = 0;
        frame = requestAnimationFrame(step);
      }
    } else if (frame !== 0) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry?.isIntersecting ?? false;
      sync();
    },
    { threshold: 0 },
  );
  observer.observe(target);

  document.addEventListener("visibilitychange", sync);

  return {
    enable() {
      enabled = true;
      sync();
    },
    disable() {
      enabled = false;
      sync();
    },
    destroy() {
      enabled = false;
      sync();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    },
  };
}

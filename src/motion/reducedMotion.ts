/**
 * Estado de `prefers-reduced-motion`, consultado desde JS.
 *
 * El CSS por si solo no basta: las animaciones creadas con la Web Animations
 * API (`element.animate()`) no se detienen con una media query, y el audio
 * tampoco. Por eso todo el resto del codigo pregunta aqui antes de crear
 * cualquier animacion o de emitir cualquier sonido.
 */

const query = window.matchMedia("(prefers-reduced-motion: reduce)");

let reduced = query.matches;
const listeners = new Set<(reduced: boolean) => void>();

query.addEventListener("change", (e) => {
  reduced = e.matches;
  for (const listener of listeners) listener(reduced);
});

/** True si el usuario pidio reducir el movimiento. */
export function prefersReducedMotion(): boolean {
  return reduced;
}

/** Se notifica en caliente si el usuario cambia la preferencia del sistema. */
export function onReducedMotionChange(
  listener: (reduced: boolean) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

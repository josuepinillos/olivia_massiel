/**
 * Aparicion suave de las secciones al entrar en pantalla.
 *
 * Con `prefers-reduced-motion: reduce` no se observa nada: todo se marca como
 * visible de inmediato, de modo que el contenido nunca depende de una animacion
 * para poder leerse.
 */

import { prefersReducedMotion } from "./reducedMotion";

export function revealOnScroll(elements: Iterable<Element>): () => void {
  const items = Array.from(elements);

  if (prefersReducedMotion()) {
    for (const el of items) el.classList.add("is-revealed");
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  for (const el of items) observer.observe(el);
  return () => observer.disconnect();
}

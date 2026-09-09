/**
 * Control de sonido.
 *
 * Deliberadamente subordinado: un punto pequeno en la barra superior. Existe
 * porque el usuario debe poder silenciar la pagina, no porque el sonido sea
 * parte del contenido. Se oculta por completo si el sistema pide reducir el
 * movimiento, porque en ese caso ya no hay audio que silenciar.
 */

import { isMuted, toggleMuted, onMuteChange } from "../audio/musicBox";
import {
  prefersReducedMotion,
  onReducedMotionChange,
} from "../motion/reducedMotion";
import { copy } from "../config/event.config";

export function initSoundToggle(): void {
  const button = document.querySelector<HTMLButtonElement>(
    "[data-sound-toggle]",
  );
  if (!button) return;

  const render = () => {
    const muted = isMuted();
    button.dataset.muted = String(muted);
    button.setAttribute("aria-pressed", String(!muted));
    button.setAttribute(
      "aria-label",
      muted ? copy.audio.enable : copy.audio.disable,
    );
  };

  const syncVisibility = (reduced: boolean) => {
    button.hidden = reduced;
  };

  button.addEventListener("click", () => {
    toggleMuted();
  });

  onMuteChange(render);
  onReducedMotionChange(syncVisibility);

  render();
  syncVisibility(prefersReducedMotion());
}

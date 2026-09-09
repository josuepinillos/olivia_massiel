/**
 * Cuenta regresiva hasta el evento.
 *
 * Se apoya en el instante exacto configurado (con desfase -05:00), asi que el
 * resultado es correcto desde cualquier zona horaria. El intervalo se detiene
 * cuando la seccion no esta en pantalla y tambien al llegar a cero, en lugar de
 * quedarse corriendo el resto de la sesion.
 */

import { event, copy } from "../config/event.config";

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function split(remainingMs: number): Parts {
  let ms = Math.max(0, remainingMs);
  const days = Math.floor(ms / 86_400_000);
  ms %= 86_400_000;
  const hours = Math.floor(ms / 3_600_000);
  ms %= 3_600_000;
  const minutes = Math.floor(ms / 60_000);
  ms %= 60_000;
  return { days, hours, minutes, seconds: Math.floor(ms / 1000) };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function initCountdown(): () => void {
  const root = document.querySelector<HTMLElement>("#cuenta");
  if (!root) return () => {};

  const fields = {
    days: root.querySelector<HTMLElement>('[data-unit="days"]'),
    hours: root.querySelector<HTMLElement>('[data-unit="hours"]'),
    minutes: root.querySelector<HTMLElement>('[data-unit="minutes"]'),
    seconds: root.querySelector<HTMLElement>('[data-unit="seconds"]'),
  };
  const note = root.querySelector<HTMLElement>("[data-countdown-note]");

  const target = new Date(event.isoDate).getTime();
  let timer = 0;

  const stop = () => {
    if (timer !== 0) {
      window.clearInterval(timer);
      timer = 0;
    }
  };

  const render = (): boolean => {
    const remaining = target - Date.now();
    const parts = split(remaining);
    if (fields.days) fields.days.textContent = pad(parts.days);
    if (fields.hours) fields.hours.textContent = pad(parts.hours);
    if (fields.minutes) fields.minutes.textContent = pad(parts.minutes);
    if (fields.seconds) fields.seconds.textContent = pad(parts.seconds);

    if (remaining <= 0) {
      if (note) note.textContent = copy.countdown.arrived;
      root.dataset.state = "arrived";
      return false;
    }
    return true;
  };

  const start = () => {
    if (timer !== 0) return;
    if (!render()) return;
    timer = window.setInterval(() => {
      if (!render()) stop();
    }, 1000);
  };

  // Solo cuenta mientras se ve. Al volver a entrar se repinta al instante, de
  // modo que nunca se muestra un valor congelado.
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) start();
      else stop();
    },
    { threshold: 0 },
  );
  observer.observe(root);

  const onVisibility = () => {
    if (document.visibilityState === "visible") render();
  };
  document.addEventListener("visibilitychange", onVisibility);

  render();

  return () => {
    stop();
    observer.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

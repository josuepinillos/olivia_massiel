/**
 * Microinteraccion sonora (decision 3).
 *
 * Es la unica idea funcional heredada del prototipo anterior. Ni musica de
 * fondo, ni autoplay, ni archivos MP3: una sola nota corta y calida, sintetizada
 * con la Web Audio API, con caracter de cajita musical.
 *
 * Reglas que aplica este modulo:
 *  - Un unico AudioContext para toda la pagina, creado de forma perezosa.
 *  - El contexto solo se crea y se reanuda tras un gesto real del usuario
 *    (pointerdown, touchstart o keydown). El hover no cuenta como gesto valido
 *    para los navegadores, asi que antes del primer gesto simplemente no suena.
 *  - Nunca suena durante la carga de la pagina.
 *  - Cooldown para que mover rapido el puntero no dispare una ráfaga de notas.
 *  - Silencio total si `prefers-reduced-motion: reduce` esta activo.
 *  - El usuario puede silenciar, y la preferencia se recuerda.
 */

import { prefersReducedMotion } from "../motion/reducedMotion";

const STORAGE_KEY = "olivia:muted";

/**
 * Dos frenos distintos, porque hay dos clases de repeticion que evitar.
 *
 * `SOURCE_COOLDOWN_MS` impide que un mismo objeto suene una y otra vez si el
 * puntero entra y sale de el, o si alguien lo pulsa a martillazos.
 *
 * `GLOBAL_MIN_GAP_MS` es solo un suelo: separa lo justo dos notas seguidas para
 * que no se solapen en un golpe. Es corto a proposito. Con un unico cooldown
 * global, deslizar el dedo por OLIVIA MASSIEL silenciaria doce de las trece
 * letras; con este suelo suenan todas, encadenadas como un arpegio.
 */
const SOURCE_COOLDOWN_MS = 500;
const GLOBAL_MIN_GAP_MS = 90;

const PEAK_GAIN = 0.055;
const DECAY_S = 0.45;

type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let armed = false;
let lastPlayedAny = 0;
const lastPlayedBySource = new Map<string, number>();
let muted = readMuted();

const muteListeners = new Set<(muted: boolean) => void>();

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Modo privado o cookies bloqueadas: se asume sonido activo.
    return false;
  }
}

function persistMuted(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Sin almacenamiento la preferencia dura solo esta sesion. No es un error.
  }
}

function getCtor(): AudioContextCtor | null {
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * Crea y reanuda el contexto. Debe invocarse dentro de un gesto del usuario;
 * si el navegador lo bloquea igualmente, devuelve false sin lanzar.
 */
async function ensureContext(): Promise<AudioContext | null> {
  if (!armed) return null;

  if (!ctx) {
    const Ctor = getCtor();
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }

  return ctx.state === "running" ? ctx : null;
}

/**
 * Marca que ya hubo un gesto valido y prepara el contexto. Se engancha una sola
 * vez a los primeros pointerdown / touchstart / keydown del documento.
 */
export function armAudioOnFirstGesture(): void {
  if (armed) return;

  const arm = () => {
    if (armed) return;
    armed = true;
    void ensureContext();
    for (const type of ["pointerdown", "touchstart", "keydown"] as const) {
      document.removeEventListener(type, arm);
    }
  };

  for (const type of ["pointerdown", "touchstart", "keydown"] as const) {
    document.addEventListener(type, arm, { passive: true });
  }
}

/**
 * Una nota. Seno fundamental + triangular a 2.01x para el brillo metalico del
 * hilo, pasados por un lowpass suave para quitarle filo, con ataque de 12 ms y
 * caida de ~0.45 s.
 *
 * `sourceId` identifica el objeto que la pide (un animal, una letra). Cada
 * fuente lleva su propio cooldown, asi que letras distintas suenan aunque se
 * toquen seguidas; lo que se corta es la repeticion de la misma.
 */
export async function playNote(
  frequency: number,
  sourceId: string,
): Promise<void> {
  if (muted || prefersReducedMotion()) return;

  const now = performance.now();
  if (now - lastPlayedAny < GLOBAL_MIN_GAP_MS) return;

  const previous = lastPlayedBySource.get(sourceId);
  if (previous !== undefined && now - previous < SOURCE_COOLDOWN_MS) return;

  // Los sellos se ponen AQUI, antes del await, no despues.
  //
  // `ensureContext` es asincrono: si se apuntara el instante al final, varias
  // llamadas seguidas leerian todas el mismo valor antiguo, pasarian la
  // comprobacion antes de que ninguna llegase a actualizarlo y sonarian todas
  // a la vez. Con los sellos por delante, la primera cierra la puerta.
  lastPlayedAny = now;
  lastPlayedBySource.set(sourceId, now);

  const audio = await ensureContext();
  if (!audio) return;

  // Se comprueba otra vez: `ensureContext` es asincrono y el usuario ha podido
  // silenciar mientras tanto.
  if (muted) return;

  const t = audio.currentTime;

  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(PEAK_GAIN, t + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, t + DECAY_S);

  const warmth = audio.createBiquadFilter();
  warmth.type = "lowpass";
  warmth.frequency.setValueAtTime(Math.min(frequency * 4.5, 7000), t);
  warmth.Q.setValueAtTime(0.4, t);

  warmth.connect(master);
  master.connect(audio.destination);

  const fundamental = audio.createOscillator();
  fundamental.type = "sine";
  fundamental.frequency.setValueAtTime(frequency, t);
  fundamental.connect(warmth);

  const harmonic = audio.createOscillator();
  harmonic.type = "triangle";
  harmonic.frequency.setValueAtTime(frequency * 2.01, t);

  const harmonicGain = audio.createGain();
  harmonicGain.gain.setValueAtTime(0.16, t);
  harmonic.connect(harmonicGain);
  harmonicGain.connect(warmth);

  fundamental.start(t);
  harmonic.start(t);
  fundamental.stop(t + DECAY_S + 0.02);
  harmonic.stop(t + DECAY_S - 0.06);

  fundamental.addEventListener("ended", () => {
    fundamental.disconnect();
    harmonic.disconnect();
    harmonicGain.disconnect();
    warmth.disconnect();
    master.disconnect();
  });
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  if (muted === value) return;
  muted = value;
  persistMuted(value);
  for (const listener of muteListeners) listener(muted);
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

export function onMuteChange(listener: (muted: boolean) => void): () => void {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

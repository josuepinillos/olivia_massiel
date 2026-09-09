import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/nav.css";
import "./styles/hero.css";
import "./styles/nameMelody.css";
import "./styles/rsvp.css";
import "./styles/sections.css";

import { armAudioOnFirstGesture } from "./audio/musicBox";
import { revealOnScroll } from "./motion/revealOnScroll";
import { initHero } from "./components/hero";
import { initNav } from "./components/nav";
import { initCountdown } from "./components/countdown";
import { initRsvp } from "./components/rsvp";
import { initNameMelody } from "./components/nameMelody/nameMelody";
import { initSoundToggle } from "./components/soundToggle";

/**
 * El AudioContext se prepara con el primer gesto real del usuario. Hasta
 * entonces no existe, asi que la pagina no puede sonar durante la carga.
 */
armAudioOnFirstGesture();

initNav();
initSoundToggle();
initHero();
initNameMelody();
initCountdown();
initRsvp();
revealOnScroll(document.querySelectorAll("[data-reveal]"));

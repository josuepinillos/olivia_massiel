/* Olivia Massiel — isolated hover/touch sound module
 * Uses Web Audio API; no external audio files required.
 * This file is intentionally standalone so Claude Code can integrate only this behavior.
 */
export class OliviaHoverAudio {
  constructor({ volume = 0.055, cooldownMs = 260 } = {}) {
    this.volume = volume;
    this.cooldownMs = cooldownMs;
    this.ctx = null;
    this.lastPlayed = 0;
  }

  async unlock() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    return this.ctx.state === 'running';
  }

  async play(freq = 392) {
    const nowMs = performance.now();
    if (nowMs - this.lastPlayed < this.cooldownMs) return;
    const ok = await this.unlock();
    if (!ok) return;
    this.lastPlayed = nowMs;

    const now = this.ctx.currentTime;
    const master = this.ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(this.volume, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    master.connect(this.ctx.destination);

    const fundamental = this.ctx.createOscillator();
    fundamental.type = 'sine';
    fundamental.frequency.setValueAtTime(freq, now);

    const harmonic = this.ctx.createOscillator();
    harmonic.type = 'triangle';
    harmonic.frequency.setValueAtTime(freq * 2.01, now);

    const harmonicGain = this.ctx.createGain();
    harmonicGain.gain.value = 0.16;
    harmonic.connect(harmonicGain);
    harmonicGain.connect(master);
    fundamental.connect(master);

    fundamental.start(now);
    harmonic.start(now);
    fundamental.stop(now + 0.44);
    harmonic.stop(now + 0.38);
  }
}

export function bindHoverSound(elements, audio = new OliviaHoverAudio()) {
  elements.forEach((element, index) => {
    const freq = [392, 440, 523.25, 587.33, 659.25, 783.99, 880][index % 7];
    const trigger = () => audio.play(freq);
    element.addEventListener('pointerenter', trigger, { passive: true });
    element.addEventListener('click', trigger, { passive: true });
  });
  return audio;
}

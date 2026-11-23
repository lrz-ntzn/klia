/** Short tones made in the browser. Nothing is fetched. */
let ctx;

function audio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function beep(frequency, start, duration, type, gain) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  amp.gain.setValueAtTime(gain, ac.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + duration);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.02);
}

export function playFx(kind, muted) {
  if (muted) return;
  try {
    if (kind === 'ok') {
      beep(523, 0, 0.08, 'triangle', 0.08);
      beep(784, 0.09, 0.12, 'triangle', 0.08);
    } else if (kind === 'no') {
      beep(196, 0, 0.16, 'sine', 0.07);
    } else if (kind === 'win') {
      [523, 659, 784, 1046].forEach((f, i) => beep(f, i * 0.09, 0.14, 'triangle', 0.07));
    }
  } catch {}
}

export function burstConfetti(root) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#ff9f1c', '#2ec4b6', '#ff5d8f', '#ffe66d', '#4dabf7'];
  const box = document.createElement('div');
  box.className = 'confetti-box';
  for (let i = 0; i < 18; i++) {
    const bit = document.createElement('i');
    bit.style.left = `${6 + Math.random() * 88}%`;
    bit.style.background = colors[i % colors.length];
    bit.style.animationDelay = `${Math.random() * 0.2}s`;
    box.appendChild(bit);
  }
  root.appendChild(box);
  setTimeout(() => box.remove(), 1400);
}

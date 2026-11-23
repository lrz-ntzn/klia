/** Original tangerine mascot. Not based on any existing app character. */
export function mascot(mood = 'idle') {
  const safe = ['idle', 'happy', 'sad', 'cheer'].includes(mood) ? mood : 'idle';
  return `<svg class="mascot mood-${safe}" viewBox="0 0 88 96" aria-hidden="true">
    <ellipse class="shadow" cx="44" cy="90" rx="18" ry="4"/>
    <path class="leaf" d="M46 18c8-10 20-10 24-4-8 2-16 6-20 12-2-2-3-6-4-8z"/>
    <path class="stem" d="M44 22c1-8 2-12 1-16"/>
    <circle class="body" cx="44" cy="50" r="28"/>
    <ellipse class="shine" cx="34" cy="40" rx="8" ry="5"/>
    <circle class="blush" cx="28" cy="56" r="4"/>
    <circle class="blush" cx="60" cy="56" r="4"/>
    <g class="eyes">
      <ellipse cx="34" cy="48" rx="4.2" ry="5"/>
      <ellipse cx="54" cy="48" rx="4.2" ry="5"/>
      <circle class="pupil" cx="35.2" cy="49" r="1.6"/>
      <circle class="pupil" cx="55.2" cy="49" r="1.6"/>
    </g>
    <path class="mouth mouth-idle" d="M36 62h16"/>
    <path class="mouth mouth-happy" d="M34 60c4 8 16 8 20 0"/>
    <path class="mouth mouth-sad" d="M34 66c4-7 16-7 20 0"/>
    <circle class="arm" cx="16" cy="54" r="6"/>
    <circle class="arm arm-r" cx="72" cy="54" r="6"/>
  </svg>`;
}

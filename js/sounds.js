/* Seoul Korean sound chart + citation IPA for the fast-read drill.
   Standard Seoul: lenis stops voice between vowels, ㅐ/ㅔ often merge,
   ㅚ/ㅟ are [we]/[wi] rather than the older [ø]/[y]. */

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const TENSE = { 'ㄱ': 'ㄲ', 'ㄷ': 'ㄸ', 'ㅂ': 'ㅃ', 'ㅅ': 'ㅆ', 'ㅈ': 'ㅉ' };
const ASPIRATE = { 'ㄱ': 'ㅋ', 'ㄷ': 'ㅌ', 'ㅂ': 'ㅍ', 'ㅈ': 'ㅊ' };
const LENIS_STOP = new Set(['ㄱ', 'ㄷ', 'ㅂ', 'ㅈ']);
const Y_GLIDE = new Set(['ㅑ', 'ㅕ', 'ㅛ', 'ㅠ', 'ㅒ', 'ㅖ']);

function decompose(ch) {
  const code = ch.codePointAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  return {
    cho: CHO[Math.floor(code / 588)],
    jung: JUNG[Math.floor((code % 588) / 28)],
    jong: JONG[code % 28],
  };
}

function linkBeforeVowel(jong) {
  const table = {
    'ㄱ': ['', 'ㄱ'], 'ㄲ': ['', 'ㄲ'], 'ㄳ': ['ㄱ', 'ㅆ'],
    'ㄴ': ['', 'ㄴ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['', 'ㄴ'],
    'ㄷ': ['', 'ㄷ'], 'ㄹ': ['', 'ㄹ'],
    'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'],
    'ㄽ': ['ㄹ', 'ㅆ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['', 'ㄹ'],
    'ㅁ': ['', 'ㅁ'], 'ㅂ': ['', 'ㅂ'], 'ㅄ': ['ㅂ', 'ㅆ'],
    'ㅅ': ['', 'ㅅ'], 'ㅆ': ['', 'ㅆ'],
    'ㅇ': ['ㅇ', null],
    'ㅈ': ['', 'ㅈ'], 'ㅊ': ['', 'ㅊ'], 'ㅋ': ['', 'ㅋ'], 'ㅌ': ['', 'ㅌ'], 'ㅍ': ['', 'ㅍ'],
    'ㅎ': ['', null],
  };
  const hit = table[jong];
  if (!hit) return { coda: jong, onset: null };
  return { coda: hit[0], onset: hit[1] };
}

function stripH(jong) {
  if (jong === 'ㄶ') return 'ㄴ';
  if (jong === 'ㅀ') return 'ㄹ';
  if (jong === 'ㅎ') return '';
  return jong;
}

function hasH(jong) {
  return jong === 'ㅎ' || jong === 'ㄶ' || jong === 'ㅀ';
}

function surfaceCoda(jong) {
  const map = {
    '': '', 'ㄱ': 'ㄱ', 'ㄲ': 'ㄱ', 'ㄳ': 'ㄱ', 'ㅋ': 'ㄱ',
    'ㄴ': 'ㄴ', 'ㄵ': 'ㄴ', 'ㄶ': 'ㄴ',
    'ㄷ': 'ㄷ', 'ㅅ': 'ㄷ', 'ㅆ': 'ㄷ', 'ㅈ': 'ㄷ', 'ㅊ': 'ㄷ', 'ㅌ': 'ㄷ', 'ㅎ': 'ㄷ',
    'ㄹ': 'ㄹ', 'ㄺ': 'ㄱ', 'ㄻ': 'ㅁ', 'ㄼ': 'ㄹ', 'ㄽ': 'ㄹ', 'ㄾ': 'ㄹ', 'ㄿ': 'ㅂ', 'ㅀ': 'ㄹ',
    'ㅁ': 'ㅁ', 'ㅂ': 'ㅂ', 'ㅍ': 'ㅂ', 'ㅄ': 'ㅂ', 'ㅇ': 'ㅇ',
  };
  return map[jong] ?? '';
}

function isObstruent(coda) {
  return coda === 'ㄱ' || coda === 'ㄷ' || coda === 'ㅂ';
}

function nasalOf(coda) {
  if (coda === 'ㄱ') return 'ㅇ';
  if (coda === 'ㄷ') return 'ㄴ';
  if (coda === 'ㅂ') return 'ㅁ';
  return coda;
}

function onsetSymbol(cho, jung, voiced, lateral) {
  const pal = jung === 'ㅣ' || Y_GLIDE.has(jung);
  if (!cho || cho === 'ㅇ') return '';
  if (cho === 'ㄹ') return lateral ? 'l' : 'ɾ';
  if (cho === 'ㅅ') return pal ? 'ɕ' : 's';
  if (cho === 'ㅆ') return pal ? 'ɕ͈' : 's͈';
  if (cho === 'ㄷ') return pal ? (voiced ? 'dʑ' : 'tɕ') : (voiced ? 'd' : 't');
  if (cho === 'ㄸ') return pal ? 'tɕ͈' : 't͈';
  if (cho === 'ㅌ') return pal ? 'tɕʰ' : 'tʰ';
  if (cho === 'ㄱ') return voiced ? 'ɡ' : 'k';
  if (cho === 'ㄲ') return 'k͈';
  if (cho === 'ㅋ') return 'kʰ';
  if (cho === 'ㅂ') return voiced ? 'b' : 'p';
  if (cho === 'ㅃ') return 'p͈';
  if (cho === 'ㅍ') return 'pʰ';
  if (cho === 'ㅈ') return voiced ? 'dʑ' : 'tɕ';
  if (cho === 'ㅉ') return 'tɕ͈';
  if (cho === 'ㅊ') return 'tɕʰ';
  if (cho === 'ㄴ') return 'n';
  if (cho === 'ㅁ') return 'm';
  if (cho === 'ㅎ') return 'h';
  return '';
}

const VOWEL_IPA = {
  'ㅏ': 'a', 'ㅐ': 'ɛ', 'ㅑ': 'ja', 'ㅒ': 'jɛ', 'ㅓ': 'ʌ', 'ㅔ': 'e', 'ㅕ': 'jʌ', 'ㅖ': 'je',
  'ㅗ': 'o', 'ㅘ': 'wa', 'ㅙ': 'wɛ', 'ㅚ': 'we', 'ㅛ': 'jo',
  'ㅜ': 'u', 'ㅝ': 'wʌ', 'ㅞ': 'we', 'ㅟ': 'wi', 'ㅠ': 'ju',
  'ㅡ': 'ɯ', 'ㅢ': 'ɯi', 'ㅣ': 'i',
};

function codaSymbol(jong) {
  const surf = surfaceCoda(jong);
  if (!surf) return '';
  if (surf === 'ㄱ') return 'k̚';
  if (surf === 'ㄴ') return 'n';
  if (surf === 'ㄷ') return 't̚';
  if (surf === 'ㄹ') return 'l';
  if (surf === 'ㅁ') return 'm';
  if (surf === 'ㅂ') return 'p̚';
  if (surf === 'ㅇ') return 'ŋ';
  return '';
}

export function ipaOf(text) {
  const syls = [...text].map(decompose).filter(Boolean).map(s => ({ ...s, voiced: false, lateral: false }));
  if (!syls.length) return '';
  for (let i = 0; i < syls.length - 1; i++) {
    const a = syls[i];
    const b = syls[i + 1];
    if (!a.jong) continue;
    if (b.cho === 'ㅇ') {
      const link = linkBeforeVowel(a.jong);
      a.jong = link.coda;
      if (link.onset) b.cho = link.onset;
    } else if (hasH(a.jong) && ASPIRATE[b.cho]) {
      b.cho = ASPIRATE[b.cho];
      a.jong = stripH(a.jong);
    }
  }
  for (let i = 0; i < syls.length - 1; i++) {
    const a = syls[i];
    const b = syls[i + 1];
    const surf = surfaceCoda(a.jong);
    if ((b.cho === 'ㄴ' || b.cho === 'ㅁ') && isObstruent(surf)) a.jong = nasalOf(surf);
  }
  for (let i = 0; i < syls.length - 1; i++) {
    const a = syls[i];
    const b = syls[i + 1];
    const surf = surfaceCoda(a.jong);
    if (surf === 'ㄹ' && b.cho === 'ㄹ') b.lateral = true;
    if (isObstruent(surf) && TENSE[b.cho]) b.cho = TENSE[b.cho];
  }
  for (let i = 1; i < syls.length; i++) {
    const prev = surfaceCoda(syls[i - 1].jong);
    const son = prev === '' || 'ㄴㄹㅁㅇ'.includes(prev);
    if (son && LENIS_STOP.has(syls[i].cho)) syls[i].voiced = true;
  }
  const parts = syls.map(s => (
    onsetSymbol(s.cho, s.jung, s.voiced, s.lateral) + (VOWEL_IPA[s.jung] || '') + codaSymbol(s.jong)
  ));
  return '[' + parts.join('.') + ']';
}

const SERIES = {
  'ㄱ': ['velar', 'plain'], 'ㅋ': ['velar', 'aspirated'], 'ㄲ': ['velar', 'tense'],
  'ㄷ': ['alveolar', 'plain'], 'ㅌ': ['alveolar', 'aspirated'], 'ㄸ': ['alveolar', 'tense'],
  'ㅂ': ['bilabial', 'plain'], 'ㅍ': ['bilabial', 'aspirated'], 'ㅃ': ['bilabial', 'tense'],
  'ㅈ': ['palatal', 'plain'], 'ㅊ': ['palatal', 'aspirated'], 'ㅉ': ['palatal', 'tense'],
  'ㅅ': ['alveolar', 'plain'], 'ㅆ': ['alveolar', 'tense'],
};

const MANNER = {
  plain: 'plain: unaspirated and short, like Spanish p/t/k, and it voices between vowels',
  aspirated: 'aspirated: a strong puff, like English p/t/k at the start of a word',
  tense: 'tense: stiff, unaspirated, and longer, with a higher pitch on the next vowel',
};

const VOWEL_HELP = {
  'ㅏ': ['[a]', "Spanish 'a' in casa (not the back vowel of English father)"],
  'ㅓ': ['[ʌ]', "like the 'u' in English cup, but more open and further back. No Spanish or German match"],
  'ㅗ': ['[o]', "a pure round o, as in Spanish oso or German so. Not the diphthong in English go"],
  'ㅜ': ['[u]', "Spanish 'u' in tú, or German 'u' in Buch"],
  'ㅡ': ['[ɯ]', 'no equivalent in English, Spanish, or German: an unrounded oo, tongue back and lips spread'],
  'ㅣ': ['[i]', "Spanish 'i' in sí, or German ie in sie"],
  'ㅐ': ['[ɛ]', "German ä in Bett, or English e in bed. Seoul often merges this with ㅔ"],
  'ㅔ': ['[e]', "Spanish e in mesa, if you keep it distinct. Seoul usually merges it with ㅐ"],
  'ㅑ': ['[ja]', "German ja, or English ya in yacht"],
  'ㅕ': ['[jʌ]', "y plus ㅓ: like young, but with that more open, backer vowel"],
  'ㅛ': ['[jo]', "German Jo in Johann, or English yo, with a pure o"],
  'ㅠ': ['[ju]', "English you, or German Ju in Jubel, with a pure ㅜ"],
  'ㅒ': ['[jɛ]', "English ye in yes. Rare, and often not separate from ㅖ in Seoul"],
  'ㅖ': ['[je]', "German je. Often merged with ㅒ"],
  'ㅘ': ['[wa]', "Spanish ua in cuatro"],
  'ㅙ': ['[wɛ]', "English we in wet. Often merged with ㅚ and ㅞ"],
  'ㅚ': ['[we]', "Seoul today says [we], like English wet. The older value is German ö [ø]"],
  'ㅝ': ['[wʌ]', "English wo in wonder, with the more open, backer ㅓ"],
  'ㅞ': ['[we]', "English we in wet. Rare on its own; Seoul merges it with ㅙ and ㅚ"],
  'ㅟ': ['[wi]', "Seoul today says [wi], like the word we. The older value is German ü [y]"],
  'ㅢ': ['[ɯi]', "no equivalent: glide from ㅡ into ㅣ. The particle 의 is often just [e]"],
};

function onsetLabel(cho) {
  const ipa = onsetSymbol(cho, 'ㅏ', false, false);
  return `${cho} [${ipa}]`;
}

export function contrastTip(correctText, chosenText) {
  const A = [...correctText].map(decompose).filter(Boolean);
  const B = [...chosenText].map(decompose).filter(Boolean);
  if (!A.length || !B.length) return 'Listen once, then match the vowel and the initial consonant.';
  const n = Math.max(A.length, B.length);
  for (let i = 0; i < n; i++) {
    const a = A[i];
    const b = B[i];
    if (!a || !b) return 'The number of syllables does not match. Read one syllable at a time, then listen.';
    const as = SERIES[a.cho];
    const bs = SERIES[b.cho];
    if (a.cho !== b.cho && as && bs && as[0] === bs[0]) {
      return `${b.cho} is ${MANNER[bs[1]]}. ${a.cho} is ${MANNER[as[1]]}. Same place (${as[0]}); only the puff and the stiffness change.`;
    }
    if (a.jung !== b.jung) {
      const w = VOWEL_HELP[a.jung];
      const g = VOWEL_HELP[b.jung];
      if (w && g) return `You read ${b.jung} ${g[0]}, ${g[1]}. This vowel is ${a.jung} ${w[0]}: ${w[1]}.`;
    }
    if (a.jong !== b.jong) {
      if (!a.jong) return `This syllable has no final consonant. ${b.jong} as a final would be [${codaSymbol(b.jong)}], one of the unreleased batchim sounds.`;
      if (!b.jong) return `You missed the final ${a.jong} [${codaSymbol(a.jong)}]. Batchim close and do not release into a puff.`;
      return `The final is ${a.jong} [${codaSymbol(a.jong)}], not ${b.jong} [${codaSymbol(b.jong)}]. Several letters share one of only seven final sounds.`;
    }
    if (a.cho !== b.cho) {
      return `The initial is ${onsetLabel(a.cho)}, not ${onsetLabel(b.cho)}.`;
    }
  }
  return 'Listen for the vowel, and for whether the consonant has a puff.';
}

export const LETTERS = [
  { id: 'g', char: 'ㄱ', kind: 'consonant', series: 'plain', place: 'velar', grid: 'velar', name: '기역', nameRr: 'giyeok', rr: 'g / k', ipaInit: '[k ~ ɡ]', ipaFinal: '[k̚]', lang: 'Spanish', compare: "Spanish unaspirated k, as in casa, at the start of a word. English k is too aspirated. Between vowels it voices to [ɡ]. As a final it is unreleased [k̚], with no puff.", word: '가방', gloss: 'bag', say: '가' },
  { id: 'n', char: 'ㄴ', kind: 'consonant', series: 'other', place: 'alveolar', name: '니은', nameRr: 'nieun', rr: 'n', ipaInit: '[n]', ipaFinal: 'same [n]', lang: 'Spanish', compare: "Spanish or English n, at the start and as a final. Before ㅣ it can sound a little palatal, but it is still n.", word: '나라', gloss: 'country', say: '나' },
  { id: 'd', char: 'ㄷ', kind: 'consonant', series: 'plain', place: 'alveolar', grid: 'alveolar', name: '디귿', nameRr: 'digeut', rr: 'd / t', ipaInit: '[t ~ d]', ipaFinal: '[t̚]', lang: 'Spanish', compare: "Spanish unaspirated t, as in tono, but alveolar rather than dental. Between vowels it voices to [d]. As a final, unreleased [t̚].", word: '다리', gloss: 'leg', say: '다' },
  { id: 'r', char: 'ㄹ', kind: 'consonant', series: 'other', place: 'alveolar', name: '리을', nameRr: 'rieul', rr: 'r / l', ipaInit: '[ɾ]', ipaFinal: '[l]', lang: 'Spanish', compare: "Between vowels, a single flap [ɾ] like Spanish pero (one r), not the trill in perro and not English r. As a final, a light [l].", word: '나라', gloss: 'country', say: '나라' },
  { id: 'm', char: 'ㅁ', kind: 'consonant', series: 'other', place: 'bilabial', name: '미음', nameRr: 'mieum', rr: 'm', ipaInit: '[m]', ipaFinal: 'same [m]', lang: 'Spanish', compare: 'Spanish or English m, at the start and as a final.', word: '마음', gloss: 'heart, mind', say: '마' },
  { id: 'b', char: 'ㅂ', kind: 'consonant', series: 'plain', place: 'bilabial', grid: 'bilabial', name: '비읍', nameRr: 'bieup', rr: 'b / p', ipaInit: '[p ~ b]', ipaFinal: '[p̚]', lang: 'Spanish', compare: "Spanish unaspirated p, as in peso, at the start of a word. Between vowels it is a voiced stop [b]. Spanish b in that position is a fricative [β], so English b is closer there. Final: unreleased [p̚].", word: '바다', gloss: 'sea', say: '바' },
  { id: 's', char: 'ㅅ', kind: 'consonant', series: 'plain', place: 'alveolar', grid: 'fricative', name: '시옷', nameRr: 'siot', rr: 's / t', ipaInit: '[s] (~ [ɕ] before ㅣ)', ipaFinal: '[t̚]', lang: 'English', compare: "English s in see. Before ㅣ or a y-glide it is [ɕ], fronter than English sh and not German ich [ç]. As a final it is not s: it becomes unreleased [t̚].", word: '사람', gloss: 'person', say: '사' },
  { id: 'ng', char: 'ㅇ', kind: 'consonant', series: 'other', place: 'velar', name: '이응', nameRr: 'ieung', rr: '∅ / ng', ipaInit: 'silent', ipaFinal: '[ŋ]', lang: 'English', compare: "Silent at the start of a syllable, so 아 is only the vowel. As a final, [ŋ] as in English sing or German singen. Spanish has no native word-final ng.", word: '아이', gloss: 'child', say: '아' },
  { id: 'j', char: 'ㅈ', kind: 'consonant', series: 'plain', place: 'palatal', grid: 'palatal', name: '지읒', nameRr: 'jieut', rr: 'j / t', ipaInit: '[tɕ ~ dʑ]', ipaFinal: '[t̚]', lang: 'None', compare: "No exact match. An unaspirated alveolo-palatal affricate, fronter than English j or ch, voiceless at the start of a word and voiced [dʑ] between vowels. German tsch is closer to ㅊ. As a final, unreleased [t̚].", word: '종이', gloss: 'paper', say: '자' },
  { id: 'ch', char: 'ㅊ', kind: 'consonant', series: 'aspirated', place: 'palatal', grid: 'palatal', name: '치읓', nameRr: 'chieut', rr: 'ch / t', ipaInit: '[tɕʰ]', ipaFinal: '[t̚]', lang: 'English', compare: "English ch in church, with a clear puff, but the tongue is farther forward ([tɕʰ], not [tʃ]). As a final, unreleased [t̚].", word: '차', gloss: 'tea', say: '차' },
  { id: 'k', char: 'ㅋ', kind: 'consonant', series: 'aspirated', place: 'velar', grid: 'velar', name: '키읔', nameRr: 'kieuk', rr: 'k', ipaInit: '[kʰ]', ipaFinal: '[k̚]', lang: 'English', compare: "English k in kite, or German k, with a strong puff. As a final it loses that puff and is unreleased [k̚], the same sound as final ㄱ.", word: '코', gloss: 'nose', say: '코' },
  { id: 't', char: 'ㅌ', kind: 'consonant', series: 'aspirated', place: 'alveolar', grid: 'alveolar', name: '티읕', nameRr: 'tieut', rr: 't', ipaInit: '[tʰ]', ipaFinal: '[t̚]', lang: 'English', compare: "English t in top, with a strong puff. As a final, unreleased [t̚], the same sound as final ㄷ.", word: '타다', gloss: 'to ride', say: '타' },
  { id: 'p', char: 'ㅍ', kind: 'consonant', series: 'aspirated', place: 'bilabial', grid: 'bilabial', name: '피읖', nameRr: 'pieup', rr: 'p', ipaInit: '[pʰ]', ipaFinal: '[p̚]', lang: 'English', compare: "English p in pie, with a strong puff. As a final, unreleased [p̚], the same sound as final ㅂ.", word: '파도', gloss: 'wave', say: '파' },
  { id: 'h', char: 'ㅎ', kind: 'consonant', series: 'other', place: 'glottal', name: '히읗', nameRr: 'hieut', rr: 'h', ipaInit: '[h]', ipaFinal: 'drops, or [t̚]', lang: 'German', compare: "English or German h. Between vowels it is weak and in Seoul often disappears (좋아 is [조아]). Before a stop it aspirates that stop (좋다 is [조타]). Left over at the end of a word, it is unreleased [t̚].", word: '하나', gloss: 'one', say: '하' },
  { id: 'kk', char: 'ㄲ', kind: 'consonant', series: 'tense', place: 'velar', grid: 'velar', name: '쌍기역', nameRr: 'ssanggiyeok', rr: 'kk', ipaInit: '[k͈]', ipaFinal: '[k̚]', lang: 'None', compare: "No equivalent in English, Spanish, or German. Stiff, unaspirated, and longer than ㄱ, with a higher pitch on the next vowel. Hold a Spanish k a beat longer and do not add a puff. As a final, just unreleased [k̚].", word: '꽃', gloss: 'flower', say: '꽃' },
  { id: 'tt', char: 'ㄸ', kind: 'consonant', series: 'tense', place: 'alveolar', grid: 'alveolar', name: '쌍디귿', nameRr: 'ssangdigeut', rr: 'tt', ipaInit: '[t͈]', ipaFinal: 'does not occur', lang: 'None', compare: "No equivalent. Stiff, unaspirated, and longer than ㄷ. It is not a doubled Spanish t and not German tt. It never occurs as a final.", word: '딸', gloss: 'daughter', say: '따' },
  { id: 'pp', char: 'ㅃ', kind: 'consonant', series: 'tense', place: 'bilabial', grid: 'bilabial', name: '쌍비읍', nameRr: 'ssangbieup', rr: 'pp', ipaInit: '[p͈]', ipaFinal: 'does not occur', lang: 'None', compare: "No equivalent. Stiff, unaspirated, and longer than ㅂ, with no puff and a higher pitch on the next vowel. It never occurs as a final.", word: '빵', gloss: 'bread', say: '빠' },
  { id: 'ss', char: 'ㅆ', kind: 'consonant', series: 'tense', place: 'alveolar', grid: 'fricative', name: '쌍시옷', nameRr: 'ssangsiot', rr: 'ss', ipaInit: '[s͈]', ipaFinal: '[t̚]', lang: 'None', compare: "No true match. A longer, tighter s than ㅅ, not just a double letter. Before ㅣ it is [ɕ͈]. As a final before a pause it is unreleased [t̚]; before a vowel it stays tense (있어 is [이써]).", word: '쌀', gloss: 'rice (uncooked)', say: '싸' },
  { id: 'jj', char: 'ㅉ', kind: 'consonant', series: 'tense', place: 'palatal', grid: 'palatal', name: '쌍지읒', nameRr: 'ssangjieut', rr: 'jj', ipaInit: '[tɕ͈]', ipaFinal: 'does not occur', lang: 'None', compare: "No equivalent. The stiff, longer, unaspirated partner of ㅈ. Not English j and not German tsch. It never occurs as a final.", word: '짜다', gloss: 'to be salty', say: '짜' },
  { id: 'a', char: 'ㅏ', kind: 'vowel', series: 'simple', name: '아', nameRr: 'a', rr: 'a', ipaInit: '[a]', ipaFinal: '', lang: 'Spanish', compare: "Spanish a in casa. English father is too far back, and cat is too front.", word: '아기', gloss: 'baby', say: '아' },
  { id: 'eo', char: 'ㅓ', kind: 'vowel', series: 'simple', name: '어', nameRr: 'eo', rr: 'eo', ipaInit: '[ʌ]', ipaFinal: '', lang: 'English', compare: "Closest to the u in English cup, but more open and further back. Some Seoul speakers round it slightly toward [ɔ]. Spanish and German have no match.", word: '어디', gloss: 'where', say: '어' },
  { id: 'o', char: 'ㅗ', kind: 'vowel', series: 'simple', name: '오', nameRr: 'o', rr: 'o', ipaInit: '[o]', ipaFinal: '', lang: 'Spanish', compare: "Spanish o in oso, or German o in so. Do not use the diphthong in English go.", word: '오이', gloss: 'cucumber', say: '오' },
  { id: 'u', char: 'ㅜ', kind: 'vowel', series: 'simple', name: '우', nameRr: 'u', rr: 'u', ipaInit: '[u]', ipaFinal: '', lang: 'Spanish', compare: "Spanish u in tú, or German u in Buch. English oo in food is close but often glides.", word: '우유', gloss: 'milk', say: '우' },
  { id: 'eu', char: 'ㅡ', kind: 'vowel', series: 'simple', name: '으', nameRr: 'eu', rr: 'eu', ipaInit: '[ɯ]', ipaFinal: '', lang: 'None', compare: "No equivalent in English, Spanish, or German. Say oo as in food, keep the tongue there, and unround the lips until they are spread.", word: '그릇', gloss: 'bowl', say: '으' },
  { id: 'i', char: 'ㅣ', kind: 'vowel', series: 'simple', name: '이', nameRr: 'i', rr: 'i', ipaInit: '[i]', ipaFinal: '', lang: 'Spanish', compare: "Spanish i in sí, or German ie in sie. English ee is close but often a slight diphthong.", word: '이름', gloss: 'name', say: '이' },
  { id: 'ae', char: 'ㅐ', kind: 'vowel', series: 'simple', name: '애', nameRr: 'ae', rr: 'ae', ipaInit: '[ɛ]', ipaFinal: '', lang: 'German', compare: "German ä in Bett, or English e in bed. In Seoul, most speakers no longer keep this separate from ㅔ.", word: '개', gloss: 'dog', say: '애' },
  { id: 'e', char: 'ㅔ', kind: 'vowel', series: 'simple', name: '에', nameRr: 'e', rr: 'e', ipaInit: '[e]', ipaFinal: '', lang: 'Spanish', compare: "Spanish e in mesa, or German e in See, in careful speech. Seoul usually merges ㅔ with ㅐ into one mid vowel.", word: '베개', gloss: 'pillow', say: '에' },
  { id: 'ya', char: 'ㅑ', kind: 'vowel', series: 'y', name: '야', nameRr: 'ya', rr: 'ya', ipaInit: '[ja]', ipaFinal: '', lang: 'German', compare: "German ja, or English ya in yacht.", word: '야구', gloss: 'baseball', say: '야' },
  { id: 'yeo', char: 'ㅕ', kind: 'vowel', series: 'y', name: '여', nameRr: 'yeo', rr: 'yeo', ipaInit: '[jʌ]', ipaFinal: '', lang: 'English', compare: "A y plus ㅓ. Like young without the ng, but the vowel is more open and further back than English u.", word: '여자', gloss: 'woman', say: '여' },
  { id: 'yo', char: 'ㅛ', kind: 'vowel', series: 'y', name: '요', nameRr: 'yo', rr: 'yo', ipaInit: '[jo]', ipaFinal: '', lang: 'German', compare: "German Jo in Johann, or English yo. Keep a pure o, not English oh-w.", word: '요리', gloss: 'cooking', say: '요' },
  { id: 'yu', char: 'ㅠ', kind: 'vowel', series: 'y', name: '유', nameRr: 'yu', rr: 'yu', ipaInit: '[ju]', ipaFinal: '', lang: 'English', compare: "English you, or German Ju in Jubel. Keep the vowel a pure ㅜ.", word: '유리', gloss: 'glass', say: '유' },
  { id: 'yae', char: 'ㅒ', kind: 'vowel', series: 'y', name: '얘', nameRr: 'yae', rr: 'yae', ipaInit: '[jɛ]', ipaFinal: '', lang: 'English', compare: "English ye in yes. The letter is rare, and Seoul often does not separate it from ㅖ.", word: '얘기', gloss: 'story', say: '얘' },
  { id: 'ye', char: 'ㅖ', kind: 'vowel', series: 'y', name: '예', nameRr: 'ye', rr: 'ye', ipaInit: '[je]', ipaFinal: '', lang: 'German', compare: "German je, or English yea. Often merged with ㅒ.", word: '예술', gloss: 'art', say: '예' },
  { id: 'wa', char: 'ㅘ', kind: 'vowel', series: 'w', name: '와', nameRr: 'wa', rr: 'wa', ipaInit: '[wa]', ipaFinal: '', lang: 'Spanish', compare: "Spanish ua in cuatro or cuando.", word: '과일', gloss: 'fruit', say: '와' },
  { id: 'wae', char: 'ㅙ', kind: 'vowel', series: 'w', name: '왜', nameRr: 'wae', rr: 'wae', ipaInit: '[wɛ]', ipaFinal: '', lang: 'English', compare: "English we in wet. In Seoul it often merges with ㅚ and ㅞ.", word: '왜', gloss: 'why', say: '왜' },
  { id: 'oe', char: 'ㅚ', kind: 'vowel', series: 'w', name: '외', nameRr: 'oe', rr: 'oe', ipaInit: '[we]', ipaFinal: '', lang: 'English', compare: "Standard Seoul today is [we], like English wet, and it merges with ㅙ and ㅞ. The older monophthong is German ö in schön [ø]. Aim for [we] unless you are studying that older sound.", word: '외국', gloss: 'foreign country', say: '외' },
  { id: 'wo', char: 'ㅝ', kind: 'vowel', series: 'w', name: '워', nameRr: 'wo', rr: 'wo', ipaInit: '[wʌ]', ipaFinal: '', lang: 'English', compare: "English wo in wonder or won, but with the more open, backer ㅓ.", word: '원', gloss: 'won (currency)', say: '워' },
  { id: 'we', char: 'ㅞ', kind: 'vowel', series: 'w', name: '웨', nameRr: 'we', rr: 'we', ipaInit: '[we]', ipaFinal: '', lang: 'English', compare: "English we in wet. Uncommon in native words, and Seoul merges it with ㅙ and ㅚ.", word: '궤', gloss: 'chest', say: '웨' },
  { id: 'wi', char: 'ㅟ', kind: 'vowel', series: 'w', name: '위', nameRr: 'wi', rr: 'wi', ipaInit: '[wi]', ipaFinal: '', lang: 'English', compare: "Standard Seoul today is [wi], like the English word we. The older monophthong is German ü in für [y]. Say w plus ㅣ unless you are targeting that older sound.", word: '위', gloss: 'above', say: '위' },
  { id: 'ui', char: 'ㅢ', kind: 'vowel', series: 'diphthong', name: '의', nameRr: 'ui', rr: 'ui', ipaInit: '[ɯi]', ipaFinal: '', lang: 'None', compare: "No equivalent in English, Spanish, or German. Glide from unrounded ㅡ [ɯ] into ㅣ [i]. Word-initially, many Seoul speakers simplify 의사 toward [i]. The particle 의 is usually [e].", word: '의사', gloss: 'doctor', say: '의' },
];

const PLACES = [
  ['bilabial', 'Lips'],
  ['alveolar', 'Alveolar'],
  ['velar', 'Velar'],
  ['palatal', 'Palatal'],
  ['fricative', 'Sibilant'],
];
const COLS = ['plain', 'aspirated', 'tense'];

let soundFilter = 'all';

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function card(letter) {
  const finalLine = letter.ipaFinal
    ? `<div class="sound-ipa">Final ${esc(letter.ipaFinal)}</div>`
    : '';
  return `<article class="card sound-card" id="sound-${esc(letter.id)}">
    <div class="sound-side">
      <div class="ch" aria-hidden="true">${esc(letter.char)}</div>
      <button type="button" class="play" data-say="${esc(letter.say)}" aria-label="Play ${esc(letter.say)}">▶ ${esc(letter.say)}</button>
    </div>
    <div>
      <div class="nm">${esc(letter.name)} <span class="muted">${esc(letter.nameRr)}</span></div>
      <div class="rr">Revised Romanization <b>${esc(letter.rr)}</b></div>
      <div class="sound-ipa">Initial ${esc(letter.ipaInit)}</div>
      ${finalLine}
      <div class="ex">${esc(letter.word)} · ${esc(letter.gloss)}</div>
      <p class="sound-cmp"><span class="lang-tag">${letter.lang === 'None' ? 'No close match' : `Closest: ${esc(letter.lang)}`}</span> ${esc(letter.compare)}</p>
    </div>
  </article>`;
}

function gridHtml() {
  const head = `<div class="gh"></div>` + COLS.map(c => `<div class="gh">${c === 'plain' ? 'Plain' : c === 'aspirated' ? 'Aspirated' : 'Tense'}</div>`).join('');
  const rows = PLACES.map(([place, label]) => {
    const cells = COLS.map(series => {
      const letter = LETTERS.find(l => l.grid === place && l.series === series);
      if (!letter) return `<div class="cell cell-empty" aria-hidden="true"><span class="ch">—</span><span class="ip">none</span></div>`;
      return `<button type="button" class="cell" data-jump="${esc(letter.id)}" aria-label="${esc(letter.char)} ${esc(letter.ipaInit)}">
        <span class="ch">${esc(letter.char)}</span>
        <span class="ip">${esc(letter.ipaInit)}</span>
      </button>`;
    }).join('');
    return `<div class="pl">${label}</div>${cells}`;
  }).join('');
  return `<div class="place-grid" role="group" aria-label="Three-way consonant contrast by place of articulation">${head}${rows}</div>`;
}

function notesHtml() {
  return `<div class="card notes">
    <h2>Seven finals and the three-way contrast</h2>
    <p><strong>Seven batchim sounds.</strong> Before a pause, every final consonant collapses to one of seven unreleased sounds: ㄱ·ㅋ·ㄲ [k̚], ㄴ [n], ㄷ·ㅅ·ㅆ·ㅈ·ㅊ·ㅌ·ㅎ [t̚], ㄹ [l], ㅁ [m], ㅂ·ㅍ [p̚], ㅇ [ŋ]. The mouth closes and does not puff. Before a vowel, that consonant usually starts the next syllable (국어 is [구거]).</p>
    <p><strong>Three-way laryngeal contrast.</strong> Stops and ㅈ come in three series. Plain ㄱㄷㅂㅈ are unaspirated and short, like Spanish p/t/k, and they voice between vowels. Aspirated ㅋㅌㅍㅊ have a strong puff, like English p/t/k at the start of a word. Tense ㄲㄸㅃㅉ are stiff, unaspirated, and longer, and the next vowel starts higher. English, Spanish, and German have no third series. ㅅ versus ㅆ is only a two-way pair.</p>
  </div>`;
}

export function renderSoundChart(root, speak, opts = {}) {
  if (opts.reset) soundFilter = 'all';
  const showC = soundFilter !== 'vowel';
  const showV = soundFilter !== 'consonant';
  const consonants = LETTERS.filter(l => l.kind === 'consonant');
  const vowels = LETTERS.filter(l => l.kind === 'vowel');
  const vowelGroups = [
    ['simple', 'Simple vowels', 'Monophthongs. ㅐ and ㅔ are simple sounds, even though the letters are historically compound.'],
    ['y', 'Y-diphthongs', 'A palatal glide plus a vowel.'],
    ['w', 'W-diphthongs', 'A labial glide plus a vowel. In Seoul, ㅚ and ㅟ are [we] and [wi], not the older German ö and ü.'],
    ['diphthong', 'ㅢ', 'Neither a y-glide nor a w-glide.'],
  ];
  root.innerHTML = `
    <div class="filters" id="sound-filter" role="group" aria-label="Filter the sound chart">
      <button type="button" data-f="all" class="${soundFilter === 'all' ? 'on' : ''}">All 40</button>
      <button type="button" data-f="consonant" class="${soundFilter === 'consonant' ? 'on' : ''}">Consonants</button>
      <button type="button" data-f="vowel" class="${soundFilter === 'vowel' ? 'on' : ''}">Vowels</button>
    </div>
    <p class="muted sound-lead">40 jamo for Seoul Korean: 14 basic consonants, 5 tense consonants, 10 basic vowel letters, and 11 compound vowel letters. Comparisons use whichever of English, Spanish, or German is actually closest.</p>
    ${showC ? `<h2 class="sound-sec">Consonants</h2><p class="muted">Stops and ㅈ line up as plain, aspirated, and tense. ㄴ, ㄹ, ㅁ, ㅇ, and ㅎ sit outside that grid.</p>${gridHtml()}${notesHtml()}<h2 class="sound-sec">Every consonant</h2>${consonants.map(card).join('')}` : ''}
    ${showV ? `<h2 class="sound-sec">Vowels</h2><p class="muted">10 basic letters ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ and 11 compound letters ㅐㅒㅔㅖㅘㅙㅚㅝㅞㅟㅢ, grouped here by the sound.</p>${vowelGroups.map(([series, title, blurb]) => {
      const items = vowels.filter(l => l.series === series);
      if (!items.length) return '';
      return `<h2 class="sound-sec">${title}</h2><p class="muted">${blurb}</p>${items.map(card).join('')}`;
    }).join('')}` : ''}`;

  root.querySelectorAll('#sound-filter button').forEach(b => {
    b.onclick = () => {
      soundFilter = b.dataset.f;
      renderSoundChart(root, speak);
    };
  });
  root.querySelectorAll('[data-jump]').forEach(b => {
    b.onclick = () => {
      const el = document.getElementById('sound-' + b.dataset.jump);
      if (!el) return;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.classList.add('sound-hit');
      setTimeout(() => el.classList.remove('sound-hit'), 1200);
    };
  });
  root.querySelectorAll('button[data-say]').forEach(b => {
    b.onclick = () => speak(b.dataset.say);
  });
}

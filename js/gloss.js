/* Revised Romanization plus short IPA notes for sounds English lacks. */

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const INIT = {
  'ㄱ': 'g', 'ㄲ': 'kk', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄸ': 'tt', 'ㄹ': 'r', 'ㅁ': 'm', 'ㅂ': 'b',
  'ㅃ': 'pp', 'ㅅ': 's', 'ㅆ': 'ss', 'ㅇ': '', 'ㅈ': 'j', 'ㅉ': 'jj', 'ㅊ': 'ch', 'ㅋ': 'k',
  'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h',
};
const VOWEL = {
  'ㅏ': 'a', 'ㅐ': 'ae', 'ㅑ': 'ya', 'ㅒ': 'yae', 'ㅓ': 'eo', 'ㅔ': 'e', 'ㅕ': 'yeo', 'ㅖ': 'ye',
  'ㅗ': 'o', 'ㅘ': 'wa', 'ㅙ': 'wae', 'ㅚ': 'oe', 'ㅛ': 'yo', 'ㅜ': 'u', 'ㅝ': 'wo', 'ㅞ': 'we',
  'ㅟ': 'wi', 'ㅠ': 'yu', 'ㅡ': 'eu', 'ㅢ': 'ui', 'ㅣ': 'i',
};
const FIN = {
  '': '', 'ㄱ': 'k', 'ㄲ': 'k', 'ㄳ': 'k', 'ㄴ': 'n', 'ㄵ': 'n', 'ㄶ': 'n', 'ㄷ': 't', 'ㄹ': 'l',
  'ㄺ': 'k', 'ㄻ': 'm', 'ㄼ': 'l', 'ㄽ': 'l', 'ㄾ': 'l', 'ㄿ': 'p', 'ㅀ': 'l', 'ㅁ': 'm', 'ㅂ': 'p',
  'ㅄ': 'p', 'ㅅ': 't', 'ㅆ': 't', 'ㅇ': 'ng', 'ㅈ': 't', 'ㅊ': 't', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 't',
};
// When a batchim meets a vowel, the second element moves onto the next syllable.
const MOVE = {
  'ㄱ': ['', 'ㄱ'], 'ㄲ': ['', 'ㄲ'], 'ㄳ': ['ㄱ', 'ㅅ'], 'ㄴ': ['', 'ㄴ'], 'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄶ': ['ㄴ', 'ㅎ'], 'ㄷ': ['', 'ㄷ'], 'ㄹ': ['', 'ㄹ'], 'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'],
  'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['ㄹ', 'ㅎ'],
  'ㅁ': ['', 'ㅁ'], 'ㅂ': ['', 'ㅂ'], 'ㅄ': ['ㅂ', 'ㅅ'], 'ㅅ': ['', 'ㅅ'], 'ㅆ': ['', 'ㅆ'],
  'ㅈ': ['', 'ㅈ'], 'ㅊ': ['', 'ㅊ'], 'ㅋ': ['', 'ㅋ'], 'ㅌ': ['', 'ㅌ'], 'ㅍ': ['', 'ㅍ'], 'ㅎ': ['', 'ㅎ'],
};

function decompose(ch) {
  const code = ch.codePointAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  return {
    cho: CHO[Math.floor(code / 588)],
    jung: JUNG[Math.floor((code % 588) / 28)],
    jong: JONG[code % 28],
  };
}

function isHangul(ch) {
  const c = ch.codePointAt(0);
  return c >= 0xac00 && c <= 0xd7a3;
}

function syllables(text) {
  const out = [];
  for (const ch of text) {
    const syl = decompose(ch);
    if (syl) out.push({ ch, ...syl, hangul: true });
    else out.push({ ch, hangul: false });
  }
  return out;
}

function link(parts) {
  const syls = parts.map(p => (p.hangul ? { ...p } : p));
  for (let i = 0; i < syls.length - 1; i++) {
    const cur = syls[i];
    const nxt = syls[i + 1];
    if (!cur.hangul || !nxt.hangul || !cur.jong) continue;
    // 몰라요: ㄹ + ㄹ is written ll, not l-r.
    if (cur.jong === 'ㄹ' && nxt.cho === 'ㄹ') {
      cur.jong = '';
      nxt.ll = true;
      continue;
    }
    if (nxt.cho !== 'ㅇ') continue;
    // 좋아요: ㅎ before a vowel is not pronounced, so it is not written.
    if (cur.jong === 'ㅎ') {
      cur.jong = '';
      continue;
    }
    const moved = MOVE[cur.jong];
    if (!moved) continue;
    // A cluster ending in ㅎ (많, 싫) drops the ㅎ before a vowel.
    if (moved[1] === 'ㅎ') {
      cur.jong = moved[0];
      continue;
    }
    cur.jong = moved[0];
    nxt.cho = moved[1];
  }
  return syls;
}

export function romanize(text) {
  if (!text) return '';
  const linked = link(syllables(String(text)));
  return linked.map(p => {
    if (!p.hangul) return p.ch;
    const onset = p.ll && p.cho === 'ㄹ' ? 'll' : (INIT[p.cho] || '');
    return onset + (VOWEL[p.jung] || '') + (FIN[p.jong] || '');
  }).join('');
}

const YI = new Set(['ㅣ', 'ㅑ', 'ㅕ', 'ㅛ', 'ㅠ', 'ㅒ', 'ㅖ']);

function pushNote(list, key, symbol, ipa, note) {
  if (list.some(n => n.key === key)) return;
  list.push({ key, symbol, ipa, note });
}

/** IPA only where English has no close sound, plus sound changes. Capped at 3. */
export function soundNotes(text) {
  const notes = [];
  const raw = syllables(String(text || ''));
  const linked = link(raw);
  raw.forEach((p, i) => {
    if (!p.hangul) return;
    const surface = linked[i];
    if (p.cho === 'ㄲ') pushNote(notes, 'kk', 'ㄲ', '[k͈]', 'Tense velar stop. Tight throat, no puff of air.');
    if (p.cho === 'ㄸ') pushNote(notes, 'tt', 'ㄸ', '[t͈]', 'Tense alveolar stop. Tight, no puff of air.');
    if (p.cho === 'ㅃ') pushNote(notes, 'pp', 'ㅃ', '[p͈]', 'Tense bilabial stop. Lips pressed, no puff of air.');
    if (p.cho === 'ㅆ' || surface.cho === 'ㅆ') pushNote(notes, 'ss', 'ㅆ', '[s͈]', 'Tense s. Stronger friction than ㅅ.');
    if (p.cho === 'ㅉ') pushNote(notes, 'jj', 'ㅉ', '[tɕ͈]', 'Tense “j”. Tight, no puff of air.');
    if (p.cho === 'ㅋ' || surface.cho === 'ㅋ') pushNote(notes, 'k', 'ㅋ', '[kʰ]', 'Aspirated velar stop. A clear puff of air.');
    if (p.cho === 'ㅌ' || surface.cho === 'ㅌ') pushNote(notes, 't', 'ㅌ', '[tʰ]', 'Aspirated alveolar stop. A puff of air.');
    if (p.cho === 'ㅍ' || surface.cho === 'ㅍ') pushNote(notes, 'p', 'ㅍ', '[pʰ]', 'Aspirated bilabial stop. A puff of air.');
    if (p.cho === 'ㅊ' || surface.cho === 'ㅊ') pushNote(notes, 'ch', 'ㅊ', '[tɕʰ]', 'Aspirated “ch”. A puff of air.');
    if (p.jung === 'ㅓ' || (p.jung === 'ㅕ')) pushNote(notes, 'eo', 'ㅓ', '[ʌ]', 'Open-mid unrounded vowel, like the u in “cup”, but shorter.');
    if (p.jung === 'ㅡ') pushNote(notes, 'eu', 'ㅡ', '[ɯ]', 'High back unrounded vowel. English has no match: “oo” with spread lips.');
    if (p.jung === 'ㅢ') {
      const afterC = p.cho !== 'ㅇ';
      pushNote(notes, 'ui', 'ㅢ', afterC ? '[i]' : '[ɯi]', afterC
        ? 'After a consonant, ㅢ is usually just [i].'
        : 'Starts as [ɯ] and glides to [i]. The particle 의 is often [e].');
    }
    if (surface.jong === 'ㄱ' || surface.jong === 'ㄲ') pushNote(notes, 'unrel-k', 'ㄱ', '[k̚]', 'Unreleased stop at the end of the syllable. The air stops.');
    if (['ㄷ', 'ㅅ', 'ㅆ', 'ㅈ', 'ㅊ', 'ㅌ', 'ㅎ'].includes(surface.jong)) pushNote(notes, 'unrel-t', 'ㄷ', '[t̚]', 'These finals are an unreleased t [t̚]. The air stops.');
    if (surface.jong === 'ㅂ' || surface.jong === 'ㅍ') pushNote(notes, 'unrel-p', 'ㅂ', '[p̚]', 'Unreleased p at the end of the syllable. The air stops.');
    if (surface.cho === 'ㄹ' && i > 0 && linked[i - 1].hangul) pushNote(notes, 'flap', 'ㄹ', '[ɾ]', 'Between vowels, ㄹ is a quick flap, not English r or l.');
    if (p.cho === 'ㅅ' && YI.has(p.jung)) pushNote(notes, 'shi', 'ㅅ', '[ɕ]', 'ㅅ before ㅣ or a y-vowel sounds like sh.');
    const nxt = raw[i + 1];
    if (nxt && nxt.hangul && (nxt.cho === 'ㄴ' || nxt.cho === 'ㅁ') && ['ㄱ', 'ㄷ', 'ㅂ'].includes(surface.jong)) {
      pushNote(notes, 'nasal', 'ㄴ/ㅁ', '[ŋ n m]', 'A stop before ㄴ or ㅁ becomes nasal: ㄱ→ㅇ, ㄷ→ㄴ, ㅂ→ㅁ.');
    }
  });
  // Possessive particle standing alone.
  if (/^의$/.test(String(text).trim())) {
    pushNote(notes, 'ui-e', '의', '[e]', 'The possessive particle 의 is usually pronounced [e], like “eh”.');
  }
  return notes.slice(0, 3);
}

export function hasHangul(text) {
  return /[\uac00-\ud7a3]/.test(text || '');
}

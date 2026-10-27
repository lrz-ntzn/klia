/* Web Speech API: recognition + synthesis */
let supported = null;

export function speechSupport() {
  if (supported !== null) return supported;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  supported = {
    recognition: !!SR,
    synthesis: 'speechSynthesis' in window,
    SR,
  };
  return supported;
}

export function speakKo(text) {
  const s = speechSupport();
  if (!s.synthesis) return Promise.reject(new Error('Speech synthesis not available'));
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const ko = voices.find(v => v.lang && v.lang.startsWith('ko'));
    if (ko) u.voice = ko;
    u.onend = resolve;
    u.onerror = resolve;
    window.speechSynthesis.speak(u);
  });
}

export function normalizeKo(s) {
  return (s || '')
    .replace(/\s+/g, '')
    .replace(/[^\uac00-\ud7a3a-z0-9]/gi, '')
    .toLowerCase();
}

export function similarity(a, b) {
  const x = normalizeKo(a);
  const y = normalizeKo(b);
  if (!x && !y) return 1;
  if (!x || !y) return 0;
  if (x === y) return 1;
  const m = x.length, n = y.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return 1 - dp[m][n] / Math.max(m, n);
}

export function listenOnce(timeoutMs = 6000) {
  const s = speechSupport();
  if (!s.recognition) {
    return Promise.reject(new Error('Speech recognition not supported in this browser. Try Chrome or Edge on Android, or Safari on iPhone. HTTPS is required for the mic.'));
  }
  return new Promise((resolve, reject) => {
    const rec = new s.SR();
    rec.lang = 'ko-KR';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    let done = false;
    const finish = (fn, val) => {
      if (done) return;
      done = true;
      try { rec.stop(); } catch {}
      fn(val);
    };
    const timer = setTimeout(() => finish(reject, new Error('No speech heard. Try again.')), timeoutMs);
    rec.onresult = (ev) => {
      clearTimeout(timer);
      const alts = [];
      for (let i = 0; i < ev.results[0].length; i++) alts.push(ev.results[0][i].transcript);
      finish(resolve, { transcript: alts[0] || '', alternatives: alts });
    };
    rec.onerror = (ev) => {
      clearTimeout(timer);
      finish(reject, new Error(ev.error || 'Recognition error'));
    };
    rec.onend = () => {
      clearTimeout(timer);
      if (!done) finish(reject, new Error('Recognition ended'));
    };
    try { rec.start(); } catch (e) { clearTimeout(timer); reject(e); }
  });
}

export async function checkPronunciation(target) {
  const result = await listenOnce();
  let best = 0;
  let bestText = result.transcript;
  for (const t of result.alternatives || [result.transcript]) {
    const sc = similarity(t, target);
    if (sc > best) { best = sc; bestText = t; }
  }
  const ok = best >= 0.72;
  if (!ok) {
    try { await speakKo(target); } catch {}
  }
  return { score: best, transcript: bestText, ok, target };
}

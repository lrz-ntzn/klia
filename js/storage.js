/* localStorage progress + export/import */
const KEY = 'kian-korean-v1';

const defaultState = () => ({
  version: 1,
  streak: { lastDate: null, count: 0 },
  srs: {},           // id -> {ease, interval, reps, due, lapses}
  hangulSeen: {},    // id -> {correct, wrong, ms[]}
  syntax: { done: 0, correct: 0, byFocus: {} },
  vocab: { seen: {}, mastered: {} },
  speak: { attempts: 0, avgScore: 0 },
  readingSpeed: [],  // {t, cpm, accuracy}
  weak: {},          // id -> fail count
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const data = JSON.parse(raw);
    return { ...defaultState(), ...data };
  } catch {
    return defaultState();
  }
}

export function save(state) {
  state.updatedAt = Date.now();
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function exportJSON(state) {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Invalid file');
  const merged = { ...defaultState(), ...data, version: 1 };
  save(merged);
  return merged;
}

export function touchStreak(state) {
  const today = new Date();
  const key = today.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  if (state.streak.lastDate === key) return state;
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  const yKey = y.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  if (state.streak.lastDate === yKey) state.streak.count += 1;
  else state.streak.count = 1;
  state.streak.lastDate = key;
  return state;
}

export { KEY, defaultState };

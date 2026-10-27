/* SM-2 spaced repetition */
export function getCard(state, id) {
  return state.srs[id] || { ease: 2.5, interval: 0, reps: 0, due: 0, lapses: 0 };
}

export function schedule(state, id, grade) {
  // grade: 0 again, 1 hard, 2 good
  const c = { ...getCard(state, id) };
  const now = Date.now();
  if (grade === 0) {
    c.reps = 0;
    c.lapses = (c.lapses || 0) + 1;
    c.interval = 0;
    c.due = now + 60 * 1000;
    c.ease = Math.max(1.3, c.ease - 0.2);
  } else {
    if (c.reps === 0) c.interval = grade === 1 ? 5 : 10; // minutes for first
    else if (c.reps === 1) c.interval = grade === 1 ? 60 : 1440; // 1h or 1d in minutes
    else {
      const mult = grade === 1 ? Math.max(1.2, c.ease - 0.15) : c.ease;
      c.interval = Math.round(c.interval * mult);
      if (grade === 2) c.ease = c.ease + 0.05;
      else c.ease = Math.max(1.3, c.ease - 0.05);
    }
    c.reps += 1;
    c.due = now + c.interval * 60 * 1000;
  }
  state.srs[id] = c;
  return c;
}

export function dueCards(state, ids) {
  const now = Date.now();
  const due = [];
  const newOnes = [];
  for (const id of ids) {
    const c = state.srs[id];
    if (!c) newOnes.push(id);
    else if (c.due <= now) due.push(id);
  }
  // prefer due, then new (cap new)
  return [...due, ...newOnes];
}

export function isMastered(state, id) {
  const c = state.srs[id];
  return c && c.reps >= 3 && c.interval >= 1440;
}

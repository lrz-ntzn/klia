/* Shared flashcard session: reveal, type, or pick. Banner stays until Next. */
import { romanize, soundNotes, hasHangul } from './gloss.js';
import { categoriesOf } from './decks.js';
import { awardXp } from './storage.js';
import { mascot } from './mascot.js';
import { playFx, burstConfetti } from './fx.js';
import { presentCard, allowsCard, speechStyle } from './register.js';

const $ = (sel, el = document) => el.querySelector(sel);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function norm(s) {
  return String(s ?? '').replace(/\s+/g, '').trim();
}

function ensureDeckState(state, deckId) {
  if (!state.decks) state.decks = {};
  if (!state.decks[deckId]) {
    state.decks[deckId] = { correct: 0, wrong: 0, cards: {}, direction: 'enko', shuffle: true };
  }
  const d = state.decks[deckId];
  if (!d.cards) d.cards = {};
  if (!d.direction) d.direction = 'enko';
  if (typeof d.shuffle !== 'boolean') d.shuffle = true;
  return d;
}

function cardDeckId(card) {
  return (card && card.deckId) || (session && session.deck.id);
}

function cardProg(card) {
  return ensureDeckState(session.state, cardDeckId(card));
}

function rankOfCard(card) {
  const s = cardProg(card).cards[card.id];
  if (s && s.lapses && s.due <= Date.now()) return 0;
  if (!s) return 1;
  if (s.due <= Date.now()) return 2;
  return 3;
}

function orderCards(cards) {
  const arr = cards.slice();
  const shuffle = session.prog ? session.prog.shuffle !== false : true;
  if (shuffle) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  arr.sort((a, b) => rankOfCard(a) - rankOfCard(b));
  return arr;
}

function mixKey(deckId, catId) {
  return deckId + ':' + catId;
}

function basicsMode() {
  const saved = session.state.decks && session.state.decks.basics && session.state.decks.basics.numberSystem;
  return saved === 'sino' || saved === 'native' || saved === 'both' ? saved : 'both';
}

function setBasicsMode(mode) {
  const deck = ensureDeckState(session.state, 'basics');
  deck.numberSystem = mode;
  session.hooks.persist();
}

function applyMode(cards, deckId) {
  if (deckId !== 'basics' || basicsMode() === 'both') return cards || [];
  return (cards || []).filter(c => c.system === basicsMode());
}

function speechNow() {
  return speechStyle(session.state);
}

function visibleCards(deck, cards) {
  return applyMode(cards, deck.id).filter(c => allowsCard(c, speechNow()));
}

function scoped(deck, cards) {
  return { ...deck, cards: visibleCards(deck, cards) };
}

function viewOf(card) {
  return presentCard(card, speechNow());
}

function selectionSet() {
  if (session.deck.mix) {
    const saved = session.state.mixCategories;
    if (!Array.isArray(saved)) {
      const all = [];
      for (const deck of session.catalog) {
        for (const cat of categoriesOf(scoped(deck, deck.cards))) all.push(mixKey(deck.id, cat.id));
      }
      return new Set(all);
    }
    return new Set(saved);
  }
  const cats = categoriesOf(scoped(session.deck, session.sourceCards));
  const saved = ensureDeckState(session.state, session.deck.id).categories;
  if (!Array.isArray(saved)) return new Set(cats.map(c => c.id));
  const known = new Set(cats.map(c => c.id));
  const picked = saved.filter(id => known.has(id));
  if (picked.length) return new Set(picked);
  if (saved.length === 0) return new Set();
  return new Set(known);
}

function writeSelection(set) {
  const list = [...set];
  if (session.deck.mix) session.state.mixCategories = list;
  else ensureDeckState(session.state, session.deck.id).categories = list;
  session.hooks.persist();
}

function cardsFor(set) {
  if (session.deck.mix) {
    const out = [];
    for (const deck of session.catalog) {
      for (const card of visibleCards(deck, deck.cards)) {
        if (set.has(mixKey(deck.id, card.cat))) out.push(card);
      }
    }
    return out;
  }
  return visibleCards(session.deck, session.sourceCards).filter(c => set.has(c.cat));
}

function catRow(key, label, count, on) {
  return `<button type="button" class="cat-row ${on ? 'on' : ''}" data-cat="${esc(key)}" aria-pressed="${on ? 'true' : 'false'}">
    <span class="cat-check" aria-hidden="true">${on ? '✓' : ''}</span>
    <span class="cat-name">${esc(label)}</span>
    <span class="cat-count">${count}</span>
  </button>`;
}

function numberToggle() {
  const mode = basicsMode();
  const btn = (id, label) => `<button type="button" class="seg ${mode === id ? 'on' : ''}" data-num="${id}" aria-pressed="${mode === id}">${label}</button>`;
  return `<div class="num-toggle" role="group" aria-label="Number system">
    ${btn('sino', 'Sino-Korean')}
    ${btn('native', 'Native Korean')}
    ${btn('both', 'Both')}
  </div>`;
}

function wireNumberToggle(root, after) {
  root.querySelectorAll('[data-num]').forEach(btn => {
    btn.onclick = () => {
      setBasicsMode(btn.dataset.num);
      after();
    };
  });
}

function showPicker() {
  const { root, deck } = session;
  const selected = selectionSet();
  const sections = deck.mix
    ? session.catalog.map(d => ({ title: d.title, rows: categoriesOf(scoped(d, d.cards)).map(c => ({ key: mixKey(d.id, c.id), ...c })) }))
    : [{ title: '', rows: categoriesOf(scoped(deck, session.sourceCards)).map(c => ({ key: c.id, ...c })) }];
  const total = cardsFor(selected).length;
  root.innerHTML = `
    <div class="study-bar">
      <button type="button" id="study-back" class="ghost">Decks</button>
    </div>
    <div class="card deck-intro">
      <h2>${esc(deck.title)}</h2>
      <p class="muted">${esc(deck.blurb || 'Read the sheet, then start when you want.')}</p>
      <button type="button" id="cat-skip" class="ghost">Skip to flashcards</button>
    </div>
    ${reviewSheet(deck)}
    ${deck.id === 'basics' ? numberToggle() : ''}
    <div class="cat-actions">
      <button type="button" id="cat-all">All</button>
      <button type="button" id="cat-none">None</button>
    </div>
    <div id="cat-list">
      ${sections.map(sec => `
        ${sec.title ? `<h2 class="section-label">${esc(sec.title)}</h2>` : ''}
        <div class="cat-list">
          ${sec.rows.map(row => catRow(row.key, row.label, row.count, selected.has(row.key))).join('')}
        </div>`).join('')}
    </div>
    <button type="button" id="cat-start" class="primary">Start flashcards · ${total}</button>`;
  $('#study-back', root).onclick = () => session.hooks.exit();
  const paintRows = () => showPicker();
  wireNumberToggle(root, paintRows);
  root.querySelectorAll('.cat-row').forEach(btn => {
    btn.onclick = () => {
      const set = selectionSet();
      if (set.has(btn.dataset.cat)) set.delete(btn.dataset.cat);
      else set.add(btn.dataset.cat);
      writeSelection(set);
      paintRows();
    };
  });
  $('#cat-all', root).onclick = () => {
    const set = new Set();
    root.querySelectorAll('.cat-row').forEach(btn => set.add(btn.dataset.cat));
    writeSelection(set);
    paintRows();
  };
  $('#cat-none', root).onclick = () => {
    writeSelection(new Set());
    paintRows();
  };
  const start = () => {
    const cards = cardsFor(selectionSet());
    if (!cards.length) {
      session.hooks.toast('Pick at least one category.');
      return;
    }
    beginSession(cards);
  };
  $('#cat-start', root).onclick = start;
  $('#cat-skip', root).onclick = start;
}

function reviewSheet(deck) {
  if (deck.mix) {
    return `<details class="review" open><summary>Review</summary><p class="muted">This mix interleaves the categories you tick. Missed cards from every deck can also be studied from Review due on the home screen.</p></details>`;
  }
  const cards = visibleCards(deck, deck.cards && deck.cards.length ? deck.cards : session.sourceCards).map(c => viewOf(c));
  const rules = cards.filter(c => c.kind === 'explain');
  const rows = cards.filter(c => c.kind !== 'explain').slice(0, 8);
  const more = cards.filter(c => c.kind !== 'explain').length - rows.length;
  return `<details class="review" open>
    <summary>Review</summary>
    ${rules.map(c => `<p><strong>${esc(c.prompt)}</strong> ${esc(c.note || c.answer || '')}</p>`).join('')}
    ${rows.length ? `<table class="sheet"><tbody>${rows.map(c => `<tr><th>${esc(c.digit || c.prompt)}</th><td>${esc(c.answer)}</td></tr>`).join('')}</tbody></table>` : ''}
    ${more > 0 ? `<p class="muted">${more} more items are in the cards.</p>` : ''}
  </details>`;
}

function beginSession(cards) {
  session.prog = ensureDeckState(session.state, session.deck.id);
  session.lastCards = cards.slice();
  session.queue = orderCards(cards);
  session.index = 0;
  session.revealed = false;
  session.banner = null;
  session.requeue = null;
  session.phase = 'run';
  session.hearts = 5;
  session.combo = 0;
  session.mood = 'idle';
  session.stats = { seen: 0, correct: 0, xp: 0, started: Date.now() };
  paint();
}

let session = null;

export function focusCard(id) {
  if (!session) return false;
  const at = session.queue.findIndex(c => c.id === id);
  if (at < 0) return false;
  session.index = at;
  session.banner = null;
  session.revealed = false;
  session.requeue = null;
  paint();
  return true;
}

export function getStudy() {
  if (!session) return null;
  return {
    deckId: session.deck.id,
    index: session.index,
    card: session.queue[session.index] || null,
    revealed: session.revealed,
    direction: session.prog.direction,
    shuffle: session.prog.shuffle,
    pending: !!session.banner,
  };
}

function digitAccepts(card) {
  const raw = String(card.digit || card.prompt || '');
  return [...new Set([raw, raw.replace(/,/g, '')])];
}

function frontBlock(card, direction) {
  if (card.digit && card.kind !== 'explain') {
    if (direction === 'koen') {
      const ko = koreanOf(card);
      return `<div class="prompt hangul-xl">${esc(ko)}</div>${glossHtml(ko)}${playButton(ko)}`;
    }
    const long = String(card.digit).replace(/,/g, '').length > 6;
    const tag = basicsMode() === 'both'
      ? `<div class="sys-tag ${esc(card.system || '')}">${esc(card.systemLabel || '')}</div>`
      : '';
    return `<div class="prompt ${long ? 'digit-lg' : 'digit-xl'}">${esc(card.digit)}</div>${tag}`;
  }
  const front = frontText(card, direction);
  const showKo = direction === 'koen' && card.kind !== 'system' && card.kind !== 'explain' && hasHangul(front);
  return `<div class="prompt">${esc(front)}</div>${showKo ? glossHtml(front) + playButton(koreanOf(card)) : ''}`;
}

function koreanOf(card) {
  return card.speak || (hasHangul(card.answer) ? card.answer : '');
}

function frontText(card, direction) {
  if (card.kind === 'explain') return card.prompt;
  if (direction === 'koen') {
    if (card.kind === 'system') return card.prompt;
    return koreanOf(card) || card.answer;
  }
  return card.prompt;
}

function backEnglish(card) {
  return card.prompt;
}

export function openStudy(root, deck, state, hooks) {
  session = { root, deck, state, hooks, sourceCards: deck.cards.slice(), phase: 'pick' };
  showPicker();
}

export function openMix(root, decks, state, hooks) {
  session = {
    root,
    deck: { id: 'mix', title: 'Custom mix', cards: [], mix: true },
    catalog: decks.filter(d => d.cards && d.cards.length),
    sourceCards: [],
    state,
    hooks,
    phase: 'pick',
  };
  showPicker();
}

function record(ok) {
  const { queue, index } = session;
  const card = queue[index];
  if (!card) return;
  const prog = cardProg(card);
  const slot = prog.cards[card.id] || { correct: 0, wrong: 0, due: 0, streak: 0, lapses: 0 };
  if (!session.stats) session.stats = { seen: 0, correct: 0, xp: 0, started: Date.now() };
  session.stats.seen += 1;
  if (ok) {
    slot.correct += 1;
    slot.streak = (slot.streak || 0) + 1;
    slot.lapses = 0;
    const minutes = Math.min(24, 2 * slot.streak);
    slot.due = Date.now() + minutes * 60 * 1000;
    prog.correct += 1;
    session.stats.correct += 1;
    session.combo = (session.combo || 0) + 1;
    const gain = 10 + Math.min(10, session.combo - 1);
    session.stats.xp += gain;
    awardXp(session.state, gain);
    session.mood = session.combo >= 3 ? 'cheer' : 'happy';
    playFx('ok', session.state.muted);
  } else {
    slot.wrong += 1;
    slot.streak = 0;
    slot.lapses = (slot.lapses || 0) + 1;
    slot.due = Date.now() - 1000;
    prog.wrong += 1;
    session.requeue = card;
    session.combo = 0;
    session.hearts = Math.max(0, (session.hearts ?? 5) - 1);
    session.mood = 'sad';
    playFx('no', session.state.muted);
  }
  prog.cards[card.id] = slot;
  session.hooks.persist();
}

function heartsHtml() {
  const n = session.hearts ?? 5;
  return `<span class="hearts" aria-label="${n} hearts">${Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
}

function sessionHud() {
  const total = Math.max(1, (session.queue || []).length);
  const pct = Math.min(100, Math.round((session.index / total) * 100));
  const combo = session.combo || 0;
  return `
    <div class="session-hud">
      <div class="session-bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
      <div class="hud-row">
        ${session.state.mascot ? mascot(session.mood || 'idle') : ''}
        ${heartsHtml()}
        <span class="combo">${combo > 1 ? combo + ' combo' : ''}</span>
      </div>
    </div>`;
}

function paintCelebrate() {
  const stats = session.stats || { seen: 0, correct: 0, xp: 0, started: Date.now() };
  const acc = stats.seen ? Math.round(stats.correct / stats.seen * 100) : 0;
  const secs = Math.max(1, Math.round((Date.now() - stats.started) / 1000));
  session.root.innerHTML = `
    <div class="celebrate">
      ${session.state.mascot ? mascot('cheer') : ''}
      <h2>Session clear</h2>
      <div class="stat-grid">
        <div class="stat"><div class="n">+${stats.xp}</div><div class="l">XP</div></div>
        <div class="stat"><div class="n">${acc}%</div><div class="l">accuracy</div></div>
        <div class="stat"><div class="n">${secs}s</div><div class="l">time</div></div>
      </div>
      <p class="muted">${stats.correct} of ${stats.seen} correct. Missed cards come back sooner next time.</p>
      <button type="button" id="study-again" class="primary">Practice anyway</button>
      <button type="button" id="study-back">Decks</button>
    </div>`;
  if (session.state.confetti) burstConfetti(session.root);
  playFx('win', session.state.muted);
  $('#study-back', session.root).onclick = () => session.hooks.exit();
  $('#study-again', session.root).onclick = () => beginSession(session.lastCards || []);
}

function paint() {
  const { root, deck, prog, queue, index } = session;
  const raw = queue[index];
  const card = raw ? viewOf(raw) : null;
  if (!card) {
    if (session.stats && session.stats.seen) {
      paintCelebrate();
      return;
    }
    root.innerHTML = `
      <button type="button" id="study-back" class="ghost">Decks</button>
      <div class="card">
        <h2>Nothing due</h2>
        <p class="muted">This deck is clear for now. Missed cards come back first next time.</p>
        <button type="button" id="study-again" class="primary">Practice anyway</button>
      </div>`;
    $('#study-back', root).onclick = () => session.hooks.exit();
    $('#study-again', root).onclick = () => beginSession(session.lastCards || []);
    return;
  }

  const direction = prog.direction;
  const dueSoon = deck.cards.filter(c => {
    const s = prog.cards[c.id];
    return s && s.lapses && s.due <= Date.now();
  }).length;

  root.innerHTML = `
    <div class="study-bar">
      <button type="button" id="study-back" class="ghost">Decks</button>
      <button type="button" id="study-cats">Topics</button>
      <button type="button" id="study-flip" aria-label="Flip direction" ${session.banner ? 'disabled' : ''}>${direction === 'enko' ? 'EN → KO' : 'KO → EN'}</button>
      <button type="button" id="study-shuffle" class="${prog.shuffle ? 'on' : ''}" aria-pressed="${prog.shuffle}">Shuffle</button>
    </div>
    ${deck.id === 'basics' ? numberToggle() : ''}
    ${sessionHud()}
    <div class="pill">${esc(deck.title)} · ${index + 1}/${queue.length}${dueSoon ? ' · ' + dueSoon + ' missed waiting' : ''}</div>
      <div class="card study-card ${session.banner && session.banner.ok === true ? 'is-right' : session.banner && session.banner.ok === false ? 'is-wrong' : ''}" id="study-card">
      ${card.group ? `<div class="group-label">${esc(card.group)}</div>` : ''}
      ${card.register ? `<div class="register ${esc(card.register)}">${esc(card.register)}</div>` : ''}
      ${card.swatch ? `<div class="swatch" style="background:${esc(card.swatch)}"></div>` : ''}
      ${frontBlock(card, direction)}
      <div id="study-controls"></div>
    </div>
    <div id="study-banner"></div>`;

  $('#study-back', root).onclick = () => session.hooks.exit();
  $('#study-cats', root).onclick = () => showPicker();
  wireNumberToggle(root, () => {
    const cards = cardsFor(selectionSet());
    if (!cards.length) {
      showPicker();
      return;
    }
    beginSession(cards);
  });
  $('#study-flip', root).onclick = () => {
    if (session.banner) return;
    prog.direction = prog.direction === 'enko' ? 'koen' : 'enko';
    session.hooks.persist();
    paint();
  };
  $('#study-shuffle', root).onclick = () => {
    prog.shuffle = !prog.shuffle;
    session.hooks.persist();
    const current = queue[index];
    const rest = queue.slice(index);
    const reordered = orderCards(rest, prog);
    if (reordered[0] !== current) {
      const at = reordered.findIndex(c => c.id === current.id);
      if (at > 0) {
        const [item] = reordered.splice(at, 1);
        reordered.unshift(item);
      }
    }
    session.queue = queue.slice(0, index).concat(reordered);
    paint();
  };
  wirePlay(root);
  renderControls(card);
  if (session.banner) showBanner();
  if (session.state.audioFirst && !session.banner && session.spoke !== index && direction === 'koen') {
    session.spoke = index;
    const ko = koreanOf(card);
    if (hasHangul(ko)) session.hooks.speak(ko);
  }
}

export function refreshStudy() {
  if (!session) return;
  if (session.phase === 'run') paint();
  else showPicker();
}

function playButton(text) {
  if (!text || !hasHangul(text)) return '';
  return `<button type="button" class="play-ko" data-speak="${esc(text)}">Play</button>`;
}

function wirePlay(scope) {
  scope.querySelectorAll('[data-speak]').forEach(btn => {
    btn.onclick = () => session.hooks.speak(btn.dataset.speak);
  });
}

function glossHtml(text) {
  const rr = romanize(text);
  const notes = soundNotes(text);
  const rrLine = rr && rr !== text ? `<div class="rr">${esc(rr)}</div>` : '';
  const ipa = notes.map(n => `<p class="ipa-note"><span class="sound-ipa">${esc(n.symbol)} ${esc(n.ipa)}</span> ${esc(n.note)}</p>`).join('');
  return rrLine + ipa;
}

function morphHtml(card) {
  if (!card.morphs) return '';
  const body = card.morphs.map(p => `<span class="m-${esc(p.k)}">${esc(p.t)}</span>`).join('');
  return `<div class="morph" aria-label="morphemes">${body}</div>
    <div class="morph-key">
      <span class="m-stem">stem</span>
      <span class="m-tense">tense</span>
      <span class="m-end">ending</span>
      <span class="m-neg">negation</span>
    </div>`;
}

function renderControls(card) {
  const box = $('#study-controls', session.root);
  if (session.banner) {
    box.innerHTML = '';
    return;
  }
  if (card.kind === 'choice') {
    const flipped = session.prog.direction === 'koen';
    const choices = flipped ? null : card.choices;
    if (flipped) {
      box.innerHTML = `
        <p class="muted">Type the English.</p>
        <input id="study-type" class="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="English">
        <button type="button" id="study-check" class="primary">Check</button>`;
      $('#study-check', box).onclick = () => gradeTyped(card, $('#study-type', box).value, [card.prompt]);
      return;
    }
    box.innerHTML = `<div class="choice-grid" id="study-choices">${choices.map(c => `<button type="button" data-choice="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
    box.querySelectorAll('[data-choice]').forEach(btn => {
      btn.onclick = () => gradeChoice(card, btn.dataset.choice, btn);
    });
    return;
  }
  if (card.kind === 'system') {
    box.innerHTML = `
      <p class="muted">Which number system?</p>
      <div class="choice-grid system-pick">
        <button type="button" data-sys="sino">Sino</button>
        <button type="button" data-sys="native">Native</button>
      </div>`;
    box.querySelectorAll('[data-sys]').forEach(btn => {
      btn.onclick = () => {
        const ok = btn.dataset.sys === card.system;
        box.querySelectorAll('button').forEach(b => {
          b.disabled = true;
          if (b.dataset.sys === card.system) b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
        });
        finish(ok, card);
      };
    });
    return;
  }
  if (card.kind === 'explain') {
    box.innerHTML = `<button type="button" id="study-reveal" class="primary">Show explanation</button>`;
    $('#study-reveal', box).onclick = () => finish(true, card, { selfGrade: false, explain: true });
    return;
  }
  const flipped = session.prog.direction === 'koen';
  const placeholder = card.digit && flipped ? 'Type the digit' : flipped ? 'Type the English' : 'Type the Korean';
  box.innerHTML = `
    <input id="study-type" class="search" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="${placeholder}">
    <div class="row">
      <button type="button" id="study-check" class="primary">Check</button>
      <button type="button" id="study-reveal">Reveal</button>
    </div>`;
  $('#study-check', box).onclick = () => {
    const typed = $('#study-type', box).value;
    if (!typed.trim()) {
      session.hooks.toast('Type an answer, or tap Reveal.');
      return;
    }
    const accepts = flipped && card.digit ? digitAccepts(card) : flipped ? [card.prompt] : acceptsOf(card);
    gradeTyped(card, typed, accepts);
  };
  $('#study-reveal', box).onclick = () => {
    const typed = $('#study-type', box).value.trim();
    if (typed) {
      const accepts = flipped && card.digit ? digitAccepts(card) : flipped ? [card.prompt] : acceptsOf(card);
      gradeTyped(card, typed, accepts);
      return;
    }
    finish(null, card, { selfGrade: true });
  };
}

function acceptsOf(card) {
  const list = [card.answer, ...(card.accept || [])];
  if (card.morphs) list.push(card.morphs.map(p => p.t).join(''));
  return list;
}

function gradeTyped(card, typed, accepts) {
  const got = norm(typed);
  const ok = accepts.some(a => norm(a) === got || norm(a).toLowerCase() === got.toLowerCase());
  finish(ok, card);
}

function gradeChoice(card, picked, btn) {
  const ok = picked === card.correct;
  const box = $('#study-controls', session.root);
  box.querySelectorAll('button').forEach(b => {
    b.disabled = true;
    if (b.dataset.choice === card.correct) b.classList.add('correct');
    else if (b === btn && !ok) b.classList.add('wrong');
  });
  finish(ok, card);
}

function finish(ok, card, opts = {}) {
  session.revealed = true;
  if (opts.selfGrade) {
    session.banner = { ok: null, card, selfGrade: true };
  } else if (opts.explain) {
    record(true);
    session.banner = { ok: true, card, explain: true };
  } else {
    record(!!ok);
    session.banner = { ok: !!ok, card };
  }
  paint();
}

function answerBlock(card) {
  const direction = session.prog.direction;
  const ko = koreanOf(card) || (hasHangul(card.answer) ? card.answer : '');
  if (card.digit && direction === 'koen' && card.kind !== 'explain') {
    return `
      <div class="fb-char digit-xl">${esc(card.digit)}</div>
      <p class="fb-tip">${esc(card.answer)}</p>
      ${glossHtml(ko)}
      ${card.note ? `<p class="fb-tip">${esc(card.note)}</p>` : ''}
      <div class="row">${playButton(ko)}<button type="button" id="study-mic">Mic</button></div>`;
  }
  const english = direction === 'koen' && card.kind !== 'explain' && card.kind !== 'system' ? backEnglish(card) : '';
  return `
    ${card.morphs ? morphHtml(card) : `<div class="fb-char">${esc(card.answer)}</div>`}
    ${ko ? glossHtml(ko) : ''}
    ${english ? `<p class="fb-tip">${esc(english)}</p>` : ''}
    ${card.note ? `<p class="fb-tip">${esc(card.note)}</p>` : ''}
    <div class="row">
      ${ko ? playButton(ko) : ''}
      ${ko ? `<button type="button" id="study-mic">Mic</button>` : ''}
    </div>`;
}

function showBanner() {
  const { banner, root } = session;
  const host = $('#study-banner', root);
  if (!host || !banner) return;
  const card = banner.card;
  if (banner.selfGrade) {
    host.innerHTML = `
      <div class="fb-banner" id="study-self">
        <div class="fb-title">Answer</div>
        ${answerBlock(card)}
        <div class="row">
          <button type="button" id="study-knew">I knew it</button>
          <button type="button" id="study-missed">I missed it</button>
        </div>
      </div>`;
    $('#study-knew', host).onclick = () => { record(true); session.banner = { ok: true, card }; paint(); };
    $('#study-missed', host).onclick = () => { record(false); session.banner = { ok: false, card }; paint(); };
    wirePlay(host);
    wireMic(host, card);
    return;
  }
  const ok = banner.ok;
  host.innerHTML = `
    <div class="fb-banner ${ok ? 'ok' : 'no'}">
      <div class="fb-title"><span aria-hidden="true">${ok ? '✓' : '✗'}</span> ${banner.explain ? 'Explanation' : ok ? 'Correct' : 'Not quite'}</div>
      ${banner.explain ? '' : `<p class="fb-pause">${ok ? 'Good. This card waits longer before it returns.' : 'Again. This card comes back in a few cards.'}</p>`}
      ${answerBlock(card)}
      <button type="button" id="study-next" class="drill-next">Continue</button>
    </div>`;
  $('#study-next', host).onclick = nextCard;
  wirePlay(host);
  wireMic(host, card);
}

function wireMic(host, card) {
  const btn = $('#study-mic', host);
  if (!btn) return;
  const target = (koreanOf(card) || '').replace(/[·]/g, ' ').trim();
  btn.onclick = async () => {
    session.hooks.toast('Listening…');
    try {
      const r = await session.hooks.listen(target);
      session.hooks.toast(`${Math.round(r.score * 100)}% · heard: ${r.transcript || '-'}`);
      if (session.state.speak) {
        session.state.speak.attempts += 1;
        session.state.speak.avgScore = session.state.speak.avgScore
          ? (session.state.speak.avgScore * 0.8 + r.score * 0.2)
          : r.score;
        session.hooks.persist();
      }
    } catch (e) {
      session.hooks.toast(e.message);
    }
  };
}

function nextCard() {
  const { queue } = session;
  if (session.requeue) {
    const insertAt = Math.min(session.index + 3, queue.length);
    queue.splice(insertAt, 0, session.requeue);
    session.requeue = null;
  }
  session.index += 1;
  session.revealed = false;
  session.banner = null;
  if (session.index >= queue.length) {
    const pool = session.lastCards || session.deck.cards;
    const again = pool.filter(c => rankOfCard(c) === 0);
    if (again.length) {
      session.queue = orderCards(again);
      session.index = 0;
    }
  }
  paint();
}

export { ensureDeckState };

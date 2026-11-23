/* Shared flashcard session: reveal, type, or pick. Banner stays until Next. */
import { romanize, soundNotes, hasHangul } from './gloss.js';

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

function rankOf(prog, card) {
  const s = prog.cards[card.id];
  if (s && s.lapses && s.due <= Date.now()) return 0;
  if (!s) return 1;
  if (s.due <= Date.now()) return 2;
  return 3;
}

function orderCards(cards, prog) {
  const arr = cards.slice();
  if (prog.shuffle) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  arr.sort((a, b) => rankOf(prog, a) - rankOf(prog, b));
  return arr;
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
  const prog = ensureDeckState(state, deck.id);
  session = {
    root, deck, state, hooks, prog,
    queue: orderCards(deck.cards, prog),
    index: 0,
    revealed: false,
    banner: null,
    requeue: null,
  };
  paint();
}

function record(ok) {
  const { prog, queue, index } = session;
  const card = queue[index];
  if (!card) return;
  const slot = prog.cards[card.id] || { correct: 0, wrong: 0, due: 0, streak: 0, lapses: 0 };
  if (ok) {
    slot.correct += 1;
    slot.streak = (slot.streak || 0) + 1;
    slot.lapses = 0;
    const minutes = Math.min(24, 2 * slot.streak);
    slot.due = Date.now() + minutes * 60 * 1000;
    prog.correct += 1;
  } else {
    slot.wrong += 1;
    slot.streak = 0;
    slot.lapses = (slot.lapses || 0) + 1;
    slot.due = Date.now() - 1000;
    prog.wrong += 1;
    session.requeue = card;
  }
  prog.cards[card.id] = slot;
  session.hooks.persist();
}

function paint() {
  const { root, deck, prog, queue, index } = session;
  const card = queue[index];
  if (!card) {
    root.innerHTML = `
      <button type="button" id="study-back" class="ghost">Decks</button>
      <div class="card">
        <h2>Nothing due</h2>
        <p class="muted">This deck is clear for now. Missed cards come back first next time.</p>
        <button type="button" id="study-again" class="primary">Practice anyway</button>
      </div>`;
    $('#study-back', root).onclick = () => session.hooks.exit();
    $('#study-again', root).onclick = () => {
      session.queue = orderCards(deck.cards, prog);
      session.index = 0;
      session.revealed = false;
      session.banner = null;
      session.requeue = null;
      paint();
    };
    return;
  }

  const direction = prog.direction;
  const flipped = direction === 'koen';
  const front = frontText(card, direction);
  const showKoOnFront = flipped && card.kind !== 'system' && card.kind !== 'explain' && hasHangul(front);
  const dueSoon = deck.cards.filter(c => {
    const s = prog.cards[c.id];
    return s && s.lapses && s.due <= Date.now();
  }).length;

  root.innerHTML = `
    <div class="study-bar">
      <button type="button" id="study-back" class="ghost">Decks</button>
      <button type="button" id="study-flip" aria-label="Flip direction" ${session.banner ? 'disabled' : ''}>${direction === 'enko' ? 'EN → KO' : 'KO → EN'}</button>
      <button type="button" id="study-shuffle" class="${prog.shuffle ? 'on' : ''}" aria-pressed="${prog.shuffle}">Shuffle</button>
    </div>
    <div class="pill">${esc(deck.title)} · ${index + 1}/${queue.length}${dueSoon ? ' · ' + dueSoon + ' missed waiting' : ''}</div>
      <div class="card study-card ${session.banner && session.banner.ok === true ? 'is-right' : session.banner && session.banner.ok === false ? 'is-wrong' : ''}" id="study-card">
      ${card.group ? `<div class="group-label">${esc(card.group)}</div>` : ''}
      ${card.register ? `<div class="register ${esc(card.register)}">${esc(card.register)}</div>` : ''}
      ${card.swatch ? `<div class="swatch" style="background:${esc(card.swatch)}"></div>` : ''}
      <div class="prompt">${esc(front)}</div>
      ${showKoOnFront ? glossHtml(front) : ''}
      ${showKoOnFront ? playButton(koreanOf(card)) : ''}
      <div id="study-controls"></div>
    </div>
    <div id="study-banner"></div>`;

  $('#study-back', root).onclick = () => session.hooks.exit();
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
  const placeholder = flipped ? 'Type the English' : 'Type the Korean';
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
    const accepts = flipped ? [card.prompt] : acceptsOf(card);
    gradeTyped(card, typed, accepts);
  };
  $('#study-reveal', box).onclick = () => {
    const typed = $('#study-type', box).value.trim();
    if (typed) {
      const accepts = flipped ? [card.prompt] : acceptsOf(card);
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
      <div class="fb-title">${banner.explain ? 'Explanation' : ok ? 'Correct' : 'Not quite'}</div>
      ${answerBlock(card)}
      <button type="button" id="study-next" class="drill-next">Next</button>
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
    const again = session.deck.cards.filter(c => rankOf(session.prog, c) === 0);
    if (again.length) {
      session.queue = orderCards(again, session.prog);
      session.index = 0;
    }
  }
  paint();
}

export { ensureDeckState };

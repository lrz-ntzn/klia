import * as Storage from './storage.js';
import * as SRS from './srs.js';
import * as Speak from './speak.js';
import { renderSoundChart, ipaOf, contrastTip } from './sounds.js';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

let state = Storage.load();
let data = { hangul: null, vocab: null, sentences: null };
let view = 'home';

async function loadData() {
  const [h, v, s] = await Promise.all([
    fetch('data/hangul.json').then(r => r.json()),
    fetch('data/vocab.json').then(r => r.json()),
    fetch('data/sentences.json').then(r => r.json()),
  ]);
  data = { hangul: h, vocab: v, sentences: s };
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function persist() {
  Storage.touchStreak(state);
  Storage.save(state);
  updateBadges();
}

function updateBadges() {
  const due = hangulDeckIds().filter(id => {
    const c = state.srs[id];
    return !c || c.due <= Date.now();
  }).length;
  const el = $('#due-pill');
  if (el) el.textContent = `${due} due`;
}

function setView(name) {
  view = name;
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === name));
  $$('.nav button').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
  const titles = {
    home: 'Kian Korean',
    hangul: 'Hangul flash',
    sounds: 'Sound chart',
    syntax: 'Sentence order',
    vocab: 'Vocab',
    progress: 'Progress',
    about: 'About',
  };
  $('#title').textContent = titles[name] || 'Kian Korean';
  if (name !== 'hangul') stopDrillClock();
  if (name === 'home') renderHome();
  if (name === 'hangul') startHangul();
  if (name === 'sounds') renderSoundChart($('[data-view="sounds"]'), (text) => Speak.speakKo(text).catch(() => toast('Audio unavailable')), { reset: true });
  if (name === 'syntax') startSyntax();
  if (name === 'vocab') renderVocab();
  if (name === 'progress') renderProgress();
  if (name === 'about') renderAbout();
}

/* ---------- Hangul ---------- */
function hangulItems() {
  const h = data.hangul;
  return [
    ...h.consonants,
    ...h.vowels,
    ...h.syllables,
    ...h.words,
  ];
}
function hangulDeckIds() {
  return hangulItems().map(x => x.id);
}
function hangulById(id) {
  return hangulItems().find(x => x.id === id);
}

let hangulMode = 'srs'; // srs | timed
let hangulQueue = [];
let hangulCurrent = null;
let hangulRevealed = false;
let timed = { left: 30, score: 0, total: 0, timer: null, item: null };

function startHangul() {
  stopDrillClock();
  const root = $('[data-view="hangul"]');
  root.innerHTML = `
    <button type="button" id="open-sounds" class="sound-link">Sound chart — 40 jamo, with sounds you already know</button>
    <div class="row" style="margin-bottom:10px">
      <button id="mode-srs" class="primary">SRS cards</button>
      <button id="mode-timed">Fast read (30s)</button>
    </div>
    <div id="hangul-body"></div>`;
  $('#open-sounds').onclick = () => setView('sounds');
  $('#mode-srs').onclick = () => { hangulMode = 'srs'; stopDrillClock(); renderHangulCard(); };
  $('#mode-timed').onclick = () => startTimed();
  renderHangulCard();
}

function renderHangulCard() {
  hangulQueue = SRS.dueCards(state, hangulDeckIds());
  if (!hangulQueue.length) {
    // all done: reshuffle weak or all
    hangulQueue = hangulDeckIds().sort(() => Math.random() - 0.5);
  }
  hangulCurrent = hangulById(hangulQueue[0]);
  hangulRevealed = false;
  const body = $('#hangul-body');
  const item = hangulCurrent;
  const label = item.type === 'consonant' ? 'Consonant' : item.type === 'vowel' ? 'Vowel' : item.type === 'syllable' ? 'Syllable' : 'Word';
  body.innerHTML = `
    <div class="pill">${label} · batch ${item.batch || '-'} · <span id="due-pill"></span></div>
    <div class="card flash-stage" id="flash-card">
      <div class="flash-char">${item.char}</div>
      <div class="reveal-hint">Tap card to reveal</div>
      <div id="flash-back" class="hidden stack" style="align-items:center">
        <div class="flash-meta">${item.romaja || ''}${item.en ? ' · ' + item.en : ''}${item.name ? ' · ' + item.name : ''}</div>
        ${item.ipa ? `<div class="flash-ipa">${item.ipa}</div>` : ''}
        ${item.note ? `<div class="flash-note">${item.note}</div>` : ''}
        ${item.jamo ? `<div class="flash-meta">jamo: ${item.jamo.join(' + ')}</div>` : ''}
      </div>
    </div>
    <div class="row">
      <button class="icon-btn" id="btn-play" title="Play">🔊</button>
      <button class="icon-btn" id="btn-mic" title="Mic check">🎙️</button>
    </div>
    <div id="mic-result"></div>
    <div class="flash-actions hidden" id="grade-actions">
      <button class="btn-again" data-g="0">Again</button>
      <button class="btn-hard" data-g="1">Hard</button>
      <button class="btn-good" data-g="2">Good</button>
    </div>`;
  updateBadges();
  $('#flash-card').onclick = () => {
    if (hangulRevealed) return;
    hangulRevealed = true;
    $('#flash-back').classList.remove('hidden');
    $('.reveal-hint').classList.add('hidden');
    $('#grade-actions').classList.remove('hidden');
  };
  $('#btn-play').onclick = (e) => { e.stopPropagation(); Speak.speakKo(item.char).catch(() => toast('Audio unavailable')); };
  $('#btn-mic').onclick = async (e) => {
    e.stopPropagation();
    const box = $('#mic-result');
    box.innerHTML = `<div class="muted">Listening… say “${item.char}”</div>`;
    try {
      const r = await Speak.checkPronunciation(item.char);
      const pct = Math.round(r.score * 100);
      const cls = pct >= 72 ? 'good' : pct >= 45 ? 'mid' : 'bad';
      box.innerHTML = `<div class="score ${cls}">${pct}%</div><div class="muted">Heard: ${r.transcript || '(nothing)'} · Target: ${r.target}</div>`;
      state.speak.attempts += 1;
      state.speak.avgScore = state.speak.avgScore ? (state.speak.avgScore * 0.8 + r.score * 0.2) : r.score;
      if (!r.ok) state.weak[item.id] = (state.weak[item.id] || 0) + 1;
      persist();
    } catch (err) {
      box.innerHTML = `<div class="feedback no">${err.message}</div>`;
    }
  };
  $$('#grade-actions button').forEach(b => b.onclick = () => {
    const g = +b.dataset.g;
    SRS.schedule(state, item.id, g);
    if (!state.hangulSeen[item.id]) state.hangulSeen[item.id] = { correct: 0, wrong: 0, ms: [] };
    if (g === 0) {
      state.hangulSeen[item.id].wrong += 1;
      state.weak[item.id] = (state.weak[item.id] || 0) + 1;
    } else {
      state.hangulSeen[item.id].correct += 1;
    }
    persist();
    renderHangulCard();
  });
}

function stopDrillClock() {
  clearInterval(timed.timer);
  timed.timer = null;
  timed.paused = false;
  timed.feedback = false;
  if (timed.onKey) {
    document.removeEventListener('keydown', timed.onKey);
    timed.onKey = null;
  }
}

function startTimed() {
  stopDrillClock();
  timed = { left: 30, score: 0, total: 0, timer: null, item: null, responseMs: 0, shownAt: 0, paused: false, feedback: false, onKey: null };
  const body = $('#hangul-body');
  const tick = () => {
    if (timed.paused) return;
    timed.left -= 0.1;
    const bar = $('#tbar');
    if (bar) bar.style.width = `${Math.max(0, (timed.left / 30) * 100)}%`;
    if (timed.left <= 0) {
      clearInterval(timed.timer);
      timed.timer = null;
      finishTimed();
    }
  };
  timed.timer = setInterval(tick, 100);
  timed.onKey = (e) => {
    if (!timed.feedback) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.target && e.target.id === 'drill-play') return;
    e.preventDefault();
    advanceDrill();
  };
  document.addEventListener('keydown', timed.onKey);
  nextTimedItem(body);
}

function drillPool() {
  return data.hangul.syllables.concat(data.hangul.words);
}

function escDrill(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function nextTimedItem(body) {
  const pool = drillPool();
  timed.item = pool[Math.floor(Math.random() * pool.length)];
  timed.feedback = false;
  timed.paused = false;
  timed.shownAt = Date.now();
  const correct = timed.item.romaja;
  const choices = new Set([correct]);
  while (choices.size < 4) {
    const d = pool[Math.floor(Math.random() * pool.length)].romaja;
    if (d) choices.add(d);
  }
  const arr = [...choices].sort(() => Math.random() - 0.5);
  body.innerHTML = `
    <div class="pill">Fast reading · ${timed.score}/${timed.total}</div>
    <div class="timer-bar"><div id="tbar" style="width:${(timed.left/30)*100}%"></div></div>
    <div class="card flash-stage"><div class="flash-char">${escDrill(timed.item.char)}</div></div>
    <div class="choice-grid" id="choices">
      ${arr.map(c => `<button type="button" data-c="${escDrill(c)}">${escDrill(c)}</button>`).join('')}
    </div>
    <div id="drill-feedback"></div>`;
  $$('#choices button').forEach(b => b.onclick = () => answerDrill(b, correct));
}

function markChoice(btn, kind) {
  btn.classList.add(kind);
  btn.disabled = true;
  const icon = kind === 'correct' ? '✓' : '✗';
  const word = kind === 'correct' ? 'correct' : 'incorrect';
  btn.innerHTML = `${escDrill(btn.dataset.c)} <span class="mark" aria-hidden="true">${icon}</span><span class="sr-only"> ${word}</span>`;
}

function answerDrill(btn, correct) {
  if (timed.feedback || !timed.item) return;
  timed.feedback = true;
  timed.paused = true;
  timed.responseMs += Math.max(0, Date.now() - timed.shownAt);
  timed.total += 1;
  const ok = btn.dataset.c === correct;
  if (ok) timed.score += 1;
  $$('#choices button').forEach(x => { x.disabled = true; });
  markChoice(btn, ok ? 'correct' : 'wrong');
  if (!ok) {
    const right = [...$$('#choices button')].find(x => x.dataset.c === correct);
    if (right) markChoice(right, 'correct');
  }
  const item = timed.item;
  const ipa = ipaOf(item.char);
  const chosen = drillPool().find(x => x.romaja === btn.dataset.c);
  const tip = ok ? '' : contrastTip(item.char, chosen ? chosen.char : '');
  const box = $('#drill-feedback');
  box.innerHTML = `
    <div class="fb-banner ${ok ? 'ok' : 'no'}" role="status">
      <div class="fb-title"><span aria-hidden="true">${ok ? '✓' : '✗'}</span> ${ok ? 'Correct' : 'Incorrect'}</div>
      <div class="fb-char">${escDrill(item.char)}</div>
      <div>Romanization <b>${escDrill(item.romaja)}</b></div>
      <div class="sound-ipa">IPA ${escDrill(ipa)}</div>
      <div>Correct answer <b>${escDrill(correct)}</b></div>
      ${ok ? '' : `<div>You picked <b>${escDrill(btn.dataset.c)}</b></div>`}
      <button type="button" id="drill-play" aria-label="Play ${escDrill(item.char)}">▶ Play ${escDrill(item.char)}</button>
      ${tip ? `<p class="fb-tip">${escDrill(tip)}</p>` : ''}
      <p class="fb-pause">Timer paused. Reading this does not use the 30 seconds.</p>
    </div>
    <button type="button" class="primary drill-next" id="drill-next">Next</button>`;
  $('#drill-play').onclick = () => Speak.speakKo(item.char).catch(() => toast('Audio unavailable'));
  $('#drill-next').onclick = () => advanceDrill();
  $('#drill-next').focus();
}

function advanceDrill() {
  if (!timed.feedback) return;
  timed.feedback = false;
  const body = $('#hangul-body');
  if (!body || timed.left <= 0) {
    finishTimed();
    return;
  }
  nextTimedItem(body);
}

function finishTimed() {
  stopDrillClock();
  const sec = timed.responseMs / 1000;
  const cpm = sec > 0 ? Math.round((timed.score / sec) * 60) : 0;
  const acc = timed.total ? timed.score / timed.total : 0;
  state.readingSpeed.push({ t: Date.now(), cpm, accuracy: acc, correct: timed.score, total: timed.total, responseMs: timed.responseMs });
  persist();
  const body = $('#hangul-body');
  if (!body) return;
  body.innerHTML = `
    <div class="card stack">
      <h2>Time!</h2>
      <div class="stat-grid">
        <div class="stat"><div class="n">${timed.score}</div><div class="l">correct</div></div>
        <div class="stat"><div class="n">${Math.round(acc*100)}%</div><div class="l">accuracy</div></div>
        <div class="stat"><div class="n">${cpm}</div><div class="l">cards / min</div></div>
      </div>
      <p class="muted">Speed uses answer time only. Time spent on the feedback banner is not counted.</p>
      <button class="primary" id="again-timed">Go again</button>
      <button id="back-srs">Back to SRS</button>
    </div>`;
  $('#again-timed').onclick = startTimed;
  $('#back-srs').onclick = () => { hangulMode = 'srs'; renderHangulCard(); };
}

/* ---------- Syntax drag-drop ---------- */
let syn = { idx: 0, placed: [], bank: [], drill: null, filter: 'all' };

function startSyntax() {
  const drills = data.sentences.drills;
  const focuses = data.sentences.focusLabels;
  const root = $('[data-view="syntax"]');
  root.innerHTML = `
    <div class="filters" id="syn-filters">
      <button data-f="all" class="on">All</button>
      ${Object.entries(focuses).map(([k,v]) => `<button data-f="${k}">${v}</button>`).join('')}
    </div>
    <div id="syn-body"></div>`;
  $$('#syn-filters button').forEach(b => b.onclick = () => {
    $$('#syn-filters button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    syn.filter = b.dataset.f;
    syn.idx = 0;
    loadDrill();
  });
  loadDrill();
}

function filteredDrills() {
  const all = data.sentences.drills;
  if (syn.filter === 'all') return all;
  return all.filter(d => d.focus === syn.filter);
}

function loadDrill() {
  const list = filteredDrills();
  if (!list.length) {
    $('#syn-body').innerHTML = `<div class="card">No drills in this filter.</div>`;
    return;
  }
  if (syn.idx >= list.length) syn.idx = 0;
  syn.drill = list[syn.idx];
  // shuffle bank
  syn.bank = [...syn.drill.tiles].sort(() => Math.random() - 0.5);
  syn.placed = [];
  renderSyntax();
}

function renderSyntax() {
  const d = syn.drill;
  const roles = data.sentences.roles;
  const body = $('#syn-body');
  body.innerHTML = `
    <div class="pill">${data.sentences.focusLabels[d.focus] || d.focus} · ${syn.idx + 1}/${filteredDrills().length}</div>
    <div class="legend">
      ${Object.entries(roles).map(([k,v]) => `<span style="background:${v.color}">${v.label}</span>`).join('')}
    </div>
    <div class="en-prompt">${d.en}</div>
    <div class="muted" style="font-size:0.8rem;margin-bottom:4px">Answer row (drag here, or tap tile then tap a slot)</div>
    <div class="drop-row" id="drop-row"></div>
    <div class="muted" style="font-size:0.8rem;margin-bottom:4px">Word bank</div>
    <div class="bank-row" id="bank-row"></div>
    <div class="row">
      <button id="syn-check" class="primary">Check</button>
      <button id="syn-reset">Reset</button>
      <button id="syn-play">🔊</button>
      <button id="syn-next">Next</button>
    </div>
    <div id="syn-feedback"></div>
    <div class="tip">${d.tip || ''}</div>`;

  const drop = $('#drop-row');
  const bank = $('#bank-row');

  function paint() {
    drop.innerHTML = '';
    bank.innerHTML = '';
    syn.placed.forEach((t, i) => drop.appendChild(makeTile(t, 'placed', i)));
    syn.bank.forEach((t, i) => bank.appendChild(makeTile(t, 'bank', i)));
  }

  let selected = null; // {from, index}

  function makeTile(t, from, index) {
    const el = document.createElement('div');
    el.className = 'tile';
    el.dataset.role = t.role;
    el.dataset.from = from;
    el.dataset.index = index;
    el.textContent = t.text;
    let ox = 0, oy = 0, dragging = false, ghost = null;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      dragging = false;
      ox = e.clientX; oy = e.clientY;
      selected = { from, index };
      $$('.tile').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
    });
    el.addEventListener('pointermove', (e) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - ox, dy = e.clientY - oy;
      if (!dragging && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        dragging = true;
        el.classList.add('dragging');
        ghost = el.cloneNode(true);
        ghost.style.position = 'fixed';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = 100;
        ghost.style.left = e.clientX - 20 + 'px';
        ghost.style.top = e.clientY - 20 + 'px';
        ghost.id = 'ghost';
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = e.clientX - 20 + 'px';
        ghost.style.top = e.clientY - 20 + 'px';
        const over = document.elementFromPoint(e.clientX, e.clientY);
        drop.classList.toggle('over', !!(over && (over === drop || drop.contains(over))));
      }
    });
    el.addEventListener('pointerup', (e) => {
      try { el.releasePointerCapture(e.pointerId); } catch {}
      el.classList.remove('dragging');
      if (ghost) { ghost.remove(); ghost = null; }
      drop.classList.remove('over');
      if (dragging) {
        const over = document.elementFromPoint(e.clientX, e.clientY);
        const overDrop = over && (over === drop || drop.contains(over));
        const overBank = over && (over === bank || bank.contains(over));
        if (from === 'bank' && overDrop) { moveToDrop(index); selected = null; }
        else if (from === 'placed' && overBank) { moveToBank(index); selected = null; }
        else if (from === 'placed' && overDrop) {
          const target = over && over.closest ? over.closest('.tile') : null;
          if (target && target.dataset.from === 'placed') {
            const ti = +target.dataset.index;
            const [item] = syn.placed.splice(index, 1);
            syn.placed.splice(ti, 0, item);
            selected = null;
            paint();
          }
        }
      }
      // tap keeps selection; placement handled by zone listeners
    });
    return el;
  }

  function moveToDrop(index) {
    if (index < 0 || index >= syn.bank.length) return;
    const [item] = syn.bank.splice(index, 1);
    syn.placed.push(item);
    paint();
  }
  function moveToBank(index) {
    if (index < 0 || index >= syn.placed.length) return;
    const [item] = syn.placed.splice(index, 1);
    syn.bank.push(item);
    paint();
  }

  drop.addEventListener('pointerup', (e) => {
    if (e.target.closest && e.target.closest('.tile')) return;
    if (selected && selected.from === 'bank') {
      moveToDrop(selected.index);
      selected = null;
    }
  });
  bank.addEventListener('pointerup', (e) => {
    if (e.target.closest && e.target.closest('.tile')) return;
    if (selected && selected.from === 'placed') {
      moveToBank(selected.index);
      selected = null;
    }
  });
  // Double-tap placed tile to return; single tap on selected bank tile + tap another bank empty places via drop
  drop.addEventListener('click', (e) => {
    if (selected && selected.from === 'bank') {
      moveToDrop(selected.index);
      selected = null;
    }
  });
  bank.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('.tile')) return;
    if (selected && selected.from === 'placed') {
      moveToBank(selected.index);
      selected = null;
    }
  });

  paint();

  $('#syn-check').onclick = () => {
    const got = syn.placed.map(t => t.text);
    const want = d.answer;
    const ok = got.length === want.length && got.every((x, i) => x === want[i]);
    const fb = $('#syn-feedback');
    state.syntax.done += 1;
    if (!state.syntax.byFocus[d.focus]) state.syntax.byFocus[d.focus] = { done: 0, correct: 0 };
    state.syntax.byFocus[d.focus].done += 1;
    if (ok) {
      state.syntax.correct += 1;
      state.syntax.byFocus[d.focus].correct += 1;
      fb.innerHTML = `<div class="feedback ok">Correct. ${want.join(' ')}</div>`;
    } else {
      state.weak[d.id] = (state.weak[d.id] || 0) + 1;
      fb.innerHTML = `<div class="feedback no">Not yet. Target: ${want.join(' ')}</div>`;
    }
    persist();
  };
  $('#syn-reset').onclick = () => { syn.bank = [...d.tiles].sort(() => Math.random() - 0.5); syn.placed = []; renderSyntax(); };
  $('#syn-next').onclick = () => { syn.idx += 1; loadDrill(); };
  $('#syn-play').onclick = () => Speak.speakKo(d.answer.join(' ')).catch(() => toast('Audio unavailable'));
}

/* ---------- Vocab ---------- */
let vocabFilter = 'all';
let vocabQuery = '';

function allVocab() {
  const v = data.vocab;
  const list = [];
  for (const x of v.verbs) list.push({ ...x, kind: x.type });
  for (const x of v.nouns) list.push({ ...x, kind: x.type });
  for (const x of v.particles) list.push({ ...x, kind: 'particle' });
  for (const x of v.adverbs) list.push({ ...x, kind: 'adverb' });
  for (const x of v.numbers) list.push({ ...x, kind: x.type });
  return list;
}

function renderVocab() {
  const root = $('[data-view="vocab"]');
  const kinds = [
    ['all', 'All'],
    ['verb', 'Verbs'],
    ['adjective', 'Adjectives'],
    ['noun', 'Nouns'],
    ['pronoun', 'Pronouns'],
    ['particle', 'Particles'],
    ['adverb', 'Adverbs'],
    ['number', 'Numbers'],
    ['counter', 'Counters'],
    ['question', 'Questions'],
  ];
  const themes = ['food','transit','shopping','school','directions','housing','jeju','daily','grammar','native','sino'];
  root.innerHTML = `
    <input class="search" id="v-search" placeholder="Search English or Korean" value="${vocabQuery}">
    <div class="filters" id="v-filters">
      ${kinds.map(([k,l]) => `<button data-k="${k}" class="${vocabFilter===k?'on':''}">${l}</button>`).join('')}
    </div>
    <div class="filters" id="v-themes">
      <button data-t="all" class="on">Any theme</button>
      ${themes.map(t => `<button data-t="${t}">${t}</button>`).join('')}
    </div>
    <div id="v-list"></div>`;
  let theme = 'all';
  const paint = () => {
    let list = allVocab();
    if (vocabFilter !== 'all') list = list.filter(x => x.kind === vocabFilter || x.type === vocabFilter);
    if (theme !== 'all') list = list.filter(x => x.theme === theme);
    const q = vocabQuery.trim().toLowerCase();
    if (q) list = list.filter(x => (x.ko + ' ' + x.en).toLowerCase().includes(q));
    $('#v-list').innerHTML = `<div class="muted" style="margin:8px 0">${list.length} items</div>` + list.slice(0, 200).map(item => {
      const forms = item.forms ? `
        <div class="forms">
          <div><b>dict</b> ${item.forms.dict}</div>
          <div><b>present</b> ${item.forms.polite_present}</div>
          <div><b>past</b> ${item.forms.polite_past}</div>
          <div><b>future</b> ${item.forms.future}</div>
          <div><b>negative</b> ${item.forms.negative}</div>
          <div><b>formal</b> ${item.forms.formal}</div>
        </div>` : '';
      return `<div class="v-item" data-id="${item.id}">
        <div>
          <div class="ko">${item.ko}</div>
          <div class="en">${item.en} · ${item.kind}${item.theme ? ' · ' + item.theme : ''}${item.irregular ? ' · irr:' + item.irregular : ''}</div>
          ${forms}
        </div>
        <div class="speak-btns">
          <button data-play="${item.ko}">🔊</button>
          <button data-mic="${item.ko}">🎙️</button>
        </div>
      </div>`;
    }).join('') + (list.length > 200 ? `<div class="muted">Showing 200 of ${list.length}. Refine search.</div>` : '');
    $$('#v-list [data-play]').forEach(b => b.onclick = () => Speak.speakKo(b.dataset.play).catch(() => toast('Audio unavailable')));
    $$('#v-list [data-mic]').forEach(b => b.onclick = async () => {
      toast('Listening…');
      try {
        const r = await Speak.checkPronunciation(b.dataset.mic);
        toast(`${Math.round(r.score*100)}% · heard: ${r.transcript || '-'}`);
        state.speak.attempts += 1;
        state.speak.avgScore = state.speak.avgScore ? (state.speak.avgScore * 0.8 + r.score * 0.2) : r.score;
        persist();
      } catch (e) { toast(e.message); }
    });
  };
  $('#v-search').oninput = (e) => { vocabQuery = e.target.value; paint(); };
  $$('#v-filters button').forEach(b => b.onclick = () => {
    vocabFilter = b.dataset.k;
    $$('#v-filters button').forEach(x => x.classList.toggle('on', x === b));
    paint();
  });
  $$('#v-themes button').forEach(b => b.onclick = () => {
    theme = b.dataset.t;
    $$('#v-themes button').forEach(x => x.classList.toggle('on', x === b));
    paint();
  });
  paint();
}

/* ---------- Progress / Home / About ---------- */
function renderHome() {
  const hCount = Object.keys(state.hangulSeen).length;
  const due = hangulDeckIds().filter(id => !state.srs[id] || state.srs[id].due <= Date.now()).length;
  const synAcc = state.syntax.done ? Math.round(state.syntax.correct / state.syntax.done * 100) : 0;
  const support = Speak.speechSupport();
  $('[data-view="home"]').innerHTML = `
    <div class="card">
      <h2>Hey there</h2>
      <p class="muted">English → Korean only. Built for fast Hangul reading, SOV drills, and Jeju survival vocab. Progress stays on this phone.</p>
    </div>
    <div class="stat-grid">
      <div class="stat"><div class="n">${state.streak.count}</div><div class="l">day streak</div></div>
      <div class="stat"><div class="n">${due}</div><div class="l">cards due</div></div>
      <div class="stat"><div class="n">${hCount}</div><div class="l">Hangul seen</div></div>
      <div class="stat"><div class="n">${synAcc}%</div><div class="l">syntax accuracy</div></div>
    </div>
    <div class="stack" style="margin-top:12px">
      <button class="primary" data-go="hangul">Start Hangul flash cards</button>
      <button data-go="syntax">Sentence order game</button>
      <button data-go="vocab">Browse vocab</button>
    </div>
    <div class="card" style="margin-top:12px">
      <h2>Mic status</h2>
      <p class="muted">${support.recognition ? 'Speech recognition ready (ko-KR).' : 'Speech recognition not available in this browser. Playback may still work.'}
      ${support.synthesis ? ' Voice playback ready.' : ' No voice playback.'}</p>
    </div>`;
  $$('[data-go]').forEach(b => b.onclick = () => setView(b.dataset.go));
}

function renderProgress() {
  const hSeen = Object.keys(state.hangulSeen).length;
  const hTotal = hangulDeckIds().length;
  const mastered = hangulDeckIds().filter(id => SRS.isMastered(state, id)).length;
  const synAcc = state.syntax.done ? Math.round(state.syntax.correct / state.syntax.done * 100) : 0;
  const weak = Object.entries(state.weak).sort((a,b) => b[1]-a[1]).slice(0, 8);
  const speeds = state.readingSpeed.slice(-8);
  const focusRows = Object.entries(state.syntax.byFocus).map(([k,v]) => {
    const acc = v.done ? Math.round(v.correct/v.done*100) : 0;
    return `<div class="v-item"><div><div class="ko" style="font-size:0.95rem">${data.sentences.focusLabels[k]||k}</div><div class="en">${v.correct}/${v.done}</div></div><div>${acc}%</div></div>`;
  }).join('') || '<div class="muted">No syntax drills yet.</div>';

  $('[data-view="progress"]').innerHTML = `
    <div class="stat-grid">
      <div class="stat"><div class="n">${state.streak.count}</div><div class="l">streak</div></div>
      <div class="stat"><div class="n">${mastered}</div><div class="l">Hangul mastered</div></div>
      <div class="stat"><div class="n">${synAcc}%</div><div class="l">syntax</div></div>
      <div class="stat"><div class="n">${Math.round((state.speak.avgScore||0)*100)}%</div><div class="l">avg mic</div></div>
    </div>
    <div class="card">
      <h2>Hangul coverage</h2>
      <div class="bar"><i style="width:${Math.round(hSeen/hTotal*100)}%"></i></div>
      <div class="muted" style="margin-top:6px">${hSeen} / ${hTotal} seen</div>
    </div>
    <div class="card">
      <h2>Syntax by focus</h2>
      ${focusRows}
    </div>
    <div class="card">
      <h2>Reading speed</h2>
      ${speeds.length ? speeds.map(s => `<div class="muted">${new Date(s.t).toLocaleString()} · ${s.cpm} cpm · ${Math.round(s.accuracy*100)}%</div>`).join('') : '<div class="muted">Run a fast-read drill to log speed.</div>'}
    </div>
    <div class="card">
      <h2>Weak items</h2>
      ${weak.length ? weak.map(([id,n]) => {
        const h = hangulById(id);
        const label = h ? h.char : id;
        return `<div class="muted">${label} · misses ${n}</div>`;
      }).join('') : '<div class="muted">None yet. Nice.</div>'}
    </div>
    <div class="stack">
      <button class="primary" id="export-btn">Export progress JSON</button>
      <button id="import-btn">Import progress JSON</button>
      <input type="file" id="import-file" accept="application/json,.json" class="hidden">
      <button id="reset-btn">Reset all progress</button>
    </div>`;
  $('#export-btn').onclick = () => {
    const blob = new Blob([Storage.exportJSON(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kian-korean-progress-${Date.now()}.json`;
    a.click();
  };
  $('#import-btn').onclick = () => $('#import-file').click();
  $('#import-file').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      state = Storage.importJSON(await f.text());
      toast('Progress imported');
      renderProgress();
    } catch (err) { toast('Import failed: ' + err.message); }
  };
  $('#reset-btn').onclick = () => {
    if (confirm('Reset all progress on this device?')) {
      state = Storage.defaultState();
      Storage.save(state);
      toast('Reset');
      renderProgress();
    }
  };
}

function renderAbout() {
  const vc = allVocab().length;
  const hc = hangulDeckIds().length;
  const sc = data.sentences.drills.length;
  $('[data-view="about"]').innerHTML = `
    <div class="card about">
      <h2>Kian Korean</h2>
      <p>English to Korean learning app. Mobile-first. Progress in localStorage. Installable as a PWA.</p>
      <p>Content counts: ${hc} Hangul cards · ${vc} vocab items · ${sc} sentence drills.</p>
      <h2>Sources</h2>
      <ul>
        ${(data.hangul.sources || []).map(s => `<li>${s}</li>`).join('')}
        ${(data.vocab.sources || []).map(s => `<li>${s}</li>`).join('')}
        ${(data.sentences.sources || []).map(s => `<li>${s}</li>`).join('')}
      </ul>
      <h2>Mic support</h2>
      <p>Web Speech API (SpeechRecognition) works best in Chrome and Edge on Android, and Safari on iPhone. Requires HTTPS. If unavailable, play buttons still use speechSynthesis when the browser has Korean voices.</p>
      <h2>Limits</h2>
      <p>Recognition quality varies by mic and accent. Scores are string similarity on the transcript, not true phonetic scoring. Offline mode caches the app shell and data files via the service worker.</p>
    </div>`;
}

/* ---------- Boot ---------- */
async function main() {
  await loadData();
  // warm voices
  if (window.speechSynthesis) speechSynthesis.getVoices();
  $$('.nav button').forEach(b => b.onclick = () => setView(b.dataset.nav));
  $('#about-link').onclick = () => setView('about');
  setView('home');
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('sw.js'); } catch {}
  }
}

main().catch(err => {
  document.body.innerHTML = `<pre style="color:#fff;padding:16px">${err.stack || err}</pre>`;
});

// expose for tests
window.__kian = {
  getState: () => state,
  setView,
  Speak,
  SRS,
  Storage,
  getDrill: () => ({
    item: timed.item,
    left: timed.left,
    paused: timed.paused,
    feedback: timed.feedback,
    responseMs: timed.responseMs,
    score: timed.score,
    total: timed.total,
  }),
};

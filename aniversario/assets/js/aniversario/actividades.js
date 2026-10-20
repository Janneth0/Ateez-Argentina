// Actividades del aniversario: cuenta regresiva, trivia, ¿qué integrante sos?, bingo,
// memorama, ahorcado y cumpleaños. Datos en trivia-data.js, quiz-data.js y extras-data.js.
(function () {
  const $ = (id) => document.getElementById(id);
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const SITE = 'https://ateezargentina.com.ar';
  // Datos del aniversario (número, fecha, hashtag): se cambian en extras-data.js
  const A = window.ANIV || { n: 8, ord: '8º', th: '8TH', fecha: '2026-10-24T00:00:00-03:00', debut: '2018-10-24T00:00:00-03:00', hashtag: '#8YearsWithATEEZ' };
  const TAGS = A.hashtag + ' #ATEEZ #ATINY';
  // Textos de la página que dependen del número de aniversario (data-aniv="ord" | "th" | "n")
  document.querySelectorAll('[data-aniv]').forEach((el) => { if (A[el.dataset.aniv] != null) el.textContent = A[el.dataset.aniv]; });
  const boom = () => window.launchConfetti && window.launchConfetti();
  const FOTO = (slug) => 'assets/img/integrantes/' + slug + '.jpg';
  const E = window.EXTRAS || { BINGO: [], HANGMAN: [], BIRTHDAYS: [] };

  // ---------- Compartir (imagen de la tarjeta + texto) ----------
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function cardBlob(id) {
    if (typeof html2canvas !== 'function') throw new Error('html2canvas no cargó');
    const c = await html2canvas($(id), { scale: 2, backgroundColor: null, useCORS: true });
    return new Promise((r) => c.toBlob(r, 'image/png'));
  }
  function addShare(box, cardId, text, fname) {
    const w = document.createElement('div');
    w.innerHTML = `<button class="abtn" data-a="share">Compartir resultado</button>
      <button class="abtn ghost" data-a="dl">Descargar imagen</button>
      <div class="share-links">
        <a target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text + ' ' + SITE)}">WhatsApp</a>
        <a target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SITE)}">X</a>
      </div>`;
    box.appendChild(w);
    w.querySelectorAll('button').forEach((b) => b.onclick = async () => {
      const old = b.textContent; b.disabled = true; b.textContent = 'Generando…';
      try {
        const blob = await cardBlob(cardId), file = new File([blob], fname, { type: 'image/png' });
        if (b.dataset.a === 'share' && navigator.canShare && navigator.canShare({ files: [file] }))
          await navigator.share({ title: 'ATEEZ ' + A.th + ' Anniversary', text: text + ' ' + SITE, files: [file] });
        else download(blob, fname);
        const prev = w.querySelector('.share-err'); if (prev) prev.remove();
      } catch (e) {
        if (!e || e.name !== 'AbortError') { // AbortError = la persona cerró el menú de compartir: no es un error
          console.log(e);
          let m = w.querySelector('.share-err');
          if (!m) { m = document.createElement('p'); m.className = 'share-err'; m.setAttribute('role', 'alert'); w.appendChild(m); }
          m.textContent = 'No pudimos generar la imagen. Probá de nuevo o sacale captura de pantalla';
        }
      }
      b.disabled = false; b.textContent = old;
    });
  }
  const againBtn = (box, label, fn) => { const b = document.createElement('button'); b.className = 'abtn ghost'; b.textContent = label; b.onclick = fn; box.appendChild(b); };

  // ---------- Cuenta regresiva ----------
  (function () {
    if (!$('cd-wrap')) return;
    const target = new Date(A.fecha), debut = new Date(A.debut);
    let fired = false;
    function tick() {
      const diff = target - new Date(), msg = $('cd-msg');
      if (diff <= 0) {
        $('cd-wrap').style.display = 'none';
        const days = Math.floor((new Date() - debut) / 864e5);
        msg.textContent = `¡Feliz ${A.ord} aniversario, ATEEZ! Ya son ${days.toLocaleString('es-AR')} días juntos.`;
        if (!fired) { fired = true; boom(); }
        return;
      }
      const p = (id, v) => { $(id).textContent = v; };
      p('cd-d', Math.floor(diff / 864e5));
      p('cd-h', Math.floor(diff / 36e5) % 24);
      p('cd-m', Math.floor(diff / 6e4) % 60);
      p('cd-s', Math.floor(diff / 1e3) % 60);
      msg.textContent = 'Falta poquito para festejar 🏴‍☠️';
    }
    tick(); setInterval(tick, 1000);
  })();

  // ---------- Trivia ----------
  const RANKS = [
    [0, 'Predebut ATINY', '🌱', 'Todavía estás en la sala de práctica. ¡A ver más MVs!'],
    [4, 'Baby ATINY', '🐣', 'Recién subís al barco, pero ya vas agarrando el ritmo.'],
    [7, 'Rookie ATINY', '⚓', 'Ya conocés a la tripulación. ¡Seguí navegando!'],
    [10, 'Pirate ATINY', '🏴‍☠️', 'Sos parte fija de la tripulación.'],
    [13, 'Capitán ATINY', '🦜', 'Conocés el mapa del tesoro casi de memoria.'],
    [16, 'Pirate King/Queen ATINY', '👑', '¡Puntaje perfecto! Sos leyenda del Treasure.']
  ];
  let tv;
  function tvStart() {
    const N = Math.min(16, (window.TRIVIA_BANK || []).length);
    tv = { i: 0, s: 0, N, qs: shuffle(window.TRIVIA_BANK).slice(0, N).map((q) => { const o = shuffle(q.slice(1)); return { q: q[0], o, c: o.indexOf(q[1]) }; }) };
    tvRender();
  }
  function tvRender() {
    const box = $('tv-box');
    if (tv.i >= tv.N) return tvEnd(box);
    const t = tv.qs[tv.i];
    box.innerHTML = `<div class="pg"><i style="width:${tv.i / tv.N * 100}%"></i></div><p><small>Pregunta ${tv.i + 1} de ${tv.N}</small></p><h5></h5>`;
    box.querySelector('h5').textContent = t.q;
    t.o.forEach((x, i) => {
      const b = document.createElement('button');
      b.className = 'opt-btn'; b.textContent = x;
      b.onclick = () => {
        const all = box.querySelectorAll('.opt-btn');
        all.forEach((y) => y.disabled = true);
        all[t.c].classList.add('ok');
        if (i === t.c) tv.s++; else b.classList.add('bad');
        setTimeout(() => { tv.i++; tvRender(); }, 900);
      };
      box.appendChild(b);
    });
  }
  function tvEnd(box) {
    const r = [...RANKS].reverse().find((x) => tv.s >= x[0] * tv.N / 16);
    box.innerHTML = `<div id="tv-card" class="res-card"><div class="res-top">ATEEZ ${A.th} ANNIVERSARY · TRIVIA ATINY</div>
      <div class="res-emoji">${r[2]}</div><h3>${r[1]}</h3><p class="res-score">${tv.s}/${tv.N}</p><p>${r[3]}</p>
      <div class="res-foot">ATEEZARGENTINA.COM.AR</div></div>`;
    againBtn(box, 'Jugar de nuevo', tvStart);
    addShare(box, 'tv-card', `¡Soy ${r[1]} ${r[2]}! Hice ${tv.s}/${tv.N} en la trivia de ATEEZ por su ${A.ord} aniversario 🏴‍☠️ ${TAGS}`, 'ATINY_Trivia_' + A.n + 'th.png');
    if (tv.s >= tv.N * 10 / 16) boom();
  }

  // ---------- ¿Qué integrante sos? ----------
  let qz;
  function qzStart() {
    qz = { i: 0, pts: {}, qs: shuffle(window.QUIZ_BANK).slice(0, 8).map((q) => ({ q: q[0], o: shuffle(q[1]) })) };
    qzRender();
  }
  function qzRender() {
    const box = $('qz-box');
    if (qz.i >= qz.qs.length) return qzEnd(box);
    const t = qz.qs[qz.i];
    box.innerHTML = `<div class="pg"><i style="width:${qz.i / qz.qs.length * 100}%"></i></div><p><small>Pregunta ${qz.i + 1} de ${qz.qs.length}</small></p><h5></h5>`;
    box.querySelector('h5').textContent = t.q;
    t.o.forEach((o) => {
      const b = document.createElement('button');
      b.className = 'opt-btn'; b.textContent = o[0];
      b.onclick = () => { [o[1], o[2]].forEach((k) => qz.pts[k] = (qz.pts[k] || 0) + 1); qz.i++; qzRender(); };
      box.appendChild(b);
    });
  }
  function qzEnd(box) {
    const sorted = Object.entries(qz.pts).sort((a, b) => b[1] - a[1]);
    const max = sorted[0][1];
    const top = shuffle(sorted.filter((x) => x[1] === max))[0]; // desempate al azar
    const second = sorted.find((x) => x[0] !== top[0]);
    const m = window.QUIZ_MEMBERS[top[0]], pct = Math.round(top[1] / qz.qs.length * 100);
    box.innerHTML = `<div id="qz-card" class="res-card"><div class="res-top">¿QUÉ INTEGRANTE SOS? · ATEEZ ${A.th}</div>
      <img class="res-photo" src="${FOTO(m.slug)}" alt="${m.n}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="res-photo res-fallback">${m.n[0]}</div>
      <h3>${m.n}</h3><p class="res-score">${pct}% de afinidad</p><p>${m.t}</p>
      ${second ? `<p><small>Tu segunda vibra: ${window.QUIZ_MEMBERS[second[0]].n}</small></p>` : ''}
      <div class="res-foot">ATEEZARGENTINA.COM.AR</div></div>`;
    againBtn(box, 'Repetir test', qzStart);
    addShare(box, 'qz-card', `¡Me salió ${m.n} (${pct}% de afinidad) en el test de ATEEZ por su ${A.ord} aniversario! ${TAGS}`, 'ATINY_Integrante_' + A.n + 'th.png');
    boom();
  }

  // ---------- Bingo ATINY (4x4) ----------
  let bg = { items: [], on: [], lines: 0 };
  const LINES = (() => {
    const l = [];
    for (let k = 0; k < 4; k++) l.push([0, 1, 2, 3].map((j) => k * 4 + j), [0, 1, 2, 3].map((j) => j * 4 + k));
    l.push([0, 5, 10, 15], [3, 6, 9, 12]);
    return l;
  })();
  function bingoInit() {
    bg = { items: shuffle(E.BINGO).slice(0, 16), on: Array(16).fill(false), lines: 0 };
    $('bg-msg').textContent = '';
    const grid = $('bg-grid');
    grid.innerHTML = '';
    bg.items.forEach((t, i) => {
      const c = document.createElement('div');
      c.className = 'bingo-cell'; c.textContent = t; c.dataset.i = i;
      c.setAttribute('role', 'button'); c.setAttribute('aria-pressed', 'false'); c.tabIndex = 0;
      grid.appendChild(c);
    });
  }
  function bingoToggle(c) {
    const i = +c.dataset.i;
    bg.on[i] = !bg.on[i];
    c.classList.toggle('on', bg.on[i]);
    c.setAttribute('aria-pressed', String(bg.on[i]));
    const n = LINES.filter((l) => l.every((x) => bg.on[x])).length;
    if (n > bg.lines) boom(); // solo festeja cuando se suma una línea nueva
    bg.lines = n;
    $('bg-msg').textContent = n ? `¡BINGO! ${n} línea${n > 1 ? 's' : ''} completa${n > 1 ? 's' : ''}` : '';
  }

  // ---------- Memorama con las fotos de los integrantes ----------
  let mm;
  const mmFmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  function mmStart() {
    clearInterval(mm && mm.timer);
    const cards = shuffle([...E.BIRTHDAYS, ...E.BIRTHDAYS]);
    mm = { cards, open: [], moves: 0, matched: 0, lock: false, t0: 0, secs: 0, timer: null };
    const box = $('mm-box');
    box.innerHTML = `<div class="mm-stats"><span>Intentos: <b id="mm-mv">0</b></span><span>Tiempo: <b id="mm-tm">0:00</b></span><span>Mejor: <b id="mm-best">–</b></span></div><div class="mm-grid" id="mm-grid"></div>`;
    try { const b = localStorage.getItem('atiny_memo_best'); if (b) $('mm-best').textContent = b; } catch (e) { /* sin storage */ }
    const grid = $('mm-grid');
    cards.forEach((m, i) => {
      const b = document.createElement('button');
      b.className = 'mm-card'; b.dataset.i = i; b.setAttribute('aria-label', 'Carta ' + (i + 1));
      b.innerHTML = `<span class="mm-q">🏴‍☠️</span><span class="mm-init">${m.n[0]}</span><img src="${FOTO(m.slug)}" alt="${m.n}" onerror="this.style.display='none'"><span class="mm-name">${m.n}</span>`;
      grid.appendChild(b);
    });
  }
  function mmFlip(b) {
    if (mm.lock || b.classList.contains('up')) return;
    if (!mm.t0) { mm.t0 = Date.now(); mm.timer = setInterval(() => { mm.secs = Math.floor((Date.now() - mm.t0) / 1000); $('mm-tm').textContent = mmFmt(mm.secs); }, 500); }
    b.classList.add('up'); mm.open.push(b);
    if (mm.open.length < 2) return;
    mm.moves++; $('mm-mv').textContent = mm.moves;
    const [a, c] = mm.open;
    if (mm.cards[a.dataset.i].slug === mm.cards[c.dataset.i].slug) {
      a.classList.add('done'); c.classList.add('done'); mm.open = []; mm.matched++;
      if (mm.matched === E.BIRTHDAYS.length) mmEnd();
    } else {
      mm.lock = true;
      setTimeout(() => { a.classList.remove('up'); c.classList.remove('up'); mm.open = []; mm.lock = false; }, 800);
    }
  }
  function mmEnd() {
    clearInterval(mm.timer);
    mm.secs = Math.floor((Date.now() - mm.t0) / 1000);
    const r = mm.moves <= 10 ? ['Memoria de Pirate King/Queen', ''] : mm.moves <= 14 ? ['Navegante experto', ''] : mm.moves <= 20 ? ['Tripulante', ''] : ['Grumete en práctica', ''];
    let best = '';
    try {
      const prev = JSON.parse(localStorage.getItem('atiny_memo_best_n') || 'null');
      if (!prev || mm.moves < prev) { localStorage.setItem('atiny_memo_best_n', mm.moves); localStorage.setItem('atiny_memo_best', mm.moves + ' intentos'); best = ' · ¡Nuevo récord!'; }
    } catch (e) { /* sin storage */ }
    const box = $('mm-box');
    box.innerHTML = `<div id="mm-card" class="res-card"><div class="res-top">MEMORAMA ATINY · ATEEZ ${A.th}</div>
      <div class="res-emoji">${r[1]}</div><h3>${r[0]}</h3><p class="res-score">${mm.moves} intentos</p><p>Tiempo: ${mmFmt(mm.secs)}${best}</p>
      <div class="res-foot">ATEEZARGENTINA.COM.AR</div></div>`;
    againBtn(box, 'Jugar de nuevo', mmStart);
    addShare(box, 'mm-card', `Completé el memorama de ATEEZ en ${mm.moves} intentos y soy "${r[0]}" ${r[1]} ${TAGS}`, 'ATINY_Memorama_' + A.n + 'th.png');
    boom();
  }

  // ---------- Ahorcado ----------
  const MAXV = 7;
  let hg, hgBag = [];
  function hgStart() {
    if (!hgBag.length) hgBag = shuffle(E.HANGMAN);
    const w = hgBag.pop();
    hg = { p: w.p, h: w.h, ok: new Set(), bad: new Set(), end: false };
    hgRender();
  }
  function hgRender(msg) {
    const box = $('hg-box');
    const letters = [...hg.p];
    const shown = letters.map((c) => c === ' ' ? '<span class="hg-ch sp"></span>' : `<span class="hg-ch">${hg.ok.has(c) || hg.end ? c : '&nbsp;'}</span>`).join('');
    const vidas = '❤️'.repeat(MAXV - hg.bad.size) + '🖤'.repeat(hg.bad.size);
    const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((k) => {
      const used = hg.ok.has(k) || hg.bad.has(k);
      return `<button class="hg-key${hg.ok.has(k) ? ' ok' : hg.bad.has(k) ? ' bad' : ''}" data-k="${k}" ${used || hg.end ? 'disabled' : ''}>${k}</button>`;
    }).join('');
    box.innerHTML = `<p class="hg-hint">💡 ${hg.h}</p><div class="hg-lives" aria-label="Vidas">${vidas}</div><div class="hg-word">${shown}</div>` +
      (msg ? `<p class="act-result">${msg}</p>` : '') + `<div class="hg-keys">${keys}</div>`;
    if (hg.end) againBtn(box, 'Otra palabra', hgStart);
  }
  function hgGuess(k) {
    if (hg.end || hg.ok.has(k) || hg.bad.has(k)) return;
    if (hg.p.includes(k)) hg.ok.add(k); else hg.bad.add(k);
    const win = [...hg.p].every((c) => c === ' ' || hg.ok.has(c));
    if (win) { hg.end = true; hgRender('¡Lo lograste!'); boom(); }
    else if (hg.bad.size >= MAXV) { hg.end = true; hgRender('¡Casi! Era: <b>' + hg.p + '</b>'); }
    else hgRender();
  }

  // Teclado físico: solo juega mientras el ahorcado está a la vista y no se está escribiendo en un campo
  // (así las letras de la credencial u otros formularios no restan vidas).
  let hgVisible = false;
  const hgSec = $('act-hang');
  if (hgSec && 'IntersectionObserver' in window) {
    new IntersectionObserver((es) => { hgVisible = es[0].isIntersecting; }, { threshold: 0.35 }).observe(hgSec);
  }
  document.addEventListener('keydown', (e) => {
    if (!hgVisible || !hg || hg.end || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    const k = (e.key || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); // Ñ -> N, Á -> A
    if (/^[A-Z]$/.test(k)) hgGuess(k);
  });

  // ---------- Cumpleaños ----------
  function cumples() {
    const box = $('bd-box');
    if (!box) return;
    const now = new Date(), hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lista = E.BIRTHDAYS.map((b) => {
      let d = new Date(hoy.getFullYear(), b.m - 1, b.d);
      if (d < hoy) d = new Date(hoy.getFullYear() + 1, b.m - 1, b.d);
      return { ...b, date: d, days: Math.round((d - hoy) / 864e5), age: d.getFullYear() - b.y };
    }).sort((a, b) => a.days - b.days);
    box.innerHTML = '<ul class="bd-list">' + lista.map((b, i) => `
      <li class="bd-item${i === 0 ? ' next' : ''}">
        <img class="bd-ph" src="${FOTO(b.slug)}" alt="${b.n}" onerror="this.outerHTML='<span class=&quot;bd-ph bd-fb&quot; style=&quot;display:flex&quot;>${b.n[0]}</span>'">
        <span class="bd-name">${b.n}<small>${b.date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} · cumple ${b.age}</small></span>
        <span class="bd-days">${b.days === 0 ? '🎂 ¡Hoy!' : b.days + '<small>' + (b.days === 1 ? 'día' : 'días') + '</small>'}</span>
      </li>`).join('') + '</ul>';
  }

  // ---------- Eventos y arranque ----------
  $('bg-grid').addEventListener('click', (e) => { const c = e.target.closest('.bingo-cell'); if (c) bingoToggle(c); });
  $('bg-grid').addEventListener('keydown', (e) => { const c = e.target.closest('.bingo-cell'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); bingoToggle(c); } });
  $('bg-shuffle').addEventListener('click', bingoInit);
  $('mm-box').addEventListener('click', (e) => { const b = e.target.closest('.mm-card'); if (b) mmFlip(b); });
  $('hg-box').addEventListener('click', (e) => { const b = e.target.closest('.hg-key'); if (b && !b.disabled) hgGuess(b.dataset.k); });

  window.ATINY_UTIL = { $, shuffle, addShare, againBtn, boom, TAGS, SITE };

  tvStart(); qzStart(); bingoInit(); mmStart(); hgStart(); cumples();
})();

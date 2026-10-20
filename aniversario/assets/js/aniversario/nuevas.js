// Actividades nuevas del aniversario: "Mi fecha ATINY", adiviná la canción con emojis
// y sopa de letras. Se carga DESPUÉS de actividades.js (usa sus utilidades compartidas).
// Los datos (eras, emojis, palabras) están en extras-data.js.
(function () {
  const U = window.ATINY_UTIL;
  if (!U) return;
  const { $, shuffle, addShare, againBtn, boom, TAGS } = U;
  const A = window.ANIV;
  const E = window.EXTRAS;

  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rand = (n) => Math.floor(Math.random() * n);
  const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const pl = (n, uno, otros) => (n === 1 ? uno : otros);
  const num = (n) => n.toLocaleString('es-AR');

  // =========================================================
  // 1) MI FECHA ATINY
  // =========================================================
  (function fechaAtiny() {
    const go = $('ft-go');
    if (!go) return;
    const DAY = 864e5;
    const ymd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const hoy = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
    // Si el día no existe ese año (29/02), usa el último día del mes
    const safe = (y, m, d) => new Date(y, m, Math.min(d, new Date(y, m + 1, 0).getDate()));
    const largo = (d) => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });

    const debut = ymd(A.debutDia);
    const inp = $('ft-date');
    inp.min = A.debutDia;
    inp.max = iso(hoy());

    function calcular() {
      const err = $('ft-err'), box = $('ft-box');
      err.textContent = '';
      box.innerHTML = '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(inp.value)) { err.textContent = 'Elegí la fecha en que te hiciste ATINY'; return; }
      const join = ymd(inp.value), today = hoy();
      if (join < debut) { err.textContent = 'ATEEZ debutó el 24/10/2018: elegí una fecha desde ahí'; return; }
      if (join > today) { err.textContent = 'Esa fecha todavía no llegó ¡Pero ya queremos que te sumes!'; return; }

      const days = Math.round((today - join) / DAY);
      const total = Math.round((today - debut) / DAY);
      const llegada = Math.round((join - debut) / DAY); // días de carrera que ya tenía ATEEZ
      let yy = today.getFullYear() - join.getFullYear();
      let mm = today.getMonth() - join.getMonth();
      let dd = today.getDate() - join.getDate();
      if (dd < 0) { mm--; dd += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
      if (mm < 0) { yy--; mm += 12; }

      const era = [...E.ERAS].reverse().find((x) => ymd(x.desde) <= join) || E.ERAS[0];

      // Aniversarios de ATEEZ (24/10) que ya festejó como ATINY
      let anivs = 0;
      for (let y = join.getFullYear(); y <= today.getFullYear(); y++) {
        const f = new Date(y, debut.getMonth(), debut.getDate());
        if (f > join && f <= today) anivs++;
      }

      // Próximo aniversario ATINY (el día en que se hizo ATINY)
      const esteAnio = safe(today.getFullYear(), join.getMonth(), join.getDate());
      const hoyCumple = esteAnio.getTime() === today.getTime() && today.getFullYear() > join.getFullYear();
      const prox = esteAnio <= today ? safe(today.getFullYear() + 1, join.getMonth(), join.getDate()) : esteAnio;
      const faltan = Math.round((prox - today) / DAY);
      const edadProx = prox.getFullYear() - join.getFullYear();

      const partes = [];
      if (yy) partes.push(yy + ' ' + pl(yy, 'año', 'años'));
      if (mm) partes.push(mm + ' ' + pl(mm, 'mes', 'meses'));
      if (dd || !partes.length) partes.push(dd + ' ' + pl(dd, 'día', 'días'));
      const tiempo = partes.length > 1 ? partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1] : partes[0];

      const nombre = $('ft-name').value.trim();
      const pct = (days / total * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 });
      const lineaProx = hoyCumple
        ? `🎂 <b>¡Hoy cumplís ${yy} ${pl(yy, 'año', 'años')} como ATINY!</b>`
        : `Tu próximo aniversario ATINY: <b>${largo(prox)}</b> (en ${faltan} ${pl(faltan, 'día', 'días')}, cumplís ${edadProx})`;

      box.innerHTML = `<div id="ft-card" class="res-card">
        <div class="res-top">ATEEZ ${A.th} ANNIVERSARY · MI FECHA ATINY</div>
        <div class="res-emoji">${era.e}</div>
        <h3>${esc(era.rango)}</h3>
        ${nombre ? `<p class="ft-name">${esc(nombre)}</p>` : ''}
        <p class="res-score">${num(days)} ${pl(days, 'día', 'días')} en el barco</p>
        <p class="ft-tiempo">${days === 0 ? '¡Recién llegás! Bienvenida/o a bordo 🏴‍☠️' : tiempo}</p>
        <div class="ft-lines">
          <span>Llegaste en la era <b>${esc(era.n)}</b></span>
          <span>${llegada === 0 ? 'Llegaste <b>el mismísimo día del debut</b>' : `ATEEZ ya llevaba <b>${num(llegada)}</b> ${pl(llegada, 'día', 'días')} de carrera`}</span>
          <span>Estuviste en <b>${anivs}</b> ${pl(anivs, 'aniversario', 'aniversarios')} de ATEEZ como ATINY</span>
          <span>Viviste el <b>${pct}%</b> de su historia</span>
          <span>${lineaProx}</span>
        </div>
        <p class="ft-era">${esc(era.t)}</p>
        <div class="res-foot">ATEEZARGENTINA.COM.AR</div>
      </div>`;
      addShare(box, 'ft-card',
        `Llevo ${num(days)} ${pl(days, 'día', 'días')} como ATINY ${era.e} Llegué en la era ${era.n}. ¿Y vos? ${TAGS}`,
        'ATINY_Mi_Fecha_' + A.n + 'th.png');
      if (days >= 365) boom();
    }

    go.addEventListener('click', calcular);
    [$('ft-date'), $('ft-name')].forEach((el) => el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); calcular(); } }));
  })();

  // =========================================================
  // 2) ADIVINÁ LA CANCIÓN CON EMOJIS
  // =========================================================
  (function emojis() {
    const box = $('em-box');
    if (!box || !E.EMOJIS || E.EMOJIS.length < 4) return;
    const N = 10;
    let em;

    function start() {
      const pool = E.EMOJIS;
      const qs = shuffle(pool).slice(0, N).map(([e, t]) => ({
        e, t,
        o: shuffle([t, ...shuffle(pool.filter((x) => x[1] !== t)).slice(0, 3).map((x) => x[1])])
      }));
      em = { i: 0, s: 0, qs, lock: false };
      render();
    }

    function render() {
      const q = em.qs[em.i];
      box.innerHTML = `<div class="pg"><i style="width:${em.i / em.qs.length * 100}%"></i></div>
        <p class="act-sub">Pregunta ${em.i + 1} de ${em.qs.length} · ¿Qué canción de ATEEZ es?</p>
        <div class="emoji-q" role="img" aria-label="Emojis de la canción">${q.e}</div>
        ${q.o.map((o) => `<button type="button" class="opt-btn" data-o="${esc(o)}">${esc(o)}</button>`).join('')}`;
    }

    function answer(btn) {
      if (em.lock) return;
      em.lock = true;
      const q = em.qs[em.i], ok = btn.dataset.o === q.t;
      if (ok) em.s++;
      box.querySelectorAll('.opt-btn').forEach((b) => {
        b.disabled = true;
        if (b.dataset.o === q.t) b.classList.add('ok');
      });
      if (!ok) btn.classList.add('bad');
      setTimeout(() => { em.i++; em.lock = false; em.i >= em.qs.length ? end() : render(); }, 900);
    }

    function end() {
      const s = em.s, n = em.qs.length;
      const r = s >= 9 ? ['Descifrador/a supremo/a', '']
        : s >= 7 ? ['Detective ATINY', '']
        : s >= 4 ? ['Curioso/a de Treasure', '']
        : ['Con ganas de repasar', ''];
      box.innerHTML = `<div id="em-card" class="res-card"><div class="res-top">ATEEZ ${A.th} ANNIVERSARY · EMOJIS ATINY</div>
        <div class="res-emoji">${r[1]}</div><h3>${r[0]}</h3>
        <p class="res-score">${s}/${n} canciones</p>
        <div class="res-foot">ATEEZARGENTINA.COM.AR</div></div>`;
      if (s >= 7) boom();
      addShare(box, 'em-card',
        `¡Soy ${r[0]} ${r[1]}! Adiviné ${s}/${n} canciones de ATEEZ solo con emojis por su ${A.ord} aniversario ${TAGS}`,
        'ATINY_Emojis_' + A.n + 'th.png');
      againBtn(box, 'Jugar de nuevo', start);
    }

    box.addEventListener('click', (e) => { const b = e.target.closest('.opt-btn'); if (b) answer(b); });
    start();
  })();

  // =========================================================
  // 3) SOPA DE LETRAS
  // =========================================================
  (function sopa() {
    const box = $('ws-box');
    if (!box || !E.SOPA) return;
    const N = 12, TOTAL = 8;
    const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];
    const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let ws = null;

    function build(words) {
      const grid = Array.from({ length: N }, () => Array(N).fill(''));
      for (const w of [...words].sort((a, b) => b.length - a.length)) {
        let ok = false;
        for (let t = 0; t < 300 && !ok; t++) {
          const [dr, dc] = DIRS[rand(DIRS.length)];
          const r0 = rand(N), c0 = rand(N);
          const r1 = r0 + dr * (w.length - 1), c1 = c0 + dc * (w.length - 1);
          if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) continue;
          let cabe = true;
          for (let i = 0; i < w.length; i++) {
            const ch = grid[r0 + dr * i][c0 + dc * i];
            if (ch && ch !== w[i]) { cabe = false; break; }
          }
          if (!cabe) continue;
          for (let i = 0; i < w.length; i++) grid[r0 + dr * i][c0 + dc * i] = w[i];
          ok = true;
        }
        if (!ok) return null;
      }
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!grid[r][c]) grid[r][c] = ABC[rand(26)];
      return grid;
    }

    function start() {
      if (ws && ws.timer) clearInterval(ws.timer);
      let words, grid = null;
      for (let i = 0; i < 40 && !grid; i++) {
        words = shuffle(E.SOPA).slice(0, TOTAL);
        grid = build(words);
      }
      if (!grid) { box.textContent = 'No pudimos armar la sopa de letras. Recargá la página.'; return; }
      ws = { grid, words, found: new Set(), sel: null, t0: 0, secs: 0, timer: null, done: false };
      render();
    }

    function render() {
      box.innerHTML = `<div class="mm-stats"><span>Encontradas: <b id="ws-n">0</b>/${TOTAL}</span><span>Tiempo: <b id="ws-t">0:00</b></span></div>
        <div class="ws-grid" style="grid-template-columns:repeat(${N},1fr)">${ws.grid.map((fila, r) => fila.map((ch, c) =>
          `<button type="button" class="ws-cell" data-r="${r}" data-c="${c}" aria-label="Fila ${r + 1}, columna ${c + 1}, letra ${ch}">${ch}</button>`).join('')).join('')}</div>
        <div class="ws-words">${[...ws.words].sort().map((w) => `<span class="ws-word" data-w="${w}">${w}</span>`).join('')}</div>
        <p class="ws-help">Tocá la primera y la última letra de cada palabra. Pueden estar en cualquier dirección (también al revés).</p>`;
    }

    const cell = (r, c) => box.querySelector(`.ws-cell[data-r="${r}"][data-c="${c}"]`);
    const flash = (cells) => {
      cells.forEach((x) => x && x.classList.add('err'));
      setTimeout(() => cells.forEach((x) => x && x.classList.remove('err')), 350);
    };

    function pick(c) {
      if (!ws || ws.done) return;
      const r = +c.dataset.r, col = +c.dataset.c;
      if (!ws.t0) {
        ws.t0 = Date.now();
        ws.timer = setInterval(() => {
          ws.secs = Math.floor((Date.now() - ws.t0) / 1000);
          const t = $('ws-t');
          if (t) t.textContent = fmt(ws.secs);
        }, 500);
      }
      if (!ws.sel) { ws.sel = { r, c: col }; c.classList.add('sel'); return; }

      const { r: r0, c: c0 } = ws.sel;
      const primera = cell(r0, c0);
      if (primera) primera.classList.remove('sel');
      ws.sel = null;
      if (r0 === r && c0 === col) return; // tocó la misma: cancela

      const dr = r - r0, dc = col - c0;
      if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) { flash([primera, c]); return; }
      const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1, sr = Math.sign(dr), sc = Math.sign(dc);
      const cells = []; let word = '';
      for (let i = 0; i < len; i++) {
        cells.push(cell(r0 + sr * i, c0 + sc * i));
        word += ws.grid[r0 + sr * i][c0 + sc * i];
      }
      const rev = [...word].reverse().join('');
      const hit = ws.words.find((w) => !ws.found.has(w) && (w === word || w === rev));
      if (!hit) { flash([primera, c]); return; }

      ws.found.add(hit);
      cells.forEach((x) => x.classList.add('found'));
      const tag = box.querySelector(`.ws-word[data-w="${hit}"]`);
      if (tag) tag.classList.add('done');
      $('ws-n').textContent = ws.found.size;
      if (ws.found.size === TOTAL) end();
    }

    function end() {
      ws.done = true;
      clearInterval(ws.timer);
      const s = ws.secs;
      const r = s <= 120 ? ['Ojo de halcón', ''] : s <= 240 ? ['Navegante atento', ''] : ['Tripulante paciente', ''];
      box.insertAdjacentHTML('beforeend', `<div id="ws-card" class="res-card" style="margin-top:16px"><div class="res-top">ATEEZ ${A.th} ANNIVERSARY · SOPA DE LETRAS</div>
        <div class="res-emoji">${r[1]}</div><h3>${r[0]}</h3>
        <p class="res-score">${TOTAL}/${TOTAL} palabras en ${fmt(s)}</p>
        <div class="res-foot">ATEEZARGENTINA.COM.AR</div></div>`);
      boom();
      addShare(box, 'ws-card',
        `¡Soy ${r[0]} ${r[1]}! Encontré las ${TOTAL} palabras de la sopa de letras de ATEEZ en ${fmt(s)} ${TAGS}`,
        'ATINY_Sopa_' + A.n + 'th.png');
      againBtn(box, 'Nueva sopa', start);
    }

    box.addEventListener('click', (e) => { const c = e.target.closest('.ws-cell'); if (c) pick(c); });
    start();
  })();
})();

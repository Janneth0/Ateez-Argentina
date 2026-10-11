// Trivia ATINY + ¿Qué integrante sos? (con compartir). Datos en trivia-data.js y quiz-data.js
(function () {
  const $ = id => document.getElementById(id);
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const SITE = 'https://ateezargentina.com.ar';
  const TAGS = '#8YearsWithATEEZ #ATEEZ #ATINY';
  const boom = () => window.launchConfetti && window.launchConfetti();

  // ---------- Compartir (imagen de la tarjeta + texto) ----------
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function cardBlob(id) {
    const c = await html2canvas($(id), { scale: 2, backgroundColor: null, useCORS: true });
    return new Promise(r => c.toBlob(r, 'image/png'));
  }
  function addShare(box, cardId, text, fname) {
    const w = document.createElement('div');
    w.innerHTML = `<button class="btn" data-a="share">Compartir resultado 📲</button>
      <button class="btn" data-a="dl">Descargar imagen 💾</button>
      <div class="share-links">
        <a target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text + ' ' + SITE)}">WhatsApp</a>
        <a target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SITE)}">X</a>
      </div>`;
    box.appendChild(w);
    w.querySelectorAll('button').forEach(b => b.onclick = async () => {
      const old = b.innerText; b.disabled = true; b.innerText = 'Generando…';
      try {
        const blob = await cardBlob(cardId), file = new File([blob], fname, { type: 'image/png' });
        if (b.dataset.a === 'share' && navigator.canShare && navigator.canShare({ files: [file] }))
          await navigator.share({ title: 'ATEEZ 8th Anniversary', text: text + ' ' + SITE, files: [file] });
        else download(blob, fname);
      } catch (e) { console.log(e); }
      b.disabled = false; b.innerText = old;
    });
  }

  // ---------- Trivia ----------
  const N = 16;
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
    tv = { i: 0, s: 0, qs: shuffle(window.TRIVIA_BANK).slice(0, N).map(q => ({ q: q[0], c: q[1], o: shuffle(q.slice(1)) })) };
    tvRender();
  }
  function tvRender() {
    const box = $('tv-box');
    if (tv.i >= N) return tvEnd(box);
    const t = tv.qs[tv.i];
    box.innerHTML = `<div class="pg"><i style="width:${tv.i / N * 100}%"></i></div><p><small>Pregunta ${tv.i + 1} de ${N}</small></p><h5>${t.q}</h5>` +
      t.o.map(x => `<button class="opt-btn">${x}</button>`).join('');
    box.querySelectorAll('.opt-btn').forEach(b => b.onclick = () => {
      box.querySelectorAll('.opt-btn').forEach(x => { x.disabled = true; if (x.innerText === t.c) x.classList.add('ok'); });
      if (b.innerText === t.c) tv.s++; else b.classList.add('bad');
      setTimeout(() => { tv.i++; tvRender(); }, 900);
    });
  }
  function tvEnd(box) {
    const r = [...RANKS].reverse().find(x => tv.s >= x[0]);
    box.innerHTML = `<div id="tv-card" class="res-card"><div class="res-top">ATEEZ 8TH ANNIVERSARY · TRIVIA ATINY</div>
      <div class="res-emoji">${r[2]}</div><h3>${r[1]}</h3><p class="res-score">${tv.s}/${N}</p><p>${r[3]}</p>
      <div class="res-foot">ATEEZARGENTINA.COM.AR</div></div>`;
    const again = document.createElement('button');
    again.className = 'btn'; again.innerText = 'Jugar de nuevo 🔁'; again.onclick = tvStart;
    box.appendChild(again);
    addShare(box, 'tv-card', `¡Soy ${r[1]} ${r[2]}! Hice ${tv.s}/${N} en la trivia de ATEEZ por su 8º aniversario 🏴‍☠️ ${TAGS}`, 'ATINY_Trivia_8th.png');
    if (tv.s >= 10) boom();
  }

  // ---------- ¿Qué integrante sos? ----------
  let qz;
  function qzStart() {
    qz = { i: 0, pts: {}, qs: shuffle(window.QUIZ_BANK).slice(0, 8).map(q => ({ q: q[0], o: shuffle(q[1]) })) };
    qzRender();
  }
  function qzRender() {
    const box = $('qz-box');
    if (qz.i >= qz.qs.length) return qzEnd(box);
    const t = qz.qs[qz.i];
    box.innerHTML = `<div class="pg"><i style="width:${qz.i / qz.qs.length * 100}%"></i></div><p><small>Pregunta ${qz.i + 1} de ${qz.qs.length}</small></p><h5>${t.q}</h5>` +
      t.o.map((x, i) => `<button class="opt-btn" data-i="${i}">${x[0]}</button>`).join('');
    box.querySelectorAll('.opt-btn').forEach(b => b.onclick = () => {
      const o = t.o[b.dataset.i];
      [o[1], o[2]].forEach(k => qz.pts[k] = (qz.pts[k] || 0) + 1);
      qz.i++; qzRender();
    });
  }
  function qzEnd(box) {
    const sorted = Object.entries(qz.pts).sort((a, b) => b[1] - a[1]);
    const max = sorted[0][1];
    const top = shuffle(sorted.filter(x => x[1] === max))[0];           // desempate al azar
    const second = sorted.find(x => x[0] !== top[0]);
    const m = window.QUIZ_MEMBERS[top[0]], pct = Math.round(top[1] / qz.qs.length * 100);
    box.innerHTML = `<div id="qz-card" class="res-card"><div class="res-top">¿QUÉ INTEGRANTE SOS? · ATEEZ 8TH</div>
      <img class="res-photo" src="assets/img/integrantes/${m.slug}.jpg" alt="${m.n}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="res-photo res-fallback">${m.n[0]}</div>
      <h3>${m.n}</h3><p class="res-score">${pct}% de afinidad</p><p>${m.t}</p>
      ${second ? `<p><small>Tu segunda vibra: ${window.QUIZ_MEMBERS[second[0]].n}</small></p>` : ''}
      <div class="res-foot">ATEEZARGENTINA.COM.AR</div></div>`;
    const again = document.createElement('button');
    again.className = 'btn'; again.innerText = 'Repetir test 🔁'; again.onclick = qzStart;
    box.appendChild(again);
    addShare(box, 'qz-card', `¡Me salió ${m.n} (${pct}% de afinidad) en el test de ATEEZ por su 8º aniversario! 🏴‍☠️ ${TAGS}`, 'ATINY_Integrante_8th.png');
    boom();
  }

  tvStart(); qzStart();
})();

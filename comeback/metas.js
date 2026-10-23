// ============================================================
// METAS.JS - Comeback: contador + pre-save + metas de streaming
// Los datos (fecha, video, pre-save, objetivos, valores actuales) se cargan
// desde el panel de admin (pestaña "Comeback y metas") y viven en Firestore,
// colección "comebacks" (el que tiene activo:true es el que se muestra).
// Si Firestore todavía no tiene nada cargado (o falla), se usa data/goals.json
// como respaldo.
// Solo YouTube se actualiza solo (API); el resto se carga a mano desde el panel.
//
// Campos que lee esta página (además de los de siempre):
//   meta.destacada   (true/false)  -> la tarjeta ocupa TODA la fila. Si ninguna meta trae este campo,
//                                     la primera sigue ocupando la fila completa (comportamiento anterior).
//   barra.completada (true/false)  -> el equipo marca la meta como cumplida a mano (para plataformas que
//                                     no se pueden verificar solas). YouTube se cumple solo al llegar al objetivo.
//   barra.tipo "puesto"            -> se muestra la POSICIÓN actual (no una barra de progreso).
// ============================================================
import { obtenerComebackActivo, normalizarComeback, PLATAFORMAS, urlSegura } from '../assets/js/comebacks.js';

(function () {
  'use strict';

  // Tip: en Google Cloud restringí esta key por "referrer HTTP" a tu dominio.
  const YOUTUBE_API_KEY = 'AIzaSyDlGihW21eWD7Y0gKXQcVHU1-SLj3_wpyQ';
  const LS_DONE = 'atiny_completed_goals'; // misma clave que usaba la versión anterior
  const DAY = 864e5;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = new Intl.NumberFormat('es-AR');
  const clamp = (n) => Math.max(0, Math.min(100, n));

  const PLAT = PLATAFORMAS;

  const lsGet = () => { try { return JSON.parse(localStorage.getItem(LS_DONE) || '[]'); } catch (e) { return []; } };
  const lsSet = (v) => { try { localStorage.setItem(LS_DONE, JSON.stringify(v)); } catch (e) { /* modo privado */ } };

  let DATA = null;
  let releaseMs = 0;

  const truthy = (v) => v === true || v === 'true' || v === 1 || v === '1';

  // ID de un video de YouTube a partir de cualquier link (watch, youtu.be, shorts, embed) o del ID suelto
  function ytId(v) {
    const t = String(v || '').trim();
    if (/^[\w-]{11}$/.test(t)) return t;
    const m = t.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : '';
  }

  // ---------- Video del comeback (derecha del contador) ----------
  function renderVideo() {
    const box = $('cb-video');
    if (!box || !DATA) return;
    const id = ytId(DATA.youtubeVideoId) || ytId(DATA.youtubeUrl);
    if (!id) { box.hidden = true; box.innerHTML = ''; return; }
    box.innerHTML = `<div class="cb-video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0" title="Video del comeback" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
    box.hidden = false;
  }

  // La columna derecha aparece solo si hay algo para mostrar (video y/o pre-save visible)
  function layoutTop() {
    const side = $('cb-side'), top = $('cb-top');
    if (!side || !top) return;
    const hayAlgo = ['cb-video', 'presave'].some((id) => { const el = $(id); return el && !el.hidden && el.innerHTML.trim(); });
    side.hidden = !hayAlgo;
    top.classList.toggle('cb-top--solo', !hayAlgo);
  }

  // Link del botón principal de una meta. En la de YouTube, si no se cargó uno, usa el del video.
  function linkMeta(m) {
    const propio = urlSegura(m.link);
    if (propio) return propio;
    if (m.plataforma === 'youtube') return urlSegura(DATA && DATA.youtubeUrl) || (DATA && DATA.youtubeVideoId ? 'https://www.youtube.com/watch?v=' + DATA.youtubeVideoId : '');
    return '';
  }

  // ---------- Pre-save ----------
  // Se muestra mientras falta para el comeback; al salir la canción se oculta solo.
  function renderPresave() {
    const box = $('presave');
    if (!box || !DATA) return;
    const items = (DATA.presave || []).filter((p) => urlSegura(p.url));
    if (!items.length) { box.hidden = true; box.innerHTML = ''; layoutTop(); return; }
    box.innerHTML = '<h3 class="presave-titulo"><i class="bi bi-bookmark-heart"></i> Pre-save</h3>' +
      '<p class="presave-sub">Guardá la canción antes del lanzamiento para que llegue directo a tu biblioteca y sume desde el minuto cero.</p>' +
      '<div class="presave-botones">' + items.map((p) => {
        const pl = PLAT[p.plataforma] || PLAT.otro;
        const nombre = p.nombrePlataforma || pl.nombre;
        return `<a class="presave-btn" style="--plat:${pl.color}" href="${esc(urlSegura(p.url))}" target="_blank" rel="noopener"><i class="bi ${pl.icon}"></i> ${esc(p.texto || 'Pre-guardar en ' + nombre)}</a>`;
      }).join('') + '</div>';
    box.hidden = Date.now() >= releaseMs;
    layoutTop();
  }

  // ---------- Contador ----------
  function tick() {
    const now = Date.now();
    const boxes = $('cb-boxes'), msg = $('cb-msg'), label = $('cb-label');
    if (!boxes) return;
    const fin24 = releaseMs + DAY;
    let target, text, show = true;

    if (now < releaseMs) { target = releaseMs; text = 'Falta para el comeback'; }
    else if (now < fin24) { target = fin24; text = '¡Ya salió! Se cierran las 24 hs en'; }
    else { show = false; text = '¡El comeback ya está acá! 🔥 Las metas de 24 hs están cerradas.'; }

    const ps = $('presave');
    if (ps && ps.innerHTML && ps.hidden !== (now >= releaseMs)) { ps.hidden = now >= releaseMs; layoutTop(); }
    boxes.style.display = show ? '' : 'none';
    label.textContent = text;
    if (!show) { msg.textContent = ''; return; }
    const diff = target - now;
    const set = (id, v) => { $(id).textContent = String(v).padStart(2, '0'); };
    $('cb-d').textContent = Math.floor(diff / DAY);
    set('cb-h', Math.floor(diff / 36e5) % 24);
    set('cb-m', Math.floor(diff / 6e4) % 60);
    set('cb-s', Math.floor(diff / 1e3) % 60);
    msg.textContent = now < releaseMs ? 'A streamear con todo, ATINY 🏴‍☠️' : '¡Ahora es cuando! Streameá, comprá y shazameá.';
  }

  // ---------- YouTube ----------
  async function fetchYouTubeViews(videoId) {
    if (!YOUTUBE_API_KEY || !videoId) return null;
    try {
      const c = JSON.parse(sessionStorage.getItem('atiny_yt') || 'null');
      if (c && c.id === videoId && Date.now() - c.t < 60000) return c.v; // cache 1 min: cuida la cuota de la API
    } catch (e) { /* sin cache */ }
    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(videoId)}&key=${YOUTUBE_API_KEY}`);
      const j = await r.json();
      const v = j.items && j.items[0] ? parseInt(j.items[0].statistics.viewCount, 10) : null;
      if (v != null) { try { sessionStorage.setItem('atiny_yt', JSON.stringify({ id: videoId, t: Date.now(), v })); } catch (e) { /* ok */ } }
      return v;
    } catch (e) {
      console.warn('No se pudo leer YouTube:', e);
      return null;
    }
  }

  // ---------- Progreso de una barra ----------
  // Devuelve un objeto con todo lo necesario para dibujar la barra o el puesto.
  function calcBarra(b, ytViews) {
    let actual = b.actual;
    let manual = true;
    if (b.fuente === 'youtube' && ytViews != null) {
      manual = false;
      actual = ytViews;
      // Pasadas las 24 hs, la meta de 24 hs queda congelada en el valor final cargado a mano.
      if (b.ventana24h && Date.now() > releaseMs + DAY && b.final24h != null) { actual = b.final24h; manual = true; }
    }
    const forzada = truthy(b.completada); // el equipo la marcó como cumplida desde el admin
    const unidad = b.unidad ? ' ' + b.unidad : '';

    // --- POSICIÓN en un ranking: se muestra el puesto, no una barra ---
    if (b.tipo === 'puesto') {
      const cumple = forzada || (actual != null && actual <= b.objetivo);
      return {
        tipo: 'puesto', cumple, forzada, actual, objetivo: b.objetivo,
        faltan: actual != null && actual > b.objetivo ? actual - b.objetivo : 0
      };
    }

    // --- CANTIDAD: barra de progreso ---
    const pct = forzada ? 100 : (actual == null ? 0 : clamp((actual / b.objetivo) * 100));
    return {
      tipo: 'cantidad', pct, cumple: pct >= 100, forzada,
      actualTxt: forzada ? '✔ Meta cumplida' : (actual == null ? 'Todavía sin datos' : `${nf.format(actual)}${unidad}`),
      objetivoTxt: `Meta: ${nf.format(b.objetivo)}${unidad}`,
      manual
    };
  }

  const barraHTML = (b, c) => `
    <div class="meta-barra${c.cumple ? ' cumplida' : ''}">
      <div class="meta-barra-top"><span class="meta-etq">${esc(b.etiqueta)}</span><span class="meta-obj">${esc(c.objetivoTxt)}</span></div>
      <div class="meta-pb" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${c.pct.toFixed(0)}" aria-label="${esc(b.etiqueta)}">
        <div class="meta-pf${c.cumple ? ' completa' : ''}" style="width:${c.pct.toFixed(1)}%"></div>
      </div>
      <div class="meta-barra-bot"><span>${esc(c.actualTxt)}</span><strong>${c.pct.toFixed(c.pct >= 100 ? 0 : 1)}%</strong></div>
    </div>`;

  const puestoHTML = (b, c) => {
    let estado;
    if (c.cumple) estado = '<span class="meta-rank-estado ok"><i class="bi bi-check-circle-fill"></i> ¡Meta cumplida!</span>';
    else if (c.actual == null) estado = '<span class="meta-rank-estado">Todavía sin datos</span>';
    else estado = `<span class="meta-rank-estado">Faltan ${nf.format(c.faltan)} puesto${c.faltan === 1 ? '' : 's'}</span>`;
    return `
    <div class="meta-rank${c.cumple ? ' cumplida' : ''}">
      <span class="meta-etq">${esc(b.etiqueta)}</span>
      <div class="meta-rank-num" aria-label="${c.actual == null ? 'Sin posición' : 'Puesto ' + c.actual}">${c.actual == null ? '–' : `<small>#</small>${nf.format(c.actual)}`}</div>
      <span class="meta-rank-sub">Puesto actual</span>
      <span class="meta-rank-meta"><i class="bi bi-bullseye"></i> Meta: #${nf.format(c.objetivo)} o mejor</span>
      ${estado}
    </div>`;
  };

  // Agrupa barras consecutivas del mismo tipo: los puestos van en una grilla de "tiles",
  // las cantidades en una columna de barras (cada grupo respeta el orden del admin).
  function barrasHTML(m, ytViews, acc) {
    const calc = m.barras.map((b) => ({ b, c: calcBarra(b, ytViews) }));
    calc.forEach(({ c }) => { acc.total++; if (c.cumple) acc.logradas++; });
    const grupos = [];
    calc.forEach((x) => {
      const ult = grupos[grupos.length - 1];
      if (ult && ult.tipo === x.c.tipo) ult.items.push(x); else grupos.push({ tipo: x.c.tipo, items: [x] });
    });
    return {
      todas: calc.length > 0 && calc.every(({ c }) => c.cumple),
      html: grupos.map((g) => g.tipo === 'puesto'
        ? `<div class="meta-ranks">${g.items.map(({ b, c }) => puestoHTML(b, c)).join('')}</div>`
        : `<div class="meta-barras">${g.items.map(({ b, c }) => barraHTML(b, c)).join('')}</div>`).join('')
    };
  }

  // ---------- Render ----------
  async function render() {
    const grid = $('metas-grid');
    if (!grid || !DATA) return;
    const hayYT = DATA.metas.some((m) => m.barras.some((b) => b.fuente === 'youtube'));
    const ytViews = hayYT ? await fetchYouTubeViews(ytId(DATA.youtubeVideoId) || ytId(DATA.youtubeUrl)) : null;
    const done = lsGet();
    const acc = { logradas: 0, total: 0 };

    // Cuáles ocupan la fila completa: las "destacadas". Si el admin todavía no tiene ese campo en
    // ninguna meta, la primera sigue siendo destacada (como antes).
    const hayFlag = DATA.metas.some((m) => m.destacada !== undefined);
    const destacadas = DATA.metas.map((m, i) => (hayFlag ? truthy(m.destacada) : i === 0));
    // Si una tarjeta común queda sola al final de una fila, ocupa todo el ancho (así no queda un hueco).
    const solas = new Set();
    let col = 0, pend = -1;
    destacadas.forEach((d, i) => {
      if (d) { if (col === 1) solas.add(pend); col = 0; } // una destacada corta la fila: la común anterior quedó sola
      else if (col === 0) { col = 1; pend = i; } else { col = 0; }
    });
    if (col === 1) solas.add(pend);

    grid.innerHTML = DATA.metas.map((m, i) => {
      const p = PLAT[m.plataforma] || { icon: 'bi-music-note-beamed', nombre: m.plataforma, color: 'var(--accent-color)' };
      const hecho = done.includes(m.id);
      const { html: barras, todas } = barrasHTML(m, ytViews, acc);
      const clases = ['meta-card', destacadas[i] ? 'destacada' : '', solas.has(i) ? 'sola' : '', todas ? 'lograda' : ''].filter(Boolean).join(' ');

      return `
        <article class="${clases}" style="--plat:${p.color}">
          <header class="meta-head">
            <span class="meta-chip"><i class="bi ${p.icon}"></i> ${esc(m.nombrePlataforma || p.nombre)}</span>
            ${todas ? '<span class="meta-lograda"><i class="bi bi-trophy-fill"></i> Meta cumplida</span>' : ''}
            <h3>${esc(m.titulo)}</h3>
            ${m.detalle ? `<p>${esc(m.detalle)}</p>` : ''}
          </header>
          ${barras}
          <footer class="meta-actions">
            ${linkMeta(m) ? `<a class="meta-btn" href="${esc(linkMeta(m))}" target="_blank" rel="noopener">${esc(m.botonTexto || 'Abrir')} <i class="bi bi-box-arrow-up-right"></i></a>` : ''}
            <button type="button" class="meta-btn meta-check${hecho ? ' on' : ''}" data-id="${esc(m.id)}" aria-pressed="${hecho}" title="Marcá lo que ya hiciste vos (se guarda solo en tu dispositivo)">
              <i class="bi ${hecho ? 'bi-check2-circle' : 'bi-circle'}"></i> ${hecho ? '¡Hice mi parte!' : 'Ya hice mi parte'}
            </button>
          </footer>
        </article>`;
    }).join('');

    const res = $('metas-resumen');
    if (res) {
      const fecha = DATA.actualizadoDate ? DATA.actualizadoDate.toLocaleDateString('es-AR') : '';
      res.innerHTML = `<span><i class="bi bi-trophy"></i> Metas logradas: <strong>${acc.logradas}</strong> de ${acc.total}</span>` +
        (fecha ? `<span><i class="bi bi-clock-history"></i> Datos manuales actualizados: ${esc(fecha)}</span>` : '') +
        (ytViews != null ? '<span><i class="bi bi-broadcast"></i> YouTube en vivo</span>' : '');
    }
  }

  // ---------- Init ----------
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.meta-check');
    if (!b) return;
    let list = lsGet();
    list = list.includes(b.dataset.id) ? list.filter((x) => x !== b.dataset.id) : [...list, b.dataset.id];
    lsSet(list);
    b.classList.toggle('on', list.includes(b.dataset.id));
    b.setAttribute('aria-pressed', list.includes(b.dataset.id));
    b.innerHTML = list.includes(b.dataset.id) ? '<i class="bi bi-check2-circle"></i> ¡Hice mi parte!' : '<i class="bi bi-circle"></i> Ya hice mi parte';
  });

  function mostrarAviso(html) {
    const g = $('metas-grid');
    if (g) g.innerHTML = `<p class="metas-error">${html}</p>`;
    const hero = document.querySelector('.cb-hero');
    if (hero) hero.style.display = 'none';
    const top = $('cb-top'); if (top) top.style.display = 'none';
  }

  async function cargarDatos() {
    try {
      const r = await obtenerComebackActivo();
      if (r.estado === 'ok') return r.data;
      if (r.estado === 'sin-activo') return 'sin-activo';
    } catch (e) {
      console.warn('No se pudo leer Firestore, se usa goals.json:', e);
    }
    // Respaldo: archivo estático (primer uso o sin conexión a Firestore)
    const r = await fetch('data/goals.json', { cache: 'no-store' });
    return normalizarComeback(await r.json());
  }

  async function init() {
    try {
      DATA = await cargarDatos();
    } catch (e) {
      console.error('No se pudieron cargar las metas', e);
      mostrarAviso('No pudimos cargar las metas. Probá recargar la página en unos minutos.');
      return;
    }
    if (DATA === 'sin-activo') {
      DATA = null;
      mostrarAviso('Pronto vamos a anunciar las metas del próximo comeback. ¡Seguinos en redes! 🏴‍☠️');
      return;
    }
    releaseMs = new Date(DATA.comeback.fecha).getTime();
    $('cb-sub').textContent = DATA.comeback.subtitulo;
    $('cb-title').textContent = DATA.comeback.titulo;
    $('cb-date').textContent = DATA.comeback.fechaTexto;
    document.dispatchEvent(new CustomEvent('comeback-listo', { detail: { id: DATA.id } }));
    renderVideo();
    renderPresave();
    layoutTop();
    tick(); setInterval(tick, 1000);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

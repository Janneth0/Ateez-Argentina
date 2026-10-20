// ============================================================
// METAS.JS - Comeback: contador + pre-save + metas de streaming
// Los datos (fecha, video, pre-save, objetivos, valores actuales) se cargan
// desde el panel de admin (pestaña "Comeback y metas") y viven en Firestore,
// colección "comebacks" (el que tiene activo:true es el que se muestra).
// Si Firestore todavía no tiene nada cargado (o falla), se usa data/goals.json
// como respaldo.
// Solo YouTube se actualiza solo (API); el resto se carga a mano desde el panel.
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
    if (!items.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.innerHTML = '<h3 class="presave-titulo"><i class="bi bi-bookmark-heart"></i> Pre-save</h3>' +
      '<p class="presave-sub">Guardá la canción antes del lanzamiento para que llegue directo a tu biblioteca y sume desde el minuto cero.</p>' +
      '<div class="presave-botones">' + items.map((p) => {
        const pl = PLAT[p.plataforma] || PLAT.otro;
        const nombre = p.nombrePlataforma || pl.nombre;
        return `<a class="presave-btn" style="--plat:${pl.color}" href="${esc(urlSegura(p.url))}" target="_blank" rel="noopener"><i class="bi ${pl.icon}"></i> ${esc(p.texto || 'Pre-guardar en ' + nombre)}</a>`;
      }).join('') + '</div>';
    box.hidden = Date.now() >= releaseMs;
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

    const ps = $('presave'); if (ps && ps.innerHTML) ps.hidden = now >= releaseMs;
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
  // Devuelve { pct, actualTxt, objetivoTxt, manual }
  function calcBarra(b, ytViews) {
    let actual = b.actual;
    let manual = true;
    if (b.fuente === 'youtube' && ytViews != null) {
      manual = false;
      actual = ytViews;
      // Pasadas las 24 hs, la meta de 24 hs queda congelada en el valor final cargado a mano.
      if (b.ventana24h && Date.now() > releaseMs + DAY && b.final24h != null) { actual = b.final24h; manual = true; }
    }
    const unidad = b.unidad ? ' ' + b.unidad : '';

    if (b.tipo === 'puesto') {
      const max = b.maximo || 100;
      const pct = actual == null ? 0 : clamp(((max - actual) / (max - b.objetivo)) * 100);
      return {
        pct,
        actualTxt: actual == null ? 'Todavía sin datos' : `Puesto actual: #${nf.format(actual)}`,
        objetivoTxt: `Meta: puesto #${nf.format(b.objetivo)} o mejor`,
        manual
      };
    }
    const pct = actual == null ? 0 : clamp((actual / b.objetivo) * 100);
    return {
      pct,
      actualTxt: actual == null ? 'Todavía sin datos' : `${nf.format(actual)}${unidad}`,
      objetivoTxt: `Meta: ${nf.format(b.objetivo)}${unidad}`,
      manual
    };
  }

  // ---------- Render ----------
  async function render() {
    const grid = $('metas-grid');
    if (!grid || !DATA) return;
    const hayYT = DATA.metas.some((m) => m.barras.some((b) => b.fuente === 'youtube'));
    const ytViews = hayYT ? await fetchYouTubeViews(DATA.youtubeVideoId) : null;
    const done = lsGet();
    let logradas = 0, total = 0;

    grid.innerHTML = DATA.metas.map((m) => {
      const p = PLAT[m.plataforma] || { icon: 'bi-music-note-beamed', nombre: m.plataforma, color: 'var(--accent-color)' };
      const hecho = done.includes(m.id);
      const barras = m.barras.map((b) => {
        const c = calcBarra(b, ytViews);
        total++; if (c.pct >= 100) logradas++;
        return `
          <div class="meta-barra">
            <div class="meta-barra-top"><span class="meta-etq">${esc(b.etiqueta)}</span><span class="meta-obj">${esc(c.objetivoTxt)}</span></div>
            <div class="meta-pb" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${c.pct.toFixed(0)}" aria-label="${esc(b.etiqueta)}">
              <div class="meta-pf${c.pct >= 100 ? ' completa' : ''}" style="width:${c.pct.toFixed(1)}%"></div>
            </div>
            <div class="meta-barra-bot"><span>${esc(c.actualTxt)}</span><strong>${c.pct.toFixed(1)}%</strong></div>
          </div>`;
      }).join('');

      return `
        <article class="meta-card" style="--plat:${p.color}">
          <header class="meta-head">
            <span class="meta-chip"><i class="bi ${p.icon}"></i> ${esc(m.nombrePlataforma || p.nombre)}</span>
            <h3>${esc(m.titulo)}</h3>
            ${m.detalle ? `<p>${esc(m.detalle)}</p>` : ''}
          </header>
          ${barras}
          <footer class="meta-actions">
            ${linkMeta(m) ? `<a class="meta-btn" href="${esc(linkMeta(m))}" target="_blank" rel="noopener">${esc(m.botonTexto || 'Abrir')} <i class="bi bi-box-arrow-up-right"></i></a>` : ''}
            <button type="button" class="meta-btn meta-check${hecho ? ' on' : ''}" data-id="${esc(m.id)}" aria-pressed="${hecho}">
              <i class="bi ${hecho ? 'bi-check2-circle' : 'bi-circle'}"></i> ${hecho ? '¡Ya lo hice!' : 'Marcar como hecho'}
            </button>
          </footer>
        </article>`;
    }).join('');

    const res = $('metas-resumen');
    if (res) {
      const fecha = DATA.actualizadoDate ? DATA.actualizadoDate.toLocaleDateString('es-AR') : '';
      res.innerHTML = `<span><i class="bi bi-trophy"></i> Metas logradas: <strong>${logradas}</strong> de ${total}</span>` +
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
    b.innerHTML = list.includes(b.dataset.id) ? '<i class="bi bi-check2-circle"></i> ¡Ya lo hice!' : '<i class="bi bi-circle"></i> Marcar como hecho';
  });

  function mostrarAviso(html) {
    const g = $('metas-grid');
    if (g) g.innerHTML = `<p class="metas-error">${html}</p>`;
    const hero = document.querySelector('.cb-hero');
    if (hero) hero.style.display = 'none';
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
    renderPresave();
    tick(); setInterval(tick, 1000);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

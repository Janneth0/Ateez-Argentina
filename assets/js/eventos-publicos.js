// ============================================================
// EVENTOS-PUBLICOS.JS
// Seccion "Publicaciones de la comunidad" en evento/index.html.
// Se alimenta en tiempo real de lo que el equipo admin/colaborador
// carga desde /admin. Los eventos con mas de un ano desde su
// "fechaEvento" se ocultan automaticamente del sitio publico
// (siguen existiendo en Firestore; el panel admin los marca como
// "Inactivo" en vez de borrarlos).
// ============================================================

import { escucharPosts } from "./posts.js";
import { renderPostCard, activarEmbedsDiferidos } from "./components.js";
import { listarFanbases } from "./fanbases.js";
import { eventoVencido, formatearFecha } from "./util.js";

const contenedor = document.getElementById("publicaciones-comunidad");
const filtros = document.getElementById("publicaciones-filtros");
const vacio = document.getElementById("publicaciones-vacio");

// ------------------------------------------------------------
// Velocidad de carga:
//  1) Esqueletos: las tarjetas "fantasma" aparecen al instante, antes de que Firestore responda.
//  2) Cache local: la ultima lista recibida se guarda en el navegador y se pinta de inmediato
//     en la proxima visita; en cuanto llega la lista real desde Firestore, se actualiza.
//  3) Embeds diferidos: Instagram/TikTok/X se cargan solo cuando la tarjeta esta por verse.
// ------------------------------------------------------------
const CACHE_KEY = "atz_eventos_cache_v1";
const CACHE_MAX_MS = 1000 * 60 * 60 * 24 * 7; // una semana

const aMs = (v) => (v && typeof v.toMillis === "function") ? v.toMillis() : (v ? new Date(v).getTime() : null);

function guardarCache(posts) {
  try {
    const plano = posts.map(p => ({ ...p, fechaEvento: aMs(p.fechaEvento), creadoEn: aMs(p.creadoEn), actualizadoEn: aMs(p.actualizadoEn) }));
    localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), posts: plano }));
  } catch (e) { /* modo privado o storage lleno: no pasa nada */ }
}

function leerCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (!c || !Array.isArray(c.posts) || Date.now() - c.t > CACHE_MAX_MS) return [];
    return c.posts;
  } catch (e) { return []; }
}

function esqueletos(n = 6) {
  return Array.from({ length: n }, () => `
    <div class="col-lg-4 col-md-6 portfolio-item">
      <div class="portfolio-card card-esqueleto" aria-hidden="true">
        <div class="image-container"></div>
        <div class="content"><div class="esq-linea esq-titulo"></div><div class="esq-linea"></div><div class="esq-linea esq-corta"></div></div>
      </div>
    </div>`).join("");
}

if (contenedor) {
  let todasLasPosts = [];
  let hayDatos = false; // true apenas se pinto algo real (cache o Firestore)
  let filtroActivo = "todas";
  let nombresFanbase = null; // id -> nombre; se pide una sola vez y solo si algún evento muestra su fanbase

  function asegurarFanbases() {
    if (nombresFanbase) return;
    nombresFanbase = {};
    listarFanbases()
      .then(lista => { nombresFanbase = Object.fromEntries(lista.map(f => [f.id, f.nombre])); pintar(); })
      .catch(() => {});
  }

  function pintar() {
    const vigentes = todasLasPosts.filter(p => !eventoVencido(p.fechaEvento));
    const lista = filtroActivo === "todas"
      ? vigentes
      : vigentes.filter(p => p.categoria === filtroActivo);

    if (lista.length === 0) {
      contenedor.innerHTML = "";
      if (vacio) vacio.style.display = "block";
      return;
    }
    if (vacio) vacio.style.display = "none";
    if (lista.some(p => p.mostrarFanbase && p.fanbaseId)) asegurarFanbases();
    contenedor.innerHTML = lista.map(p => renderPostCard({
      ...p,
      // La fecha se muestra salvo que quien lo cargó haya elegido ocultarla (los viejos la muestran).
      fechaTexto: p.mostrarFecha === false ? "" : formatearFecha(p.fechaEvento) + (p.horaEvento ? ` \u00b7 ${p.horaEvento} hs` : ""),
      fanbaseNombre: p.mostrarFanbase && p.fanbaseId ? (nombresFanbase?.[p.fanbaseId] || "") : "",
      destacado: p.destacado === true
    })).join("");
    activarEmbedsDiferidos(contenedor);
  }

  // Primero lo que ya se vio la ultima vez (si hay); si no, esqueletos.
  const enCache = leerCache();
  if (enCache.length) { todasLasPosts = enCache; hayDatos = true; pintar(); }
  else contenedor.innerHTML = esqueletos();

  escucharPosts(
    (posts) => {
      todasLasPosts = posts;
      hayDatos = true;
      guardarCache(posts);
      pintar();
    },
    (err) => {
      console.warn("No se pudieron cargar las publicaciones de Firestore:", err);
      if (hayDatos) return; // ya hay algo en pantalla (cache): se deja
      contenedor.innerHTML = "";
      if (vacio) {
        vacio.style.display = "block";
        vacio.textContent = "Todavia no hay publicaciones cargadas por el equipo.";
      }
    }
  );

  if (filtros) {
    filtros.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filtro]");
      if (!btn) return;
      filtros.querySelectorAll("[data-filtro]").forEach(b => b.classList.remove("filter-active"));
      btn.classList.add("filter-active");
      filtroActivo = btn.getAttribute("data-filtro");
      pintar();
    });
  }
}

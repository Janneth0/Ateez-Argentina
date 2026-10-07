// ============================================================
// VIDEOS-APP.JS - ATEEZ ARGENTINA
// Pagina "Ver todos" (videos.html?serie=mvs|wanteez|logbook).
// - "mvs" sigue trayendose por busqueda de texto (hasta 50, el
//   maximo por request de la YouTube Data API).
// - "wanteez"/"logbook" se traen de su lista de reproduccion
//   completa (todas las paginas), asi son exactamente los
//   episodios reales y no aparecen Shorts sueltos.
// ============================================================

import { apiKeyConfigurada, buscarUltimosVideos, buscarVideosDePlaylist } from "./youtube-buscar.js";
import { SERIES_YOUTUBE } from "./youtube-series-config.js";
import { renderVideoCompacto } from "./components.js";

const params = new URLSearchParams(window.location.search);
const serieId = params.get("serie");
const serie = SERIES_YOUTUBE[serieId];

const tituloEl = document.getElementById("titulo-serie");
const descripcionEl = document.getElementById("descripcion-serie");
const grillaEl = document.getElementById("grilla-todos");

function renderEmbedGrande(v) {
  return `
    <div class="col-lg-6 col-12 mb-4">
        <h3 class="mv-titulo">${v.titulo}</h3>
        <div class="embed-responsive">
            <iframe src="https://www.youtube.com/embed/${v.id}" title="${v.titulo}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>
        </div>
    </div>`;
}

async function cargar() {
  if (!serie) {
    tituloEl.textContent = "Serie no encontrada";
    grillaEl.innerHTML = `<p class="text-center text-muted">No reconocemos esa sección. <a href="contenido.html">Volvé a Contenido</a>.</p>`;
    return;
  }

  document.title = `${serie.nombre} - Todos los videos - ATEEZ Argentina`;
  document.getElementById("meta-titulo").textContent = document.title;
  tituloEl.textContent = serie.nombre;

  if (!apiKeyConfigurada()) {
    descripcionEl.textContent = "Mostrando los últimos videos conocidos (no hay una API key de YouTube configurada para traer el listado completo).";
    pintar(serie.respaldo);
    return;
  }

  try {
    // "mvs" no tiene playlist propia todavía, así que sigue por búsqueda de
    // texto; wanteez/logbook usan su playlist real (todos los episodios).
    const videos = serie.playlistId
      ? await buscarVideosDePlaylist(serie.playlistId)
      : await buscarUltimosVideos(serie.query, 50);

    descripcionEl.textContent = `${videos.length} video${videos.length === 1 ? "" : "s"} encontrados.`;
    pintar(videos.length > 0 ? videos : serie.respaldo);
  } catch (err) {
    console.warn("No se pudo traer el listado completo desde YouTube, se muestran los de respaldo:", err);
    descripcionEl.textContent = "No se pudo conectar con YouTube en este momento — mostrando los últimos videos conocidos.";
    pintar(serie.respaldo);
  }
}

function pintar(videos) {
  if (videos.length === 0) {
    grillaEl.innerHTML = `<p class="text-center text-muted">No encontramos videos para esta sección.</p>`;
    return;
  }
  if (serie.tipo === "embed") {
    grillaEl.innerHTML = videos.map(renderEmbedGrande).join("");
  } else {
    grillaEl.className = "video-compacto-grid";
    grillaEl.innerHTML = videos.map(renderVideoCompacto).join("");
  }
}

cargar().catch((err) => {
  console.error("Error inesperado en videos.html:", err);
  grillaEl.innerHTML = `<p class="text-center text-muted">No se pudieron cargar los videos (${err.message || err}).</p>`;
});
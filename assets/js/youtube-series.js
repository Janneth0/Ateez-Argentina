// ============================================================
// YOUTUBE-SERIES.JS - ATEEZ ARGENTINA
// Trae los ultimos 4 videos de WANTEEZ y de LOG_LOGBOOK desde sus
// listas de reproduccion oficiales (no por busqueda de texto, para
// no traer Shorts que solo tengan el hashtag en el titulo) y los
// renderiza como tarjetas compactas en contenido.html. La
// definicion de cada serie vive en youtube-series-config.js,
// compartida con la vista "ver todos" (videos.html).
// ============================================================

import { apiKeyConfigurada, buscarVideosDePlaylist } from "./youtube-buscar.js";
import { renderVideoCompacto } from "./components.js";
import { SERIES_YOUTUBE } from "./youtube-series-config.js";

async function cargarSerie(containerId, serieId) {
  const cont = document.getElementById(containerId);
  if (!cont) return;
  const { playlistId, respaldo } = SERIES_YOUTUBE[serieId];

  if (!apiKeyConfigurada()) {
    cont.innerHTML = respaldo.map(renderVideoCompacto).join("");
    return;
  }
  try {
    const videos = await buscarVideosDePlaylist(playlistId);
    cont.innerHTML = (videos.length > 0 ? videos.slice(0, 4) : respaldo).map(renderVideoCompacto).join("");
  } catch (err) {
    console.warn(`No se pudieron traer los últimos videos de la playlist "${playlistId}", se muestra la lista de respaldo:`, err);
    cont.innerHTML = respaldo.map(renderVideoCompacto).join("");
  }
}

function cargarSerieSegura(containerId, serieId) {
  cargarSerie(containerId, serieId).catch((err) => {
    console.error(`Error inesperado cargando la serie "${serieId}":`, err);
    const cont = document.getElementById(containerId);
    if (cont) cont.innerHTML = `<p class="text-center text-muted">No se pudieron cargar los videos (${err.message || err}).</p>`;
  });
}

cargarSerieSegura("grilla-wanteez", "wanteez");
cargarSerieSegura("grilla-logbook", "logbook");
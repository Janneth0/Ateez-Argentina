// ============================================================
// YOUTUBE-MVS.JS - ATEEZ ARGENTINA
// Muestra los ultimos 4 "Official MV" del canal de ATEEZ como
// embeds grandes en contenido.html. La definicion de la serie
// (query de busqueda + respaldo) vive en youtube-series-config.js,
// compartida con la vista "ver todos" (videos.html).
// ============================================================

import { apiKeyConfigurada, buscarUltimosVideos } from "./youtube-buscar.js";
import { SERIES_YOUTUBE } from "./youtube-series-config.js";

const { query, respaldo } = SERIES_YOUTUBE.mvs;

function renderGrilla(videos) {
  const cont = document.getElementById("grilla-mvs");
  if (!cont) return;
  cont.innerHTML = videos.map(v => `
    <div class="col-lg-6 col-12 mb-4">
        <h3 class="mv-titulo">${v.titulo}</h3>
        <div class="embed-responsive">
            <iframe src="https://www.youtube.com/embed/${v.id}" title="${v.titulo}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>
        </div>
    </div>`).join("");
}

async function cargarUltimosMVs() {
  if (!apiKeyConfigurada()) {
    renderGrilla(respaldo);
    return;
  }
  try {
    const videos = await buscarUltimosVideos(query, 4);
    renderGrilla(videos.length > 0 ? videos : respaldo);
  } catch (err) {
    console.warn("No se pudieron traer los últimos MVs desde YouTube, se muestra la lista de respaldo:", err);
    renderGrilla(respaldo);
  }
}

// Si algo revienta ANTES de llegar al try/catch de arriba (por ejemplo un
// error al importar este mismo archivo), esto asegura que en vez de quedar
// la sección en "Cargando los últimos videos..." para siempre, se vea el
// motivo real en la consola y un aviso visible en la página.
cargarUltimosMVs().catch((err) => {
  console.error("Error inesperado cargando los MVs:", err);
  const cont = document.getElementById("grilla-mvs");
  if (cont) cont.innerHTML = `<p class="text-center text-muted">No se pudieron cargar los videos (${err.message || err}).</p>`;
});

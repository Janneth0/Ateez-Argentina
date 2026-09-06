// ============================================================
// YOUTUBE-MVS.JS - ATEEZ ARGENTINA
// Busca en el canal oficial de ATEEZ los últimos videos cuyo
// título contenga "Official MV" y renderiza los 4 más recientes
// como embeds grandes. Si no hay API key configurada, o la
// búsqueda falla, muestra una lista fija de respaldo.
// ============================================================

import { apiKeyConfigurada, buscarUltimosVideos } from "./youtube-buscar.js";

const RESPALDO_MANUAL = [
  { id: "-q_S27LbNKU", titulo: "ATEEZ - 'BAD' Official MV" },
  { id: "vqkfEUqjl6Y", titulo: "ATEEZ - 'Adrenaline' Official MV" },
  { id: "JOF2ZTqvzwY", titulo: "ATEEZ - 'In Your Fantasy' Official MV" },
  { id: "H4H99b1CjPU", titulo: "ATEEZ - 'Lemon Drop' Official MV" }
];

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
    renderGrilla(RESPALDO_MANUAL);
    return;
  }
  try {
    const videos = await buscarUltimosVideos("Official MV", 4);
    renderGrilla(videos.length > 0 ? videos : RESPALDO_MANUAL);
  } catch (err) {
    console.warn("No se pudieron traer los últimos MVs desde YouTube, se muestra la lista de respaldo:", err);
    renderGrilla(RESPALDO_MANUAL);
  }
}

cargarUltimosMVs();

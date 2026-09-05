// ============================================================
// YOUTUBE-MVS.JS - ATEEZ ARGENTINA
// Busca en el canal oficial de ATEEZ los últimos videos cuyo
// título contenga "Official MV" (la forma en que KQ Entertainment
// titula los videoclips) y renderiza los 4 más recientes. Se
// recalcula solo con la YouTube Data API v3 (gratis hasta 10.000
// unidades/día; esta búsqueda gasta 100 unidades por carga de
// página, así que alcanza sobra para un sitio de fans).
//
// Si todavía no cargaste una API key en youtube-config.js, se
// muestra automáticamente una lista fija de respaldo para que la
// sección nunca quede vacía.
// ============================================================

import { YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY } from "./youtube-config.js";

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
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "TU_YOUTUBE_API_KEY") {
    renderGrilla(RESPALDO_MANUAL);
    return;
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&q=${encodeURIComponent('Official MV')}&type=video&order=date&maxResults=4&part=snippet`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("YouTube API respondió " + res.status);
    const data = await res.json();
    const videos = (data.items || []).map(item => ({
      id: item.id.videoId,
      titulo: item.snippet.title
    }));
    renderGrilla(videos.length > 0 ? videos : RESPALDO_MANUAL);
  } catch (err) {
    console.warn("No se pudieron traer los últimos MVs desde YouTube, se muestra la lista de respaldo:", err);
    renderGrilla(RESPALDO_MANUAL);
  }
}

cargarUltimosMVs();

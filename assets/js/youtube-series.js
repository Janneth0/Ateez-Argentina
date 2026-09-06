// ============================================================
// YOUTUBE-SERIES.JS - ATEEZ ARGENTINA
// Trae los últimos 4 videos de WANTEEZ y de LOG_LOGBOOK (ambas
// series propias de ATEEZ, publicadas en su canal oficial de
// YouTube) y los renderiza como tarjetas compactas — pensadas
// para verse bien en mobile, a diferencia del embed grande que
// se usa en "Últimos Comebacks".
// ============================================================

import { apiKeyConfigurada, buscarUltimosVideos } from "./youtube-buscar.js";
import { renderVideoCompacto } from "./components.js";

const RESPALDO_WANTEEZ = [
  { id: "e25DlSEATPY", titulo: "WANTEEZ EP.51", descripcion: "Episodio 51 de WANTEEZ, la serie de variedades de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/e25DlSEATPY/mqdefault.jpg" },
  { id: "MQoo7U5YAvU", titulo: "WANTEEZ EP.50", descripcion: "Episodio 50 de WANTEEZ, la serie de variedades de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/MQoo7U5YAvU/mqdefault.jpg" },
  { id: "1iW2elRk4e4", titulo: "WANTEEZ EP.49", descripcion: "Episodio 49 de WANTEEZ, la serie de variedades de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/1iW2elRk4e4/mqdefault.jpg" },
  { id: "BnnonDTgvxs", titulo: "WANTEEZ EP.48", descripcion: "Episodio 48 de WANTEEZ, la serie de variedades de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/BnnonDTgvxs/mqdefault.jpg" }
];

const RESPALDO_LOGBOOK = [
  { id: "49Qw9AieEp8", titulo: "log_logbook#229", descripcion: "Episodio 229 de LOG_LOGBOOK, el detrás de escena de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/49Qw9AieEp8/mqdefault.jpg" },
  { id: "00_IIrQ8KTI", titulo: "log_logbook#226", descripcion: "Episodio 226 de LOG_LOGBOOK, el detrás de escena de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/00_IIrQ8KTI/mqdefault.jpg" },
  { id: "PQKXqmSUOO4", titulo: "log_logbook#223", descripcion: "Episodio 223 de LOG_LOGBOOK, el detrás de escena de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/PQKXqmSUOO4/mqdefault.jpg" },
  { id: "fFN69TTaKoo", titulo: "log_logbook#220", descripcion: "Episodio 220 de LOG_LOGBOOK, el detrás de escena de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/fFN69TTaKoo/mqdefault.jpg" }
];

async function cargarSerie(containerId, query, respaldo) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  if (!apiKeyConfigurada()) {
    cont.innerHTML = respaldo.map(renderVideoCompacto).join("");
    return;
  }
  try {
    const videos = await buscarUltimosVideos(query, 4);
    cont.innerHTML = (videos.length > 0 ? videos : respaldo).map(renderVideoCompacto).join("");
  } catch (err) {
    console.warn(`No se pudieron traer los últimos videos de "${query}", se muestra la lista de respaldo:`, err);
    cont.innerHTML = respaldo.map(renderVideoCompacto).join("");
  }
}

cargarSerie("grilla-wanteez", "WANTEEZ", RESPALDO_WANTEEZ);
cargarSerie("grilla-logbook", "log_logbook", RESPALDO_LOGBOOK);

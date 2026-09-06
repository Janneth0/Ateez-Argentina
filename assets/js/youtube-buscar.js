// ============================================================
// YOUTUBE-BUSCAR.JS - ATEEZ ARGENTINA
// Función genérica para buscar videos en el canal oficial de
// ATEEZ por texto, usada por youtube-mvs.js (Comebacks) y
// youtube-series.js (WANTEEZ / LOG_LOGBOOK).
// ============================================================

import { YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY } from "./youtube-config.js";

export function apiKeyConfigurada() {
  return Boolean(YOUTUBE_API_KEY) && YOUTUBE_API_KEY !== "TU_YOUTUBE_API_KEY";
}

/**
 * Busca los últimos `maxResults` videos del canal de ATEEZ cuyo título
 * coincida con `query`. Devuelve [{id, titulo, descripcion, thumbnail}].
 * Tira una excepción si la API falla (el llamador decide el respaldo).
 */
export async function buscarUltimosVideos(query, maxResults = 4) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&q=${encodeURIComponent(query)}&type=video&order=date&maxResults=${maxResults}&part=snippet`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("YouTube API respondió " + res.status);
  const data = await res.json();
  return (data.items || []).map(item => ({
    id: item.id.videoId,
    titulo: item.snippet.title,
    descripcion: item.snippet.description || "",
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || ""
  }));
}

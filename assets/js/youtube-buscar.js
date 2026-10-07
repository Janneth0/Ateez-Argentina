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

/**
 * Trae TODOS los videos de una playlist de YouTube (pagina automaticamente
 * hasta traerlos todos), ordenados del mas nuevo al mas viejo por su fecha
 * real de publicacion. Se usa para WANTEEZ y LOG_LOGBOOK en vez de buscar
 * por texto, para no traer Shorts que solo tengan el hashtag en el titulo.
 */
export async function buscarVideosDePlaylist(playlistId) {
  let items = [];
  let pageToken = "";

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${YOUTUBE_API_KEY}&playlistId=${playlistId}&part=snippet,contentDetails&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("YouTube API respondió " + res.status);
    const data = await res.json();

    items = items.concat((data.items || []).map(item => ({
      id: item.snippet.resourceId.videoId,
      titulo: item.snippet.title,
      descripcion: item.snippet.description || "",
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
      // contentDetails.videoPublishedAt es la fecha real de publicacion del
      // video; snippet.publishedAt sería la fecha en que se agregó A LA
      // LISTA, que no es lo mismo.
      fecha: item.contentDetails?.videoPublishedAt || item.snippet.publishedAt
    })));

    pageToken = data.nextPageToken || "";
  } while (pageToken);

  // Filtra videos privados/eliminados (YouTube los deja en la playlist con
  // título "Private video" o "Deleted video" y sin fecha real)
  items = items.filter(v => v.id && v.titulo !== "Private video" && v.titulo !== "Deleted video");

  items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  return items;
}
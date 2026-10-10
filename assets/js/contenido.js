// ============================================================
// CONTENIDO.JS - ATEEZ ARGENTINA
// Coleccion "contenido": series subtituladas, traducciones,
// dance covers y demas contenido de la comunidad cargado a mano
// desde el panel (a diferencia de los MVs/WANTEEZ/LOG_LOGBOOK,
// que se traen solos desde YouTube).
//
// Admin y colaborador pueden crear; colaborador solo edita/borra
// lo propio, admin todo (mismo patron que noticias.js y posts.js).
//
// Estructura de cada documento:
// {
//   titulo: string,
//   descripcion: string,
//   link: string,        // donde verlo (puede ser un Drive, un sitio, un video)
//   adjunto: string,      // opcional: imagen, link de Drive, o post de red social
//   categoria: "serie" | "traduccion" | "dancecover" | "otro",
//   destacado: boolean,   // solo admin: si es un video de YouTube, se muestra
//                         // arriba de todo en contenido.html (máximo 2)
//   creadoPor: uid,
//   creadoEn: timestamp,
//   actualizadoEn: timestamp
// }
// ============================================================

import { db } from "./firebase-init.js";
import { extraerIdYoutube } from "./util.js";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const COL = "contenido";

export const CATEGORIAS_CONTENIDO = [
  { valor: "serie", etiqueta: "Serie subtitulada" },
  { valor: "traduccion", etiqueta: "Traducción" },
  { valor: "dancecover", etiqueta: "Dance Cover" },
  { valor: "otro", etiqueta: "Otro" }
];

function aMilisegundos(valor) {
  if (!valor) return 0;
  if (typeof valor.toMillis === "function") return valor.toMillis();
  const d = new Date(valor);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

// Igual que en posts.js/noticias.js: se ordena del lado del cliente (no con
// orderBy de Firestore) para que un documento viejo al que le falte algun
// campo nuevo no desaparezca de los resultados.
function ordenarContenido(items) {
  return [...items].sort((a, b) => aMilisegundos(b.creadoEn) - aMilisegundos(a.creadoEn));
}

export async function listarContenido() {
  const snap = await getDocs(query(collection(db, COL)));
  return ordenarContenido(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export function escucharContenido(callback, onError) {
  return onSnapshot(
    query(collection(db, COL)),
    (snap) => callback(ordenarContenido(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
    (err) => onError && onError(err)
  );
}

export async function crearContenido({ titulo, descripcion, link, adjunto, categoria, destacado, uid }) {
  return addDoc(collection(db, COL), {
    titulo,
    descripcion,
    link: link || "",
    adjunto: adjunto || "",
    categoria: categoria || "otro",
    destacado: !!destacado,
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  });
}

export async function editarContenido(id, { titulo, descripcion, link, adjunto, categoria, destacado }) {
  const cambios = {
    titulo,
    descripcion,
    link: link || "",
    adjunto: adjunto || "",
    categoria: categoria || "otro",
    actualizadoEn: serverTimestamp()
  };
  // "destacado" solo se incluye si viene explícito (el admin). Un colaborador
  // no lo manda, así su edición no toca ese campo — y las reglas de Firestore
  // además le impedirían cambiarlo aunque lo intentara.
  if (typeof destacado === "boolean") cambios.destacado = destacado;
  return updateDoc(doc(db, COL, id), cambios);
}

/**
 * Devuelve los videos que se muestran como "destacados" arriba de todo en
 * contenido.html: los marcados con destacado=true que además tengan un link
 * de YouTube válido, máximo 2 (los más nuevos). Lo usan tanto la sección de
 * destacados como la grilla general (que los excluye para no repetirlos),
 * así las dos siempre coinciden en cuáles son.
 */
export function seleccionarDestacados(items = []) {
  return items
    .filter(c => c.destacado === true)
    .map(c => ({ ...c, videoId: extraerIdYoutube(c.link) }))
    .filter(c => c.videoId)
    .slice(0, 2);
}

export async function eliminarContenido(id) {
  return deleteDoc(doc(db, COL, id));
}

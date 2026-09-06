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
//   creadoPor: uid,
//   creadoEn: timestamp,
//   actualizadoEn: timestamp
// }
// ============================================================

import { db } from "./firebase-init.js";
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

export async function crearContenido({ titulo, descripcion, link, adjunto, categoria, uid }) {
  return addDoc(collection(db, COL), {
    titulo,
    descripcion,
    link: link || "",
    adjunto: adjunto || "",
    categoria: categoria || "otro",
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  });
}

export async function editarContenido(id, { titulo, descripcion, link, adjunto, categoria }) {
  return updateDoc(doc(db, COL, id), {
    titulo,
    descripcion,
    link: link || "",
    adjunto: adjunto || "",
    categoria: categoria || "otro",
    actualizadoEn: serverTimestamp()
  });
}

export async function eliminarContenido(id) {
  return deleteDoc(doc(db, COL, id));
}

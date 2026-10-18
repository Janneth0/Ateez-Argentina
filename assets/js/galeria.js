// ============================================================
// GALERIA.JS - ATEEZ ARGENTINA
// Colección "galeria". Admin y colaborador pueden subir fotos (cada foto guarda
// quién la subió y de qué fanbase, igual que eventos, noticias y contenido);
// en la home solo se muestran las últimas N (ver GALERIA_LIMITE
// en index.html) para no saturar de imágenes — el resto se ve
// completo en el lightbox al hacer click en "Ver toda la galería".
// ============================================================

import { db } from "./firebase-init.js";
import {
  collection, addDoc, deleteDoc, doc, getDocs, onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const COL = "galeria";

export async function listarGaleria() {
  const snap = await getDocs(query(collection(db, COL), orderBy("creadoEn", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function escucharGaleria(callback, onError) {
  return onSnapshot(query(collection(db, COL), orderBy("creadoEn", "desc")),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => onError && onError(err));
}

/** datos: { imagenUrl, descripcion, uid, fanbaseId, autorNombre } */
export async function agregarFotoGaleria({ imagenUrl, descripcion = "", uid, fanbaseId = null, autorNombre = "" }) {
  return addDoc(collection(db, COL), {
    imagenUrl,
    descripcion,
    creadoPor: uid,
    creadoPorNombre: autorNombre || "",
    fanbaseId: fanbaseId || null,
    creadoEn: serverTimestamp()
  });
}

export async function eliminarFotoGaleria(id) {
  return deleteDoc(doc(db, COL, id));
}

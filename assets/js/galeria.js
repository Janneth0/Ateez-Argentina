// ============================================================
// GALERIA.JS - ATEEZ ARGENTINA
// Colección "galeria". Admin y colaborador pueden subir fotos;
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

/** datos: { imagenUrl, descripcion, uid } */
export async function agregarFotoGaleria(datos) {
  return addDoc(collection(db, COL), { ...datos, creadoPor: datos.uid, creadoEn: serverTimestamp() });
}

export async function eliminarFotoGaleria(id) {
  return deleteDoc(doc(db, COL, id));
}

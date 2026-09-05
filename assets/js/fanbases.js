// ============================================================
// FANBASES.JS - ATEEZ ARGENTINA
// Colección "fanbases": las sedes/fanbases que se muestran en el
// mapa de index.html. Solo un admin puede crear/editar/eliminar
// (ver firestore.rules); lectura pública.
// ============================================================

import { db } from "./firebase-init.js";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const COL = "fanbases";

export const REDES_DISPONIBLES = ["instagram", "twitter", "tiktok", "facebook", "youtube", "discord", "otro"];

export async function listarFanbases() {
  const snap = await getDocs(query(collection(db, COL), orderBy("nombre")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function escucharFanbases(callback, onError) {
  return onSnapshot(query(collection(db, COL), orderBy("nombre")),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => onError && onError(err));
}

/** datos: { nombre, descripcion, logoUrl, ciudad, redes: [{red,url}], uid } */
export async function crearFanbase(datos) {
  return addDoc(collection(db, COL), { ...datos, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() });
}

export async function editarFanbase(id, datos) {
  return updateDoc(doc(db, COL, id), { ...datos, actualizadoEn: serverTimestamp() });
}

export async function eliminarFanbase(id) {
  return deleteDoc(doc(db, COL, id));
}

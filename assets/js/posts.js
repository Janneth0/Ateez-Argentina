// ============================================================
// POSTS.JS - ATEEZ ARGENTINA
// CRUD de publicaciones (coleccion "posts") reutilizado por:
//  - el panel de administrador (crear / editar / eliminar)
//  - las paginas publicas (listar / mostrar)
//
// Estructura de cada documento en "posts":
// {
//   titulo: string,
//   descripcion: string,
//   link: string,           // instagram u otra red social
//   categoria: "cumpleanos" | "comeback" | "especial" | "otro",
//   fechaEvento: timestamp, // puede faltar en documentos viejos, ver nota abajo
//   creadoPor: uid,
//   creadoEn: timestamp,
//   actualizadoEn: timestamp
// }
//
// IMPORTANTE: el orden se calcula del lado del cliente (no con
// orderBy de Firestore) a proposito. orderBy() en Firestore
// EXCLUYE cualquier documento que no tenga ese campo, asi que un
// evento viejo sin "fechaEvento" simplemente desaparecia de la
// lista aunque siguiera existiendo en la base. Ordenando nosotros
// mismos, ademas usamos "creadoEn" como respaldo si a algun
// documento le llegara a faltar "fechaEvento".
// ============================================================

import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const POSTS_COL = "posts";

export const CATEGORIAS = [
  { valor: "cumpleanos", etiqueta: "Cumpleaños", filtro: "filter-hbd" },
  { valor: "comeback", etiqueta: "Comeback", filtro: "filter-cb" },
  { valor: "especial", etiqueta: "Especial", filtro: "filter-esp" },
  { valor: "otro", etiqueta: "Otro", filtro: "filter-other" }
];

function aMilisegundos(valor) {
  if (!valor) return 0;
  if (typeof valor.toMillis === "function") return valor.toMillis(); // Timestamp de Firestore
  const d = new Date(valor);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Ordena por fechaEvento; si a algún doc le falta, usa creadoEn como respaldo. */
function ordenarPosts(posts) {
  return [...posts].sort((a, b) => {
    const fechaA = aMilisegundos(a.fechaEvento) || aMilisegundos(a.creadoEn);
    const fechaB = aMilisegundos(b.fechaEvento) || aMilisegundos(b.creadoEn);
    return fechaB - fechaA;
  });
}

export async function listarPosts() {
  const snap = await getDocs(query(collection(db, POSTS_COL)));
  return ordenarPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export async function crearPost({ titulo, descripcion, link, categoria, uid, fechaEvento }) {
  return addDoc(collection(db, POSTS_COL), {
    titulo,
    descripcion,
    link,
    categoria: categoria || "otro",
    fechaEvento: Timestamp.fromDate(new Date(fechaEvento)),
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  });
}

export async function editarPost(id, { titulo, descripcion, link, categoria, fechaEvento }) {
  return updateDoc(doc(db, POSTS_COL, id), {
    titulo,
    descripcion,
    link,
    categoria: categoria || "otro",
    fechaEvento: Timestamp.fromDate(new Date(fechaEvento)),
    actualizadoEn: serverTimestamp()
  });
}

export async function eliminarPost(id) {
  return deleteDoc(doc(db, POSTS_COL, id));
}

/**
 * Escucha cambios en tiempo real de la coleccion de posts.
 * `callback` recibe el array actualizado (ya ordenado) cada vez
 * que hay un cambio. Devuelve la funcion para desuscribirse.
 */
export function escucharPosts(callback, onError) {
  return onSnapshot(
    query(collection(db, POSTS_COL)),
    (snap) => callback(ordenarPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
    (err) => { if (onError) onError(err); }
  );
}

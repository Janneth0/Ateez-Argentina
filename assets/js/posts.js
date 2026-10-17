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
//   horaEvento: string,       // opcional, "18:30" (hora de Argentina, texto: no tiene problemas de zona horaria)
//   mostrarFecha: boolean,    // false = la fecha NO se muestra en la tarjeta pública (por defecto se muestra)
//   mostrarFanbase: boolean,  // true = la tarjeta pública muestra a qué fanbase pertenece (por defecto no)
//   destacado: boolean,       // estrella: lo maneja un admin; los destacados salen primero
//   creadoPor: uid,
//   creadoPorNombre: string, // nombre de quien lo cargó (para que su equipo lo vea en el panel)
//   fanbaseId: string|null,  // fanbase de quien lo cargó (null = fan independiente)
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
import { fechaDesdeInput } from "./util.js";
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

/** Destacados primero; después por fechaEvento (si a algún doc le falta, usa creadoEn como respaldo). */
function ordenarPosts(posts) {
  return [...posts].sort((a, b) => {
    const da = a.destacado === true, db_ = b.destacado === true;
    if (da !== db_) return da ? -1 : 1;
    const fechaA = aMilisegundos(a.fechaEvento) || aMilisegundos(a.creadoEn);
    const fechaB = aMilisegundos(b.fechaEvento) || aMilisegundos(b.creadoEn);
    return fechaB - fechaA;
  });
}

export async function listarPosts() {
  const snap = await getDocs(query(collection(db, POSTS_COL)));
  return ordenarPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export async function crearPost({ titulo, descripcion, link, categoria, uid, fechaEvento, horaEvento = "", fanbaseId, autorNombre, mostrarFecha = true, mostrarFanbase = false }) {
  return addDoc(collection(db, POSTS_COL), {
    titulo,
    descripcion,
    link,
    categoria: categoria || "otro",
    fechaEvento: Timestamp.fromDate(fechaDesdeInput(fechaEvento)),
    horaEvento: horaEvento || "",
    mostrarFecha: mostrarFecha !== false,
    mostrarFanbase: mostrarFanbase === true,
    destacado: false,
    creadoPor: uid,
    creadoPorNombre: autorNombre || "",
    fanbaseId: fanbaseId || null,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  });
}

export async function editarPost(id, { titulo, descripcion, link, categoria, fechaEvento, horaEvento = "", mostrarFecha = true, mostrarFanbase = false, fanbaseId }) {
  const cambios = {
    titulo,
    descripcion,
    link,
    categoria: categoria || "otro",
    fechaEvento: Timestamp.fromDate(fechaDesdeInput(fechaEvento)),
    horaEvento: horaEvento || "",
    mostrarFecha: mostrarFecha !== false,
    mostrarFanbase: mostrarFanbase === true,
    actualizadoEn: serverTimestamp()
  };
  // La fanbase solo se toca si viene explícita (la manda el admin; null = fan independiente).
  // Un colaborador no la manda, y las reglas de Firestore tampoco le dejarían cambiarla.
  if (fanbaseId !== undefined) cambios.fanbaseId = fanbaseId || null;
  return updateDoc(doc(db, POSTS_COL, id), cambios);
}

/** Estrella de un evento (solo admin: las reglas de Firestore lo exigen). */
export async function marcarPostDestacado(id, destacado) {
  return updateDoc(doc(db, POSTS_COL, id), { destacado });
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

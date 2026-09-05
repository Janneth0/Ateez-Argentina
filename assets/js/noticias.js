// ============================================================
// NOTICIAS.JS - ATEEZ ARGENTINA
// Colección "noticias". Admin y colaborador pueden crear;
// colaborador solo edita/borra las propias, admin todas.
// El campo "slug" es el identificador único usado en la URL
// (/Noticias/<slug>) y se genera a partir del título.
// ============================================================

import { db } from "./firebase-init.js";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs,
  onSnapshot, query, where, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { slugify } from "./util.js";

const COL = "noticias";

// Normaliza un doc de Firestore a un objeto de noticia "seguro" para pintar
// en pantalla. Lo importante: si a la noticia le falta el campo "slug" (por
// ejemplo porque se cargó a mano desde la consola de Firebase, en vez de
// usar el panel de admin, que es el único lugar que genera el slug), se usa
// el ID del documento como slug de respaldo. Sin esto, la tarjeta se veía
// en la grilla pero el link apuntaba a ".../Noticias/undefined" y al hacer
// click no llevaba a ningún lado (ni la encontraba el buscador por slug).
function normalizarNoticia(id, data) {
  const slug = typeof data.slug === "string" && data.slug.trim() ? data.slug.trim() : id;
  return { id, ...data, slug };
}

function aMilisegundos(valor) {
  if (!valor) return 0;
  if (typeof valor.toMillis === "function") return valor.toMillis();
  const d = new Date(valor);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

// Ordena destacadas primero y, dentro de cada grupo, por fecha de publicación
// descendente (con "creadoEn" como respaldo si a algún doc le falta la fecha).
// Se ordena del lado del cliente, no con orderBy() de Firestore, porque
// orderBy() excluye de los resultados cualquier documento al que le falte
// ese campo — y eso hacía "desaparecer" noticias/eventos viejos que se
// cargaron antes de agregar ese campo, aunque siguieran existiendo en la base.
function ordenarNoticias(noticias) {
  return [...noticias].sort((a, b) => {
    if (!!b.destacada !== !!a.destacada) return (b.destacada ? 1 : 0) - (a.destacada ? 1 : 0);
    const fechaA = aMilisegundos(a.fechaPublicacion) || aMilisegundos(a.creadoEn);
    const fechaB = aMilisegundos(b.fechaPublicacion) || aMilisegundos(b.creadoEn);
    return fechaB - fechaA;
  });
}

/** Genera un slug único agregando -2, -3... si ya existe otro con el mismo. */
export async function generarSlugUnico(titulo, idActual = null) {
  const base = slugify(titulo) || "noticia";
  let candidato = base;
  let intento = 1;
  // Como es un sitio chico, alcanza con revisar contra el listado completo ya cacheado por el caller.
  while (await existeSlug(candidato, idActual)) {
    intento += 1;
    candidato = `${base}-${intento}`;
  }
  return candidato;
}

async function existeSlug(slug, idActual) {
  const snap = await getDocs(query(collection(db, COL), where("slug", "==", slug)));
  return snap.docs.some(d => d.id !== idActual);
}

export async function obtenerNoticiaPorSlug(slug) {
  const snap = await getDocs(query(collection(db, COL), where("slug", "==", slug)));
  if (!snap.empty) {
    const d = snap.docs[0];
    return normalizarNoticia(d.id, d.data());
  }
  // Respaldo: si no hay ningún doc con ese "slug", puede ser que el link use
  // directamente el ID del documento (noticia vieja o cargada sin slug).
  const porId = await getDoc(doc(db, COL, slug));
  return porId.exists() ? normalizarNoticia(porId.id, porId.data()) : null;
}

export async function listarNoticias() {
  const snap = await getDocs(query(collection(db, COL)));
  return ordenarNoticias(snap.docs.map(d => normalizarNoticia(d.id, d.data())));
}

export function escucharNoticias(callback, onError) {
  return onSnapshot(
    query(collection(db, COL)),
    (snap) => callback(ordenarNoticias(snap.docs.map(d => normalizarNoticia(d.id, d.data())))),
    (err) => onError && onError(err)
  );
}

/**
 * datos: { titulo, resumen, contenidoHtml, imagenUrl, fechaPublicacion (string yyyy-mm-dd), uid }
 */
export async function crearNoticia(datos) {
  const slug = await generarSlugUnico(datos.titulo);
  return addDoc(collection(db, COL), {
    ...datos,
    slug,
    destacada: false,
    fechaPublicacion: Timestamp.fromDate(new Date(datos.fechaPublicacion)),
    creadoPor: datos.uid,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  });
}

export async function editarNoticia(id, datos, regenerarSlug = false) {
  const cambios = {
    ...datos,
    fechaPublicacion: Timestamp.fromDate(new Date(datos.fechaPublicacion)),
    actualizadoEn: serverTimestamp()
  };
  if (regenerarSlug) {
    cambios.slug = await generarSlugUnico(datos.titulo, id);
  }
  delete cambios.uid;
  return updateDoc(doc(db, COL, id), cambios);
}

export async function eliminarNoticia(id) {
  return deleteDoc(doc(db, COL, id));
}

/** Solo un admin puede marcar/desmarcar una noticia como destacada (ver firestore.rules). */
export async function marcarDestacada(id, destacada) {
  return updateDoc(doc(db, COL, id), { destacada });
}

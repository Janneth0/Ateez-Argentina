// ============================================================
// COMEBACKS.JS - ATEEZ ARGENTINA
// Colección "comebacks" en Firestore. Cada documento es UN comeback
// (fecha, video de YouTube, links de pre-save y metas de streaming).
// Solo uno tiene activo:true: ese es el que muestra /comeback/.
// Para un próximo comeback se duplica el actual desde el panel
// (pestaña "Comeback y metas") y se lo marca como activo.
//
// Lectura pública. Escritura: admin o colaborador con el permiso
// "puedeEditarMetas" (ver firestore.rules). Borrar: solo admin.
// ============================================================

import { db } from "./firebase-init.js";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, limit,
  writeBatch, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const COL = "comebacks";
const TZ = "America/Argentina/Buenos_Aires";

// Plataformas conocidas (icono de Bootstrap Icons + color de la tarjeta).
// "otro" permite escribir el nombre a mano.
export const PLATAFORMAS = {
  youtube: { icon: "bi-youtube", nombre: "YouTube", color: "#ff0000" },
  spotify: { icon: "bi-spotify", nombre: "Spotify", color: "#1db954" },
  itunes: { icon: "bi-apple", nombre: "iTunes", color: "#fa57c1" },
  applemusic: { icon: "bi-apple", nombre: "Apple Music", color: "#fa243c" },
  shazam: { icon: "bi-soundwave", nombre: "Shazam", color: "#0088ff" },
  amazon: { icon: "bi-amazon", nombre: "Amazon Music", color: "#25d1da" },
  deezer: { icon: "bi-music-note-beamed", nombre: "Deezer", color: "#a238ff" },
  tiktok: { icon: "bi-tiktok", nombre: "TikTok", color: "#25f4ee" },
  otro: { icon: "bi-music-note-beamed", nombre: "Otra plataforma", color: "var(--accent-color)" }
};

// Plataformas que suelen tener pre-save / pre-add.
export const PLATAFORMAS_PRESAVE = ["spotify", "applemusic", "amazon", "deezer", "otro"];

/** Solo deja pasar links http(s) (evita "javascript:" y similares). */
export function urlSegura(url) {
  const u = String(url || "").trim();
  return /^https?:\/\//i.test(u) ? u : "";
}

/** "2026-11-13T02:00:00-03:00" -> "13 de noviembre · 02:00 hs (hora Argentina)" */
export function fechaTextoArgentina(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const dia = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, day: "numeric", month: "long" }).format(d);
  const hora = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return `${dia} · ${hora} hs (hora Argentina)`;
}

/** ISO -> "YYYY-MM-DDTHH:mm" en hora Argentina (para <input type="datetime-local">). */
export function isoAInputArgentina(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
  }).format(d).replace(" ", "T");
}

/** "YYYY-MM-DDTHH:mm" (hora Argentina) -> ISO con offset -03:00 (Argentina no usa horario de verano). */
export function inputArgentinaAIso(valor) {
  return valor ? `${valor}:00-03:00` : "";
}

/** Firestore no acepta "undefined": lo cambia por null en todo el objeto. */
function limpiar(valor) {
  if (Array.isArray(valor)) return valor.map(limpiar);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, limpiar(v)]));
  }
  return valor === undefined ? null : valor;
}

export function idCorto(prefijo = "id") {
  return `${prefijo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export function comebackVacio() {
  return {
    nombre: "", subtitulo: "ATEEZ Comeback Countdown", titulo: "", fecha: "", fechaTexto: "",
    youtubeUrl: "", youtubeVideoId: "", presave: [], metas: [], activo: false
  };
}

// ---------- Lectura ----------

/** Normaliza un documento (de Firestore o de goals.json) a la forma que usa la página. */
export function normalizarComeback(raw) {
  const c = raw.comeback || {};
  const fecha = raw.fecha || c.fecha || "";
  const act = raw.actualizadoEn?.toDate ? raw.actualizadoEn.toDate() : (raw.actualizado ? new Date(raw.actualizado + "T12:00:00") : null);
  return {
    id: raw.id || null,
    actualizadoDate: act,
    comeback: {
      subtitulo: raw.subtitulo || c.subtitulo || "",
      titulo: raw.titulo || c.titulo || "",
      fecha,
      fechaTexto: raw.fechaTexto || c.fechaTexto || fechaTextoArgentina(fecha)
    },
    youtubeVideoId: raw.youtubeVideoId || null,
    youtubeUrl: raw.youtubeUrl || "",
    presave: Array.isArray(raw.presave) ? raw.presave : [],
    metas: Array.isArray(raw.metas) ? raw.metas : []
  };
}

/**
 * Para la página pública. Devuelve:
 *  - { estado: "ok", data }      hay un comeback activo
 *  - { estado: "sin-activo" }    hay comebacks cargados pero ninguno activo
 *  - { estado: "vacio" }         todavía no se cargó ninguno (se usa goals.json)
 */
export async function obtenerComebackActivo() {
  const snap = await getDocs(query(collection(db, COL), where("activo", "==", true), limit(1)));
  if (!snap.empty) {
    const d = snap.docs[0];
    return { estado: "ok", data: normalizarComeback({ id: d.id, ...d.data() }) };
  }
  const alguno = await getDocs(query(collection(db, COL), limit(1)));
  return { estado: alguno.empty ? "vacio" : "sin-activo" };
}

/** Para el panel: todos los comebacks, el activo primero y luego por fecha (más nuevo arriba). */
export function escucharComebacks(callback, onError) {
  return onSnapshot(collection(db, COL), (snap) => {
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    lista.sort((a, b) => (b.activo === true) - (a.activo === true) || String(b.fecha || "").localeCompare(String(a.fecha || "")));
    callback(lista);
  }, (err) => onError && onError(err));
}

// ---------- Escritura ----------

export async function crearComeback(datos, uid) {
  const ref = await addDoc(collection(db, COL), limpiar({
    ...datos, activo: false, creadoPor: uid || null, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(), actualizadoPor: uid || null
  }));
  return ref.id;
}

export async function editarComeback(id, datos, uid) {
  const { id: _omitido, creadoEn, creadoPor, ...resto } = datos;
  return updateDoc(doc(db, COL, id), limpiar({ ...resto, actualizadoEn: serverTimestamp(), actualizadoPor: uid || null }));
}

export async function eliminarComeback(id) {
  return deleteDoc(doc(db, COL, id));
}

/** Deja activo SOLO a este comeback (los demás pasan a archivados). */
export async function activarComeback(id) {
  const snap = await getDocs(collection(db, COL));
  const batch = writeBatch(db);
  snap.docs.forEach(d => {
    const debeEstarActivo = d.id === id;
    if ((d.data().activo === true) !== debeEstarActivo) batch.update(d.ref, { activo: debeEstarActivo });
  });
  return batch.commit();
}

/** Copia un comeback para armar el siguiente: mantiene las metas (objetivos) pero borra valores, fecha, video y pre-save. */
export function duplicarParaNuevoComeback(c) {
  return {
    ...comebackVacio(),
    nombre: `${c.nombre || c.titulo || "Comeback"} (copia)`,
    subtitulo: c.subtitulo || "ATEEZ Comeback Countdown",
    titulo: "",
    metas: (c.metas || []).map(m => ({
      ...m,
      id: idCorto("meta"),
      barras: (m.barras || []).map(b => ({ ...b, id: idCorto("barra"), actual: null, final24h: null }))
    }))
  };
}

/** Importa comeback/data/goals.json como primer comeback (queda activo). Pensado para usarse una sola vez. */
export async function importarDesdeGoalsJson(uid) {
  const r = await fetch("../comeback/data/goals.json", { cache: "no-store" });
  if (!r.ok) throw new Error("No se encontró comeback/data/goals.json");
  const j = await r.json();
  const n = normalizarComeback(j);
  const id = await crearComeback({
    nombre: n.comeback.titulo,
    subtitulo: n.comeback.subtitulo,
    titulo: n.comeback.titulo,
    fecha: n.comeback.fecha,
    fechaTexto: n.comeback.fechaTexto,
    youtubeVideoId: n.youtubeVideoId,
    youtubeUrl: n.youtubeVideoId ? `https://www.youtube.com/watch?v=${n.youtubeVideoId}` : "",
    presave: [],
    metas: n.metas
  }, uid);
  await activarComeback(id);
  return id;
}

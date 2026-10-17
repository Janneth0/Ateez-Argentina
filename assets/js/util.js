// ============================================================
// UTIL.JS - ATEEZ ARGENTINA
// Funciones chicas reutilizadas en varios módulos.
// ============================================================

/** Convierte un título en un slug apto para URL: "¡Gran Evento 2026!" -> "gran-evento-2026" */
export function slugify(texto = "") {
  return String(texto)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // saca tildes
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ------------------------------------------------------------
// FECHAS SIN HORA (fecha de un evento, fecha de una noticia)
//
// El <input type="date"> entrega "2026-11-01". Si se hace new Date("2026-11-01")
// JavaScript lo toma como medianoche UTC, que en Argentina (UTC-3) es el 31/10 a
// las 21:00: al mostrarlo en hora local aparecía un día antes. Para evitarlo,
// estas fechas se guardan a las 12:00 UTC y SIEMPRE se muestran en UTC, así
// todo el mundo ve el mismo día, sin importar su zona horaria. (Las fechas ya
// guardadas a medianoche UTC también se ven bien, sin migrar nada.)
// ------------------------------------------------------------

/** "2026-11-01" (del <input type="date">) -> Date a las 12:00 UTC de ese día. */
export function fechaDesdeInput(texto = "") {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(texto));
  if (!m) return new Date(NaN);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
}

/** Fecha guardada -> "2026-11-01" para cargarla de nuevo en un <input type="date">. */
export function fechaAInput(fecha) {
  const d = aFechaJS(fecha);
  return d ? d.toISOString().slice(0, 10) : hoyParaInput();
}

/** El día de HOY (en la zona horaria de quien usa el panel) como "yyyy-mm-dd". */
export function hoyParaInput() {
  const n = new Date();
  const dos = (x) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${dos(n.getMonth() + 1)}-${dos(n.getDate())}`;
}

/** Formatea una fecha (Date, Firestore Timestamp o string ISO) como "3 de septiembre de 2026". */
export function formatearFecha(fecha) {
  const d = aFechaJS(fecha);
  if (!d) return "";
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Formatea corto: "03/09/2026" */
export function formatearFechaCorta(fecha) {
  const d = aFechaJS(fecha);
  if (!d) return "";
  return d.toLocaleDateString("es-AR", { timeZone: "UTC" });
}

/** Convierte Timestamp de Firestore, string o Date a un objeto Date de JS. */
export function aFechaJS(fecha) {
  if (!fecha) return null;
  if (fecha instanceof Date) return fecha;
  if (typeof fecha.toDate === "function") return fecha.toDate(); // Firestore Timestamp
  const d = new Date(fecha);
  return isNaN(d.getTime()) ? null : d;
}

/** Días transcurridos desde una fecha hasta hoy. */
export function diasDesde(fecha) {
  const d = aFechaJS(fecha);
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** Un evento se considera inactivo (vencido) al año de su fecha. */
export function eventoVencido(fechaEvento) {
  const dias = diasDesde(fechaEvento);
  return dias !== null && dias > 365;
}

/** Un evento está "por vencer" si le quedan 30 días o menos para cumplir el año. */
export function eventoPorVencer(fechaEvento) {
  const dias = diasDesde(fechaEvento);
  return dias !== null && dias > 335 && dias <= 365;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Saca el ID de un video de YouTube de cualquier formato de link común:
 * watch?v=ID, youtu.be/ID, embed/ID, shorts/ID, live/ID. Devuelve null si
 * el link no es de YouTube (o no tiene un ID válido de 11 caracteres).
 */
export function extraerIdYoutube(url = "") {
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?(?:[^#\s]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export { escapeHtml };

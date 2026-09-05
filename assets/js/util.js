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

/** Formatea una fecha (Date, Firestore Timestamp o string ISO) como "3 de septiembre de 2026". */
export function formatearFecha(fecha) {
  const d = aFechaJS(fecha);
  if (!d) return "";
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

/** Formatea corto: "03/09/2026" */
export function formatearFechaCorta(fecha) {
  const d = aFechaJS(fecha);
  if (!d) return "";
  return d.toLocaleDateString("es-AR");
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

export { escapeHtml };

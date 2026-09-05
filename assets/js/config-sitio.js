// ============================================================
// CONFIG-SITIO.JS - ATEEZ ARGENTINA
// Un unico documento en Firestore (configuracion/sitio) guarda
// la paleta de colores y el logo activos. Lectura publica,
// escritura solo admin (ver firestore.rules).
//
// Se controlan 6 variables (no solo 3): fondo, superficie, acento,
// texto, encabezados y contraste. Antes solo se exponian fondo/
// superficie/acento, por eso al elegir un fondo claro el texto
// (fijo en un tono claro pensado para fondo oscuro) se volvia
// invisible. Cada paleta predefinida ya viene con los 6 valores
// probados para tener buen contraste.
// ============================================================

import { db } from "./firebase-init.js";
import { doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const REF = () => doc(db, "configuracion", "sitio");

export const PALETAS_PREDEFINIDAS = [
  {
    id: "pirata-dorado", nombre: "Pirata Dorado (oscuro)", modo: "oscuro",
    fondo: "#0c0e16", superficie: "#161a29", accento: "#d4af37",
    texto: "#e9e6df", heading: "#ffffff", contraste: "#0c0e16"
  },
  {
    id: "carmesi", nombre: "Carmesí ATEEZ (oscuro)", modo: "oscuro",
    fondo: "#0c0e16", superficie: "#1a1420", accento: "#e0344a",
    texto: "#e9e6df", heading: "#ffffff", contraste: "#0c0e16"
  },
  {
    id: "esmeralda", nombre: "Esmeralda Nocturna (oscuro)", modo: "oscuro",
    fondo: "#0a1512", superficie: "#122019", accento: "#2fbf8f",
    texto: "#e9e6df", heading: "#ffffff", contraste: "#0a1512"
  },
  {
    id: "claro-dorado", nombre: "Claro Dorado (claro)", modo: "claro",
    fondo: "#faf8f4", superficie: "#ffffff", accento: "#b5872a",
    texto: "#2b2620", heading: "#171310", contraste: "#ffffff"
  },
  {
    id: "claro-celeste", nombre: "Celeste y Blanco (claro, AR)", modo: "claro",
    fondo: "#f4f8fb", superficie: "#ffffff", accento: "#1f6fb2",
    texto: "#1c2733", heading: "#0d1620", contraste: "#ffffff"
  }
];

export const CONFIG_POR_DEFECTO = {
  logoUrl: "assets/img/logoATZ.jpeg",
  paletaId: "pirata-dorado",
  modo: "oscuro",
  fondo: "#0c0e16",
  superficie: "#161a29",
  accento: "#d4af37",
  texto: "#e9e6df",
  heading: "#ffffff",
  contraste: "#0c0e16"
};

export async function obtenerConfigSitio() {
  const snap = await getDoc(REF());
  return snap.exists() ? { ...CONFIG_POR_DEFECTO, ...snap.data() } : CONFIG_POR_DEFECTO;
}

export function escucharConfigSitio(callback) {
  return onSnapshot(REF(), (snap) => {
    callback(snap.exists() ? { ...CONFIG_POR_DEFECTO, ...snap.data() } : CONFIG_POR_DEFECTO);
  }, () => callback(CONFIG_POR_DEFECTO));
}

/** Solo deberia llamarse si el usuario es admin (las reglas de Firestore lo exigen igual). */
export async function actualizarConfigSitio(datos) {
  return setDoc(REF(), datos, { merge: true });
}

/**
 * Aplica los 6 colores del tema como variables CSS globales. Se llama en
 * cada pagina. Como main.css ahora hace que el navbar, los dropdowns y
 * los botones deriven de estas mismas variables, cambiar estos 6 valores
 * alcanza para que TODO el sitio (fondo, texto, navbar, tarjetas, botones)
 * cambie de forma coherente.
 */
export function aplicarTemaEnPagina(config) {
  const root = document.documentElement.style;
  if (config.fondo) root.setProperty("--background-color", config.fondo);
  if (config.superficie) root.setProperty("--surface-color", config.superficie);
  if (config.accento) root.setProperty("--accent-color", config.accento);
  if (config.texto) root.setProperty("--default-color", config.texto);
  if (config.heading) root.setProperty("--heading-color", config.heading);
  if (config.contraste) root.setProperty("--contrast-color", config.contraste);

  document.body?.classList.toggle("tema-claro", config.modo === "claro");

  document.querySelectorAll(".site-logo-img").forEach(img => {
    if (config.logoUrl) img.src = config.logoUrl;
  });
}

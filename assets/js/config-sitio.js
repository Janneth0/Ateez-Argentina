// ============================================================
// CONFIG-SITIO.JS - ATEEZ ARGENTINA
// Un unico documento en Firestore (configuracion/sitio) guarda
// TODO lo que el admin puede personalizar desde el panel:
//  - Paleta de colores del contenido principal (6 valores)
//  - Paleta de colores del header/footer (3 valores, comparten
//    siempre entre si, pero pueden ser distintos del resto del sitio)
//  - Logo
//  - Redes sociales (usadas tanto en el header como en el footer)
//  - Datos de contacto (email, direccion)
//  - Los 2 mapas embebidos del footer
// Lectura publica, escritura solo admin (ver firestore.rules).
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

export const REDES_SOCIALES_POR_DEFECTO = [
  { red: "facebook", url: "https://www.facebook.com/people/Startinyarg/61569342044743/" },
  { red: "twitter", url: "https://x.com/StartinyARG" },
  { red: "instagram", url: "https://www.instagram.com/startinyarg/" },
  { red: "tiktok", url: "https://tiktok.com/@startinyarg" },
  { red: "youtube", url: "https://www.youtube.com/@StartinyArg" }
];

export const CONFIG_POR_DEFECTO = {
  logoUrl: "assets/img/logoATZ.jpeg",
  paletaId: "pirata-dorado",
  modo: "oscuro",
  // Paleta del contenido principal
  fondo: "#0c0e16",
  superficie: "#161a29",
  accento: "#d4af37",
  texto: "#e9e6df",
  heading: "#ffffff",
  contraste: "#0c0e16",
  // Paleta de header/footer (comparten siempre estos 3 entre si)
  fondoHF: "#0c0e16",
  textoHF: "#e9e6df",
  accentoHF: "#d4af37",
  // Redes sociales (header + footer)
  redesSociales: REDES_SOCIALES_POR_DEFECTO,
  // Contacto (footer)
  contactoEmail: "startinyargentina@gmail.com",
  contactoDireccion: "Ciudad Autónoma de Buenos Aires, Argentina",
  // Mapas embebidos (footer)
  mapa1Titulo: "Mural ATEEZ",
  mapa1Url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3285.760355186323!2d-58.45040092488723!3d-34.55962255516975!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb5000cb5b0eb%3A0x672dd769a348bab9!2sMural%20ATEEZ!5e0!3m2!1ses-419!2sar!4v1755992014758!5m2!1ses-419!2sar",
  mapa2Titulo: "Mural Argentiny",
  mapa2Url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d205.3607881219956!2d-58.44808776228413!3d-34.55931231975737!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb5001057febb%3A0x9c0919b207b923a!2sMURAL%20ARGENTINY!5e0!3m2!1ses-419!2sar!4v1755992312929!5m2!1ses-419!2sar"
};

export async function obtenerConfigSitio() {
  try {
    const snap = await getDoc(REF());
    return snap.exists() ? { ...CONFIG_POR_DEFECTO, ...snap.data() } : CONFIG_POR_DEFECTO;
  } catch (err) {
    console.warn("No se pudo leer la configuración del sitio, se usan los valores por defecto:", err);
    return CONFIG_POR_DEFECTO;
  }
}

export function escucharConfigSitio(callback) {
  return onSnapshot(REF(), (snap) => {
    callback(snap.exists() ? { ...CONFIG_POR_DEFECTO, ...snap.data() } : CONFIG_POR_DEFECTO);
  }, () => callback(CONFIG_POR_DEFECTO));
}

/** Solo debería llamarse si el usuario es admin (las reglas de Firestore lo exigen igual). */
export async function actualizarConfigSitio(datos) {
  return setDoc(REF(), datos, { merge: true });
}

/**
 * Aplica los colores del tema (contenido + header/footer) como variables
 * CSS globales. Se llama en cada página a través de site-boot.js.
 */
export function aplicarTemaEnPagina(config) {
  const root = document.documentElement.style;
  if (config.fondo) root.setProperty("--background-color", config.fondo);
  if (config.superficie) root.setProperty("--surface-color", config.superficie);
  if (config.accento) root.setProperty("--accent-color", config.accento);
  if (config.texto) root.setProperty("--default-color", config.texto);
  if (config.heading) root.setProperty("--heading-color", config.heading);
  if (config.contraste) root.setProperty("--contrast-color", config.contraste);

  if (config.fondoHF) root.setProperty("--hf-background-color", config.fondoHF);
  if (config.textoHF) root.setProperty("--hf-text-color", config.textoHF);
  if (config.accentoHF) root.setProperty("--hf-accent-color", config.accentoHF);

  document.body?.classList.toggle("tema-claro", config.modo === "claro");

  document.querySelectorAll(".site-logo-img").forEach(img => {
    if (config.logoUrl) img.src = config.logoUrl;
  });
}

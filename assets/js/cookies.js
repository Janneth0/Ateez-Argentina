// ============================================================
// COOKIES.JS - ATEEZ ARGENTINA
// Banner simple de consentimiento de cookies (Google Analytics /
// Firebase no se activan hasta que el usuario acepta). Guarda la
// elección en localStorage (esto es un dato puramente del
// navegador del visitante, no de la cuenta de usuario, así que
// no entra en conflicto con la prohibición de localStorage para
// datos de la app: acá es exactamente lo que corresponde usar).
// ============================================================

const CLAVE = "atz_cookie_consent"; // "aceptado" | "rechazado"

function yaDecidio() {
  try { return localStorage.getItem(CLAVE); } catch { return null; }
}

function guardarDecision(valor) {
  try { localStorage.setItem(CLAVE, valor); } catch { /* Storage bloqueado por el navegador: seguimos igual */ }
}

function crearBanner() {
  const div = document.createElement("div");
  div.id = "cookie-banner";
  div.innerHTML = `
    <div class="cookie-banner-texto">
      <p>Usamos cookies propias y de terceros (Google, Instagram, YouTube, Spotify) para que el sitio funcione
      correctamente y para medir el uso. Podés leer más en nuestros
      <a href="${rutaBase()}terminos.html#cookies">Términos y Condiciones</a>.</p>
    </div>
    <div class="cookie-banner-botones">
      <button type="button" id="cookie-rechazar" class="btn btn-outline-secondary btn-sm">Rechazar</button>
      <button type="button" id="cookie-aceptar" class="btn btn-primary btn-sm">Aceptar</button>
    </div>`;
  document.body.appendChild(div);

  document.getElementById("cookie-aceptar").addEventListener("click", () => {
    guardarDecision("aceptado");
    div.remove();
  });
  document.getElementById("cookie-rechazar").addEventListener("click", () => {
    guardarDecision("rechazado");
    div.remove();
  });
}

function rutaBase() {
  // Deduce si estamos en la raíz o en una subcarpeta (Noticias/, evento/, admin/) mirando la URL.
  const partes = window.location.pathname.split("/").filter(Boolean);
  const carpetasConocidas = ["noticias", "evento", "admin"];
  const ultima = partes[partes.length - 1]?.toLowerCase();
  const penultima = partes[partes.length - 2]?.toLowerCase();
  if (carpetasConocidas.includes(ultima) || carpetasConocidas.includes(penultima)) return "../";
  return "";
}

if (!yaDecidio()) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", crearBanner);
  } else {
    crearBanner();
  }
}

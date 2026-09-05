// ============================================================
// INDEX-APP.JS
// Arranque de index.html: aplica el tema del sitio (colores/logo
// configurados por el admin), pinta las fanbases y la galeria
// (limitada, para no saturar la home).
// ============================================================

import { escucharConfigSitio, aplicarTemaEnPagina } from "./config-sitio.js";
import { escucharFanbases } from "./fanbases.js";
import { escucharGaleria } from "./galeria.js";
import { renderFanbaseCard, renderGaleriaItem } from "./components.js";

const GALERIA_LIMITE = 8; // cuantas fotos se muestran en la home antes de "ver todas" via lightbox

escucharConfigSitio((config) => aplicarTemaEnPagina(config));

const fanbasesGrid = document.getElementById("fanbases-grid");
if (fanbasesGrid) {
  escucharFanbases(
    (fanbases) => {
      if (fanbases.length === 0) {
        fanbasesGrid.innerHTML = `<p class="text-center text-muted">Todavía no hay fanbases cargadas. ¡Sumate escribiéndonos!</p>`;
        return;
      }
      fanbasesGrid.innerHTML = fanbases.map(renderFanbaseCard).join("");
    },
    () => { fanbasesGrid.innerHTML = `<p class="text-center text-muted">No se pudieron cargar las fanbases.</p>`; }
  );
}

const galeriaGrid = document.getElementById("galeria-grid");
const galeriaVacio = document.getElementById("galeria-vacio");
if (galeriaGrid) {
  escucharGaleria(
    (fotos) => {
      if (fotos.length === 0) {
        galeriaVacio.style.display = "block";
        return;
      }
      galeriaVacio.style.display = "none";
      // Se muestran las ultimas GALERIA_LIMITE fotos como grilla chica; el resto
      // queda igual "dentro" del mismo grupo de glightbox (data-gallery), asi que
      // al abrir el lightbox el usuario puede navegar por TODAS las fotos con las
      // flechas, sin que la home se vea sobrecargada de imagenes.
      const visibles = fotos.slice(0, GALERIA_LIMITE);
      const resto = fotos.slice(GALERIA_LIMITE);
      galeriaGrid.innerHTML = visibles.map(renderGaleriaItem).join("")
        + resto.map(f => renderGaleriaItem(f)).join("").replace(/<a /g, '<a style="display:none" ');
      if (resto.length > 0) {
        galeriaGrid.insertAdjacentHTML("beforeend", `
          <a class="galeria-item galeria-ver-todas" href="#" data-abrir-primera>
              <span>+${resto.length}<br><small>Ver todas</small></span>
          </a>`);
        galeriaGrid.querySelector("[data-abrir-primera]").addEventListener("click", (e) => {
          e.preventDefault();
          galeriaGrid.querySelector(".galeria-item.glightbox").click();
        });
      }
      if (window.GLightbox) window.GLightbox({ selector: ".glightbox" });
    },
    () => { galeriaVacio.style.display = "block"; }
  );
}

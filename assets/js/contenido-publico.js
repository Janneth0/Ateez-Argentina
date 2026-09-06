// ============================================================
// CONTENIDO-PUBLICO.JS
// Sección "Series y Traducciones" de contenido.html: escucha en
// tiempo real la colección "contenido" (cargada desde el panel)
// y la renderiza con filtro por categoría.
// ============================================================

import { escucharContenido } from "./contenido.js";
import { renderContenidoCard, reprocesarEmbedsRedes } from "./components.js";

const contenedor = document.getElementById("grilla-contenido");
const filtros = document.getElementById("contenido-filtros");
const vacio = document.getElementById("contenido-vacio");

if (contenedor) {
  let todoElContenido = [];
  let filtroActivo = "todas";

  function pintar() {
    const lista = filtroActivo === "todas"
      ? todoElContenido
      : todoElContenido.filter(c => c.categoria === filtroActivo);

    if (lista.length === 0) {
      contenedor.innerHTML = "";
      if (vacio) vacio.style.display = "block";
      return;
    }
    if (vacio) vacio.style.display = "none";
    contenedor.innerHTML = lista.map(renderContenidoCard).join("");
    reprocesarEmbedsRedes();
  }

  escucharContenido(
    (items) => { todoElContenido = items; pintar(); },
    (err) => {
      console.warn("No se pudo cargar el contenido:", err);
      if (vacio) { vacio.style.display = "block"; vacio.textContent = "Todavía no hay contenido cargado por el equipo."; }
    }
  );

  if (filtros) {
    filtros.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filtro]");
      if (!btn) return;
      filtros.querySelectorAll("[data-filtro]").forEach(b => b.classList.remove("filter-active"));
      btn.classList.add("filter-active");
      filtroActivo = btn.getAttribute("data-filtro");
      pintar();
    });
  }
}

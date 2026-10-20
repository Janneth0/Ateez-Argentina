// ============================================================
// CONTENIDO-PUBLICO.JS
// Seccion "Series, Traducciones y Mas Contenido" de contenido.html: escucha en
// tiempo real la coleccion "contenido" (cargada desde el panel) y la muestra con
// filtro por categoria.
//
// Vista: SIEMPRE se muestran los dos formatos, cada uno con su propio diseno:
//   - Videos de YouTube (Dance Covers, Otros)  -> grilla 16:9, se reproducen en la tarjeta
//   - Publicaciones de Instagram/TikTok/X (Series, Traducciones) -> el post embebido,
//     en columnas tipo "muro" porque cada post tiene un alto distinto
// El tipo se detecta por el link (no por la categoria), asi un video cargado en "Series"
// o un post cargado en "Otro" tambien se ve bien. En "Todo" salen los dos grupos.
// ============================================================

import { escucharContenido, seleccionarDestacados } from "./contenido.js";
import {
  renderContenidoVideo,
  renderContenidoPost,
  videoIdDeContenido,
  activarEmbedsDiferidos
} from "./components.js";

const contenedor = document.getElementById("grilla-contenido");
const filtros = document.getElementById("contenido-filtros");
const vacio = document.getElementById("contenido-vacio");

if (contenedor) {
  let todoElContenido = [];
  let filtroActivo = "todas";

  function grupo({ titulo, icono, html }, conTitulo) {
    return `
      <div class="contenido-grupo">
        ${conTitulo ? `<h3 class="contenido-grupo-titulo"><i class="bi ${icono}"></i> ${titulo}</h3>` : ""}
        ${html}
      </div>`;
  }

  function pintar() {
    const lista = filtroActivo === "todas"
      ? todoElContenido
      : todoElContenido.filter(c => c.categoria === filtroActivo);

    const videos = lista.filter(c => videoIdDeContenido(c));
    const posts = lista.filter(c => !videoIdDeContenido(c));

    if (lista.length === 0) {
      contenedor.innerHTML = "";
      if (vacio) vacio.style.display = "block";
      return;
    }
    if (vacio) vacio.style.display = "none";

    const conTitulos = videos.length > 0 && posts.length > 0; // los titulos solo hacen falta si se ven los dos
    const partes = [];
    if (videos.length) {
      partes.push(grupo({
        titulo: "Videos", icono: "bi-play-btn-fill",
        html: `<div class="row">${videos.map(renderContenidoVideo).join("")}</div>`
      }, conTitulos));
    }
    if (posts.length) {
      partes.push(grupo({
        titulo: "Publicaciones", icono: "bi-chat-square-heart-fill",
        html: `<div class="contenido-muro">${posts.map(renderContenidoPost).join("")}</div>`
      }, conTitulos));
    }
    contenedor.innerHTML = partes.join("");
    activarEmbedsDiferidos(contenedor);
  }

  escucharContenido(
    (items) => {
      // Los videos destacados ya se muestran arriba de todo (ver
      // contenido-destacados.js), asi que aca se excluyen para no repetirlos.
      const idsDestacados = new Set(seleccionarDestacados(items).map(c => c.id));
      todoElContenido = items.filter(c => !idsDestacados.has(c.id));
      pintar();
    },
    (err) => {
      console.warn("No se pudo cargar el contenido:", err);
      if (vacio) { vacio.style.display = "block"; vacio.textContent = "Todavia no hay contenido cargado por el equipo."; }
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

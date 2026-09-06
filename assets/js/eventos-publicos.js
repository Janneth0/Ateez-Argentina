// ============================================================
// EVENTOS-PUBLICOS.JS
// Seccion "Publicaciones de la comunidad" en evento/index.html.
// Se alimenta en tiempo real de lo que el equipo admin/colaborador
// carga desde /admin. Los eventos con mas de un ano desde su
// "fechaEvento" se ocultan automaticamente del sitio publico
// (siguen existiendo en Firestore; el panel admin los marca como
// "Inactivo" en vez de borrarlos).
// ============================================================

import { escucharPosts } from "./posts.js";
import { renderPostCard, reprocesarEmbedsRedes } from "./components.js";
import { eventoVencido, formatearFecha } from "./util.js";

const contenedor = document.getElementById("publicaciones-comunidad");
const filtros = document.getElementById("publicaciones-filtros");
const vacio = document.getElementById("publicaciones-vacio");

if (contenedor) {
  let todasLasPosts = [];
  let filtroActivo = "todas";

  function pintar() {
    const vigentes = todasLasPosts.filter(p => !eventoVencido(p.fechaEvento));
    const lista = filtroActivo === "todas"
      ? vigentes
      : vigentes.filter(p => p.categoria === filtroActivo);

    if (lista.length === 0) {
      contenedor.innerHTML = "";
      if (vacio) vacio.style.display = "block";
      return;
    }
    if (vacio) vacio.style.display = "none";
    contenedor.innerHTML = lista.map(p => renderPostCard({
      ...p,
      descripcion: `${p.descripcion} \u00b7 ${formatearFecha(p.fechaEvento)}`
    })).join("");
    reprocesarEmbedsRedes();
  }

  escucharPosts(
    (posts) => {
      todasLasPosts = posts;
      pintar();
    },
    (err) => {
      console.warn("No se pudieron cargar las publicaciones de Firestore:", err);
      if (vacio) {
        vacio.style.display = "block";
        vacio.textContent = "Todavia no hay publicaciones cargadas por el equipo.";
      }
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

// ============================================================
// CONTENIDO-DESTACADOS.JS - ATEEZ ARGENTINA
// Sección "Destacado" de contenido.html, arriba de "Últimos
// Comebacks": 1 o 2 videos de YouTube elegidos a mano por el admin
// desde el panel (Contenido > marcar "Video destacado").
// Si no hay ninguno, la sección entera queda oculta.
// ============================================================

import { escucharContenido, seleccionarDestacados } from "./contenido.js";
import { escapeHtml } from "./util.js";

const seccion = document.getElementById("destacados");
const grilla = document.getElementById("grilla-destacados");

if (seccion && grilla) {
  let firmaAnterior = "";

  escucharContenido(
    (items) => {
      const videos = seleccionarDestacados(items);

      // Si nada cambió respecto de lo que ya está en pantalla no se vuelve a
      // dibujar: reasignar innerHTML recarga los iframes y cortaría un video
      // que alguien esté mirando justo cuando otra persona edita otra cosa.
      const firma = videos.map(v => `${v.id}:${v.videoId}:${v.titulo}:${v.descripcion}`).join("|");
      if (firma === firmaAnterior) return;
      firmaAnterior = firma;

      if (videos.length === 0) {
        seccion.style.display = "none";
        grilla.innerHTML = "";
        return;
      }

      seccion.style.display = "";
      const columna = videos.length === 1 ? "col-lg-8 col-12" : "col-lg-6 col-12";
      grilla.innerHTML = videos.map(v => `
        <div class="${columna} mb-4 video-destacado">
            <div class="embed-responsive">
                <iframe src="https://www.youtube.com/embed/${v.videoId}" title="${escapeHtml(v.titulo)}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>
            </div>
            <h3>${escapeHtml(v.titulo)}</h3>
            ${v.descripcion ? `<p>${escapeHtml(v.descripcion)}</p>` : ""}
        </div>`).join("");
    },
    (err) => {
      console.warn("No se pudieron cargar los videos destacados:", err);
      seccion.style.display = "none";
    }
  );
}

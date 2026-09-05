// ============================================================
// COMPONENTS.JS - ATEEZ ARGENTINA
// Header, footer y tarjeta de publicación centralizados en un
// solo lugar. Cambiás el logo, el menú, los links o el footer
// UNA sola vez acá y se actualiza en todo el sitio.
//
// Cada página solo necesita:
//   <div id="site-header"></div>  ... contenido ...  <div id="site-footer"></div>
//   <script type="module">
//     import { montarHeader, montarFooter } from "RUTA/assets/js/components.js";
//     montarHeader({ base: "RUTA_RELATIVA_A_LA_RAIZ/", activo: "eventos" });
//     montarFooter({ base: "RUTA_RELATIVA_A_LA_RAIZ/" });
//   </script>
// ============================================================

/** Genera el HTML del header. `base` es la ruta relativa hacia la raíz del sitio ("" o "../"). */
export function renderHeader({ base = "", activo = "", logoUrl = "" } = {}) {
  const activa = (clave) => (activo === clave ? "active" : "");
  const logo = logoUrl || `${base}assets/img/logoATZ.jpeg`;
  return `
  <header id="header" class="header fixed-top">
      <div class="container-fluid container-xl position-relative">
          <div class="top-row d-flex align-items-center justify-content-between">
              <a href="${base}index.html" class="logo d-flex align-items-center">
                  <img src="${logo}" alt="ATEEZ Argentina - logo oficial de la comunidad" class="logo site-logo-img">
                  <h1 class="sitename">ATEEZ Argentina</h1>
              </a>
              <div class="d-flex align-items-center">
                  <div class="social-links">
                      <a href="https://www.facebook.com/people/Startinyarg/61569342044743/" class="facebook" aria-label="Facebook"><i class="bi bi-facebook"></i></a>
                      <a href="https://x.com/StartinyARG" class="twitter" aria-label="Twitter / X"><i class="bi bi-twitter"></i></a>
                      <a href="https://www.instagram.com/startinyarg/" class="instagram" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
                      <a href="https://tiktok.com/@startinyarg" class="tiktok" aria-label="TikTok"><i class="bi bi-tiktok"></i></a>
                  </div>
              </div>
          </div>
      </div>

      <div class="nav-wrap">
          <div class="container d-flex justify-content-center position-relative">
              <nav id="navmenu" class="navmenu">
                  <ul>
                      <li><a href="${base}index.html" class="${activa('inicio')}">Inicio</a></li>
                      <li><a href="${base}evento/" class="${activa('eventos')}">Eventos</a></li>
                      <li><a href="${base}Noticias/noticias.html" class="${activa('noticias')}">Noticias</a></li>
                      <li class="dropdown"><a href="${base}contenido.html"><span>Contenido</span> <i class="bi bi-chevron-down toggle-dropdown"></i></a>
                          <ul>
                              <li><a href="${base}contenido.html#series">Series</a></li>
                              <li><a href="${base}contenido.html#Playlists">Playlists</a></li>
                              <li><a href="${base}contenido.html#danceCovers">Dance Covers</a></li>
                              <li><a href="${base}contenido.html#contenidoATZ">Más Contenido</a></li>
                          </ul>
                      </li>
                      <li class="dropdown"><a href="${base}index.html#nosotros"><span>Nosotros</span> <i class="bi bi-chevron-down toggle-dropdown"></i></a>
                          <ul>
                              <li><a href="${base}index.html#sedes">Sedes</a></li>
                          </ul>
                      </li>
                  </ul>
                  <i class="mobile-nav-toggle d-xl-none bi bi-list"></i>
              </nav>
          </div>
      </div>
  </header>`;
}

/** Genera el HTML del footer. `base` es la ruta relativa hacia la raíz del sitio ("" o "../"). */
export function renderFooter({ base = "" } = {}) {
  return `
  <footer id="footer" class="footer dark-background">
      <div class="container">
          <div class="row">
              <div class="col-lg-4 col-md-6 col-12">
                  <h4>Mural ATEEZ</h4>
                  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3285.760355186323!2d-58.45040092488723!3d-34.55962255516975!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb5000cb5b0eb%3A0x672dd769a348bab9!2sMural%20ATEEZ!5e0!3m2!1ses-419!2sar!4v1755992014758!5m2!1ses-419!2sar"
                      height="300" style="border:0; border-radius: 10px;" allowfullscreen="" loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade"></iframe>
              </div>
              <div class="col-lg-4 col-md-6 col-12">
                  <h4>Mural Argentiny</h4>
                  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d205.3607881219956!2d-58.44808776228413!3d-34.55931231975737!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb5001057febb%3A0x9c0919b207b923a!2sMURAL%20ARGENTINY!5e0!3m2!1ses-419!2sar!4v1755992312929!5m2!1ses-419!2sar"
                      height="300" style="border:0; border-radius: 10px;" allowfullscreen="" loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade"></iframe>
              </div>
              <div class="col-lg-4 col-md-12 col-12">
                  <div class="footer-contact">
                      <h4>Contacto</h4>
                      <div class="contact-item">
                          <div class="contact-icon"><i class="bi bi-geo-alt"></i></div>
                          <div class="contact-info"><p>Ciudad Autónoma de Buenos Aires<br>Argentina</p></div>
                      </div>
                      <div class="contact-item">
                          <div class="contact-icon"><i class="bi bi-envelope"></i></div>
                          <div class="contact-info"><p>startinyargentina@gmail.com</p></div>
                      </div>
                      <div class="social-links">
                          <a href="https://instagram.com/StartinyARG" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
                          <a href="https://x.com/StartinyARG" aria-label="Twitter / X"><i class="bi bi-twitter-x"></i></a>
                          <a href="https://www.facebook.com/share/1LuX7TrB8g/" aria-label="Facebook"><i class="bi bi-facebook"></i></a>
                          <a href="https://www.youtube.com/@StartinyArg" aria-label="YouTube"><i class="bi bi-youtube"></i></a>
                          <a href="https://tiktok.com/@startinyarg" aria-label="TikTok"><i class="bi bi-tiktok"></i></a>
                      </div>
                  </div>
              </div>
          </div>
      </div>
      <div class="footer-bottom">
          <div class="container">
              <div class="row align-items-center">
                  <div class="col-lg-6">
                      <div class="copyright">
                          <p>© <span>Copyright 2025-2026</span> <strong class="px-1 sitename">ATEEZ Argentina</strong>
                              <span>Todos los derechos reservados</span></p>
                      </div>
                  </div>
                  <div class="col-lg-6">
                      <div class="credits">Hecho con 🏴‍☠️ por la comunidad Argentina de ATINY</div>
                  </div>
              </div>
          </div>
      </div>
  </footer>`;
}

/** Monta el header dentro de <div id="site-header"> y reinicializa lo mínimo necesario del theme JS. */
export function montarHeader(opciones = {}) {
  const el = document.getElementById("site-header");
  if (el) el.outerHTML = renderHeader(opciones);
}

/** Monta el footer dentro de <div id="site-footer">. */
export function montarFooter(opciones = {}) {
  const el = document.getElementById("site-footer");
  if (el) el.outerHTML = renderFooter(opciones);
}

/**
 * Genera el HTML de una tarjeta de publicación (evento / noticia / contenido).
 * Reutiliza la estructura visual "portfolio-card" ya existente en el sitio.
 * Si el link es de Instagram, embebe el post; si no, muestra una tarjeta con botón "Ver publicación".
 */
export function renderPostCard({ id, titulo, descripcion, link = "", categoria = "otro" } = {}) {
  const esInstagram = /instagram\.com/i.test(link);
  const claveFiltro = {
    cumpleanos: "filter-hbd",
    comeback: "filter-cb",
    especial: "filter-esp",
    otro: "filter-other"
  }[categoria] || "filter-other";

  const media = esInstagram
    ? `<blockquote class="instagram-media" data-instgrm-permalink="${link}" data-instgrm-version="14"></blockquote>`
    : `<a href="${link}" target="_blank" rel="noopener" class="post-link-card">
         <i class="bi bi-link-45deg"></i>
         <span>Ver publicación</span>
       </a>`;

  return `
  <div class="col-lg-4 col-md-6 portfolio-item isotope-item ${claveFiltro}" data-post-id="${id || ''}">
      <div class="portfolio-card">
          <div class="image-container">${media}</div>
          <div class="content">
              <h3>${escapeHtml(titulo)}</h3>
              <p>${escapeHtml(descripcion)}</p>
          </div>
      </div>
  </div>`;
}

export function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Vuelve a pedirle a Instagram que procese los embeds nuevos que insertamos dinámicamente. */
export function reprocesarEmbedsInstagram() {
  if (window.instgrm && window.instgrm.Embeds) {
    window.instgrm.Embeds.process();
  }
}

const ICONO_RED = {
  instagram: "bi-instagram",
  twitter: "bi-twitter-x",
  tiktok: "bi-tiktok",
  facebook: "bi-facebook",
  youtube: "bi-youtube",
  discord: "bi-discord",
  otro: "bi-link-45deg"
};

/** Tarjeta de una fanbase/sede (usada en index.html, cargada desde Firestore). */
export function renderFanbaseCard({ id, nombre, descripcion, logoUrl, redes = [], ciudad = "" } = {}) {
  const logo = logoUrl || "assets/img/logoATZ.jpeg";
  const enlaces = redes.map(r => `
      <a href="${r.url}" target="_blank" rel="noopener" aria-label="${escapeHtml(r.red)}">
          <i class="bi ${ICONO_RED[r.red] || ICONO_RED.otro}"></i>
      </a>`).join("");

  return `
  <div class="col-lg-3 col-md-4 col-6" data-fanbase-id="${id || ''}">
      <div class="fanbase-card" data-bs-toggle="modal" data-bs-target="#modalFanbase-${id}">
          <img src="${logo}" alt="Logo de ${escapeHtml(nombre)}" loading="lazy">
          <h4>${escapeHtml(nombre)}</h4>
          ${ciudad ? `<span class="fanbase-ciudad"><i class="bi bi-geo-alt"></i> ${escapeHtml(ciudad)}</span>` : ""}
      </div>
  </div>
  <div class="modal fade" id="modalFanbase-${id}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
              <div class="modal-header">
                  <h5 class="modal-title">${escapeHtml(nombre)}</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
              </div>
              <div class="modal-body text-center">
                  <img src="${logo}" alt="Logo de ${escapeHtml(nombre)}" class="mb-3" style="width:96px;height:96px;object-fit:cover;border-radius:50%;">
                  <p>${escapeHtml(descripcion)}</p>
                  <div class="social-links justify-content-center">${enlaces}</div>
              </div>
          </div>
      </div>
  </div>`;
}

/** Tarjeta de noticia para la grilla/listado. */
export function renderNoticiaCard({ slug, titulo, resumen, imagenUrl, fechaPublicacion, destacada, base = "" } = {}) {
  const fecha = fechaPublicacion ? new Date(fechaPublicacion.toDate ? fechaPublicacion.toDate() : fechaPublicacion) : null;
  const fechaTexto = fecha ? fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }) : "";
  const img = imagenUrl || `${base}assets/img/logoATZ.jpeg`;
  return `
  <article class="col-lg-4 col-md-6 noticia-item">
      <a href="${base}Noticias/${slug}" class="noticia-card" data-slug="${slug}">
          ${destacada ? '<span class="noticia-destacada"><i class="bi bi-star-fill"></i> Destacada</span>' : ""}
          <div class="noticia-imagen"><img src="${img}" alt="${escapeHtml(titulo)}" loading="lazy"></div>
          <div class="noticia-contenido">
              <span class="noticia-fecha">${fechaTexto}</span>
              <h3>${escapeHtml(titulo)}</h3>
              <p>${escapeHtml(resumen || "")}</p>
          </div>
      </a>
  </article>`;
}

function fechaNoticiaTexto(fechaPublicacion) {
  const fecha = fechaPublicacion ? new Date(fechaPublicacion.toDate ? fechaPublicacion.toDate() : fechaPublicacion) : null;
  return fecha ? fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }) : "";
}

/** Bloque grande de la noticia principal (ver Noticias/noticias.html). */
export function renderNoticiaDestacado({ slug, titulo, resumen, imagenUrl, fechaPublicacion, base = "" } = {}) {
  const img = imagenUrl || `${base}assets/img/logoATZ.jpeg`;
  return `
  <div class="col-lg-6">
      <a href="${base}Noticias/${slug}" class="noticia-destacado" data-slug="${slug}">
          <div class="noticia-destacado-imagen"><img src="${img}" alt="${escapeHtml(titulo)}" loading="lazy"></div>
          <span class="noticia-destacado-tag"><i class="bi bi-star-fill"></i> Destacada</span>
          <h2>${escapeHtml(titulo)}</h2>
          <p>${escapeHtml(resumen || "")}</p>
          <span class="noticia-destacado-fecha"><i class="bi bi-calendar3"></i> ${fechaNoticiaTexto(fechaPublicacion)}</span>
      </a>
  </div>`;
}

/** Tarjeta chica (se usan varias juntas al lado de la destacada). */
export function renderNoticiaMini({ slug, titulo, imagenUrl, fechaPublicacion, base = "" } = {}) {
  const img = imagenUrl || `${base}assets/img/logoATZ.jpeg`;
  return `
  <div class="col-6">
      <a href="${base}Noticias/${slug}" class="noticia-mini" data-slug="${slug}">
          <div class="noticia-mini-imagen"><img src="${img}" alt="${escapeHtml(titulo)}" loading="lazy"></div>
          <h3>${escapeHtml(titulo)}</h3>
          <span class="noticia-mini-fecha">${fechaNoticiaTexto(fechaPublicacion)}</span>
      </a>
  </div>`;
}

/** Item chico de galería (para grilla con lightbox glightbox). */
export function renderGaleriaItem({ imagenUrl, descripcion = "" } = {}) {
  return `
  <a class="galeria-item glightbox" href="${imagenUrl}" data-type="image" data-gallery="galeria-atz" data-title="${escapeHtml(descripcion)}">
      <img src="${imagenUrl}" alt="${escapeHtml(descripcion)}" loading="lazy">
  </a>`;
}

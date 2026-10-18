// ============================================================
// COMPONENTS.JS - ATEEZ ARGENTINA
// Header, footer, modal de Terminos y tarjetas reutilizables,
// centralizados en un solo lugar.
//
// Cada pagina se inicializa con site-boot.js (que llama a estas
// funciones con la configuracion ya cargada desde Firestore), no
// hace falta llamarlas a mano.
// ============================================================

import { REDES_SOCIALES_POR_DEFECTO, CONFIG_POR_DEFECTO, logoDelSitio } from "./config-sitio.js";
import { extraerIdYoutube } from "./util.js";

export const ICONO_RED = {
  instagram: "bi-instagram",
  twitter: "bi-twitter-x",
  tiktok: "bi-tiktok",
  facebook: "bi-facebook",
  youtube: "bi-youtube",
  discord: "bi-discord",
  otro: "bi-link-45deg"
};

function renderIconosSociales(redes = []) {
  return redes.map(r => `<a href="${r.url}" class="${r.red}" aria-label="${r.red}"><i class="bi ${ICONO_RED[r.red] || ICONO_RED.otro}"></i></a>`).join("");
}

/** Genera el HTML del header. `base` es la ruta relativa hacia la raíz ("" o "../"). `config` trae logo/redes. */
export function renderHeader({ base = "", activo = "", config = {} } = {}) {
  const activa = (clave) => (activo === clave ? "active" : "");
  const logo = config.logoUrl || `${base}assets/img/AteezArgentinaLogo.png`;
  const redes = config.redesSociales || REDES_SOCIALES_POR_DEFECTO;

  return `
  <header id="header" class="header hf-background fixed-top">
      <div class="container-fluid container-xl position-relative ">
          <div class="top-row d-flex align-items-center justify-content-between ">
              <a href="${base}index.html" class="logo d-flex align-items-center">
                  <img src="${logo}" alt="ATEEZ Argentina - logo oficial de la comunidad" class="logo site-logo-img">
                  <h1 class="sitename">ATEEZ Argentina</h1>
              </a>
              <div class="d-flex align-items-center">
                  <div class="social-links">${renderIconosSociales(redes)}</div>
              </div>
               <i class="mobile-nav-toggle d-xl-none bi bi-list"></i>
          </div>
      </div>

      <div class="nav-wrap">
          <div class="container d-flex justify-content-center position-relative">
              <nav id="navmenu" class="navmenu">
                  <ul>
                      <li><a href="${base}index.html" class="${activa('inicio')}">Inicio</a></li>
                      <li><a href="${base}evento/" class="${activa('eventos')}">Eventos</a></li>
                      <li><a href="${base}Noticias/noticias.html" class="${activa('noticias')}">Noticias</a></li>
                      <li><a href="${base}metas/" class="${activa('metas')}">Metas</a></li>
                      <li class="dropdown"><a href="${base}contenido.html" class="${activa('contenido')}"><span>Contenido</span> <i class="bi bi-chevron-down toggle-dropdown"></i></a>
                          <ul>
                              <li><a href="${base}contenido.html#mvs">Últimos Comebacks</a></li>
                              <li><a href="${base}contenido.html#wanteez">WANTEEZ</a></li>
                              <li><a href="${base}contenido.html#logbook">LOG_LOGBOOK</a></li>
                              <li><a href="${base}contenido.html#series">Series y Traducciones</a></li>
                          </ul>
                      </li>
                      <li class="dropdown"><a href="${base}index.html#nosotros"><span>Nosotros</span> <i class="bi bi-chevron-down toggle-dropdown"></i></a>
                          <ul>
                              <li><a href="${base}index.html#sedes">Sedes</a></li>
                              <li><a href="${base}index.html#galeria">Galería</a></li>
                          </ul>
                      </li>
                  </ul>
                  
              </nav>
          </div>
      </div>
  </header>`;
}

/** Genera el HTML del footer. `config` trae redes/contacto/mapas. */
export function renderFooter({ base = "", config = {} } = {}) {
  const c = { ...CONFIG_POR_DEFECTO, ...config };
  const redes = c.redesSociales || REDES_SOCIALES_POR_DEFECTO;

  return `
  <footer id="footer" class="footer hf-background">
      <div class="container">
          <div class="row">
              <div class="col-lg-4 col-md-6 col-12">
                  <h4>${escapeHtml(c.mapa1Titulo || "")}</h4>
                  <iframe src="${c.mapa1Url}" height="300" style="border:0; border-radius: 10px;"
                      allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
              </div>
              <div class="col-lg-4 col-md-6 col-12">
                  <h4>${escapeHtml(c.mapa2Titulo || "")}</h4>
                  <iframe src="${c.mapa2Url}" height="300" style="border:0; border-radius: 10px;"
                      allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
              </div>
              <div class="col-lg-4 col-md-12 col-12">
                  <div class="footer-contact">
                      <h4>Contacto</h4>
                      <div class="contact-item">
                          <div class="contact-icon"><i class="bi bi-geo-alt"></i></div>
                          <div class="contact-info"><p>${escapeHtml(c.contactoDireccion || "")}</p></div>
                      </div>
                      <div class="contact-item">
                          <div class="contact-icon"><i class="bi bi-envelope"></i></div>
                          <div class="contact-info"><p>${escapeHtml(c.contactoEmail || "")}</p></div>
                      </div>
                      <div class="social-links">${renderIconosSociales(redes)}</div>
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
                  <div class="col-lg-6 text-lg-end">
                      <div class="credits">
                          Hecho con 🏴‍☠️ por la comunidad Argentina de ATINY ·
                          <a href="#" data-bs-toggle="modal" data-bs-target="#modalTerminos">Términos y Condiciones</a>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </footer>`;
}

/** Modal de Términos y Condiciones, se monta una sola vez por página (ver site-boot.js). */
export function renderModalTerminos() {
  return `
  <div class="modal fade" id="modalTerminos" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-scrollable modal-lg">
          <div class="modal-content">
              <div class="modal-header">
                  <h5 class="modal-title">Términos y Condiciones</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
              </div>
              <div class="modal-body terminos-cuerpo">
                  <p class="text-muted">Última actualización: octubre de 2026</p>

                  <h6>1. Quiénes somos</h6>
                  <p>ATEEZ Argentina es un sitio hecho por fans, sin fines de lucro, que reúne información sobre la
                      comunidad Argentina de ATINY: fanbases, eventos, noticias y contenido relacionado a ATEEZ. No
                      tiene afiliación oficial con ATEEZ, KQ Entertainment ni sus empresas asociadas.</p>

                  <h6>2. Registro de cuentas (panel de colaboradores)</h6>
                  <p>El panel en <code>/admin</code> es solo para quienes ayudan a mantener el sitio. Al registrarte
                      ahí, nos das tu nombre, email, fecha de nacimiento, celular y país. Estos datos se usan
                      únicamente para identificarte dentro del equipo — nunca se venden ni se comparten con
                      terceros, y no se muestran públicamente. Podés pedir que los eliminemos escribiendo a
                      ateezargentina.contacto@gmail.com.</p>

                  <h6>3. Uso por menores de edad</h6>
                  <p>Si sos menor de edad, necesitás el permiso de un padre, madre o tutor para registrarte como
                      colaborador.</p>

                  <h6>4. Cookies</h6>
                  <p>Usamos cookies para recordar tu sesión en el panel y si ya aceptaste este aviso. Algunos
                      contenidos embebidos (Instagram, TikTok, Twitter/X, YouTube, Spotify, Google Maps) pueden
                      instalar sus propias cookies de terceros al cargarlos.</p>

                  <h6>5. Contenido de terceros</h6>
                  <p>Las imágenes, videos y música que se muestran pertenecen a sus respectivos dueños/as. Los
                      usamos con fines informativos y de fandom, sin fines comerciales.</p>

                  <h6>6. Responsabilidad del contenido cargado</h6>
                  <p>Las noticias, eventos, fanbases y contenido que aparecen en el sitio los carga nuestro equipo de
                      colaboradores. Hacemos lo posible por mantener la información precisa, pero puede haber
                      errores. Si encontrás algo incorrecto, avisanos por email.</p>

                  <h6>7. Publicaciones de venta</h6>
                  <p>En el sitio no se publican ofertas de venta ni de reventa (entradas, álbumes, merchandising,
                      productos de fans, etc.) de personas o tiendas particulares. Solo se difunden ventas, preventas
                      o sorteos que provengan de <strong>fuentes oficiales</strong>: la agencia y sus tiendas oficiales,
                      distribuidores autorizados y las ticketeras o productoras oficiales de cada show. Quienes
                      colaboran con el sitio deben verificar el origen antes de publicar, y el equipo puede quitar
                      cualquier publicación que no cumpla esta regla.</p>

                  <h6>8. Contacto</h6>
                  <p>Para cualquier consulta escribinos a
                      <a href="mailto:ateezargentina.contacto@gmail.com">ateezargentina.contacto@gmail.com</a>.</p>
              </div>
              <div class="modal-footer">
                  <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Entendido</button>
              </div>
          </div>
      </div>
  </div>`;
}

/** Monta el header dentro de <div id="site-header">. */
export function montarHeader(opciones = {}) {
  const el = document.getElementById("site-header");
  if (el) el.outerHTML = renderHeader(opciones);
}

/** Monta el footer dentro de <div id="site-footer">. */
export function montarFooter(opciones = {}) {
  const el = document.getElementById("site-footer");
  if (el) el.outerHTML = renderFooter(opciones);
}

/** Monta el modal de Términos al final del <body>, si todavía no está. */
export function montarModalTerminos() {
  if (document.getElementById("modalTerminos")) return;
  document.body.insertAdjacentHTML("beforeend", renderModalTerminos());
}

// ------------------------------------------------------------
// Redes sociales: deteccion y embeds
// ------------------------------------------------------------

/**
 * Detecta de que red social es un link y devuelve el HTML de embed
 * correspondiente. Se usa para eventos y para contenido cargado desde el
 * panel. Reconoce Instagram, TikTok, Twitter/X y Facebook (posts publicos);
 * si no reconoce la red, muestra una tarjeta generica de "Ver publicacion".
 */
export function renderEmbedRedSocial(link = "") {
  if (/instagram\.com/i.test(link)) {
    return `<blockquote class="instagram-media" data-instgrm-permalink="${link}" data-instgrm-version="14"></blockquote>`;
  }
  if (/tiktok\.com/i.test(link)) {
    return `<blockquote class="tiktok-embed" cite="${link}" data-video-id="">
              <section><a target="_blank" rel="noopener" href="${link}">Ver en TikTok</a></section>
            </blockquote>`;
  }
  if (/(twitter\.com|x\.com)\/\w+\/status/i.test(link)) {
    return `<blockquote class="twitter-tweet"><a href="${link}"></a></blockquote>`;
  }
  if (/facebook\.com/i.test(link)) {
    const src = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(link)}&show_text=true&width=500`;
    return `<iframe src="${src}" style="width:100%;height:100%;min-height:340px;border:none;overflow:hidden;" loading="lazy" scrolling="no" allowfullscreen></iframe>`;
  }
  return `<a href="${link}" target="_blank" rel="noopener" class="post-link-card">
            <i class="bi bi-link-45deg"></i>
            <span>Ver publicación</span>
          </a>`;
}

export function esLinkRedSocial(url = "") {
  return /instagram\.com|tiktok\.com|(twitter\.com|x\.com)\/\w+\/status|facebook\.com/i.test(url);
}

/**
 * Vuelve a pedirle a cada red que procese los embeds nuevos insertados
 * dinámicamente. Instagram y Twitter/X exponen una función para esto;
 * TikTok NO tiene ninguna API documentada para reprocesar (confirmado:
 * no existe "window.tiktokEmbed.lib.render" ni nada parecido), así que
 * la única forma que funciona es volver a insertar su script con un
 * parámetro distinto en la URL para forzar que el navegador lo cargue
 * de nuevo y escanee la página otra vez.
 */
export function reprocesarEmbedsRedes() {
  if (window.instgrm?.Embeds) window.instgrm.Embeds.process();
  if (window.twttr?.widgets) window.twttr.widgets.load();

  if (document.querySelector(".tiktok-embed")) {
    const anterior = document.getElementById("tiktok-embed-script");
    if (anterior) anterior.remove();
    const script = document.createElement("script");
    script.id = "tiktok-embed-script";
    script.src = `https://www.tiktok.com/embed.js?t=${Date.now()}`;
    script.async = true;
    document.body.appendChild(script);
  }
}

/** @deprecated usar reprocesarEmbedsRedes(). Se mantiene como alias por compatibilidad. */
export function reprocesarEmbedsInstagram() {
  reprocesarEmbedsRedes();
}

// ------------------------------------------------------------
// Tarjetas de contenido (eventos, noticias, fanbases, galería, contenido)
// ------------------------------------------------------------

export function renderPostCard({ id, titulo, descripcion, link = "", categoria = "otro", fechaTexto = "", fanbaseNombre = "", destacado = false } = {}) {
  const claveFiltro = {
    cumpleanos: "filter-hbd",
    comeback: "filter-cb",
    especial: "filter-esp",
    otro: "filter-other"
  }[categoria] || "filter-other";

  // Todas las tarjetas tienen el mismo alto: el título y la descripción se cortan con "…"
  // si son largos (el texto completo queda en el tooltip), y la fecha / fanbase / link
  // van siempre en una franja fija abajo, así nunca se pisan con el embed.
  const datos = [
    fechaTexto ? `<span class="evento-dato"><i class="bi bi-calendar-event"></i> ${escapeHtml(fechaTexto)}</span>` : "",
    fanbaseNombre ? `<span class="evento-dato evento-fanbase"><i class="bi bi-people-fill"></i> ${escapeHtml(fanbaseNombre)}</span>` : ""
  ].join("");
//   const verPublicacion = link
//     ? `<a class="evento-ver" href="${escapeHtml(link)}" target="_blank" rel="noopener">Ver publicación <i class="bi bi-box-arrow-up-right"></i></a>`
//     : "";
  const verPublicacion = link
    ? ``
    : "";

  return `
  <div class="col-lg-4 col-md-6 portfolio-item isotope-item ${claveFiltro}" data-post-id="${id || ''}">
      <div class="portfolio-card${destacado ? " es-destacado" : ""}">
          ${destacado ? `<span class="evento-estrella"><i class="bi bi-star-fill"></i> Destacado</span>` : ""}
          <div class="image-container">${renderEmbedRedSocial(link)}</div>
          <div class="content">
              <h3 class="texto-2-lineas" title="${escapeHtml(titulo)}">${escapeHtml(titulo)}</h3>
              <p class="texto-3-lineas" title="${escapeHtml(descripcion)}">${escapeHtml(descripcion)}</p>
              <div class="evento-meta">${datos}${verPublicacion}</div>
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

/** Tarjeta de una fanbase/sede (usada en index.html, cargada desde Firestore). */
export function renderFanbaseCard({ id, nombre, descripcion, logoUrl, redes = [], ciudad = "" } = {}) {
  const logo = logoUrl || logoDelSitio("");
  const claseLogo = logoUrl ? "" : "logo-fallback"; // si no tiene logo propio, usa el del sitio y se actualiza solo
  const enlaces = redes.map(r => `
      <a href="${r.url}" target="_blank" rel="noopener" aria-label="${escapeHtml(r.red)}">
          <i class="bi ${ICONO_RED[r.red] || ICONO_RED.otro}"></i>
      </a>`).join("");

  return `
  <div class="col-lg-3 col-md-4 col-6" data-fanbase-id="${id || ''}">
      <div class="fanbase-card" data-bs-toggle="modal" data-bs-target="#modalFanbase-${id}">
          <img src="${logo}" class="${claseLogo}" alt="Logo de ${escapeHtml(nombre)}" loading="lazy">
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
                  <img src="${logo}" alt="Logo de ${escapeHtml(nombre)}" class="mb-3 ${claseLogo}" style="width:96px;height:96px;object-fit:cover;border-radius:50%;">
                  <p>${escapeHtml(descripcion)}</p>
                  <div class="social-links justify-content-center">${enlaces}</div>
              </div>
          </div>
      </div>
  </div>`;
}

function fechaNoticiaTexto(fechaPublicacion) {
  const fecha = fechaPublicacion ? new Date(fechaPublicacion.toDate ? fechaPublicacion.toDate() : fechaPublicacion) : null;
  return fecha ? fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";
}

/** Tarjeta de noticia para la grilla/listado. */
export function renderNoticiaCard({ slug, titulo, resumen, imagenUrl, fechaPublicacion, destacada, base = "" } = {}) {
  const img = imagenUrl || logoDelSitio(base);
  const claseImg = imagenUrl ? "" : ' class="logo-fallback"';
  return `
  <article class="col-lg-4 col-md-6 noticia-item">
      <a href="${base}Noticias/${slug}" class="noticia-card" data-slug="${slug}">
          ${destacada ? '<span class="noticia-destacada"><i class="bi bi-star-fill"></i> Destacada</span>' : ""}
          <div class="noticia-imagen"><img src="${img}"${claseImg} alt="${escapeHtml(titulo)}" loading="lazy"></div>
          <div class="noticia-contenido">
              <span class="noticia-fecha">${fechaNoticiaTexto(fechaPublicacion)}</span>
              <h3>${escapeHtml(titulo)}</h3>
              <p>${escapeHtml(resumen || "")}</p>
          </div>
      </a>
  </article>`;
}

/** Bloque grande de la noticia principal (ver Noticias/noticias.html). */
export function renderNoticiaDestacado({ slug, titulo, resumen, imagenUrl, fechaPublicacion, base = "" } = {}) {
  const img = imagenUrl || logoDelSitio(base);
  const claseImg = imagenUrl ? "" : ' class="logo-fallback"';
  return `
  <div class="col-lg-6">
      <a href="${base}Noticias/${slug}" class="noticia-destacado" data-slug="${slug}">
          <div class="noticia-destacado-imagen"><img src="${img}"${claseImg} alt="${escapeHtml(titulo)}" loading="lazy"></div>
          <span class="noticia-destacado-tag"><i class="bi bi-star-fill"></i> Destacada</span>
          <h2>${escapeHtml(titulo)}</h2>
          <p>${escapeHtml(resumen || "")}</p>
          <span class="noticia-destacado-fecha"><i class="bi bi-calendar3"></i> ${fechaNoticiaTexto(fechaPublicacion)}</span>
      </a>
  </div>`;
}

/** Tarjeta chica (se usan varias juntas al lado de la destacada). */
export function renderNoticiaMini({ slug, titulo, imagenUrl, fechaPublicacion, base = "" } = {}) {
  const img = imagenUrl || logoDelSitio(base);
  const claseImg = imagenUrl ? "" : ' class="logo-fallback"';
  return `
  <div class="col-6">
      <a href="${base}Noticias/${slug}" class="noticia-mini" data-slug="${slug}">
          <div class="noticia-mini-imagen"><img src="${img}"${claseImg} alt="${escapeHtml(titulo)}" loading="lazy"></div>
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

// Al tocar la miniatura de un video de YouTube, se reemplaza por el reproductor real
// (con reproducción automática, porque la persona acaba de tocar "play").
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const fachada = e.target.closest?.(".yt-facade");
    if (!fachada) return;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${fachada.dataset.videoId}?autoplay=1&rel=0`;
    iframe.title = fachada.dataset.titulo || "Video de YouTube";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    fachada.replaceWith(iframe);
  });

  // Publicaciones de redes sociales en "Contenido": en la grilla se muestra una tarjeta
  // uniforme y el embed real (que es pesado y de alto variable) se abre en una ventana.
  document.addEventListener("click", (e) => {
    const fachada = e.target.closest?.(".social-facade");
    if (!fachada) return;
    abrirPublicacion(fachada.dataset.url, fachada.dataset.titulo);
  });

  // Si la imagen de una tarjeta de contenido no carga, se reemplaza por el logo del sitio.
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img?.tagName !== "IMG" || !img.matches(".contenido-media img:not(.contenido-img-respaldo)")) return;
    img.classList.add("contenido-img-respaldo", "logo-fallback");
    img.src = logoDelSitio("");
  }, true);
}

function abrirPublicacion(url, titulo = "") {
  if (!url) return;
  let dialogo = document.getElementById("dialogo-publicacion");
  if (!dialogo) {
    dialogo = document.createElement("dialog");
    dialogo.id = "dialogo-publicacion";
    dialogo.className = "dialogo-publicacion";
    dialogo.innerHTML = `<button type="button" class="dialogo-cerrar" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
      <div class="dialogo-cuerpo"></div>`;
    document.body.appendChild(dialogo);
    dialogo.addEventListener("click", (ev) => {
      if (ev.target === dialogo || ev.target.closest(".dialogo-cerrar")) dialogo.close(); // clic afuera o en la X
    });
    dialogo.addEventListener("close", () => { dialogo.querySelector(".dialogo-cuerpo").innerHTML = ""; });
  }
  dialogo.setAttribute("aria-label", titulo || "Publicación");
  dialogo.querySelector(".dialogo-cuerpo").innerHTML = renderEmbedRedSocial(url);
  dialogo.showModal();
  reprocesarEmbedsRedes();
}

const REDES_CONTENIDO = [
  { re: /instagram\.com/i, clave: "instagram", nombre: "Instagram", icono: "bi-instagram" },
  { re: /tiktok\.com/i, clave: "tiktok", nombre: "TikTok", icono: "bi-tiktok" },
  { re: /(twitter\.com|x\.com)\//i, clave: "x", nombre: "X", icono: "bi-twitter-x" },
  { re: /facebook\.com/i, clave: "facebook", nombre: "Facebook", icono: "bi-facebook" }
];

const ES_LINK_IMAGEN = (url = "") => /\.(jpe?g|png|gif|webp|avif)(\?.*)?$/i.test(url) || /drive\.google\.com\/thumbnail/i.test(url);

/**
 * Tarjeta de contenido cargado por el equipo (series, traducciones, dance
 * covers, fan content, etc). El campo "adjunto" puede ser: una imagen
 * directa, un link de Drive ya normalizado, un post de una red social
 * (se embebe igual que en los eventos), o vacío.
 */
export function renderContenidoCard({ id, titulo, descripcion, link = "", adjunto = "" } = {}) {
  let media = "";
  // YouTube: si el video está en "Imagen o publicación" se usa ese; si ese campo
  // está vacío y el "Link" es de YouTube, se embebe el del link. (Antes un link de
  // YouTube en "adjunto" se intentaba mostrar como imagen, fallaba y se ocultaba.)
  const videoId = extraerIdYoutube(adjunto) || (!adjunto ? extraerIdYoutube(link) : null);
  if (videoId) {
    // "Fachada": se muestra solo la miniatura y un botón de play. El reproductor de
    // YouTube (que es pesado) se carga recién cuando la persona toca el video, así
    // una grilla con muchos videos no hace lenta la página, sobre todo en celular.
    media = `<div class="contenido-media contenido-youtube">
        <button type="button" class="yt-facade" data-video-id="${videoId}" data-titulo="${escapeHtml(titulo)}" aria-label="Reproducir: ${escapeHtml(titulo)}">
            <img src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg" alt="" loading="lazy">
            <i class="bi bi-play-circle-fill yt-play" aria-hidden="true"></i>
        </button>
      </div>`;
  } else if (adjunto && esLinkRedSocial(adjunto)) {
    const red = REDES_CONTENIDO.find(r => r.re.test(adjunto)) || REDES_CONTENIDO[0];
    media = `<div class="contenido-media contenido-social red-${red.clave}">
        <button type="button" class="social-facade" data-url="${escapeHtml(adjunto)}" data-titulo="${escapeHtml(titulo)}" aria-label="Ver publicación de ${red.nombre}: ${escapeHtml(titulo)}">
            <i class="bi ${red.icono} social-icono" aria-hidden="true"></i>
            <span class="social-cta">Ver publicación de ${red.nombre}</span>
        </button>
      </div>`;
  } else if (adjunto) {
    media = `<div class="contenido-media"><img src="${escapeHtml(adjunto)}" alt="${escapeHtml(titulo)}" loading="lazy"></div>`;
  } else {
    // Sin imagen: se muestra el logo del sitio para que todas las tarjetas tengan el mismo tamaño.
    media = `<div class="contenido-media contenido-sin-imagen"><img class="contenido-img-respaldo logo-fallback" src="${logoDelSitio("")}" alt="" loading="lazy"></div>`;
  }

  return `
  <div class="col-lg-4 col-md-6 contenido-item" data-contenido-id="${id || ''}">
      <div class="contenido-card">
          ${media}
          <div class="contenido-card-body">
              <h4 class="texto-2-lineas" title="${escapeHtml(titulo)}">${escapeHtml(titulo)}</h4>
              <p class="texto-3-lineas" title="${escapeHtml(descripcion)}">${escapeHtml(descripcion)}</p>
              ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener" class="contenido-card-link">Ver <i class="bi bi-box-arrow-up-right"></i></a>` : ""}
          </div>
      </div>
  </div>`;
}

/**
 * Tarjeta compacta para videos de YouTube (usada en WANTEEZ / LOG_LOGBOOK):
 * miniatura + título + resumen corto + link al video. Pensada para mobile,
 * a diferencia del embed grande que se usa en "Últimos Comebacks".
 */
export function renderVideoCompacto({ id, titulo, descripcion = "", thumbnail = "" } = {}) {
  const resumenCorto = descripcion.length > 90 ? descripcion.slice(0, 90).trim() + "…" : descripcion;
  const url = `https://www.youtube.com/watch?v=${id}`;
  return `
  <a href="${url}" target="_blank" rel="noopener" class="video-compacto">
      <div class="video-compacto-thumb">
          <img src="${thumbnail}" alt="${escapeHtml(titulo)}" loading="lazy">
          <i class="bi bi-play-circle-fill"></i>
      </div>
      <div class="video-compacto-info">
          <h5>${escapeHtml(titulo)}</h5>
          <p>${escapeHtml(resumenCorto)}</p>
      </div>
  </a>`;
}

// ============================================================
// NOTICIAS-APP.JS
// Maneja las dos "vistas" de Noticias/noticias.html (listado y
// detalle) sin recargar la pagina, con URL propia por noticia
// (/Noticias/<slug>) via History API, y actualiza el SEO
// (title, meta description, Open Graph) de cada articulo.
//
// Como es un sitio 100% estatico (sin servidor propio), el link
// directo a /Noticias/<slug> funciona gracias al 404.html de la
// raiz del repo, que redirige a este archivo con ?ruta=<slug> y
// esta pagina "limpia" la URL con history.replaceState.
//
// LIMITACION CONOCIDA: como el contenido se arma con JavaScript,
// los bots que NO ejecutan JS (por ejemplo el crawler de Facebook/
// Twitter para generar la vista previa al compartir) van a ver el
// meta por defecto, no el de la noticia especifica. Googlebot si
// ejecuta JS y indexa el contenido real. Para preview perfecto en
// redes sociales haria falta pre-renderizado (Cloud Function o
// build step) - lo dejamos anotado como mejora futura.
// ============================================================

import { escucharNoticias } from "../assets/js/noticias.js";
import { renderNoticiaCard, renderNoticiaDestacado, renderNoticiaMini, escapeHtml } from "../assets/js/components.js";
import { formatearFecha } from "../assets/js/util.js";

let todasLasNoticias = [];
let listaLista = false;

const vistaLista = document.getElementById("vista-lista-noticias");
const vistaDetalle = document.getElementById("vista-detalle-noticia");
const grillaDestacada = document.getElementById("grilla-destacada");
const grilla = document.getElementById("grilla-noticias");
const vacio = document.getElementById("noticias-vacio");

escucharNoticias(
  (noticias) => {
    todasLasNoticias = noticias;
    listaLista = true;
    pintarLista();
    enrutar(); // por si el detalle estaba esperando que carguen las noticias
  },
  (err) => {
    console.warn("No se pudieron cargar las noticias:", err);
    vacio.style.display = "block";
    vacio.textContent = "No se pudieron cargar las noticias en este momento.";
  }
);

// La primera noticia (ya viene ordenada con las destacadas primero, y
// dentro de cada grupo por fecha) se pinta grande, las 4 siguientes en
// tarjetas chicas al lado, y el resto abajo en la grilla de siempre.
function pintarLista() {
  if (todasLasNoticias.length === 0) {
    grillaDestacada.innerHTML = "";
    grilla.innerHTML = "";
    vacio.style.display = "block";
    return;
  }
  vacio.style.display = "none";

  const [principal, ...resto] = todasLasNoticias;
  const secundarias = resto.slice(0, 4);
  const restantes = resto.slice(4);

  grillaDestacada.innerHTML = renderNoticiaDestacado({ ...principal, base: "../" }) +
    (secundarias.length
      ? `<div class="col-lg-6"><div class="row g-3">${secundarias.map(n => renderNoticiaMini({ ...n, base: "../" })).join("")}</div></div>`
      : "");

  grilla.innerHTML = restantes.map(n => renderNoticiaCard({ ...n, base: "../" })).join("");
}

// Intercepta clicks en tarjetas de noticia para navegar sin recargar
document.addEventListener("click", (e) => {
  const link = e.target.closest("a[data-slug]");
  if (!link) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // dejar que abra en pestaña nueva normalmente
  e.preventDefault();
  irADetalle(link.dataset.slug, true);
});

document.getElementById("volver-listado")?.addEventListener("click", (e) => {
  e.preventDefault();
  history.pushState({}, "", "./");
  mostrarListado();
});

window.addEventListener("popstate", () => enrutar());

function irADetalle(slug, empujarHistorial) {
  if (empujarHistorial) history.pushState({ slug }, "", `./${slug}`);
  renderDetalle(slug);
}

function mostrarListado() {
  vistaLista.style.display = "";
  vistaDetalle.style.display = "none";
  restaurarSeoPorDefecto();
}

function renderDetalle(slug) {
  const noticia = todasLasNoticias.find(n => n.slug === slug);
  if (!noticia) {
    if (!listaLista) return; // todavia no cargo Firestore, esperamos
    // Slug no encontrado: volvemos al listado
    mostrarListado();
    return;
  }

  vistaLista.style.display = "none";
  vistaDetalle.style.display = "";
  window.scrollTo({ top: 0, behavior: "instant" });

  document.getElementById("detalle-titulo").textContent = noticia.titulo;
  document.getElementById("detalle-fecha").textContent = formatearFecha(noticia.fechaPublicacion);
  document.getElementById("detalle-imagen").src = noticia.imagenUrl || "../assets/img/logoATZ.jpeg";
  document.getElementById("detalle-imagen").alt = noticia.titulo;
  document.getElementById("detalle-contenido").innerHTML = noticia.contenidoHtml || "";
  document.getElementById("detalle-destacada").style.display = noticia.destacada ? "inline-flex" : "none";

  // Recomendadas: el resto de las noticias, hasta 4
  const recomendadas = todasLasNoticias.filter(n => n.slug !== slug).slice(0, 4);
  const asideEl = document.getElementById("aside-recomendadas");
  asideEl.innerHTML = recomendadas.map(n => `
    <a href="./${n.slug}" data-slug="${n.slug}" class="aside-noticia">
        <img src="${n.imagenUrl || '../assets/img/logoATZ.jpeg'}" alt="${escapeHtml(n.titulo)}" loading="lazy">
        <div>
            <span>${formatearFecha(n.fechaPublicacion)}</span>
            <h6>${escapeHtml(n.titulo)}</h6>
        </div>
    </a>`).join("") || "<p class=\"text-muted\">No hay más noticias todavía.</p>";

  actualizarSeo(noticia);
}

function actualizarSeo(noticia) {
  const titulo = `${noticia.titulo} - ATEEZ Argentina`;
  document.title = titulo;
  document.getElementById("meta-titulo").textContent = titulo;
  document.getElementById("meta-descripcion").setAttribute("content", noticia.resumen || "");
  document.getElementById("og-titulo").setAttribute("content", titulo);
  document.getElementById("og-descripcion").setAttribute("content", noticia.resumen || "");
  document.getElementById("og-imagen").setAttribute("content", noticia.imagenUrl || "");
  const url = new URL(`./${noticia.slug}`, window.location.href).toString();
  document.getElementById("og-url").setAttribute("content", url);
  document.getElementById("canonical").setAttribute("href", url);

  // Datos estructurados NewsArticle: ayuda a que Google entienda que es una
  // noticia (fecha, autor, imagen) y la muestre mejor en los resultados.
  const fecha = noticia.fechaPublicacion?.toDate ? noticia.fechaPublicacion.toDate() : new Date(noticia.fechaPublicacion);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": noticia.titulo,
    "description": noticia.resumen || "",
    "image": noticia.imagenUrl ? [noticia.imagenUrl] : undefined,
    "datePublished": isNaN(fecha?.getTime?.()) ? undefined : fecha.toISOString(),
    "author": { "@type": "Organization", "name": "ATEEZ Argentina" },
    "publisher": {
      "@type": "Organization",
      "name": "ATEEZ Argentina",
      "logo": { "@type": "ImageObject", "url": "https://ateezargentina.com.ar/assets/img/logoATZ.jpeg" }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url }
  };
  let scriptTag = document.getElementById("jsonld-noticia");
  if (!scriptTag) {
    scriptTag = document.createElement("script");
    scriptTag.type = "application/ld+json";
    scriptTag.id = "jsonld-noticia";
    document.head.appendChild(scriptTag);
  }
  scriptTag.textContent = JSON.stringify(jsonLd);
}

function restaurarSeoPorDefecto() {
  document.title = "Noticias - ATEEZ Argentina";
  document.getElementById("meta-titulo").textContent = "Noticias - ATEEZ Argentina";
  document.getElementById("meta-descripcion").setAttribute("content", "Noticias de ATEEZ Argentina: novedades, comebacks y actualizaciones sobre ATEEZ y la comunidad Argentina de ATINY.");
  document.getElementById("jsonld-noticia")?.remove();
}

// ------------------------------------------------------------
// Enrutamiento inicial: detecta si hay que mostrar una noticia
// puntual, ya sea por pushState (slug en el path) o por el
// query param ?ruta= que llega desde el 404.html de GitHub Pages.
// ------------------------------------------------------------
function enrutar() {
  const params = new URLSearchParams(window.location.search);
  const rutaDesde404 = params.get("ruta");
  if (rutaDesde404) {
    history.replaceState({ slug: rutaDesde404 }, "", `./${rutaDesde404}`);
    renderDetalle(rutaDesde404);
    return;
  }

  const partes = window.location.pathname.split("/").filter(Boolean);
  const ultima = partes[partes.length - 1];
  const esArchivoIndex = !ultima || ultima === "noticias.html";
  if (!esArchivoIndex) {
    renderDetalle(ultima);
  } else {
    mostrarListado();
  }
}

enrutar();

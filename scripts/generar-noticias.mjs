// ============================================================
// GENERAR-NOTICIAS.MJS - ATEEZ ARGENTINA
//
// Problema que resuelve: el sitio es estático (GitHub Pages) y las noticias
// viven en Firestore. Una URL como /Noticias/mi-noticia no existe como
// archivo, así que GitHub Pages la contesta con un 404 y recién ahí el
// 404.html redirige. Para Google eso significa "página inexistente" y no la
// indexa (y además el contenido se arma con JavaScript).
//
// Qué hace este script: lee las noticias publicadas desde Firestore (lectura
// pública, no usa ninguna clave secreta) y genera por cada una un archivo real
//     Noticias/<slug>.html
// ya con título, descripción, Open Graph, datos estructurados (NewsArticle) y
// el texto de la noticia dentro del HTML. GitHub Pages lo sirve con código 200
// en la misma URL de siempre (/Noticias/<slug>, sin ".html").
// También regenera sitemap.xml con todas las noticias.
//
// Lo corre solo la GitHub Action (.github/workflows/noticias-seo.yml), pero
// también se puede correr a mano:   node scripts/generar-noticias.mjs
//
// Para probarlo sin internet:  NOTICIAS_MOCK=ruta/a/archivo.json node scripts/generar-noticias.mjs
// (el JSON tiene el mismo formato que devuelve la API REST de Firestore).
// ============================================================

import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOMINIO = "https://ateezargentina.com.ar";
const MARCA = "<!-- noticia-prerenderizada: generado automaticamente, no editar a mano -->";
const NOMBRES_RESERVADOS = new Set(["noticias", "index"]);

// ---------------------------------------------------------------- utilidades
const escapeHtml = (s = "") => String(s)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const absoluta = (url) => /^https?:\/\//i.test(url || "");

function urlAbsolutaDeImagen(url) {
  if (!url) return `${DOMINIO}/assets/img/AteezArgentinaLogo.png`;
  if (absoluta(url)) return url;
  return `${DOMINIO}/${String(url).replace(/^\.?\.?\//, "")}`;
}

// UTC a propósito: la fecha de una noticia se guarda a las 12:00 UTC (o a medianoche UTC en las
// viejas) y así se ve el mismo día que eligió quien la cargó (ver util.js, "FECHAS SIN HORA").
function fechaLarga(d) {
  return d ? d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";
}

// ------------------------------------------------- Firestore (API REST pública)
function leerConfigFirebase() {
  const txt = readFileSync(join(RAIZ, "assets/js/firebase-config.js"), "utf8");
  const projectId = txt.match(/projectId:\s*"([^"]+)"/)?.[1];
  const apiKey = txt.match(/apiKey:\s*"([^"]+)"/)?.[1];
  if (!projectId) throw new Error("No encontré projectId en assets/js/firebase-config.js");
  return { projectId, apiKey };
}

/** Convierte un valor de la API REST de Firestore ({stringValue: ..}) a un valor de JS. */
function valorFirestore(v) {
  if (!v || typeof v !== "object") return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("timestampValue" in v) return new Date(v.timestampValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(valorFirestore);
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, valorFirestore(x)]));
  return undefined;
}

async function cargarNoticias() {
  let documentos = [];

  if (process.env.NOTICIAS_MOCK) {
    documentos = JSON.parse(readFileSync(process.env.NOTICIAS_MOCK, "utf8")).documents || [];
  } else {
    const { projectId, apiKey } = leerConfigFirebase();
    let pageToken = "";
    do {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/noticias` +
        `?pageSize=200${apiKey ? `&key=${apiKey}` : ""}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Firestore respondió ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
      const data = await resp.json();
      documentos.push(...(data.documents || []));
      pageToken = data.nextPageToken || "";
    } while (pageToken);
  }

  return documentos.map(d => {
    const id = d.name.split("/").pop();
    const f = Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, valorFirestore(v)]));
    // Igual que en el sitio: si la noticia no tiene "slug", se usa el ID del documento.
    const slug = typeof f.slug === "string" && f.slug.trim() ? f.slug.trim() : id;
    return {
      id, slug,
      titulo: f.titulo || "",
      resumen: f.resumen || "",
      imagenUrl: f.imagenUrl || "",
      contenidoHtml: f.contenidoHtml || "",
      destacada: f.destacada === true,
      fechaPublicacion: f.fechaPublicacion instanceof Date ? f.fechaPublicacion : null,
      actualizadoEn: f.actualizadoEn instanceof Date ? f.actualizadoEn : (d.updateTime ? new Date(d.updateTime) : null),
      creadoEn: f.creadoEn instanceof Date ? f.creadoEn : (d.createTime ? new Date(d.createTime) : null)
    };
  })
  // Un slug raro (con barras, espacios, etc.) no puede ser un nombre de archivo seguro: se omite.
  .filter(n => n.titulo && /^[A-Za-z0-9_-]+$/.test(n.slug) && !NOMBRES_RESERVADOS.has(n.slug.toLowerCase()))
  .sort((a, b) => {
    if (a.destacada !== b.destacada) return a.destacada ? -1 : 1;
    const fa = (a.fechaPublicacion || a.creadoEn || 0), fb = (b.fechaPublicacion || b.creadoEn || 0);
    return fb - fa;
  });
}

// ------------------------------------------------------------ página de cada noticia
function reemplazar(html, patron, nuevo, descripcion) {
  if (!patron.test(html)) throw new Error(`La plantilla Noticias/noticias.html cambió: no encuentro ${descripcion}. Actualizá scripts/generar-noticias.mjs.`);
  // "nuevo" puede ser un texto o una función (coincidencia) => texto. Se usa función y no
  // texto con "$1" para que un "$" dentro del contenido de una noticia no se interprete.
  return html.replace(patron, (...m) => (typeof nuevo === "function" ? nuevo(m) : nuevo));
}

function paginaDeNoticia(plantilla, n, todas) {
  const url = `${DOMINIO}/Noticias/${n.slug}`;
  const titulo = `${n.titulo} - ATEEZ Argentina`;
  const descripcion = n.resumen || `${n.titulo}. Noticias de ATEEZ Argentina, la comunidad argentina de ATINY.`;
  const imagen = urlAbsolutaDeImagen(n.imagenUrl);
  const fecha = n.fechaPublicacion || n.creadoEn;
  const modificado = n.actualizadoEn || fecha;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: n.titulo,
    description: descripcion,
    image: [imagen],
    ...(fecha ? { datePublished: fecha.toISOString() } : {}),
    ...(modificado ? { dateModified: modificado.toISOString() } : {}),
    author: { "@type": "Organization", name: "ATEEZ Argentina" },
    publisher: { "@type": "Organization", name: "ATEEZ Argentina", logo: { "@type": "ImageObject", url: `${DOMINIO}/assets/img/AteezArgentinaLogo.png` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": url }
  };

  const otras = todas.filter(x => x.slug !== n.slug).slice(0, 4);
  const asideHtml = otras.length
    ? otras.map(o => `
                        <a href="./${o.slug}" data-slug="${o.slug}" class="aside-noticia">
                            <img src="${escapeHtml(o.imagenUrl || "../assets/img/AteezArgentinaLogo.png")}" alt="${escapeHtml(o.titulo)}" loading="lazy">
                            <div>
                                <span>${escapeHtml(fechaLarga(o.fechaPublicacion || o.creadoEn))}</span>
                                <h6>${escapeHtml(o.titulo)}</h6>
                            </div>
                        </a>`).join("")
    : "";

  let h = plantilla;
  h = reemplazar(h, /<title id="meta-titulo">[\s\S]*?<\/title>/, `<title id="meta-titulo">${escapeHtml(titulo)}</title>`, "<title id=meta-titulo>");
  h = reemplazar(h, /<meta id="meta-descripcion" name="description" content="[^"]*">/, `<meta id="meta-descripcion" name="description" content="${escapeHtml(descripcion)}">`, "meta description");
  h = reemplazar(h, /<meta id="og-titulo" property="og:title" content="[^"]*">/, `<meta id="og-titulo" property="og:title" content="${escapeHtml(titulo)}">`, "og:title");
  h = reemplazar(h, /<meta id="og-descripcion" property="og:description" content="[^"]*">/, `<meta id="og-descripcion" property="og:description" content="${escapeHtml(descripcion)}">`, "og:description");
  h = reemplazar(h, /<meta id="og-imagen" property="og:image" content="[^"]*">/, `<meta id="og-imagen" property="og:image" content="${escapeHtml(imagen)}">\n    <meta name="twitter:card" content="summary_large_image">\n    <meta name="twitter:title" content="${escapeHtml(titulo)}">\n    <meta name="twitter:description" content="${escapeHtml(descripcion)}">\n    <meta name="twitter:image" content="${escapeHtml(imagen)}">`, "og:image");
  h = reemplazar(h, /<meta id="og-url" property="og:url" content="[^"]*">/, `<meta id="og-url" property="og:url" content="${url}">`, "og:url");
  h = reemplazar(h, /<link id="canonical" rel="canonical" href="[^"]*">/, `<link id="canonical" rel="canonical" href="${url}">`, "canonical");
  h = reemplazar(h, /<\/head>/, `    <script type="application/ld+json" id="jsonld-noticia">${JSON.stringify(jsonLd).replaceAll("<", "\\u003c")}</script>\n</head>`, "</head>");

  // Vista de lista oculta y vista de detalle visible desde el HTML (sin esperar a JavaScript).
  h = reemplazar(h, /(<section class="container section" id="vista-lista-noticias")>/, (m) => `${m[1]} style="display:none;">`, "vista-lista-noticias");
  h = reemplazar(h, /(<section class="container section" id="vista-detalle-noticia") style="display:none;">/, (m) => `${m[1]}>`, "vista-detalle-noticia");
  h = reemplazar(h, /<h1 id="detalle-titulo"><\/h1>/, `<h1 id="detalle-titulo">${escapeHtml(n.titulo)}</h1>`, "detalle-titulo");
  h = reemplazar(h, /<span id="detalle-fecha"><\/span>/, `<span id="detalle-fecha">${escapeHtml(fechaLarga(fecha))}</span>`, "detalle-fecha");
  h = reemplazar(h, /<img id="detalle-imagen" src="" alt="" class="detalle-imagen-principal">/, `<img id="detalle-imagen" src="${escapeHtml(n.imagenUrl || "../assets/img/AteezArgentinaLogo.png")}" alt="${escapeHtml(n.titulo)}" class="detalle-imagen-principal">`, "detalle-imagen");
  h = reemplazar(h, /<div id="detalle-contenido" class="detalle-cuerpo"><\/div>/, `<div id="detalle-contenido" class="detalle-cuerpo">${n.contenidoHtml}</div>`, "detalle-contenido");
  if (n.destacada) h = reemplazar(h, /(<span id="detalle-destacada" class="noticia-destacada-detalle") style="display:none;">/, (m) => `${m[1]}>`, "detalle-destacada");
  if (asideHtml) h = reemplazar(h, /<div id="aside-recomendadas"><\/div>/, `<div id="aside-recomendadas">${asideHtml}\n                    </div>`, "aside-recomendadas");

  return h.replace("<!DOCTYPE html>", `<!DOCTYPE html>\n${MARCA}`);
}

// ---------------------------------------------------------------------- sitemap
function sitemapXml(noticias) {
  const fijas = [
    ["/", "weekly", "1.0"], ["/evento/", "weekly", "0.9"], ["/Noticias/noticias.html", "daily", "0.9"], ["/contenido.html", "weekly", "0.7"],
    ["/comeback/", "weekly", "0.8"], ["/aniversario/", "monthly", "0.7"]
  ].map(([loc, freq, prio]) => `  <url>\n    <loc>${DOMINIO}${loc}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`);

  const items = noticias.map(n => {
    const d = n.actualizadoEn || n.fechaPublicacion || n.creadoEn;
    return `  <url>\n    <loc>${DOMINIO}/Noticias/${n.slug}</loc>${d ? `\n    <lastmod>${d.toISOString().slice(0, 10)}</lastmod>` : ""}\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...fijas, ...items].join("\n")}\n</urlset>\n`;
}

// ------------------------------------------------------------------------ main
function escribirSiCambio(ruta, contenido) {
  if (existsSync(ruta) && readFileSync(ruta, "utf8") === contenido) return false;
  writeFileSync(ruta, contenido);
  return true;
}

const noticias = await cargarNoticias();
if (noticias.length === 0 && !process.env.NOTICIAS_MOCK && !process.env.PERMITIR_VACIO) {
  // Si por un error de lectura vinieran 0 noticias, NO se borra nada del sitio.
  console.log("Firestore devolvió 0 noticias: no se toca nada (PERMITIR_VACIO=1 para forzar).");
  process.exit(0);
}

const plantilla = readFileSync(join(RAIZ, "Noticias/noticias.html"), "utf8");
const carpeta = join(RAIZ, "Noticias");
let escritas = 0;
const esperados = new Set();

for (const n of noticias) {
  const archivo = `${n.slug}.html`;
  esperados.add(archivo);
  if (escribirSiCambio(join(carpeta, archivo), paginaDeNoticia(plantilla, n, noticias))) escritas++;
}

// Borra las páginas generadas de noticias que ya no existen (solo archivos con la marca).
let borradas = 0;
for (const archivo of readdirSync(carpeta)) {
  if (!archivo.endsWith(".html") || esperados.has(archivo)) continue;
  if (readFileSync(join(carpeta, archivo), "utf8").includes(MARCA)) { unlinkSync(join(carpeta, archivo)); borradas++; }
}

const sitemapCambio = escribirSiCambio(join(RAIZ, "sitemap.xml"), sitemapXml(noticias));
console.log(`Noticias: ${noticias.length} · páginas escritas/actualizadas: ${escritas} · borradas: ${borradas} · sitemap ${sitemapCambio ? "actualizado" : "sin cambios"}`);

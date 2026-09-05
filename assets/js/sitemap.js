// ============================================================
// SITEMAP.JS - ATEEZ ARGENTINA
// Arma el XML del sitemap incluyendo las noticias y eventos
// cargados hasta el momento. Se usa desde el panel admin
// (pestaña Apariencia > "Descargar sitemap.xml actualizado"),
// ya que al ser un sitio 100% estático no hay forma de generarlo
// automáticamente en el servidor.
// ============================================================

const DOMINIO = "https://ateezargentina.com.ar";

const PAGINAS_FIJAS = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/evento/", changefreq: "weekly", priority: "0.9" },
  { loc: "/Noticias/noticias.html", changefreq: "daily", priority: "0.9" },
  { loc: "/contenido.html", changefreq: "weekly", priority: "0.7" },
  { loc: "/terminos.html", changefreq: "yearly", priority: "0.2" }
];

function fechaISO(fecha) {
  const d = fecha?.toDate ? fecha.toDate() : new Date(fecha);
  return isNaN(d?.getTime?.()) ? "" : d.toISOString().slice(0, 10);
}

export function generarSitemapXml({ noticias = [] } = {}) {
  const urls = [
    ...PAGINAS_FIJAS.map(p => `  <url>\n    <loc>${DOMINIO}${p.loc}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`),
    ...noticias.map(n => {
      const fecha = fechaISO(n.fechaPublicacion || n.actualizadoEn);
      return `  <url>\n    <loc>${DOMINIO}/Noticias/${n.slug}</loc>${fecha ? `\n    <lastmod>${fecha}</lastmod>` : ""}\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
    })
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function descargarSitemap(xml) {
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sitemap.xml";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

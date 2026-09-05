// ============================================================
// IMAGENES.JS - ATEEZ ARGENTINA
// Como no usamos Firebase Storage (pide plan pago), las imágenes
// se cargan pegando una URL. Esta función detecta links "para
// compartir" de Google Drive y los convierte automáticamente en
// una URL que sirve como imagen directa.
// ============================================================

/**
 * Si `url` es un link de Google Drive (de los que da el botón "Compartir"),
 * devuelve una URL que funciona como imagen directa. Si no reconoce el
 * formato, devuelve la URL tal cual la pegaron.
 */
export function normalizarUrlImagen(url = "") {
  const limpia = url.trim();
  if (!limpia) return limpia;

  const patrones = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,   // .../file/d/<ID>/view?usp=sharing
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,   // .../open?id=<ID>
    /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,     // .../uc?id=<ID>&export=...
    /[?&]id=([a-zA-Z0-9_-]+)/                          // cualquier otra variante con ?id=<ID>
  ];

  for (const patron of patrones) {
    const match = limpia.match(patron);
    if (match) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
  }

  return limpia;
}

/** True si el link parece ser de Google Drive (para mostrar el aviso de conversión). */
export function esLinkDeDrive(url = "") {
  return /drive\.google\.com/.test(url);
}

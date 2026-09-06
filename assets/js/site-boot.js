// ============================================================
// SITE-BOOT.JS - ATEEZ ARGENTINA
// Punto único de arranque para TODAS las páginas del sitio
// (incluido /admin). Antes cada página tenía su propio script
// inline llamando a montarHeader/montarFooter y solo index.html
// aplicaba el tema — por eso el cambio de colores/logo desde el
// panel "solo afectaba a la home". Ahora toda página usa esta
// única función, así queda garantizado que el header, el footer,
// el tema de colores y el modal de Términos son siempre
// consistentes en todo el sitio.
//
// Uso en cada página:
//   <script type="module">
//     import { iniciarSitio } from "RUTA/assets/js/site-boot.js";
//     iniciarSitio({ base: "RUTA_RELATIVA_A_LA_RAIZ/", activo: "eventos" });
//   </script>
// ============================================================

import { obtenerConfigSitio, escucharConfigSitio, aplicarTemaEnPagina } from "./config-sitio.js";
import { montarHeader, montarFooter, montarModalTerminos } from "./components.js";

export async function iniciarSitio({ base = "", activo = "" } = {}) {
  // Primer valor: se resuelve rápido si Firestore tiene cache local.
  const config = await obtenerConfigSitio();
  montarHeader({ base, activo, config });
  montarFooter({ base, config });
  montarModalTerminos();
  aplicarTemaEnPagina(config);

  // Si el admin cambia algo mientras alguien está navegando, se actualiza
  // en vivo sin que la persona tenga que recargar la página.
  escucharConfigSitio((configNuevo) => {
    aplicarTemaEnPagina(configNuevo);
    montarHeader({ base, activo, config: configNuevo });
    montarFooter({ base, config: configNuevo });
  });
}

// ============================================================
// ADMIN.JS - Panel de Administracion ATEEZ Argentina
// ============================================================

import { iniciarSitio } from "../assets/js/site-boot.js";
import { renderFooter, ICONO_RED } from "../assets/js/components.js";
import {
  registrarConEmail, loginConEmail, loginConGoogle, logout, obtenerPerfil,
  escucharAuth, traducirErrorAuth, listarUsuarios, asignarRol, recuperarContrasena, actualizarMiFanbase,
  actualizarPermisoColores, asignarFanbase
} from "../assets/js/auth.js";
import { escucharPosts, crearPost, editarPost, eliminarPost, marcarPostDestacado, CATEGORIAS } from "../assets/js/posts.js";
import {
  escucharNoticias, crearNoticia, editarNoticia, eliminarNoticia, marcarDestacada
} from "../assets/js/noticias.js";
import {
  escucharContenido, crearContenido, editarContenido, eliminarContenido, CATEGORIAS_CONTENIDO
} from "../assets/js/contenido.js";
import {
  escucharFanbases, crearFanbase, editarFanbase, eliminarFanbase, listarFanbases, REDES_DISPONIBLES
} from "../assets/js/fanbases.js";
import { escucharGaleria, agregarFotoGaleria, eliminarFotoGaleria } from "../assets/js/galeria.js";
import {
  PALETAS_PREDEFINIDAS, obtenerConfigSitio, actualizarConfigSitio, aplicarTemaEnElemento, conLogoResuelto,
  REDES_SOCIALES_POR_DEFECTO
} from "../assets/js/config-sitio.js";
import { normalizarUrlImagen } from "../assets/js/imagenes.js";
import { completarFanbaseEnContenido } from "../assets/js/fanbase-contenido.js";
import { generarSitemapXml, descargarSitemap } from "../assets/js/sitemap.js";
import { paises } from "../assets/js/paises.js";
import { formatearFechaCorta, eventoVencido, eventoPorVencer, escapeHtml, extraerIdYoutube, fechaAInput, hoyParaInput } from "../assets/js/util.js";

iniciarSitio({ base: "../" });

// ------------------------------------------------------------
// Vistas
// ------------------------------------------------------------
const vistas = {
  cargando: document.getElementById("vista-cargando"),
  auth: document.getElementById("vista-auth"),
  pendiente: document.getElementById("vista-pendiente"),
  dashboard: document.getElementById("vista-dashboard")
};
function mostrarVista(nombre) {
  Object.entries(vistas).forEach(([clave, el]) => {
    if (el) el.style.display = clave === nombre ? "" : "none";
  });
}

// ------------------------------------------------------------
// Pais / dial en registro
// ------------------------------------------------------------
const selectPais = document.getElementById("reg-pais");
const spanDial = document.getElementById("reg-dial");
if (selectPais) {
  selectPais.innerHTML = paises.map(p => `<option value="${p.codigo}" data-dial="${p.dial}">${p.nombre}</option>`).join("");
  selectPais.addEventListener("change", () => {
    const opt = selectPais.selectedOptions[0];
    spanDial.textContent = opt ? opt.dataset.dial : "+";
  });
}

// ------------------------------------------------------------
// Fanbase: se muestra tanto en el registro como en la pantalla de
// espera (para quienes entran con Google, que no pasan por el form).
// ------------------------------------------------------------
let cacheFanbasesRegistro = [];
async function cargarSelectsDeFanbase() {
  try {
    cacheFanbasesRegistro = await listarFanbases();
    const opciones = cacheFanbasesRegistro.map(f => `<option value="${f.id}">${f.nombre}</option>`).join("");
    const selectRegistro = document.getElementById("reg-fanbase");
    const selectPendiente = document.getElementById("pendiente-fanbase");
    if (selectRegistro) selectRegistro.insertAdjacentHTML("beforeend", opciones);
    if (selectPendiente) selectPendiente.insertAdjacentHTML("beforeend", opciones);
  } catch (err) {
    console.warn("No se pudieron cargar las fanbases para el selector:", err);
  }
}
cargarSelectsDeFanbase();

// ------------------------------------------------------------
// Login / registro / Google / logout
// ------------------------------------------------------------
const formLogin = document.getElementById("form-login");
const loginError = document.getElementById("login-error");
formLogin?.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.style.display = "none";
  document.getElementById("login-ok").style.display = "none";
  try {
    await loginConEmail(document.getElementById("login-email").value.trim(), document.getElementById("login-password").value);
  } catch (err) {
    loginError.textContent = traducirErrorAuth(err);
    loginError.style.display = "block";
  }
});

const formRegistro = document.getElementById("form-registro");
const registroError = document.getElementById("registro-error");
formRegistro?.addEventListener("submit", async (e) => {
  e.preventDefault();
  registroError.style.display = "none";

  if (!document.getElementById("reg-terminos").checked) {
    registroError.textContent = "Tenés que aceptar los Términos y Condiciones para registrarte.";
    registroError.style.display = "block";
    return;
  }

  const nombreCompleto = document.getElementById("reg-nombre").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const fechaNacimiento = document.getElementById("reg-fecha").value;
  const paisCodigo = selectPais.value;
  const celular = `${spanDial.textContent} ${document.getElementById("reg-celular").value.trim()}`;
  const fanbase = document.getElementById("reg-fanbase")?.value || null;

  try {
    await registrarConEmail({ email, password, nombreCompleto, fechaNacimiento, celular, pais: paisCodigo, fanbase });
  } catch (err) {
    registroError.textContent = traducirErrorAuth(err);
    registroError.style.display = "block";
  }
});

document.getElementById("btn-guardar-fanbase-pendiente")?.addEventListener("click", async () => {
  if (!usuarioActual) return;
  const valor = document.getElementById("pendiente-fanbase").value || null;
  const okEl = document.getElementById("pendiente-fanbase-ok");
  try {
    await actualizarMiFanbase(usuarioActual.uid, valor);
    usuarioActual.fanbase = valor;
    okEl.style.display = "block";
    setTimeout(() => { okEl.style.display = "none"; }, 2500);
  } catch (err) {
    console.error(err);
    alert("No se pudo guardar: " + (err.message || err));
  }
});

document.getElementById("btn-google")?.addEventListener("click", async () => {
  loginError.style.display = "none";
  try { await loginConGoogle(); } catch (err) {
    loginError.textContent = traducirErrorAuth(err);
    loginError.style.display = "block";
  }
});

document.getElementById("btn-olvide-contrasena")?.addEventListener("click", async () => {
  const loginOk = document.getElementById("login-ok");
  loginError.style.display = "none";
  loginOk.style.display = "none";
  const email = document.getElementById("login-email").value.trim();
  if (!email) {
    loginError.textContent = "Escribí tu email arriba primero, y después tocá \"¿Olvidaste tu contraseña?\".";
    loginError.style.display = "block";
    return;
  }
  try {
    await recuperarContrasena(email);
    loginOk.textContent = `Te mandamos un link para restablecer la contraseña a ${email}. Revisá spam si no lo ves.`;
    loginOk.style.display = "block";
  } catch (err) {
    loginError.textContent = traducirErrorAuth(err);
    loginError.style.display = "block";
  }
});

document.getElementById("btn-logout")?.addEventListener("click", () => logout());
document.getElementById("btn-logout-pendiente")?.addEventListener("click", () => logout());

// ------------------------------------------------------------
// Estado global
// ------------------------------------------------------------
let usuarioActual = null;
let mapaUsuarios = {}; // uid -> perfil, para mostrar "responsable"
const desuscribir = { posts: null, noticias: null, contenido: null, fanbases: null, galeria: null };

escucharAuth(async (user) => {
  Object.keys(desuscribir).forEach(k => { if (desuscribir[k]) { desuscribir[k](); desuscribir[k] = null; } });

  if (!user) {
    usuarioActual = null;
    mostrarVista("auth");
    return;
  }

  mostrarVista("cargando");
  const perfil = await obtenerPerfil(user.uid);

  if (!perfil || !perfil.rol) {
    usuarioActual = perfil ? { uid: user.uid, ...perfil } : { uid: user.uid, rol: null };
    mostrarVista("pendiente");
    const selectPendiente = document.getElementById("pendiente-fanbase");
    if (selectPendiente) selectPendiente.value = usuarioActual.fanbase || "";
    return;
  }

  usuarioActual = { uid: user.uid, ...perfil };
  iniciarDashboard();
});

async function iniciarDashboard() {
  mostrarVista("dashboard");
  const esAdmin = usuarioActual.rol === "admin";
  // El admin siempre puede usar la pestaña Apariencia (colores). Un colaborador
  // solo si el admin se lo habilitó desde la pestaña Usuarios.
  const puedeColores = esAdmin || usuarioActual.puedeEditarColores === true;

  // Para mostrar el nombre de mi fanbase en el saludo (si ya las cargó el selector del registro, no se pide de nuevo).
  if (cacheFanbasesRegistro.length === 0) cacheFanbasesRegistro = await listarFanbases().catch(() => []);

  // La sección Fanbases la ve el admin (todas) y el colaborador que pertenece a una fanbase
  // (solo la suya, como "Mi sede"). Un fan independiente no la ve.
  const tieneSede = !esAdmin && !!usuarioActual.fanbase;
  const puedeVerFanbases = esAdmin || tieneSede;

  pintarSaludo(esAdmin, puedeColores);
  document.querySelectorAll(".admin-only").forEach(el => { el.style.display = esAdmin ? "" : "none"; });
  document.querySelectorAll(".colores-only").forEach(el => { el.style.display = puedeColores ? "" : "none"; });
  document.getElementById("tab-fanbases-item").style.display = puedeVerFanbases ? "" : "none";
  document.getElementById("tab-fanbases-btn").textContent = esAdmin ? "Fanbases" : "Mi sede";
  document.getElementById("fanbases-titulo").textContent = esAdmin ? "Fanbases / Sedes" : "Mi sede";
  document.getElementById("fanbases-aviso-colab").style.display = esAdmin ? "none" : "";

  if (esAdmin) {
    try {
      const usuarios = await listarUsuarios();
      mapaUsuarios = Object.fromEntries(usuarios.map(u => [u.id, u]));
    } catch (err) { console.error(err); }
  } else {
    mapaUsuarios[usuarioActual.uid] = usuarioActual;
  }

  cargarPublicaciones();
  cargarNoticias();
  cargarContenido();
  if (puedeColores) cargarApariencia(esAdmin);
  if (puedeVerFanbases) cargarFanbases();
  if (esAdmin) {
    cargarUsuarios();
    cargarGaleria();
  }
}

function nombreResponsable(uid) {
  const u = mapaUsuarios[uid];
  return u ? (u.nombreCompleto || u.email || "Sin nombre") : "Usuario desconocido";
}

// ------------------------------------------------------------
// Permisos y visibilidad por fanbase
//  - Admin: ve y toca todo.
//  - Colaborador con fanbase: VE lo que cargó cualquier persona de su fanbase
//    (solo lectura), pero solo EDITA/BORRA lo que cargó él mismo.
//  - Colaborador independiente (sin fanbase): ve solo lo suyo.
// Las reglas de Firestore hacen cumplir lo de editar/borrar del lado del servidor.
// ------------------------------------------------------------
function esAdminActual() { return usuarioActual?.rol === "admin"; }
function miFanbase() { return usuarioActual?.fanbase || null; }

function puedeTocar(item) {
  return esAdminActual() || item.creadoPor === usuarioActual.uid;
}

function esVisibleEnPanel(item) {
  if (esAdminActual() || item.creadoPor === usuarioActual.uid) return true;
  return !!miFanbase() && item.fanbaseId === miFanbase();
}

/** Los colaboradores no pueden leer perfiles ajenos, así que el nombre viaja guardado en el propio item. */
function nombreResponsableDe(item) {
  const u = mapaUsuarios[item.creadoPor];
  return u ? (u.nombreCompleto || u.email || "Sin nombre") : (item.creadoPorNombre || "Usuario desconocido");
}

/** Etiqueta con la fanbase del item, o "Independiente" si lo cargó un fan sin fanbase. */
function etiquetaFanbaseDe(item) {
  if (!item.fanbaseId) return `<span class="badge-fanbase independiente">Independiente</span>`;
  const nombre = cacheFanbasesRegistro.find(f => f.id === item.fanbaseId)?.nombre || "Fanbase eliminada";
  return `<span class="badge-fanbase">${escapeHtml(nombre)}</span>`;
}

function lineaResponsable(item) {
  const partes = [];
  if (esAdminActual() || item.creadoPor !== usuarioActual.uid) partes.push(`Cargado por: ${escapeHtml(nombreResponsableDe(item))}`);
  // El admin ve la fanbase de todo; un colaborador de fanbase también (ve lo de su equipo).
  // Un colaborador independiente solo ve lo suyo, así que ahí la etiqueta sobra.
  if (esAdminActual() || miFanbase()) partes.push(etiquetaFanbaseDe(item));
  return partes.length ? `<p class="responsable">${partes.join(" \u00b7 ")}</p>` : "";
}

function accionesItem(item) {
  if (!puedeTocar(item)) {
    return `<span class="solo-lectura" title="Lo cargó otra persona de tu fanbase: solo la puede editar quien lo cargó"><i class="bi bi-eye"></i> Solo lectura</span>`;
  }
  return `<button type="button" class="editar" title="Editar" data-id="${item.id}"><i class="bi bi-pencil"></i></button>
                  <button type="button" class="eliminar" title="Eliminar" data-id="${item.id}"><i class="bi bi-trash"></i></button>`;
}

/** Datos del autor que se guardan en cada evento/noticia/contenido nuevo. */
function datosDeAutor() {
  return {
    uid: usuarioActual.uid,
    fanbaseId: miFanbase(),
    autorNombre: usuarioActual.nombreCompleto || usuarioActual.email || ""
  };
}

function pintarSaludo(esAdmin, puedeColores) {
  const nombreFb = usuarioActual.fanbase
    ? (cacheFanbasesRegistro.find(f => f.id === usuarioActual.fanbase)?.nombre || "fanbase eliminada")
    : "";
  document.getElementById("saludo-usuario").textContent =
    `Hola, ${usuarioActual.nombreCompleto || usuarioActual.email} \u00b7 Rol: ${esAdmin ? "Administrador" : "Colaborador"}` +
    ` \u00b7 ${nombreFb ? "Fanbase: " + nombreFb : "Fan independiente"}` +
    (!esAdmin && puedeColores ? " \u00b7 Colores habilitados" : "");
}

// ==============================================================
// EVENTOS (antes "Publicaciones")
// ==============================================================
const listaPublicacionesEl = document.getElementById("lista-publicaciones");
const modalPublicacion = new bootstrap.Modal(document.getElementById("modalPublicacion"));
const formPublicacion = document.getElementById("form-publicacion");
const publicacionError = document.getElementById("publicacion-error");
const avisoVencimiento = document.getElementById("aviso-vencimiento");
let cachePosts = [];

function etiquetaCategoria(valor) {
  return CATEGORIAS.find(c => c.valor === valor)?.etiqueta || "Otro";
}

function cargarPublicaciones() {
  desuscribir.posts = escucharPosts(
    (posts) => {
      cachePosts = posts;
      const visibles = posts.filter(esVisibleEnPanel);

      if (visibles.length === 0) {
        listaPublicacionesEl.innerHTML = `<p class="text-muted">Todavía no hay eventos cargados.</p>`;
      } else {
        listaPublicacionesEl.innerHTML = visibles.map(p => {
          const vencido = eventoVencido(p.fechaEvento);
          return `
          <div class="admin-list-item" data-id="${p.id}">
              <div class="item-info">
                  <h5><span class="badge-categoria">${etiquetaCategoria(p.categoria)}</span>${escapeHtml(p.titulo)}
                      ${p.destacado ? '<i class="bi bi-star-fill estrella-evento" title="Evento destacado"></i>' : ''}
                      ${vencido ? '<span class="badge-estado vencido">Inactivo</span>' : ''}</h5>
                  <p>${escapeHtml(p.descripcion)} \u00b7 ${formatearFechaCorta(p.fechaEvento)}${p.horaEvento ? ` ${escapeHtml(p.horaEvento)} hs` : ''}${p.mostrarFecha === false ? ' <em class="nota-oculta">(fecha oculta al público)</em>' : ''}</p>
                  ${lineaResponsable(p)}
              </div>
              <div class="item-actions">
                  ${esAdminActual() ? `<button type="button" class="destacar ${p.destacado ? 'activa' : ''}" title="${p.destacado ? 'Quitar la estrella' : 'Destacar: aparece primero'}" data-id="${p.id}"><i class="bi ${p.destacado ? 'bi-star-fill' : 'bi-star'}"></i></button>` : ''}
                  ${accionesItem(p)}
              </div>
          </div>`;
        }).join("");
      }

      if (usuarioActual.rol === "admin") {
        const porVencer = posts.filter(p => eventoPorVencer(p.fechaEvento));
        if (porVencer.length > 0) {
          avisoVencimiento.style.display = "block";
          avisoVencimiento.innerHTML = `<i class="bi bi-exclamation-triangle"></i> ${porVencer.length} evento(s) van a pasar a
            inactivo en los próximos días (cumplen un año desde su fecha): ${porVencer.map(p => `<strong>${escapeHtml(p.titulo)}</strong> (cargado por ${escapeHtml(nombreResponsable(p.creadoPor))})`).join(", ")}.`;
        } else {
          avisoVencimiento.style.display = "none";
        }
      }
    },
    (err) => {
      listaPublicacionesEl.innerHTML = `<p class="text-muted">No se pudieron cargar los eventos: ${escapeHtml(err.message || String(err))}</p>`;
      console.error(err);
    }
  );
}

listaPublicacionesEl.addEventListener("click", async (e) => {
  const btnEditar = e.target.closest(".editar");
  const btnEliminar = e.target.closest(".eliminar");
  const btnDestacar = e.target.closest(".destacar");

  if (btnDestacar && esAdminActual()) {
    const post = cachePosts.find(p => p.id === btnDestacar.dataset.id);
    if (!post) return;
    try { await marcarPostDestacado(post.id, !post.destacado); } catch (err) { console.error(err); }
    return;
  }

  if (btnEditar) {
    const post = cachePosts.find(p => p.id === btnEditar.dataset.id);
    if (!post) return;
    document.getElementById("modalPublicacionTitulo").textContent = "Editar evento";
    document.getElementById("pub-id").value = post.id;
    document.getElementById("pub-titulo").value = post.titulo || "";
    document.getElementById("pub-descripcion").value = post.descripcion || "";
    document.getElementById("pub-link").value = post.link || "";
    document.getElementById("pub-categoria").value = post.categoria || "otro";
    document.getElementById("pub-fecha").value = fechaInputValue(post.fechaEvento);
    document.getElementById("pub-hora").value = post.horaEvento || "";
    document.getElementById("pub-mostrar-fecha").checked = post.mostrarFecha !== false;
    prepararFilaFanbase(post.fanbaseId, post.mostrarFanbase === true);
    publicacionError.style.display = "none";
    modalPublicacion.show();
  }
  if (btnEliminar) abrirConfirmarEliminar("evento", btnEliminar.dataset.id, () => eliminarPost(btnEliminar.dataset.id));
});

document.getElementById("btn-nueva-publicacion").addEventListener("click", () => {
  document.getElementById("modalPublicacionTitulo").textContent = "Nuevo evento";
  formPublicacion.reset();
  document.getElementById("pub-id").value = "";
  document.getElementById("pub-fecha").value = hoyParaInput();
  document.getElementById("pub-hora").value = "";
  document.getElementById("pub-mostrar-fecha").checked = true;
  prepararFilaFanbase(miFanbase(), false);
  publicacionError.style.display = "none";
  modalPublicacion.show();
});

/** La opción "mostrar mi fanbase" solo aparece si el evento pertenece a una fanbase (los independientes no tienen). */
function prepararFilaFanbase(fanbaseId, marcado) {
  const fila = document.getElementById("pub-fanbase-fila");
  fila.style.display = fanbaseId ? "" : "none";
  document.getElementById("pub-mostrar-fanbase").checked = !!fanbaseId && marcado;
  document.getElementById("pub-fanbase-nombre").textContent =
    cacheFanbasesRegistro.find(f => f.id === fanbaseId)?.nombre || "tu fanbase";
}

formPublicacion.addEventListener("submit", async (e) => {
  e.preventDefault();
  publicacionError.style.display = "none";
  const id = document.getElementById("pub-id").value;
  const datos = {
    titulo: document.getElementById("pub-titulo").value.trim(),
    descripcion: document.getElementById("pub-descripcion").value.trim(),
    link: document.getElementById("pub-link").value.trim(),
    categoria: document.getElementById("pub-categoria").value,
    fechaEvento: document.getElementById("pub-fecha").value,
    horaEvento: document.getElementById("pub-hora").value,
    mostrarFecha: document.getElementById("pub-mostrar-fecha").checked,
    mostrarFanbase: document.getElementById("pub-fanbase-fila").style.display !== "none"
      && document.getElementById("pub-mostrar-fanbase").checked
  };
  try {
    if (id) await editarPost(id, datos); else await crearPost({ ...datos, ...datosDeAutor() });
    modalPublicacion.hide();
  } catch (err) {
    console.error(err);
    publicacionError.textContent = `No se pudo guardar: ${err.message || err}`;
    publicacionError.style.display = "block";
  }
});

function fechaInputValue(fecha) {
  return fechaAInput(fecha);
}

// ==============================================================
// ELIMINACION GENERICA (modal compartido)
// ==============================================================
const modalConfirmarEliminar = new bootstrap.Modal(document.getElementById("modalConfirmarEliminar"));
let accionEliminar = null;
function abrirConfirmarEliminar(tipoTexto, id, accion) {
  document.getElementById("modalConfirmarEliminarTitulo").textContent = `¿Eliminar ${tipoTexto}?`;
  accionEliminar = accion;
  modalConfirmarEliminar.show();
}
document.getElementById("btn-confirmar-eliminar").addEventListener("click", async () => {
  if (!accionEliminar) return;
  try { await accionEliminar(); } catch (err) { console.error(err); }
  finally { accionEliminar = null; modalConfirmarEliminar.hide(); }
});

// ==============================================================
// NOTICIAS
// ==============================================================
const listaNoticiasEl = document.getElementById("lista-noticias");
const modalNoticia = new bootstrap.Modal(document.getElementById("modalNoticia"));
const formNoticia = document.getElementById("form-noticia");
const noticiaError = document.getElementById("noticia-error");
const editorContenido = document.getElementById("not-contenido");
let cacheNoticias = [];
let tituloOriginalEdicion = "";

function cargarNoticias() {
  desuscribir.noticias = escucharNoticias(
    (noticias) => {
      cacheNoticias = noticias;
      const visibles = noticias.filter(esVisibleEnPanel);

      if (visibles.length === 0) {
        listaNoticiasEl.innerHTML = `<p class="text-muted">Todavía no hay noticias cargadas.</p>`;
        return;
      }
      listaNoticiasEl.innerHTML = visibles.map(n => `
        <div class="admin-list-item" data-id="${n.id}">
            <div class="item-info">
                <h5>${escapeHtml(n.titulo)}</h5>
                <p>${escapeHtml(n.resumen || "")} \u00b7 ${formatearFechaCorta(n.fechaPublicacion)}</p>
                ${lineaResponsable(n)}
            </div>
            <div class="item-actions">
                ${usuarioActual.rol === 'admin' ? `<button type="button" class="destacar ${n.destacada ? 'activa' : ''}" title="Destacar" data-id="${n.id}"><i class="bi ${n.destacada ? 'bi-star-fill' : 'bi-star'}"></i></button>` : ''}
                ${accionesItem(n)}
            </div>
        </div>`).join("");
    },
    (err) => { listaNoticiasEl.innerHTML = `<p class="text-muted">No se pudieron cargar las noticias: ${escapeHtml(err.message || String(err))}</p>`; console.error(err); }
  );
}

listaNoticiasEl.addEventListener("click", async (e) => {
  const btnEditar = e.target.closest(".editar");
  const btnEliminar = e.target.closest(".eliminar");
  const btnDestacar = e.target.closest(".destacar");

  if (btnDestacar) {
    const n = cacheNoticias.find(x => x.id === btnDestacar.dataset.id);
    try { await marcarDestacada(n.id, !n.destacada); } catch (err) { console.error(err); }
    return;
  }
  if (btnEditar) {
    const n = cacheNoticias.find(x => x.id === btnEditar.dataset.id);
    if (!n) return;
    document.getElementById("modalNoticiaTitulo").textContent = "Editar noticia";
    document.getElementById("not-id").value = n.id;
    document.getElementById("not-titulo").value = n.titulo || "";
    document.getElementById("not-resumen").value = n.resumen || "";
    document.getElementById("not-imagen-url").value = n.imagenUrl || "";
    document.getElementById("not-fecha").value = fechaInputValue(n.fechaPublicacion);
    editorContenido.innerHTML = n.contenidoHtml || "";
    tituloOriginalEdicion = n.titulo || "";
    noticiaError.style.display = "none";
    actualizarPreviewNoticia();
    modalNoticia.show();
  }
  if (btnEliminar) abrirConfirmarEliminar("noticia", btnEliminar.dataset.id, () => eliminarNoticia(btnEliminar.dataset.id));
});

document.getElementById("btn-nueva-noticia").addEventListener("click", () => {
  document.getElementById("modalNoticiaTitulo").textContent = "Nueva noticia";
  formNoticia.reset();
  document.getElementById("not-id").value = "";
  document.getElementById("not-fecha").value = hoyParaInput();
  editorContenido.innerHTML = "";
  tituloOriginalEdicion = "";
  noticiaError.style.display = "none";
  actualizarPreviewNoticia();
  modalNoticia.show();
});

// Barra de edicion simple (contenteditable + execCommand)
document.querySelectorAll(".editor-toolbar button").forEach(btn => {
  btn.addEventListener("click", () => {
    editorContenido.focus();
    const cmd = btn.dataset.cmd;
    if (cmd === "createLink") {
      const url = prompt("Pegá el link:");
      if (url) document.execCommand(cmd, false, url);
    } else if (cmd === "formatBlock") {
      document.execCommand(cmd, false, btn.dataset.valor);
    } else {
      document.execCommand(cmd, false, null);
    }
    actualizarPreviewNoticia();
  });
});

["input", "keyup"].forEach(evt => editorContenido.addEventListener(evt, actualizarPreviewNoticia));
["not-titulo", "not-fecha"].forEach(id => document.getElementById(id).addEventListener("input", actualizarPreviewNoticia));
document.getElementById("not-imagen-url").addEventListener("input", actualizarPreviewNoticia);

function actualizarPreviewNoticia() {
  document.getElementById("preview-titulo").textContent = document.getElementById("not-titulo").value || "Título de la noticia";
  document.getElementById("preview-contenido").innerHTML = editorContenido.innerHTML || "<p>Escribí el contenido para ver la vista previa acá.</p>";
  const fecha = document.getElementById("not-fecha").value;
  document.getElementById("preview-fecha").textContent = fecha ? formatearFechaCorta(fecha) : "Fecha";
  const img = document.getElementById("not-imagen-url").value;
  document.getElementById("preview-imagen").src = img || "../assets/img/AteezArgentinaLogo.png";
}

document.getElementById("not-imagen-url").addEventListener("blur", (e) => {
  e.target.value = normalizarUrlImagen(e.target.value);
  actualizarPreviewNoticia();
});

formNoticia.addEventListener("submit", async (e) => {
  e.preventDefault();
  noticiaError.style.display = "none";
  const id = document.getElementById("not-id").value;
  const titulo = document.getElementById("not-titulo").value.trim();
  const datos = {
    titulo,
    resumen: document.getElementById("not-resumen").value.trim(),
    imagenUrl: document.getElementById("not-imagen-url").value.trim(),
    fechaPublicacion: document.getElementById("not-fecha").value,
    contenidoHtml: editorContenido.innerHTML
  };
  try {
    if (id) {
      await editarNoticia(id, datos, titulo !== tituloOriginalEdicion);
    } else {
      await crearNoticia({ ...datos, ...datosDeAutor() });
    }
    modalNoticia.hide();
  } catch (err) {
    console.error(err);
    noticiaError.textContent = `No se pudo guardar la noticia: ${err.message || err}`;
    noticiaError.style.display = "block";
  }
});

// ==============================================================
// CONTENIDO (admin + colaborador)
// ==============================================================
const listaContenidoEl = document.getElementById("lista-contenido");
const modalContenido = new bootstrap.Modal(document.getElementById("modalContenido"));
const formContenido = document.getElementById("form-contenido");
const contenidoError = document.getElementById("contenido-error");
let cacheContenido = [];

function etiquetaCategoriaContenido(valor) {
  return CATEGORIAS_CONTENIDO.find(c => c.valor === valor)?.etiqueta || "Otro";
}

function cargarContenido() {
  desuscribir.contenido = escucharContenido(
    (items) => {
      cacheContenido = items;
      const visibles = items.filter(esVisibleEnPanel);

      if (visibles.length === 0) {
        listaContenidoEl.innerHTML = `<p class="text-muted">Todavía no hay contenido cargado.</p>`;
        return;
      }
      listaContenidoEl.innerHTML = visibles.map(c => `
        <div class="admin-list-item" data-id="${c.id}">
            <div class="item-info">
                <h5><span class="badge-categoria">${etiquetaCategoriaContenido(c.categoria)}</span>${escapeHtml(c.titulo)}
                    ${c.destacado ? '<span class="badge-destacado"><i class="bi bi-star-fill"></i> Destacado</span>' : ''}</h5>
                <p>${escapeHtml(c.descripcion)}</p>
                ${lineaResponsable(c)}
            </div>
            <div class="item-actions">
                ${accionesItem(c)}
            </div>
        </div>`).join("");
    },
    (err) => {
      listaContenidoEl.innerHTML = `<p class="text-muted">No se pudo cargar el contenido: ${escapeHtml(err.message || String(err))}</p>`;
      console.error(err);
    }
  );
}

listaContenidoEl.addEventListener("click", (e) => {
  const btnEditar = e.target.closest(".editar");
  const btnEliminar = e.target.closest(".eliminar");

  if (btnEditar) {
    const item = cacheContenido.find(c => c.id === btnEditar.dataset.id);
    if (!item) return;
    document.getElementById("modalContenidoTitulo").textContent = "Editar contenido";
    document.getElementById("cont-id").value = item.id;
    document.getElementById("cont-titulo").value = item.titulo || "";
    document.getElementById("cont-descripcion").value = item.descripcion || "";
    document.getElementById("cont-categoria").value = item.categoria || "otro";
    document.getElementById("cont-link").value = item.link || "";
    document.getElementById("cont-adjunto").value = item.adjunto || "";
    document.getElementById("cont-destacado").checked = item.destacado === true;
    contenidoError.style.display = "none";
    modalContenido.show();
  }
  if (btnEliminar) abrirConfirmarEliminar("contenido", btnEliminar.dataset.id, () => eliminarContenido(btnEliminar.dataset.id));
});

document.getElementById("btn-nuevo-contenido").addEventListener("click", () => {
  document.getElementById("modalContenidoTitulo").textContent = "Nuevo contenido";
  formContenido.reset();
  document.getElementById("cont-id").value = "";
  contenidoError.style.display = "none";
  modalContenido.show();
});

document.getElementById("cont-adjunto")?.addEventListener("blur", (e) => {
  e.target.value = normalizarUrlImagen(e.target.value);
});

formContenido.addEventListener("submit", async (e) => {
  e.preventDefault();
  contenidoError.style.display = "none";
  const id = document.getElementById("cont-id").value;
  const datos = {
    titulo: document.getElementById("cont-titulo").value.trim(),
    descripcion: document.getElementById("cont-descripcion").value.trim(),
    categoria: document.getElementById("cont-categoria").value,
    link: document.getElementById("cont-link").value.trim(),
    adjunto: normalizarUrlImagen(document.getElementById("cont-adjunto").value.trim())
  };

  // "Video destacado": solo lo puede tocar el admin (el interruptor ni se ve
  // para un colaborador, y las reglas de Firestore también lo impiden).
  if (usuarioActual.rol === "admin") {
    const destacado = document.getElementById("cont-destacado").checked;
    datos.destacado = destacado;
    if (destacado) {
      if (!extraerIdYoutube(datos.link)) {
        contenidoError.textContent = "Para destacarlo, el campo «Link» tiene que ser un link de YouTube (youtube.com/watch?v=… o youtu.be/…).";
        contenidoError.style.display = "block";
        return;
      }
      const otros = cacheContenido.filter(c => c.id !== id && c.destacado === true && extraerIdYoutube(c.link));
      if (otros.length >= 2) {
        contenidoError.textContent = `Ya hay 2 videos destacados (${otros.slice(0, 2).map(o => `«${o.titulo}»`).join(" y ")}). Sacale el destacado a uno antes de sumar otro.`;
        contenidoError.style.display = "block";
        return;
      }
    }
  }

  try {
    if (id) await editarContenido(id, datos); else await crearContenido({ ...datos, ...datosDeAutor() });
    modalContenido.hide();
  } catch (err) {
    console.error(err);
    contenidoError.textContent = `No se pudo guardar: ${err.message || err}`;
    contenidoError.style.display = "block";
  }
});

// ==============================================================
// FANBASES: el admin maneja todas; un colaborador solo edita su sede
// ==============================================================
const listaFanbasesEl = document.getElementById("lista-fanbases");
const modalFanbase = document.getElementById("modalFanbaseAdmin") ? new bootstrap.Modal(document.getElementById("modalFanbaseAdmin")) : null;
const formFanbase = document.getElementById("form-fanbase");
const fanbaseError = document.getElementById("fanbase-error");
const redesLista = document.getElementById("fb-redes-lista");
let cacheFanbases = [];

function cargarFanbases() {
  desuscribir.fanbases = escucharFanbases(
    (todas) => {
      cacheFanbasesRegistro = todas;
      if (esAdminActual()) dibujarUsuarios(); // por si se creó/renombró/borró una fanbase
      // El admin ve todas las fanbases; un colaborador solo la suya.
      const fanbases = esAdminActual() ? todas : todas.filter(f => f.id === miFanbase());
      cacheFanbases = fanbases;
      if (fanbases.length === 0) {
        listaFanbasesEl.innerHTML = `<p class="text-muted">${esAdminActual() ? "Todavía no hay fanbases cargadas." : "Tu sede ya no existe. Avisale a un admin para que te asigne otra."}</p>`;
        return;
      }
      listaFanbasesEl.innerHTML = fanbases.map(f => `
        <div class="admin-list-item" data-id="${f.id}">
            <div class="item-info">
                <h5>${escapeHtml(f.nombre)}</h5>
                <p>${escapeHtml(f.ciudad || "")}</p>
            </div>
            <div class="item-actions">
                ${accionesFanbase(f)}
            </div>
        </div>`).join("");
    },
    (err) => { listaFanbasesEl.innerHTML = `<p class="text-muted">No se pudieron cargar las fanbases: ${escapeHtml(err.message || String(err))}</p>`; console.error(err); }
  );
}

function accionesFanbase(f) {
  const editar = `<button type="button" class="editar" title="Editar" data-id="${f.id}"><i class="bi bi-pencil"></i></button>`;
  // Eliminar sedes es solo del admin (las reglas de Firestore también lo exigen).
  const eliminar = esAdminActual()
    ? `<button type="button" class="eliminar" title="Eliminar" data-id="${f.id}"><i class="bi bi-trash"></i></button>`
    : "";
  return editar + eliminar;
}

function filaRed(red = "instagram", url = "") {
  const div = document.createElement("div");
  div.className = "fb-red-row";
  div.innerHTML = `
    <select class="form-select red-tipo">
      ${REDES_DISPONIBLES.map(r => `<option value="${r}" ${r === red ? "selected" : ""}>${r[0].toUpperCase() + r.slice(1)}</option>`).join("")}
    </select>
    <input type="url" class="form-control red-url" placeholder="https://..." value="${url}">
    <button type="button" class="quitar-red"><i class="bi bi-x-lg"></i></button>`;
  div.querySelector(".quitar-red").addEventListener("click", () => div.remove());
  return div;
}

document.getElementById("btn-agregar-red")?.addEventListener("click", () => redesLista.appendChild(filaRed()));

document.getElementById("btn-nueva-fanbase")?.addEventListener("click", () => {
  document.getElementById("modalFanbaseTitulo").textContent = "Nueva fanbase";
  formFanbase.reset();
  document.getElementById("fb-nombre").disabled = false;
  document.getElementById("fb-id").value = "";
  redesLista.innerHTML = "";
  redesLista.appendChild(filaRed());
  fanbaseError.style.display = "none";
  modalFanbase.show();
});

listaFanbasesEl?.addEventListener("click", (e) => {
  const btnEditar = e.target.closest(".editar");
  const btnEliminar = e.target.closest(".eliminar");
  if (btnEditar) {
    const f = cacheFanbases.find(x => x.id === btnEditar.dataset.id);
    if (!f) return;
    document.getElementById("modalFanbaseTitulo").textContent = "Editar fanbase";
    document.getElementById("fb-id").value = f.id;
    document.getElementById("fb-nombre").value = f.nombre || "";
    document.getElementById("fb-nombre").disabled = !esAdminActual(); // renombrar es solo del admin
    document.getElementById("fb-descripcion").value = f.descripcion || "";
    document.getElementById("fb-ciudad").value = f.ciudad || "";
    document.getElementById("fb-logo-url").value = f.logoUrl || "";
    redesLista.innerHTML = "";
    (f.redes || []).forEach(r => redesLista.appendChild(filaRed(r.red, r.url)));
    if ((f.redes || []).length === 0) redesLista.appendChild(filaRed());
    fanbaseError.style.display = "none";
    modalFanbase.show();
  }
  if (btnEliminar && esAdminActual()) abrirConfirmarEliminar("fanbase", btnEliminar.dataset.id, () => eliminarFanbase(btnEliminar.dataset.id));
});

document.getElementById("fb-logo-url")?.addEventListener("blur", (e) => {
  e.target.value = normalizarUrlImagen(e.target.value);
});

formFanbase?.addEventListener("submit", async (e) => {
  e.preventDefault();
  fanbaseError.style.display = "none";
  const id = document.getElementById("fb-id").value;
  const redes = Array.from(redesLista.querySelectorAll(".fb-red-row")).map(row => ({
    red: row.querySelector(".red-tipo").value,
    url: row.querySelector(".red-url").value.trim()
  })).filter(r => r.url);

  const datos = {
    nombre: document.getElementById("fb-nombre").value.trim(),
    descripcion: document.getElementById("fb-descripcion").value.trim(),
    ciudad: document.getElementById("fb-ciudad").value.trim(),
    logoUrl: document.getElementById("fb-logo-url").value.trim(),
    redes
  };
  try {
    if (!esAdminActual()) {
      if (!id) throw new Error("Solo un admin puede crear fanbases.");
      delete datos.nombre; // un colaborador no puede renombrar su sede
    }
    if (id) await editarFanbase(id, datos); else await crearFanbase({ ...datos, uid: usuarioActual.uid });
    modalFanbase.hide();
  } catch (err) {
    console.error(err);
    fanbaseError.textContent = `No se pudo guardar la fanbase: ${err.message || err}`;
    fanbaseError.style.display = "block";
  }
});

// ==============================================================
// GALERIA (solo admin)
// ==============================================================
const listaGaleriaEl = document.getElementById("lista-galeria");
const modalFoto = document.getElementById("modalFoto") ? new bootstrap.Modal(document.getElementById("modalFoto")) : null;
const formFoto = document.getElementById("form-foto");
const fotoError = document.getElementById("foto-error");

function cargarGaleria() {
  desuscribir.galeria = escucharGaleria(
    (fotos) => {
      if (fotos.length === 0) {
        listaGaleriaEl.innerHTML = `<p class="text-muted">Todavía no subiste fotos.</p>`;
        return;
      }
      listaGaleriaEl.innerHTML = fotos.map(f => `
        <div class="foto-item" data-id="${f.id}">
            <img src="${f.imagenUrl}" alt="${escapeHtml(f.descripcion || "")}">
            <button type="button" class="eliminar-foto" data-id="${f.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
        </div>`).join("");
    },
    (err) => { listaGaleriaEl.innerHTML = `<p class="text-muted">No se pudo cargar la galería.</p>`; console.error(err); }
  );
}

document.getElementById("btn-nueva-foto")?.addEventListener("click", () => {
  formFoto.reset();
  fotoError.style.display = "none";
  modalFoto.show();
});

listaGaleriaEl?.addEventListener("click", (e) => {
  const btn = e.target.closest(".eliminar-foto");
  if (!btn) return;
  abrirConfirmarEliminar("foto", btn.dataset.id, () => eliminarFotoGaleria(btn.dataset.id));
});

document.getElementById("foto-url")?.addEventListener("blur", (e) => {
  e.target.value = normalizarUrlImagen(e.target.value);
  const preview = document.getElementById("foto-preview");
  const wrap = document.getElementById("foto-preview-wrap");
  if (e.target.value) { preview.src = e.target.value; wrap.style.display = "block"; }
  else { wrap.style.display = "none"; }
});

formFoto?.addEventListener("submit", async (e) => {
  e.preventDefault();
  fotoError.style.display = "none";
  const imagenUrl = normalizarUrlImagen(document.getElementById("foto-url").value.trim());
  try {
    await agregarFotoGaleria({ imagenUrl, descripcion: document.getElementById("foto-descripcion").value.trim(), uid: usuarioActual.uid });
    modalFoto.hide();
  } catch (err) {
    console.error(err);
    fotoError.textContent = `No se pudo guardar la foto: ${err.message || err}`;
    fotoError.style.display = "block";
  }
});

// ==============================================================
// APARIENCIA: COLORES (admin + colaboradores habilitados)
// y DATOS DEL SITIO (solo admin)
//
// Las dos pestañas guardan en el mismo documento (configuracion/sitio) pero
// cada una escribe SOLO sus propios campos. Así las reglas de Firestore
// pueden dejar que un colaborador habilitado toque los colores sin poder
// tocar logo, redes, contacto ni mapas.
// ==============================================================
const formColores = document.getElementById("form-colores");
const formSitio = document.getElementById("form-sitio");
const paletasOpcionesEl = document.getElementById("paletas-opciones");
const previewColoresEl = document.getElementById("preview-colores");
const previewDatosEl = document.getElementById("preview-datos");
const apRedesListaEl = document.getElementById("ap-redes-lista");
const badgeBorradorEl = document.getElementById("colores-borrador");

let paletaSeleccionada = "pirata-dorado";
let configGuardada = null; // lo último que hay guardado en Firestore: base de la vista previa y de "Descartar"

// campo de la config -> id del <input type="color">
const IDS_COLOR = {
  fondo: "ap-fondo", superficie: "ap-superficie", accento: "ap-accento",
  texto: "ap-texto", heading: "ap-heading", contraste: "ap-contraste",
  fondoHF: "ap-fondo-hf", textoHF: "ap-texto-hf", accentoHF: "ap-accento-hf"
};
// Solo estos 6 pertenecen a "la paleta" del contenido. Se compara por id EXACTO
// (con startsWith, "ap-fondo-hf" se confundía con "ap-fondo").
const IDS_PALETA_CONTENIDO = new Set(["ap-fondo", "ap-superficie", "ap-accento", "ap-texto", "ap-heading", "ap-contraste"]);

// ---------------------------------------------------------------- COLORES
function leerColoresDelFormulario() {
  return Object.fromEntries(Object.entries(IDS_COLOR).map(([campo, id]) => [campo, document.getElementById(id).value]));
}

function llenarFormColores(config) {
  const base = PALETAS_PREDEFINIDAS.find(p => p.id === config.paletaId);
  paletaSeleccionada = base ? base.id : null;
  Object.entries(IDS_COLOR).forEach(([campo, id]) => { document.getElementById(id).value = config[campo]; });
  marcarPaletaActiva();
}

function marcarPaletaActiva() {
  paletasOpcionesEl.querySelectorAll(".paleta-opcion")
    .forEach(el => el.classList.toggle("activa", el.dataset.id === paletaSeleccionada));
}

/** Al elegir una paleta predefinida solo cambian los 6 colores del contenido (los de encabezado/pie quedan como están). */
function aplicarPaleta(paleta) {
  paletaSeleccionada = paleta.id;
  ["fondo", "superficie", "accento", "texto", "heading", "contraste"]
    .forEach(campo => { document.getElementById(IDS_COLOR[campo]).value = paleta[campo]; });
  marcarPaletaActiva();
}

function hayCambiosDeColor() {
  if (!configGuardada) return false;
  const actual = leerColoresDelFormulario();
  return Object.keys(actual).some(k => String(actual[k]).toLowerCase() !== String(configGuardada[k] ?? "").toLowerCase());
}

function refrescarPreviewColores() {
  if (!configGuardada) return;
  dibujarVistaPrevia(previewColoresEl, { ...configGuardada, ...leerColoresDelFormulario() }, { conCuerpo: true });
  if (badgeBorradorEl) badgeBorradorEl.style.display = hayCambiosDeColor() ? "" : "none";
}

// ----------------------------------------------------------- DATOS DEL SITIO
function filaRedApariencia(red = "instagram", url = "") {
  const div = document.createElement("div");
  div.className = "fb-red-row";
  div.innerHTML = `
    <select class="form-select red-tipo">
      ${REDES_DISPONIBLES.map(r => `<option value="${r}" ${r === red ? "selected" : ""}>${r[0].toUpperCase() + r.slice(1)}</option>`).join("")}
    </select>
    <input type="url" class="form-control red-url" placeholder="https://..." value="${escapeHtml(url)}">
    <button type="button" class="quitar-red"><i class="bi bi-x-lg"></i></button>`;
  div.querySelector(".quitar-red").addEventListener("click", () => { div.remove(); refrescarPreviewDatos(); });
  return div;
}

function leerRedesDelFormulario() {
  return Array.from(apRedesListaEl.querySelectorAll(".fb-red-row")).map(row => ({
    red: row.querySelector(".red-tipo").value,
    url: row.querySelector(".red-url").value.trim()
  })).filter(r => r.url);
}

function leerDatosDelSitioDelFormulario() {
  return {
    logoUrl: document.getElementById("ap-logo-url").value.trim(),
    redesSociales: leerRedesDelFormulario(),
    contactoEmail: document.getElementById("ap-contacto-email").value.trim(),
    contactoDireccion: document.getElementById("ap-contacto-direccion").value.trim(),
    mapa1Titulo: document.getElementById("ap-mapa1-titulo").value.trim(),
    mapa1Url: document.getElementById("ap-mapa1-url").value.trim(),
    mapa2Titulo: document.getElementById("ap-mapa2-titulo").value.trim(),
    mapa2Url: document.getElementById("ap-mapa2-url").value.trim()
  };
}

function mostrarLogoChico(url) {
  const preview = document.getElementById("ap-logo-preview");
  const wrap = document.getElementById("ap-logo-preview-wrap");
  if (url) { preview.src = url; wrap.style.display = "block"; } else { wrap.style.display = "none"; }
}

function llenarFormSitio(config) {
  document.getElementById("ap-logo-url").value = config.logoUrl || "";
  document.getElementById("ap-contacto-email").value = config.contactoEmail || "";
  document.getElementById("ap-contacto-direccion").value = config.contactoDireccion || "";
  document.getElementById("ap-mapa1-titulo").value = config.mapa1Titulo || "";
  document.getElementById("ap-mapa1-url").value = config.mapa1Url || "";
  document.getElementById("ap-mapa2-titulo").value = config.mapa2Titulo || "";
  document.getElementById("ap-mapa2-url").value = config.mapa2Url || "";
  mostrarLogoChico(config.logoUrl ? conLogoResuelto(config, "../").logoUrl : "");

  apRedesListaEl.innerHTML = "";
  (config.redesSociales?.length ? config.redesSociales : REDES_SOCIALES_POR_DEFECTO)
    .forEach(r => apRedesListaEl.appendChild(filaRedApariencia(r.red, r.url)));
}

function refrescarPreviewDatos() {
  if (!configGuardada || !previewDatosEl) return;
  dibujarVistaPrevia(previewDatosEl, { ...configGuardada, ...leerDatosDelSitioDelFormulario() }, { conCuerpo: false });
}

// ------------------------------------------------------------------- CARGA
async function cargarApariencia(conSitio) {
  paletasOpcionesEl.innerHTML = PALETAS_PREDEFINIDAS.map(p => `
    <div class="paleta-opcion" data-id="${p.id}">
        <div class="swatches">
            <span style="background:${p.fondo}"></span><span style="background:${p.superficie}"></span><span style="background:${p.accento}"></span><span style="background:${p.texto}"></span>
        </div>
        <small>${p.nombre}</small>
    </div>`).join("");

  paletasOpcionesEl.querySelectorAll(".paleta-opcion").forEach(el => {
    el.addEventListener("click", () => {
      aplicarPaleta(PALETAS_PREDEFINIDAS.find(p => p.id === el.dataset.id));
      refrescarPreviewColores();
    });
  });

  configGuardada = await obtenerConfigSitio();
  llenarFormColores(configGuardada);
  refrescarPreviewColores();

  if (conSitio) {
    llenarFormSitio(configGuardada);
    refrescarPreviewDatos();
  }
}

// ---------------------------------------------------------- VISTA PREVIA
/**
 * Dibuja la vista previa dentro de `contenedor`. Es un cuadro AISLADO: los
 * colores del borrador se aplican solo a ese cuadro (no a la página del
 * panel), así una combinación mala no deja el propio panel ilegible. Son
 * componentes de prueba con las MISMAS clases CSS que usa el sitio real, así
 * que lo que se ve acá es lo que va a ver el público.
 */
function dibujarVistaPrevia(contenedor, config, { conCuerpo = false } = {}) {
  if (!contenedor) return;
  const cfg = conLogoResuelto({ ...config, logoUrl: normalizarUrlImagen(config.logoUrl || "") }, "../");
  contenedor.innerHTML = `
    <div class="preview-frame" aria-hidden="true">
      ${renderHeaderPreview(cfg)}
      ${conCuerpo ? renderCuerpoPreview() : ""}
      ${renderFooterPreview(cfg)}
    </div>`;
  aplicarTemaEnElemento(contenedor.firstElementChild, cfg);
}

/** Encabezado simplificado y ordenado, solo para visualizar colores (no es navegable). */
function renderHeaderPreview(config) {
  const redes = config.redesSociales?.length ? config.redesSociales : REDES_SOCIALES_POR_DEFECTO;
  const iconos = redes.map(r => `<span class="preview-social"><i class="bi ${ICONO_RED[r.red] || ICONO_RED.otro}"></i></span>`).join("");
  return `
    <div class="preview-header hf-background">
      <div class="preview-header-top">
        <div class="preview-brand">
          <img src="${escapeHtml(config.logoUrl || "../assets/img/AteezArgentinaLogo.png")}" alt="">
          <span>ATEEZ Argentina</span>
        </div>
        <div class="preview-socials">${iconos}</div>
      </div>
      <nav class="preview-nav">
        <span class="activo">Inicio</span>
        <span>Eventos</span>
        <span>Noticias</span>
        <span>Contenido <i class="bi bi-chevron-down"></i></span>
        <span>Nosotros <i class="bi bi-chevron-down"></i></span>
      </nav>
    </div>`;
}

/** Pie real del sitio, pero sin ids duplicados y con los mapas reemplazados por un recuadro liviano (no recargar 2 iframes en cada cambio). */
function renderFooterPreview(config) {
  return renderFooter({ base: "../", config })
    .replace(/ id="(?:header|footer|navmenu)"/g, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/g,
      `<div class="preview-mapa"><i class="bi bi-geo-alt-fill"></i><span>Mapa</span></div>`);
}

/** Componentes de prueba del cuerpo de la página: títulos, texto, filtros, tarjetas, video, fanbase y botones. */
function renderCuerpoPreview() {
  return `
    <div class="preview-cuerpo">
      <div class="section-title">
        <span class="subtitle">Subtítulo de sección</span>
        <h2>Título de sección</h2>
        <p>Así se ven los textos corridos, <a href="#">los links</a> y el <strong>texto resaltado</strong> sobre el color de fondo del sitio.</p>
      </div>

      <div class="publicaciones-filtros">
        <button type="button" class="filter-active">Todas</button>
        <button type="button">Cumpleaños</button>
        <button type="button">Comeback</button>
      </div>

      <div class="row g-3">
        <div class="col-md-4">
          <div class="noticia-card">
            <span class="noticia-destacada"><i class="bi bi-star-fill"></i> Destacada</span>
            <div class="noticia-imagen"><div class="preview-img"></div></div>
            <div class="noticia-contenido">
              <span class="noticia-fecha">12 sep 2026</span>
              <h3>Título de una noticia</h3>
              <p>Resumen de ejemplo para ver el texto de las tarjetas.</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="contenido-card">
            <div class="contenido-media"><div class="preview-img"></div></div>
            <div class="contenido-card-body">
              <h4>Título de contenido</h4>
              <p>Descripción breve de un contenido cargado por el equipo.</p>
              <a href="#" class="contenido-card-link">Ver <i class="bi bi-box-arrow-up-right"></i></a>
            </div>
          </div>
        </div>
        <div class="col-md-4 preview-col-apilada">
          <div class="fanbase-card">
            <div class="preview-avatar"></div>
            <h4>Nombre de la fanbase</h4>
            <span class="fanbase-ciudad"><i class="bi bi-geo-alt"></i> Ciudad</span>
          </div>
          <div class="video-compacto">
            <div class="video-compacto-thumb"><div class="preview-img"></div><i class="bi bi-play-circle-fill"></i></div>
            <div class="video-compacto-info">
              <h5>Episodio de ejemplo</h5>
              <p>Resumen corto del video.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="preview-botones">
        <button type="button" class="btn btn-primary btn-sm">Botón principal</button>
        <button type="button" class="btn btn-outline-secondary btn-sm">Botón secundario</button>
      </div>
    </div>`;
}

// ----------------------------------------------------------- EVENTOS: COLORES
formColores?.addEventListener("input", (e) => {
  if (IDS_PALETA_CONTENIDO.has(e.target.id)) {
    paletaSeleccionada = null; // se movió un color a mano: ya no es una paleta predefinida
    marcarPaletaActiva();
  }
  refrescarPreviewColores();
});

document.getElementById("btn-descartar-colores")?.addEventListener("click", () => {
  if (!configGuardada) return;
  llenarFormColores(configGuardada);
  refrescarPreviewColores();
  document.getElementById("colores-error").style.display = "none";
  document.getElementById("colores-ok").style.display = "none";
});

formColores?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("colores-error");
  const okEl = document.getElementById("colores-ok");
  errorEl.style.display = "none";
  okEl.style.display = "none";
  try {
    const paletaBase = PALETAS_PREDEFINIDAS.find(p => p.id === paletaSeleccionada);
    // Se manda SOLO lo que son colores (ver CAMPOS_COLOR en config-sitio.js):
    // las reglas de Firestore rechazan cualquier otro campo si quien guarda es
    // un colaborador habilitado.
    const payload = {
      ...leerColoresDelFormulario(),
      paletaId: paletaSeleccionada,
      modo: paletaBase?.modo || "personalizado"
    };
    await actualizarConfigSitio(payload);
    configGuardada = { ...configGuardada, ...payload };
    okEl.style.display = "block";
    refrescarPreviewColores();
  } catch (err) {
    console.error(err);
    errorEl.textContent = `No se pudieron guardar los colores: ${err.message || err}`;
    errorEl.style.display = "block";
  }
});

// ------------------------------------------------------ EVENTOS: DATOS DEL SITIO
formSitio?.addEventListener("input", refrescarPreviewDatos);

document.getElementById("ap-btn-agregar-red")?.addEventListener("click", () => {
  apRedesListaEl.appendChild(filaRedApariencia());
  refrescarPreviewDatos();
});

document.getElementById("ap-logo-url")?.addEventListener("blur", (e) => {
  e.target.value = normalizarUrlImagen(e.target.value);
  mostrarLogoChico(e.target.value ? conLogoResuelto({ logoUrl: e.target.value }, "../").logoUrl : "");
  refrescarPreviewDatos();
});

formSitio?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("sitio-error");
  const okEl = document.getElementById("sitio-ok");
  errorEl.style.display = "none";
  okEl.style.display = "none";
  try {
    const payload = leerDatosDelSitioDelFormulario();
    await actualizarConfigSitio(payload);
    configGuardada = { ...configGuardada, ...payload };
    okEl.style.display = "block";
  } catch (err) {
    console.error(err);
    errorEl.textContent = `No se pudieron guardar los datos: ${err.message || err}`;
    errorEl.style.display = "block";
  }
});

document.getElementById("btn-generar-sitemap")?.addEventListener("click", () => {
  const xml = generarSitemapXml({ noticias: cacheNoticias });
  descargarSitemap(xml);
});

// ==============================================================
// USUARIOS (solo admin)
// ==============================================================
const listaUsuariosEl = document.getElementById("lista-usuarios");

let cacheUsuarios = [];
let usuariosCargados = false;

async function cargarUsuarios() {
  try {
    cacheUsuarios = await listarUsuarios();
    mapaUsuarios = Object.fromEntries(cacheUsuarios.map(u => [u.id, u]));
    cacheFanbasesRegistro = await listarFanbases().catch(() => cacheFanbasesRegistro);
    usuariosCargados = true;
    dibujarUsuarios();
  } catch (err) {
    console.error(err);
    listaUsuariosEl.innerHTML = `<p class="text-muted">No se pudieron cargar los usuarios: ${escapeHtml(err.message || String(err))}</p>`;
  }
}

/** <option>s de fanbase para el selector de cada usuario (incluye "Fan independiente"). */
function opcionesFanbase(seleccionada) {
  const existe = cacheFanbasesRegistro.some(f => f.id === seleccionada);
  return `<option value="" ${!seleccionada ? "selected" : ""}>Fan independiente</option>` +
    cacheFanbasesRegistro.map(f => `<option value="${f.id}" ${f.id === seleccionada ? "selected" : ""}>${escapeHtml(f.nombre)}</option>`).join("") +
    (seleccionada && !existe ? `<option value="${escapeHtml(seleccionada)}" selected>Fanbase eliminada</option>` : "");
}

function dibujarUsuarios() {
  if (!usuariosCargados) return;
  const usuarios = cacheUsuarios;

  if (usuarios.length === 0) {
    listaUsuariosEl.innerHTML = `<p class="text-muted">No hay usuarios registrados todavía.</p>`;
    return;
  }
  listaUsuariosEl.innerHTML = usuarios.map(u => `
      <div class="admin-list-item" data-uid="${u.id}">
          <div class="item-info">
              <h5>${escapeHtml(u.nombreCompleto || u.email || "Sin nombre")}</h5>
              <p>${escapeHtml(u.email || "")}${u.rol ? "" : " · Pendiente de rol"}</p>
          </div>
          <div class="item-actions">
              ${u.rol === "colaborador" ? `
              <div class="form-check form-switch permiso-colores" title="Permite que esta persona use la pestaña Apariencia (solo los colores)">
                  <input class="form-check-input permiso-colores-check" type="checkbox" role="switch" id="pc-${u.id}" data-uid="${u.id}" ${u.puedeEditarColores ? "checked" : ""}>
                  <label class="form-check-label" for="pc-${u.id}">Puede editar colores</label>
              </div>` : ""}
              <select class="form-select form-select-sm fanbase-select" data-uid="${u.id}" title="Fanbase a la que pertenece esta persona" aria-label="Fanbase">
                  ${opcionesFanbase(u.fanbase)}
              </select>
              <select class="form-select form-select-sm rol-select" data-uid="${u.id}" aria-label="Rol">
                  <option value="" ${!u.rol ? "selected" : ""}>Sin rol</option>
                  <option value="colaborador" ${u.rol === "colaborador" ? "selected" : ""}>Colaborador</option>
                  <option value="admin" ${u.rol === "admin" ? "selected" : ""}>Admin</option>
              </select>
          </div>
      </div>`).join("");
}

listaUsuariosEl.addEventListener("change", async (e) => {
  const permiso = e.target.closest(".permiso-colores-check");
  if (permiso) {
    const uid = permiso.dataset.uid;
    try {
      await actualizarPermisoColores(uid, permiso.checked);
      if (mapaUsuarios[uid]) mapaUsuarios[uid].puedeEditarColores = permiso.checked;
    } catch (err) {
      console.error(err);
      permiso.checked = !permiso.checked; // vuelve al estado anterior
      alert("No se pudo actualizar el permiso: " + (err.message || err));
    }
    return;
  }

  const selectFanbase = e.target.closest(".fanbase-select");
  if (selectFanbase) {
    const uid = selectFanbase.dataset.uid;
    const anterior = mapaUsuarios[uid]?.fanbase || "";
    const nueva = selectFanbase.value || null;
    try {
      await asignarFanbase(uid, nueva);
      if (mapaUsuarios[uid]) mapaUsuarios[uid].fanbase = nueva; // es el mismo objeto que está en cacheUsuarios
      if (uid === usuarioActual.uid) usuarioActual.fanbase = nueva;
    } catch (err) {
      console.error(err);
      selectFanbase.value = anterior; // vuelve al valor anterior
      alert("No se pudo cambiar la fanbase. Revisá que las reglas de Firestore estén publicadas. " + (err.message || err));
    }
    return;
  }

  const select = e.target.closest(".rol-select");
  if (!select) return;
  try {
    await asignarRol(select.dataset.uid, select.value || null);
    cargarUsuarios(); // se vuelve a dibujar: el interruptor de colores solo aplica a colaboradores
  } catch (err) { console.error(err); alert("No se pudo actualizar el rol. Revisá los permisos en Firestore."); }
});

// Herramienta de uso único: le pone fanbase y nombre del autor a lo cargado antes de esta función.
document.getElementById("btn-completar-fanbase")?.addEventListener("click", async (e) => {
  const boton = e.currentTarget;
  const resultadoEl = document.getElementById("completar-fanbase-resultado");
  resultadoEl.style.display = "none";
  boton.disabled = true;
  try {
    const { revisados, actualizados } = await completarFanbaseEnContenido(mapaUsuarios);
    resultadoEl.className = "admin-alert admin-alert-ok";
    resultadoEl.textContent = `Listo: se revisaron ${revisados} items y se actualizaron ${actualizados}.`;
  } catch (err) {
    console.error(err);
    resultadoEl.className = "admin-alert admin-alert-error";
    resultadoEl.textContent = `No se pudo completar: ${err.message || err}`;
  } finally {
    resultadoEl.style.display = "block";
    boton.disabled = false;
  }
});

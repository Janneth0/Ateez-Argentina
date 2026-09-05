// ============================================================
// ADMIN.JS - Panel de Administracion ATEEZ Argentina
// ============================================================

import { montarHeader, montarFooter } from "../assets/js/components.js";
import {
  registrarConEmail, loginConEmail, loginConGoogle, logout, obtenerPerfil,
  escucharAuth, traducirErrorAuth, listarUsuarios, asignarRol, recuperarContrasena
} from "../assets/js/auth.js";
import { escucharPosts, crearPost, editarPost, eliminarPost, CATEGORIAS } from "../assets/js/posts.js";
import {
  escucharNoticias, crearNoticia, editarNoticia, eliminarNoticia, marcarDestacada
} from "../assets/js/noticias.js";
import {
  escucharFanbases, crearFanbase, editarFanbase, eliminarFanbase, REDES_DISPONIBLES
} from "../assets/js/fanbases.js";
import { escucharGaleria, agregarFotoGaleria, eliminarFotoGaleria } from "../assets/js/galeria.js";
import {
  PALETAS_PREDEFINIDAS, obtenerConfigSitio, actualizarConfigSitio
} from "../assets/js/config-sitio.js";
import { normalizarUrlImagen } from "../assets/js/imagenes.js";
import { generarSitemapXml, descargarSitemap } from "../assets/js/sitemap.js";
import { paises } from "../assets/js/paises.js";
import { formatearFechaCorta, eventoVencido, eventoPorVencer, escapeHtml } from "../assets/js/util.js";

montarHeader({ base: "../" });
montarFooter({ base: "../" });

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

  try {
    await registrarConEmail({ email, password, nombreCompleto, fechaNacimiento, celular, pais: paisCodigo });
  } catch (err) {
    registroError.textContent = traducirErrorAuth(err);
    registroError.style.display = "block";
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
const desuscribir = { posts: null, noticias: null, fanbases: null, galeria: null };

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
    return;
  }

  usuarioActual = { uid: user.uid, ...perfil };
  iniciarDashboard();
});

async function iniciarDashboard() {
  mostrarVista("dashboard");
  const esAdmin = usuarioActual.rol === "admin";

  document.getElementById("saludo-usuario").textContent =
    `Hola, ${usuarioActual.nombreCompleto || usuarioActual.email} \u00b7 Rol: ${esAdmin ? "Administrador" : "Colaborador"}`;
  document.querySelectorAll(".admin-only").forEach(el => { el.style.display = esAdmin ? "" : "none"; });

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
  if (esAdmin) {
    cargarUsuarios();
    cargarFanbases();
    cargarGaleria();
    cargarApariencia();
  }
}

function nombreResponsable(uid) {
  const u = mapaUsuarios[uid];
  return u ? (u.nombreCompleto || u.email || "Sin nombre") : "Usuario desconocido";
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
      const visibles = usuarioActual.rol === "admin" ? posts : posts.filter(p => p.creadoPor === usuarioActual.uid);

      if (visibles.length === 0) {
        listaPublicacionesEl.innerHTML = `<p class="text-muted">Todavía no hay eventos cargados.</p>`;
      } else {
        listaPublicacionesEl.innerHTML = visibles.map(p => {
          const vencido = eventoVencido(p.fechaEvento);
          return `
          <div class="admin-list-item" data-id="${p.id}">
              <div class="item-info">
                  <h5><span class="badge-categoria">${etiquetaCategoria(p.categoria)}</span>${escapeHtml(p.titulo)}
                      ${vencido ? '<span class="badge-estado vencido">Inactivo</span>' : ''}</h5>
                  <p>${escapeHtml(p.descripcion)} \u00b7 ${formatearFechaCorta(p.fechaEvento)}</p>
                  ${usuarioActual.rol === 'admin' ? `<p class="responsable">Cargado por: ${escapeHtml(nombreResponsable(p.creadoPor))}</p>` : ''}
              </div>
              <div class="item-actions">
                  <button type="button" class="editar" title="Editar" data-id="${p.id}"><i class="bi bi-pencil"></i></button>
                  <button type="button" class="eliminar" title="Eliminar" data-id="${p.id}"><i class="bi bi-trash"></i></button>
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

listaPublicacionesEl.addEventListener("click", (e) => {
  const btnEditar = e.target.closest(".editar");
  const btnEliminar = e.target.closest(".eliminar");

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
    publicacionError.style.display = "none";
    modalPublicacion.show();
  }
  if (btnEliminar) abrirConfirmarEliminar("evento", btnEliminar.dataset.id, () => eliminarPost(btnEliminar.dataset.id));
});

document.getElementById("btn-nueva-publicacion").addEventListener("click", () => {
  document.getElementById("modalPublicacionTitulo").textContent = "Nuevo evento";
  formPublicacion.reset();
  document.getElementById("pub-id").value = "";
  document.getElementById("pub-fecha").value = new Date().toISOString().slice(0, 10);
  publicacionError.style.display = "none";
  modalPublicacion.show();
});

formPublicacion.addEventListener("submit", async (e) => {
  e.preventDefault();
  publicacionError.style.display = "none";
  const id = document.getElementById("pub-id").value;
  const datos = {
    titulo: document.getElementById("pub-titulo").value.trim(),
    descripcion: document.getElementById("pub-descripcion").value.trim(),
    link: document.getElementById("pub-link").value.trim(),
    categoria: document.getElementById("pub-categoria").value,
    fechaEvento: document.getElementById("pub-fecha").value
  };
  try {
    if (id) await editarPost(id, datos); else await crearPost({ ...datos, uid: usuarioActual.uid });
    modalPublicacion.hide();
  } catch (err) {
    console.error(err);
    publicacionError.textContent = `No se pudo guardar: ${err.message || err}`;
    publicacionError.style.display = "block";
  }
});

function fechaInputValue(fecha) {
  if (!fecha) return new Date().toISOString().slice(0, 10);
  const d = fecha.toDate ? fecha.toDate() : new Date(fecha);
  return d.toISOString().slice(0, 10);
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
      const visibles = usuarioActual.rol === "admin" ? noticias : noticias.filter(n => n.creadoPor === usuarioActual.uid);

      if (visibles.length === 0) {
        listaNoticiasEl.innerHTML = `<p class="text-muted">Todavía no hay noticias cargadas.</p>`;
        return;
      }
      listaNoticiasEl.innerHTML = visibles.map(n => `
        <div class="admin-list-item" data-id="${n.id}">
            <div class="item-info">
                <h5>${escapeHtml(n.titulo)}</h5>
                <p>${escapeHtml(n.resumen || "")} \u00b7 ${formatearFechaCorta(n.fechaPublicacion)}</p>
                ${usuarioActual.rol === 'admin' ? `<p class="responsable">Cargado por: ${escapeHtml(nombreResponsable(n.creadoPor))}</p>` : ''}
            </div>
            <div class="item-actions">
                ${usuarioActual.rol === 'admin' ? `<button type="button" class="destacar ${n.destacada ? 'activa' : ''}" title="Destacar" data-id="${n.id}"><i class="bi ${n.destacada ? 'bi-star-fill' : 'bi-star'}"></i></button>` : ''}
                <button type="button" class="editar" title="Editar" data-id="${n.id}"><i class="bi bi-pencil"></i></button>
                <button type="button" class="eliminar" title="Eliminar" data-id="${n.id}"><i class="bi bi-trash"></i></button>
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
  document.getElementById("not-fecha").value = new Date().toISOString().slice(0, 10);
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
  document.getElementById("preview-imagen").src = img || "../assets/img/logoATZ.jpeg";
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
      await crearNoticia({ ...datos, uid: usuarioActual.uid });
    }
    modalNoticia.hide();
  } catch (err) {
    console.error(err);
    noticiaError.textContent = `No se pudo guardar la noticia: ${err.message || err}`;
    noticiaError.style.display = "block";
  }
});

// ==============================================================
// FANBASES (solo admin)
// ==============================================================
const listaFanbasesEl = document.getElementById("lista-fanbases");
const modalFanbase = document.getElementById("modalFanbaseAdmin") ? new bootstrap.Modal(document.getElementById("modalFanbaseAdmin")) : null;
const formFanbase = document.getElementById("form-fanbase");
const fanbaseError = document.getElementById("fanbase-error");
const redesLista = document.getElementById("fb-redes-lista");
let cacheFanbases = [];

function cargarFanbases() {
  desuscribir.fanbases = escucharFanbases(
    (fanbases) => {
      cacheFanbases = fanbases;
      if (fanbases.length === 0) {
        listaFanbasesEl.innerHTML = `<p class="text-muted">Todavía no hay fanbases cargadas.</p>`;
        return;
      }
      listaFanbasesEl.innerHTML = fanbases.map(f => `
        <div class="admin-list-item" data-id="${f.id}">
            <div class="item-info">
                <h5>${escapeHtml(f.nombre)}</h5>
                <p>${escapeHtml(f.ciudad || "")}</p>
            </div>
            <div class="item-actions">
                <button type="button" class="editar" title="Editar" data-id="${f.id}"><i class="bi bi-pencil"></i></button>
                <button type="button" class="eliminar" title="Eliminar" data-id="${f.id}"><i class="bi bi-trash"></i></button>
            </div>
        </div>`).join("");
    },
    (err) => { listaFanbasesEl.innerHTML = `<p class="text-muted">No se pudieron cargar las fanbases: ${escapeHtml(err.message || String(err))}</p>`; console.error(err); }
  );
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
    document.getElementById("fb-descripcion").value = f.descripcion || "";
    document.getElementById("fb-ciudad").value = f.ciudad || "";
    document.getElementById("fb-logo-url").value = f.logoUrl || "";
    redesLista.innerHTML = "";
    (f.redes || []).forEach(r => redesLista.appendChild(filaRed(r.red, r.url)));
    if ((f.redes || []).length === 0) redesLista.appendChild(filaRed());
    fanbaseError.style.display = "none";
    modalFanbase.show();
  }
  if (btnEliminar) abrirConfirmarEliminar("fanbase", btnEliminar.dataset.id, () => eliminarFanbase(btnEliminar.dataset.id));
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
// APARIENCIA (solo admin)
// ==============================================================
const formApariencia = document.getElementById("form-apariencia");
const paletasOpcionesEl = document.getElementById("paletas-opciones");
let paletaSeleccionada = "pirata-dorado";

async function cargarApariencia() {
  if (!formApariencia) return;
  paletasOpcionesEl.innerHTML = PALETAS_PREDEFINIDAS.map(p => `
    <div class="paleta-opcion" data-id="${p.id}">
        <div class="swatches">
            <span style="background:${p.fondo}"></span><span style="background:${p.superficie}"></span><span style="background:${p.accento}"></span><span style="background:${p.texto}"></span>
        </div>
        <small>${p.nombre}</small>
    </div>`).join("");

  paletasOpcionesEl.querySelectorAll(".paleta-opcion").forEach(el => {
    el.addEventListener("click", () => {
      const paleta = PALETAS_PREDEFINIDAS.find(p => p.id === el.dataset.id);
      aplicarPaletaAFormulario(paleta);
    });
  });

  const config = await obtenerConfigSitio();
  const paleta = PALETAS_PREDEFINIDAS.find(p => p.id === config.paletaId) || { ...config, id: null };
  aplicarPaletaAFormulario({ ...paleta, ...config });
  document.getElementById("ap-logo-url").value = config.logoUrl || "";
  if (config.logoUrl) {
    document.getElementById("ap-logo-preview").src = config.logoUrl;
    document.getElementById("ap-logo-preview-wrap").style.display = "block";
  }
}

function aplicarPaletaAFormulario(paleta) {
  paletaSeleccionada = paleta.id;
  document.getElementById("ap-fondo").value = paleta.fondo;
  document.getElementById("ap-superficie").value = paleta.superficie;
  document.getElementById("ap-accento").value = paleta.accento;
  document.getElementById("ap-texto").value = paleta.texto;
  document.getElementById("ap-heading").value = paleta.heading;
  document.getElementById("ap-contraste").value = paleta.contraste;
  paletasOpcionesEl.querySelectorAll(".paleta-opcion").forEach(el => el.classList.toggle("activa", el.dataset.id === paleta.id));
}

["ap-fondo", "ap-superficie", "ap-accento", "ap-texto", "ap-heading", "ap-contraste"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", () => { paletaSeleccionada = null; paletasOpcionesEl.querySelectorAll(".paleta-opcion").forEach(el => el.classList.remove("activa")); });
});

document.getElementById("ap-logo-url")?.addEventListener("blur", (e) => {
  e.target.value = normalizarUrlImagen(e.target.value);
  const preview = document.getElementById("ap-logo-preview");
  const wrap = document.getElementById("ap-logo-preview-wrap");
  if (e.target.value) { preview.src = e.target.value; wrap.style.display = "block"; }
  else { wrap.style.display = "none"; }
});

formApariencia?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("apariencia-error");
  const okEl = document.getElementById("apariencia-ok");
  errorEl.style.display = "none";
  okEl.style.display = "none";
  try {
    const paletaBase = PALETAS_PREDEFINIDAS.find(p => p.id === paletaSeleccionada);
    await actualizarConfigSitio({
      paletaId: paletaSeleccionada,
      modo: paletaBase?.modo || "personalizado",
      fondo: document.getElementById("ap-fondo").value,
      superficie: document.getElementById("ap-superficie").value,
      accento: document.getElementById("ap-accento").value,
      texto: document.getElementById("ap-texto").value,
      heading: document.getElementById("ap-heading").value,
      contraste: document.getElementById("ap-contraste").value,
      logoUrl: document.getElementById("ap-logo-url").value.trim()
    });
    okEl.style.display = "block";
  } catch (err) {
    console.error(err);
    errorEl.textContent = "No se pudieron guardar los cambios.";
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

async function cargarUsuarios() {
  try {
    const usuarios = await listarUsuarios();
    mapaUsuarios = Object.fromEntries(usuarios.map(u => [u.id, u]));
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
              <select class="form-select form-select-sm rol-select" data-uid="${u.id}">
                  <option value="" ${!u.rol ? "selected" : ""}>Sin rol</option>
                  <option value="colaborador" ${u.rol === "colaborador" ? "selected" : ""}>Colaborador</option>
                  <option value="admin" ${u.rol === "admin" ? "selected" : ""}>Admin</option>
              </select>
          </div>
      </div>`).join("");
  } catch (err) {
    console.error(err);
    listaUsuariosEl.innerHTML = `<p class="text-muted">No se pudieron cargar los usuarios: ${escapeHtml(err.message || String(err))}</p>`;
  }
}

listaUsuariosEl.addEventListener("change", async (e) => {
  const select = e.target.closest(".rol-select");
  if (!select) return;
  try { await asignarRol(select.dataset.uid, select.value || null); }
  catch (err) { console.error(err); alert("No se pudo actualizar el rol. Revisá los permisos en Firestore."); }
});

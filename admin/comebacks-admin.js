// ============================================================
// COMEBACKS-ADMIN.JS - Pestaña "Comeback y metas" del panel
// La ve el admin y los colaboradores a los que un admin les activó el
// permiso "Puede editar metas" (pestaña Usuarios).
// Maneja: fecha del comeback, video de YouTube, links de pre-save y las
// metas de streaming (plataformas, links, objetivos y valores actuales).
// ============================================================

import {
  PLATAFORMAS, PLATAFORMAS_PRESAVE, escucharComebacks, crearComeback, editarComeback, eliminarComeback,
  activarComeback, duplicarParaNuevoComeback, importarDesdeGoalsJson, comebackVacio, idCorto,
  fechaTextoArgentina, isoAInputArgentina, inputArgentinaAIso, urlSegura
} from "../assets/js/comebacks.js";
import { escapeHtml, extraerIdYoutube } from "../assets/js/util.js";

const e = escapeHtml;
const $ = (id) => document.getElementById(id);

let usuario = null;
let esAdmin = false;
let lista = [];
let editandoId = null; // null = comeback nuevo

const optsPlataforma = (sel, claves = Object.keys(PLATAFORMAS)) =>
  claves.map(k => `<option value="${k}" ${k === sel ? "selected" : ""}>${e(PLATAFORMAS[k].nombre)}</option>`).join("");

// ---------------------------------------------------------------
// Lista de comebacks
// ---------------------------------------------------------------
function dibujarLista() {
  const cont = $("cb-lista");
  if (!cont) return;
  $("cb-import-aviso").style.display = lista.length === 0 ? "" : "none";
  if (lista.length === 0) {
    cont.innerHTML = `<p class="text-muted1">Todavía no hay comebacks cargados. La página pública está usando el archivo metas/data/goals.json.</p>`;
    return;
  }
  cont.innerHTML = lista.map(c => `
    <div class="admin-list-item" data-id="${c.id}">
      <div class="item-info">
        <h5>${e(c.nombre || c.titulo || "Sin nombre")} ${c.activo ? `<span class="badge-categoria">ACTIVO en la web</span>` : ""}</h5>
        <p>${e(c.fechaTexto || "Sin fecha")} · ${(c.metas || []).length} metas · ${(c.presave || []).length} pre-save</p>
      </div>
      <div class="item-actions">
        ${c.activo ? "" : `<button type="button" class="cb-activar" data-id="${c.id}" title="Mostrar este comeback en la página de metas"><i class="bi bi-broadcast"></i></button>`}
        <button type="button" class="cb-duplicar" data-id="${c.id}" title="Duplicar para armar el próximo comeback"><i class="bi bi-files"></i></button>
        <button type="button" class="cb-editar" data-id="${c.id}" title="Editar"><i class="bi bi-pencil"></i></button>
        ${esAdmin ? `<button type="button" class="cb-eliminar eliminar" data-id="${c.id}" title="Eliminar"><i class="bi bi-trash"></i></button>` : ""}
      </div>
    </div>`).join("");
}

// ---------------------------------------------------------------
// Editor
// ---------------------------------------------------------------
function filaPresave(p = {}) {
  const div = document.createElement("div");
  div.className = "cb-fila cb-presave";
  div.innerHTML = `
    <select class="form-select ps-plat" aria-label="Plataforma">${optsPlataforma(p.plataforma || "spotify", PLATAFORMAS_PRESAVE)}</select>
    <input type="text" class="form-control ps-nombre solo-otro" placeholder="Nombre de la plataforma" value="${e(p.nombrePlataforma || "")}">
    <input type="url" class="form-control ps-url" placeholder="Link de pre-save (https://...)" value="${e(p.url || "")}">
    <input type="text" class="form-control ps-texto" placeholder="Texto del botón (opcional)" value="${e(p.texto || "")}">
    <button type="button" class="quitar-red cb-quitar" title="Quitar"><i class="bi bi-x-lg"></i></button>`;
  div.dataset.plat = p.plataforma || "spotify";
  return div;
}

function filaBarra(b = {}) {
  const div = document.createElement("div");
  div.className = "cb-barra";
  div.dataset.id = b.id || idCorto("barra");
  div.dataset.tipo = b.tipo || "cantidad";
  div.innerHTML = `
    <div class="cb-grid">
      <label>Nombre de la barra<input type="text" class="form-control b-etq" placeholder="Ej: Primeras 24 hs" value="${e(b.etiqueta || "")}"></label>
      <label>Tipo
        <select class="form-select b-tipo">
          <option value="cantidad" ${b.tipo !== "puesto" ? "selected" : ""}>Cantidad (vistas, streams...)</option>
          <option value="puesto" ${b.tipo === "puesto" ? "selected" : ""}>Puesto en un ranking</option>
        </select>
      </label>
      <label><span class="solo-cantidad">Meta (número a alcanzar)</span><span class="solo-puesto">Meta: puesto # o mejor</span>
        <input type="number" min="0" step="any" class="form-control b-obj" value="${b.objetivo ?? ""}"></label>
      <label class="solo-cantidad">Unidad<input type="text" class="form-control b-unidad" placeholder="vistas, streams..." value="${e(b.unidad || "")}"></label>
      <label class="solo-puesto">Puesto máximo del ranking<input type="number" min="1" class="form-control b-max" placeholder="Ej: 200" value="${b.maximo ?? ""}"></label>
      <label><span class="solo-cantidad">Valor actual</span><span class="solo-puesto">Puesto actual</span>
        <input type="number" min="0" step="any" class="form-control b-actual" placeholder="vacío = sin datos" value="${b.actual ?? ""}"></label>
    </div>
    <div class="cb-grid solo-yt">
      <label>Fuente del valor
        <select class="form-select b-fuente">
          <option value="manual" ${b.fuente !== "youtube" ? "selected" : ""}>Manual (lo cargo yo)</option>
          <option value="youtube" ${b.fuente === "youtube" ? "selected" : ""}>Automático desde YouTube</option>
        </select>
      </label>
      <label class="cb-check"><input type="checkbox" class="form-check-input b-24h" ${b.ventana24h ? "checked" : ""}> Es la meta de las primeras 24 hs</label>
      <label>Valor final de 24 hs (se carga al cerrar las 24 hs)<input type="number" min="0" class="form-control b-final" value="${b.final24h ?? ""}"></label>
    </div>
    <button type="button" class="btn btn-sm btn-outline-secondary cb-quitar-barra"><i class="bi bi-trash"></i> Quitar barra</button>`;
  return div;
}

function bloqueMeta(m = {}) {
  const div = document.createElement("div");
  div.className = "cb-meta";
  div.dataset.id = m.id || idCorto("meta");
  div.dataset.plat = m.plataforma || "youtube";
  div.innerHTML = `
    <div class="cb-meta-head">
      <strong class="cb-meta-num"></strong>
      <button type="button" class="btn btn-sm btn-outline-danger cb-quitar-meta"><i class="bi bi-trash"></i> Quitar meta</button>
    </div>
    <div class="cb-grid">
      <label>Plataforma<select class="form-select m-plat">${optsPlataforma(m.plataforma || "youtube")}</select></label>
      <label class="solo-otro">Nombre de la plataforma<input type="text" class="form-control m-nombre-plat" value="${e(m.nombrePlataforma || "")}"></label>
      <label>Título de la tarjeta<input type="text" class="form-control m-titulo" placeholder="Ej: Spotify" value="${e(m.titulo || "")}"></label>
      <label>Detalle (opcional)<input type="text" class="form-control m-detalle" placeholder="Ej: Ranking diario de Argentina" value="${e(m.detalle || "")}"></label>
      <label>Link del botón<input type="url" class="form-control m-link" placeholder="https://..." value="${e(m.link || "")}"></label>
      <label>Texto del botón<input type="text" class="form-control m-boton" placeholder="Ej: Escuchar en Spotify" value="${e(m.botonTexto || "")}"></label>
    </div>
    <div class="cb-barras"></div>
    <button type="button" class="btn btn-sm btn-outline-secondary cb-agregar-barra"><i class="bi bi-plus-lg"></i> Agregar barra de progreso</button>`;
  const barras = div.querySelector(".cb-barras");
  (m.barras || []).forEach(b => barras.appendChild(filaBarra(b)));
  return div;
}

function renumerarMetas() {
  document.querySelectorAll("#cb-metas .cb-meta").forEach((m, i) => { m.querySelector(".cb-meta-num").textContent = `Meta ${i + 1}`; });
}

function abrirEditor(c) {
  editandoId = c.id || null;
  $("cb-editor-titulo").textContent = editandoId ? "Editar comeback" : "Nuevo comeback";
  $("cb-nombre").value = c.nombre || "";
  $("cb-titulo").value = c.titulo || "";
  $("cb-subtitulo").value = c.subtitulo || "";
  $("cb-fecha").value = c.fecha ? isoAInputArgentina(c.fecha) : "";
  $("cb-activo").checked = !!c.activo;
  $("cb-yt-url").value = c.youtubeUrl || (c.youtubeVideoId ? `https://www.youtube.com/watch?v=${c.youtubeVideoId}` : "");
  actualizarAvisoYoutube();

  const ps = $("cb-presave-lista");
  ps.innerHTML = "";
  (c.presave || []).forEach(p => ps.appendChild(filaPresave(p)));

  const ms = $("cb-metas");
  ms.innerHTML = "";
  (c.metas || []).forEach(m => ms.appendChild(bloqueMeta(m)));
  renumerarMetas();

  $("cb-error").style.display = "none";
  $("cb-lista-vista").style.display = "none";
  $("cb-editor-vista").style.display = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cerrarEditor() {
  $("cb-editor-vista").style.display = "none";
  $("cb-lista-vista").style.display = "";
}

function actualizarAvisoYoutube() {
  const url = $("cb-yt-url").value.trim();
  const id = extraerIdYoutube(url);
  const aviso = $("cb-yt-aviso");
  if (!url) { aviso.textContent = "Sin video: las barras de YouTube quedan en \"sin datos\" hasta que cargues uno."; return; }
  aviso.textContent = id ? `Video detectado (ID ${id}). Las vistas se leen solas desde YouTube.` : "No se reconoce el link. Pegá el link del video (youtube.com/watch?v=… o youtu.be/…).";
}

const num = (el) => { const v = el.value.trim(); return v === "" ? null : Number(v); };

function leerFormulario() {
  const errores = [];
  const titulo = $("cb-titulo").value.trim();
  const fechaInput = $("cb-fecha").value;
  if (!titulo) errores.push("Falta el título del comeback.");
  if (!fechaInput) errores.push("Falta la fecha y hora del comeback.");

  const ytUrl = $("cb-yt-url").value.trim();
  const ytId = ytUrl ? extraerIdYoutube(ytUrl) : null;
  if (ytUrl && !ytId) errores.push("El link de YouTube no es válido.");

  const presave = Array.from(document.querySelectorAll("#cb-presave-lista .cb-presave")).map(row => ({
    plataforma: row.querySelector(".ps-plat").value,
    nombrePlataforma: row.querySelector(".ps-nombre").value.trim() || null,
    url: row.querySelector(".ps-url").value.trim(),
    texto: row.querySelector(".ps-texto").value.trim() || null
  })).filter(p => p.url);
  presave.forEach(p => { if (!urlSegura(p.url)) errores.push(`El link de pre-save "${p.url}" tiene que empezar con https://`); });

  const metas = Array.from(document.querySelectorAll("#cb-metas .cb-meta")).map((bloque, i) => {
    const plataforma = bloque.querySelector(".m-plat").value;
    const link = bloque.querySelector(".m-link").value.trim();
    if (link && !urlSegura(link)) errores.push(`Meta ${i + 1}: el link tiene que empezar con https://`);
    const barras = Array.from(bloque.querySelectorAll(".cb-barra")).map(b => {
      const tipo = b.querySelector(".b-tipo").value;
      const barra = {
        id: b.dataset.id,
        etiqueta: b.querySelector(".b-etq").value.trim(),
        tipo,
        objetivo: num(b.querySelector(".b-obj")),
        actual: num(b.querySelector(".b-actual"))
      };
      if (!barra.etiqueta) errores.push(`Meta ${i + 1}: una barra no tiene nombre.`);
      if (barra.objetivo == null || barra.objetivo <= 0) errores.push(`Meta ${i + 1}: la barra "${barra.etiqueta || "sin nombre"}" necesita una meta mayor a 0.`);
      if (tipo === "puesto") {
        barra.maximo = num(b.querySelector(".b-max")) || 100;
        if (barra.objetivo != null && barra.objetivo >= barra.maximo) errores.push(`Meta ${i + 1}: en "${barra.etiqueta}" el puesto meta tiene que ser menor al puesto máximo.`);
      } else {
        barra.unidad = b.querySelector(".b-unidad").value.trim() || null;
      }
      if (plataforma === "youtube" && tipo === "cantidad") {
        barra.fuente = b.querySelector(".b-fuente").value;
        barra.ventana24h = b.querySelector(".b-24h").checked;
        barra.final24h = num(b.querySelector(".b-final"));
      }
      return barra;
    });
    return {
      id: bloque.dataset.id,
      plataforma,
      nombrePlataforma: plataforma === "otro" ? (bloque.querySelector(".m-nombre-plat").value.trim() || null) : null,
      titulo: bloque.querySelector(".m-titulo").value.trim() || PLATAFORMAS[plataforma].nombre,
      detalle: bloque.querySelector(".m-detalle").value.trim() || null,
      link,
      botonTexto: bloque.querySelector(".m-boton").value.trim() || null,
      barras
    };
  });

  const fecha = inputArgentinaAIso(fechaInput);
  return {
    errores,
    datos: {
      nombre: $("cb-nombre").value.trim() || titulo,
      subtitulo: $("cb-subtitulo").value.trim() || "ATEEZ Comeback Countdown",
      titulo,
      fecha,
      fechaTexto: fechaTextoArgentina(fecha),
      youtubeUrl: ytId ? `https://www.youtube.com/watch?v=${ytId}` : "",
      youtubeVideoId: ytId,
      presave,
      metas,
      activo: $("cb-activo").checked
    }
  };
}

async function guardar(ev) {
  ev.preventDefault();
  const err = $("cb-error");
  err.style.display = "none";
  const { errores, datos } = leerFormulario();
  if (errores.length) {
    err.innerHTML = errores.map(x => `• ${e(x)}`).join("<br>");
    err.style.display = "block";
    return;
  }
  const btn = $("cb-guardar");
  btn.disabled = true;
  try {
    let id = editandoId;
    if (id) await editarComeback(id, datos, usuario.uid);
    else id = await crearComeback(datos, usuario.uid);
    if (datos.activo) await activarComeback(id);
    cerrarEditor();
  } catch (error) {
    console.error(error);
    err.textContent = `No se pudo guardar: ${error.message || error}. Revisá que las reglas de Firestore estén publicadas (colección "comebacks").`;
    err.style.display = "block";
  } finally {
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------
function conectarEventos() {
  $("cb-nuevo").addEventListener("click", () => abrirEditor({
    ...comebackVacio(),
    metas: [{ id: idCorto("meta"), plataforma: "youtube", titulo: "YouTube", botonTexto: "Ver en YouTube", barras: [] }]
  }));
  $("cb-cancelar").addEventListener("click", cerrarEditor);
  $("cb-form").addEventListener("submit", guardar);
  $("cb-yt-url").addEventListener("input", actualizarAvisoYoutube);

  $("cb-import").addEventListener("click", async (ev) => {
    ev.currentTarget.disabled = true;
    try { await importarDesdeGoalsJson(usuario.uid); }
    catch (error) { console.error(error); alert("No se pudo importar: " + (error.message || error)); }
    finally { ev.currentTarget.disabled = false; }
  });

  $("cb-lista").addEventListener("click", async (ev) => {
    const b = ev.target.closest("button[data-id]");
    if (!b) return;
    const c = lista.find(x => x.id === b.dataset.id);
    if (!c) return;
    try {
      if (b.classList.contains("cb-editar")) abrirEditor(c);
      else if (b.classList.contains("cb-duplicar")) abrirEditor(duplicarParaNuevoComeback(c));
      else if (b.classList.contains("cb-activar")) {
        if (confirm(`¿Mostrar "${c.nombre || c.titulo}" en la página de metas? El comeback activo hoy pasa a archivado.`)) await activarComeback(c.id);
      } else if (b.classList.contains("cb-eliminar") && esAdmin) {
        if (confirm(`¿Eliminar "${c.nombre || c.titulo}"? No se puede deshacer.`)) await eliminarComeback(c.id);
      }
    } catch (error) { console.error(error); alert("No se pudo completar la acción: " + (error.message || error)); }
  });

  // Presave: agregar / quitar / cambiar plataforma
  $("cb-agregar-presave").addEventListener("click", () => $("cb-presave-lista").appendChild(filaPresave()));
  $("cb-presave-lista").addEventListener("click", (ev) => { ev.target.closest(".cb-quitar")?.closest(".cb-fila").remove(); });
  $("cb-presave-lista").addEventListener("change", (ev) => {
    const s = ev.target.closest(".ps-plat");
    if (s) s.closest(".cb-fila").dataset.plat = s.value;
  });

  // Metas
  $("cb-agregar-meta").addEventListener("click", () => {
    $("cb-metas").appendChild(bloqueMeta({ plataforma: "spotify", barras: [] }));
    renumerarMetas();
  });
  const cont = $("cb-metas");
  cont.addEventListener("click", (ev) => {
    const meta = ev.target.closest(".cb-meta");
    if (!meta) return;
    if (ev.target.closest(".cb-quitar-meta")) {
      if (confirm("¿Quitar esta meta completa?")) { meta.remove(); renumerarMetas(); }
    } else if (ev.target.closest(".cb-quitar-barra")) {
      ev.target.closest(".cb-barra").remove();
    } else if (ev.target.closest(".cb-agregar-barra")) {
      meta.querySelector(".cb-barras").appendChild(filaBarra());
    }
  });
  cont.addEventListener("change", (ev) => {
    const meta = ev.target.closest(".cb-meta");
    if (!meta) return;
    if (ev.target.classList.contains("m-plat")) {
      meta.dataset.plat = ev.target.value;
      const t = meta.querySelector(".m-titulo");
      if (!t.value.trim()) t.placeholder = PLATAFORMAS[ev.target.value].nombre;
    }
    if (ev.target.classList.contains("b-tipo")) ev.target.closest(".cb-barra").dataset.tipo = ev.target.value;
  });
}

/** Se llama una sola vez desde admin.js, si la persona puede ver la pestaña. */
let yaIniciado = false;
let detener = null;
export function iniciarPanelComeback({ usuarioActual, esAdminActual }) {
  usuario = usuarioActual;
  esAdmin = esAdminActual;
  if (yaIniciado) return; // el panel puede reiniciarse al cambiar la sesión: no duplicar eventos
  yaIniciado = true;
  conectarEventos();
  detener = escucharComebacks((c) => { lista = c; dibujarLista(); }, (error) => {
    console.error(error);
    $("cb-lista").innerHTML = `<p class="text-muted">No se pudieron cargar los comebacks: ${e(error.message || String(error))}. ¿Publicaste las reglas nuevas de Firestore?</p>`;
  });
}

// ============================================================
// SOBRES.JS - "Abrí tus sobres" (sin login, todo en localStorage)
// SOBRES_MAX sobres por comeback, visibles de a uno. Cada sobre trae 3 photocards
// boca abajo que se dan vuelta tocándolas. Con las 3 a la vista se pueden compartir
// (menú nativo del celular) o descargar como PNG, de a una o las 3 juntas.
// El siguiente sobre se habilita SOBRES_ESPERA_HS horas después de abrir el anterior.
// Clave: "atiny_sobres2_{comebackId}" -> [{ t, cartas:[id,id,id], vistas:[0|1,0|1,0|1] }]
// ============================================================
import { SOBRES_MAX, SOBRES_ESPERA_HS, RAREZAS, CARTAS } from "./sobres-data.js";

const box = document.getElementById("sobres");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const porId = Object.fromEntries(CARTAS.map((c) => [c.id, c]));
const ESPERA = SOBRES_ESPERA_HS * 36e5;
const imgSrc = (c) => `../assets/img/sobres/${c.id}.webp`;

let clave = "", S = [], ocupado = false, aviso = "";

function leer() {
  try {
    const j = JSON.parse(localStorage.getItem(clave) || "[]");
    return (Array.isArray(j) ? j : []).filter((s) => s && Array.isArray(s.cartas) && s.cartas.length === 3 && s.cartas.every((id) => porId[id]))
      .slice(0, SOBRES_MAX).map((s) => ({ t: +s.t || 0, cartas: s.cartas, vistas: [0, 1, 2].map((i) => (s.vistas && s.vistas[i] ? 1 : 0)) }));
  } catch (e) { return []; }
}
const guardar = () => { try { localStorage.setItem(clave, JSON.stringify(S)); } catch (e) { /* modo privado */ } };

// 3 cartas distintas, priorizando las que todavía no tiene; la rareza sale por peso.
function sacar3() {
  const tengo = new Set(S.flatMap((s) => s.cartas)), out = [];
  for (let i = 0; i < 3; i++) {
    let pool = CARTAS.filter((c) => !tengo.has(c.id) && !out.includes(c.id));
    if (!pool.length) pool = CARTAS.filter((c) => !out.includes(c.id));
    const rz = [...new Set(pool.map((c) => c.rareza))];
    let r = Math.random() * rz.reduce((a, k) => a + RAREZAS[k].peso, 0), pick = rz[0];
    for (const k of rz) { if ((r -= RAREZAS[k].peso) < 0) { pick = k; break; } }
    const g = pool.filter((c) => c.rareza === pick);
    out.push(g[Math.floor(Math.random() * g.length)].id);
  }
  return out;
}

// ---------- Render ----------
// Diseno "figurita" (estilo album de Panini): borde blanco de sticker, numero de figurita,
// estrellas de rareza, banda con el nombre y brillo foil (holografico en las raras, dorado en la especial).
const ESTRELLAS = { comun: 1, rara: 2, especial: 3 };
const numeroDe = (c) => CARTAS.findIndex((x) => x.id === c.id) + 1;
const fmtNum = (c) => `${String(numeroDe(c)).padStart(2, "0")}/${String(CARTAS.length).padStart(2, "0")}`;
const numHtml = (c) => `Nº ${String(numeroDe(c)).padStart(2, "0")}<span class="pc-tot">/${String(CARTAS.length).padStart(2, "0")}</span>`;
// Repetida = ya salio en un sobre anterior (asi se ve el cartel "¡Nueva!" / "Repetida")
const esRepetida = (si, id) => S.slice(0, si).some((x) => x.cartas.includes(id));

function carta(c, girada, nueva, s, i) {
  const rep = esRepetida(s, c.id);
  return `<div class="pc rz-${c.rareza}${girada ? " girada" : ""}${nueva ? " nueva" : ""}" style="--c:${esc(c.color)}" data-s="${s}" data-c="${i}"${girada ? "" : ' role="button" tabindex="0" aria-label="Dar vuelta la photocard"'}>
    <div class="pc-in">
      <div class="pc-b"><span class="pc-b-marco"><b>ATEEZ</b><small>ARGENTINA</small><i class="bi bi-stars"></i></span></div>
      <div class="pc-f">
        <div class="pc-art">
          <div class="pc-ph">${esc(c.miembro[0])}</div>
          <img src="${esc(imgSrc(c))}" alt="${esc(c.miembro)}" loading="lazy">
          <span class="pc-num">${numHtml(c)}</span>
          <span class="pc-estrellas" aria-label="${esc(RAREZAS[c.rareza].nombre)}">${"★".repeat(ESTRELLAS[c.rareza] || 1)}</span>
          <span class="pc-tag ${rep ? "rep" : "nva"}">${rep ? "Repetida" : "¡Nueva!"}</span>
          <div class="pc-cap"><b>${esc(c.miembro)}</b><small>${esc(RAREZAS[c.rareza].nombre)}</small></div>
        </div>
        <div class="pc-foil" aria-hidden="true"></div>
      </div>
    </div></div>`;
}

function render(nuevo = -1) {
  if (!box || !clave) return;
  box.hidden = false;
  const rest = SOBRES_MAX - S.length;
  const bloques = S.map((s, si) => {
    const completo = s.vistas.every(Boolean);
    const btn = (act, i, ico, txt, mini) => `<button type="button" class="meta-btn${mini ? " mini" : ""}" data-act="${act}" data-s="${si}" data-c="${i}" ${mini ? `title="${txt}" aria-label="${txt}"` : ""}><i class="bi ${ico}"></i>${mini ? "" : " " + txt}</button>`;
    return `<div class="sobre-bloque"><h4>Sobre ${si + 1} de ${SOBRES_MAX}</h4>
      <div class="sobres-fila">${s.cartas.map((id, i) => `<div class="pc-wrap">${carta(porId[id], !!s.vistas[i], si === nuevo, si, i)}
        ${completo ? `<div class="pc-btns">${btn("sh", i, "bi-share", "Compartir", 1)}${btn("dl", i, "bi-download", "Descargar", 1)}</div>` : ""}</div>`).join("")}</div>
      ${completo ? `<div class="pc-btns">${btn("sh3", 0, "bi-share", "Compartir las 3")}${btn("dl3", 0, "bi-download", "Descargar las 3")}</div>`
        : '<p class="sobres-sub">Tocá cada photocard para darla vuelta 👆</p>'}</div>`;
  }).join("");

  let prox = "";
  if (rest > 0) {
    const t = S.length ? S[S.length - 1].t + ESPERA : 0, lista = Date.now() >= t;
    prox = `<div class="sobre-bloque"><h4>Sobre ${S.length + 1} de ${SOBRES_MAX}</h4>
      <div class="sobres-fila"><button type="button" class="sobre${lista ? "" : " bloqueado"}" data-t="${t}" ${lista ? 'aria-label="Abrir sobre"' : "disabled"}>
        <span class="sobre-tapa" aria-hidden="true"></span>
        <span class="sobre-cuerpo"><b class="sobre-logo">ATEEZ</b><small class="sobre-sub">ARGENTINA</small><i class="bi ${lista ? "bi-stars" : "bi-lock-fill"} sobre-ico"></i><em class="sobre-pie">3 photocards</em></span>
      </button></div>
      <p class="sobres-sub">${lista ? "¡Tocá el sobre para abrirlo! Trae 3 photocards al azar." : 'Se habilita en <strong class="sobre-espera"></strong>'}</p></div>`;
  } else prox = '<p class="sobres-sub">¡Abriste todos tus sobres! Volvé en el próximo comeback 🏴‍☠️</p>';

  box.innerHTML = `<h3 class="presave-titulo"><i class="bi bi-envelope-paper-heart"></i> Abrí tus sobres</h3>${bloques}${prox}${aviso ? `<p class="sobres-sub" role="status">${esc(aviso)}</p>` : ""}`;
  box.querySelectorAll(".pc-f img").forEach((img) => img.addEventListener("error", () => img.remove()));
  espera();
}

function espera() {
  const el = box && box.querySelector(".sobre-espera");
  if (!el) return;
  const d = +el.closest(".sobre-bloque").querySelector(".sobre").dataset.t - Date.now();
  if (d <= 0) return render();
  const p = (n) => String(n).padStart(2, "0");
  el.textContent = `${p(Math.floor(d / 36e5))}:${p(Math.floor(d / 6e4) % 60)}:${p(Math.floor(d / 1e3) % 60)}`;
}
setInterval(espera, 1000);

// ---------- Acciones ----------
function abrir(btn) {
  const t = S.length ? S[S.length - 1].t + ESPERA : 0;
  if (ocupado || S.length >= SOBRES_MAX || Date.now() < t) return;
  ocupado = true; aviso = ""; btn.classList.add("abriendo");
  setTimeout(() => { S.push({ t: Date.now(), cartas: sacar3(), vistas: [0, 0, 0] }); guardar(); ocupado = false; render(S.length - 1); }, 1150);
}

function voltear(pc) {
  const s = S[+pc.dataset.s], i = +pc.dataset.c;
  if (!s || s.vistas[i]) return;
  s.vistas[i] = 1; guardar(); pc.classList.add("girada", "recien"); pc.removeAttribute("role"); pc.removeAttribute("tabindex");
  if (s.vistas.every(Boolean)) setTimeout(() => render(), 700); // muestra los botones de compartir/descargar
}

// ---------- Imágenes (canvas) ----------
const cargarImg = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const aBlob = (cv) => new Promise((r, j) => cv.toBlob((b) => (b ? r(b) : j(new Error("toBlob"))), "image/png"));

// Rectangulo con esquinas redondeadas (roundRect no existe en navegadores viejos)
function rr(x, X, Y, W, H, R) {
  x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R);
  x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath();
}

// La imagen que se descarga/comparte tiene el mismo look de figurita que se ve en pantalla.
async function dibujar(c, w = 600, h = 900) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const x = cv.getContext("2d");
  const M = 22, esp = c.rareza === "especial", rara = c.rareza === "rara";

  // sticker: fondo blanco (dorado en la especial) con sombra suave
  rr(x, 0, 0, w, h, 44); x.fillStyle = esp ? "#ffe27a" : "#ffffff"; x.fill();
  const iw = w - M * 2, ih = h - M * 2;
  x.save(); rr(x, M, M, iw, ih, 30); x.clip();

  // arte: color del integrante + foto
  x.fillStyle = c.color; x.fillRect(M, M, iw, ih);
  const img = await cargarImg(imgSrc(c));
  if (img) { const k = Math.max(iw / img.width, ih / img.height); x.drawImage(img, M + (iw - img.width * k) / 2, M + (ih - img.height * k) / 2, img.width * k, img.height * k); }
  else { x.fillStyle = "rgba(255,255,255,.85)"; x.font = "800 360px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(c.miembro[0], w / 2, h / 2 - 40); }

  // brillo foil
  if (rara || esp) {
    const g = x.createLinearGradient(M, M, M + iw, M + ih);
    if (esp) { g.addColorStop(0, "rgba(255,215,0,.35)"); g.addColorStop(.5, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,170,0,.35)"); }
    else { ["#ff0080", "#ff8c00", "#ffe600", "#00e676", "#00b0ff", "#7c4dff"].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col + "40")); }
    x.fillStyle = g; x.fillRect(M, M, iw, ih);
  }
  const sh = x.createLinearGradient(M, M, M + iw * .8, M + ih * .6);
  sh.addColorStop(0, "rgba(255,255,255,.28)"); sh.addColorStop(.35, "rgba(255,255,255,0)");
  x.fillStyle = sh; x.fillRect(M, M, iw, ih);

  // banda del nombre
  const bh = 150, by = M + ih - bh;
  const bg = x.createLinearGradient(0, by, 0, by + bh);
  bg.addColorStop(0, "rgba(0,0,0,0)"); bg.addColorStop(.35, "rgba(0,0,0,.72)"); bg.addColorStop(1, "rgba(0,0,0,.88)");
  x.fillStyle = bg; x.fillRect(M, by - 20, iw, bh + 20);
  x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "alphabetic";
  x.font = "800 52px sans-serif"; x.fillText(c.miembro.toUpperCase(), w / 2, by + 78);
  x.font = "500 24px sans-serif"; x.fillStyle = esp ? "#ffd700" : "rgba(255,255,255,.85)";
  x.fillText(`${"★".repeat(ESTRELLAS[c.rareza] || 1)}  ${RAREZAS[c.rareza].nombre}  ·  ATEEZ Argentina`, w / 2, by + 118);

  // numero de figurita
  rr(x, M + 18, M + 18, 150, 50, 25); x.fillStyle = "rgba(0,0,0,.6)"; x.fill();
  x.fillStyle = "#fff"; x.font = "700 26px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(`Nº ${fmtNum(c)}`, M + 18 + 75, M + 18 + 26);
  x.restore();

  // borde fino interior para que el recorte se vea prolijo
  rr(x, M, M, iw, ih, 30); x.lineWidth = 3; x.strokeStyle = esp ? "#d4a200" : "rgba(0,0,0,.12)"; x.stroke();
  return cv;
}

async function dibujarTrio(cs) {
  const cv = document.createElement("canvas"); cv.width = 1960; cv.height = 1060;
  const x = cv.getContext("2d");
  x.fillStyle = "#14141f"; x.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < 3; i++) x.drawImage(await dibujar(cs[i]), 40 + i * 640, 40);
  x.fillStyle = "#fff"; x.font = "600 36px sans-serif"; x.textAlign = "center";
  x.fillText("ATEEZ Argentina · #ATEEZenArgentina 🏴‍☠️", cv.width / 2, 1016);
  return cv;
}

function bajar(blob, name) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function compartir(file, text) {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  bajar(file, file.name);
  aviso = "Tu navegador no permite compartir directo: descargamos la imagen para que la subas a tus redes 📲";
}

async function accion(b) {
  if (ocupado) return;
  ocupado = true; aviso = "";
  const s = S[+b.dataset.s], a = b.dataset.act;
  try {
    let blob, name, txt;
    if (a === "dl" || a === "sh") {
      const c = porId[s.cartas[+b.dataset.c]];
      blob = await aBlob(await dibujar(c)); name = `ateez-${c.id}.png`;
      txt = `Me salió ${c.miembro} (${RAREZAS[c.rareza].nombre}) en los sobres de ATEEZ Argentina 🏴‍☠️ #ATEEZenArgentina`;
    } else {
      blob = await aBlob(await dibujarTrio(s.cartas.map((id) => porId[id]))); name = "ateez-mis-photocards.png";
      txt = "Mis photocards de ATEEZ Argentina 🏴‍☠️ #ATEEZenArgentina";
    }
    const file = new File([blob], name, { type: "image/png" });
    if (a.startsWith("sh")) await compartir(file, txt); else bajar(blob, name);
  } catch (err) { console.warn(err); aviso = "No pudimos generar la imagen. Probá de nuevo."; }
  ocupado = false; render();
}

box?.addEventListener("click", (e) => {
  const pc = e.target.closest(".pc:not(.girada)");
  if (pc) return voltear(pc);
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  if (b.classList.contains("sobre")) abrir(b); else if (b.dataset.act) accion(b);
});
box?.addEventListener("keydown", (e) => {
  const pc = e.target.closest && e.target.closest(".pc:not(.girada)");
  if (pc && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); voltear(pc); }
});
document.addEventListener("comeback-listo", (e) => { clave = `atiny_sobres2_${e.detail.id || "base"}`; S = leer(); render(); });

// Inclinacion 3D + reflejo de luz al pasar el mouse sobre una photocard ya dada vuelta (solo con mouse:
// en celular no hace falta y no interfiere con el scroll).
box?.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  const pc = e.target.closest && e.target.closest(".pc.girada");
  if (!pc) return;
  const r = pc.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
  pc.style.setProperty("--ry", `${((px - 0.5) * 24).toFixed(1)}deg`);
  pc.style.setProperty("--rx", `${((0.5 - py) * 24).toFixed(1)}deg`);
  pc.style.setProperty("--mx", `${(px * 100).toFixed(0)}%`);
  pc.style.setProperty("--my", `${(py * 100).toFixed(0)}%`);
});
box?.addEventListener("pointerout", (e) => {
  const pc = e.target.closest && e.target.closest(".pc.girada");
  if (!pc || pc.contains(e.relatedTarget)) return;
  ["--rx", "--ry", "--mx", "--my"].forEach((v) => pc.style.removeProperty(v));
});

// ============================================================
// SOBRES-DATA.JS - Configuración de la actividad "Abrí tus sobres"
// Cada persona tiene SOBRES_MAX sobres por comeback (se ve de a uno) y cada sobre trae 3 pcs al azar.
// El siguiente sobre se habilita SOBRES_ESPERA_HS horas después de abrir el anterior.
// Imágenes: guardalas en assets/img/sobres/ con el nombre del id (ej: hongjoong-1.webp).
// Si la imagen no existe, se muestra una carta de color con la inicial del integrante.
// ============================================================
export const SOBRES_MAX = 3;
export const SOBRES_ESPERA_HS = 0;

// Probabilidad de cada rareza (suman 100)
export const RAREZAS = {
  comun:    { nombre: "Común",    peso: 70 },
  rara:     { nombre: "Rara",     peso: 25 },
  especial: { nombre: "Especial", peso: 5 }
};

const MIEMBROS = [
  ["Hongjoong", "#e94560"], ["Seonghwa", "#9b5de5"], ["Yunho", "#f9a826"], ["Yeosang", "#4cc9f0"],
  ["San", "#f72585"], ["Mingi", "#43aa8b"], ["Wooyoung", "#ff7b00"], ["Jongho", "#4361ee"]
];

export const CARTAS = [
  ...MIEMBROS.flatMap(([m, color]) => {
    const slug = m.toLowerCase();
    return [
      { id: `${slug}-1`, miembro: m, rareza: "comun", color },
      { id: `${slug}-2`, miembro: m, rareza: "rara", color }
    ];
  }),
  { id: "ateez-1", miembro: "ATEEZ", rareza: "especial", color: "#ffd700" }
];

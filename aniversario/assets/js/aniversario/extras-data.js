// ============================================================
// DATOS DEL ANIVERSARIO - todo se edita acá, sin tocar actividades.js
//
// CADA AÑO: cambiá solo ANIV.n y ANIV.fecha (y el hashtag si cambia).
// El resto (cuenta regresiva, tarjetas, textos para compartir) se ajusta solo.
// Los textos del <title>/<meta> de index.html y la marca de agua
// 'ATEEZ 8TH' de aniversario.css hay que cambiarlos a mano.
// ============================================================
(function () {
  const n = 8; // número de aniversario
  const suf = (n % 100 >= 11 && n % 100 <= 13) ? 'TH' : ({ 1: 'ST', 2: 'ND', 3: 'RD' }[n % 10] || 'TH');
  window.ANIV = {
    n,
    ord: n + 'º',                          // 8º
    th: n + suf,                           // 8TH
    fecha: '2026-10-24T00:00:00-03:00',    // cuándo termina la cuenta regresiva (hora Argentina)
    debut: '2018-10-24T00:00:00-03:00',    // debut de ATEEZ
    debutDia: '2018-10-24',                // solo el día (lo usa "Mi fecha ATINY")
    hashtag: '#8YearsWithATEEZ'            // ojo: confirmá que sea el oficial
  };
})();

// Datos de las actividades extra: bingo, ahorcado y cumpleaños.
// Todo se edita acá, sin tocar actividades.js.
window.EXTRAS = {
  // ---- "Mi fecha ATINY": eras (desde = fecha del primer lanzamiento de cada una) ----
  ERAS: [
    { desde: '2018-10-24', n: 'Treasure', e: '🏴‍☠️', rango: 'Tripulación original', t: 'Llegaste cuando ATEEZ recién empezaba a buscar el tesoro. ¡Sos parte de la historia desde el principio!' },
    { desde: '2020-07-29', n: 'Zero: Fever', e: '🔥', rango: 'Veterano/a de Zero: Fever', t: 'Subiste al barco en plena fiebre. Viste cómo ATEEZ se hacía gigante.' },
    { desde: '2022-07-29', n: 'The World', e: '🌍', rango: 'Explorador/a de The World', t: 'Llegaste cuando ATEEZ salió a conquistar el mundo. ¡Y acá seguís!' },
    { desde: '2024-05-31', n: 'Golden Hour', e: '✨', rango: 'ATINY de la Golden Hour', t: 'Llegaste en la hora dorada. Todavía queda un montón de camino para recorrer juntos.' }
  ],
  // ---- Adiviná la canción con emojis: [emojis, título] ----
  // Los distractores salen solos de esta misma lista, así que solo agregá pares nuevos.
  EMOJIS: [
    ['🏴‍☠️👑', 'Pirate King'],
    ['🗣️📣', 'Say My Name'],
    ['🌊', 'Wave'],
    ['🎭✨', 'Illusion'],
    ['🐇🎩', 'Wonderland'],
    ['❓➡️✅', 'Answer'],
    ['🌀🧠', 'Inception'],
    ['🎆☝️', 'Fireworks'],
    ['🔁👀', 'Deja Vu'],
    ['🙏💌', 'Thanxx'],
    ['🪖🌿', 'Guerrilla'],
    ['🤪📝', 'Crazy Form'],
    ['🌶️🔥', 'Bouncy'],
    ['⛏️🍔', 'Work'],
    ['🧊🦷', 'Ice On My Teeth'],
    ['🍋💧', 'Lemon Drop'],
    ['⚡💉', 'Adrenaline'],
    ['😈🖤', 'BAD'],
    ['💭🦄', 'In Your Fantasy'],
    ['😴🌠', 'Dreamers'],
    ['♾️🚀', 'Limitless'],
    ['🙅‍♂️🆗', 'Not Okay'],
    ['🎂🎉', 'Birthday']
  ],
  // ---- Sopa de letras: solo letras A-Z, sin espacios ni tildes, hasta 12 letras ----
  SOPA: [
    'HONGJOONG', 'SEONGHWA', 'YUNHO', 'YEOSANG', 'SAN', 'MINGI', 'WOOYOUNG', 'JONGHO',
    'ATINY', 'ATEEZ', 'PIRATA', 'TESORO', 'CAPITAN', 'TRIPULACION', 'ARGENTINA', 'MATE',
    'GUERRILLA', 'WONDERLAND', 'ADRENALINE', 'WANTEEZ', 'FEVER', 'TREASURE', 'LEMON',
    'ANSWER', 'LIGHTSTICK', 'COMEBACK', 'PHOTOCARD', 'WORK'
  ],
  // Bingo: se eligen 16 al azar de esta lista (agregá las que quieras)
  BINGO: [
    'Lloré con un MV', 'Tengo un lightstick', 'Fui a un concierto', 'Me sé una coreo',
    'Tengo photocards', 'Armé una playlist de ATEEZ', 'Convertí a un amigo en ATINY', 'Me desvelé por un comeback',
    'Compré un álbum', 'Tengo más de un bias', 'Participé en un proyecto de fans', 'Escuché Pirate King mil veces',
    'Vi un live a la madrugada', 'Tengo merch de ATEEZ', 'Conocí amigos por ATEEZ', 'Sueño con verlos en Argentina',
    'Streameé hasta las 3 AM', 'Hice trending un hashtag', 'Mi mamá ya sabe quién es mi bias', 'Aprendí coreano por ellos',
    'Fui a una juntada de ATINY', 'Tengo un fondo de pantalla de ATEEZ', 'Compré un álbum solo por las photocards', 'Lloré viendo un concierto'
  ],
  // Ahorcado: p = palabra, h = pista (solo datos confirmados en el banco de la trivia)
  HANGMAN: [
    { p: 'PIRATE KING', h: 'Canción de debut de ATEEZ' },
    { p: 'WONDERLAND', h: 'Tema principal de Treasure EP.Fin: All to Action' },
    { p: 'ANSWER', h: 'Tema principal de Treasure Epilogue: Action to Answer' },
    { p: 'GUERRILLA', h: 'Tema principal de The World EP.1: Movement' },
    { p: 'CRAZY FORM', h: 'Tema principal de The World EP.Fin: Will' },
    { p: 'WORK', h: 'Tema principal de Golden Hour: Part.1' },
    { p: 'ICE ON MY TEETH', h: 'Tema principal de Golden Hour: Part.2' },
    { p: 'LEMON DROP', h: 'Tema principal de Golden Hour: Part.3' },
    { p: 'ADRENALINE', h: 'Tema principal de Golden Hour: Part.4' },
    { p: 'ATINY', h: 'Así se llama el fandom' },
    { p: 'HONGJOONG', h: 'Es el líder (el Capitán)' },
    { p: 'JONGHO', h: 'Es el maknae' },
    { p: 'KQ ENTERTAINMENT', h: 'La agencia de ATEEZ' },
    { p: 'WANTEEZ', h: 'Serie de YouTube de ATEEZ que arrancó en 2022' }
  ],
  // Cumpleaños (m = mes, d = día, y = año de nacimiento)
  BIRTHDAYS: [
    { n: 'Hongjoong', slug: 'hongjoong', m: 11, d: 7, y: 1998 },
    { n: 'Seonghwa', slug: 'seonghwa', m: 4, d: 3, y: 1998 },
    { n: 'Yunho', slug: 'yunho', m: 3, d: 23, y: 1999 },
    { n: 'Yeosang', slug: 'yeosang', m: 6, d: 15, y: 1999 },
    { n: 'San', slug: 'san', m: 2, d: 10, y: 1999 },
    { n: 'Mingi', slug: 'mingi', m: 8, d: 9, y: 1999 },
    { n: 'Wooyoung', slug: 'wooyoung', m: 11, d: 26, y: 1999 },
    { n: 'Jongho', slug: 'jongho', m: 10, d: 12, y: 2000 }
  ]
};

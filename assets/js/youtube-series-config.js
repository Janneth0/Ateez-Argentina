// ============================================================
// YOUTUBE-SERIES-CONFIG.JS - ATEEZ ARGENTINA
// Un único lugar con la definición de cada serie de YouTube que
// se muestra en Contenido. Lo usan tanto la vista "últimos 4" de
// contenido.html como la vista "ver todos" de videos.html, así
// nunca quedan desincronizadas entre sí.
// ============================================================

export const SERIES_YOUTUBE = {
  mvs: {
    nombre: "Últimos Comebacks",
    playlistId:"PL_G3lYLGW-D861cDMNhWwfoyga23KzfgZ",
    tipo: "embed", // video grande incrustado
    respaldo: [
      { id: "-q_S27LbNKU", titulo: "ATEEZ - 'BAD' Official MV" },
      { id: "vqkfEUqjl6Y", titulo: "ATEEZ - 'Adrenaline' Official MV" },
      { id: "JOF2ZTqvzwY", titulo: "ATEEZ - 'In Your Fantasy' Official MV" },
      { id: "H4H99b1CjPU", titulo: "ATEEZ - 'Lemon Drop' Official MV" }
    ]
  },
    wanteez: {
    nombre: "WANTEEZ",
    playlistId: "PL_G3lYLGW-D_yqkYBZgIhCTYrN18POCdQ", // ej: PL3Y2NB1-BFRRr5rDgj6gfvrDBePHr96v9
    tipo: "compacto",
    respaldo: [
      { id: "e25DlSEATPY", titulo: "WANTEEZ EP.51", descripcion: "Episodio 51 de WANTEEZ, la serie de variedades de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/e25DlSEATPY/mqdefault.jpg" },
      { id: "MQoo7U5YAvU", titulo: "WANTEEZ EP.50", descripcion: "Episodio 50 de WANTEEZ, la serie de variedades de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/MQoo7U5YAvU/mqdefault.jpg" },
      { id: "1iW2elRk4e4", titulo: "WANTEEZ EP.49", descripcion: "Episodio 49 de WANTEEZ, la serie de variedades de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/1iW2elRk4e4/mqdefault.jpg" },
      { id: "BnnonDTgvxs", titulo: "WANTEEZ EP.48", descripcion: "Episodio 48 de WANTEEZ, la serie de variedades de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/BnnonDTgvxs/mqdefault.jpg" }
    ]
  },
  logbook: {
    nombre: "LOG_LOGBOOK",
    playlistId: "PL_G3lYLGW-D8QRXX2oeyfEfGw47g_Q7_W",
    tipo: "compacto",
    respaldo: [
      { id: "49Qw9AieEp8", titulo: "log_logbook#229", descripcion: "Episodio 229 de LOG_LOGBOOK, el detrás de escena de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/49Qw9AieEp8/mqdefault.jpg" },
      { id: "00_IIrQ8KTI", titulo: "log_logbook#226", descripcion: "Episodio 226 de LOG_LOGBOOK, el detrás de escena de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/00_IIrQ8KTI/mqdefault.jpg" },
      { id: "PQKXqmSUOO4", titulo: "log_logbook#223", descripcion: "Episodio 223 de LOG_LOGBOOK, el detrás de escena de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/PQKXqmSUOO4/mqdefault.jpg" },
      { id: "fFN69TTaKoo", titulo: "log_logbook#220", descripcion: "Episodio 220 de LOG_LOGBOOK, el detrás de escena de ATEEZ.", thumbnail: "https://i.ytimg.com/vi/fFN69TTaKoo/mqdefault.jpg" }
    ]
  }
};

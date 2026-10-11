// Integrantes: nombre, nombre de la foto (assets/img/integrantes/<slug>.jpg) y mensaje del resultado.
window.QUIZ_MEMBERS = {
  HJ: { n: 'Hongjoong', slug: 'hongjoong', t: 'Líder nato: ideas, estrategia y capitán del barco.' },
  SH: { n: 'Seonghwa', slug: 'seonghwa', t: 'Cuidás a todos y tenés una elegancia natural.' },
  YH: { n: 'Yunho', slug: 'yunho', t: 'Energía inagotable y muy buena onda.' },
  YS: { n: 'Yeosang', slug: 'yeosang', t: 'Observador/a, tranquilo/a y con estilo propio.' },
  SN: { n: 'San', slug: 'san', t: 'Intensidad y carisma en todo lo que hacés.' },
  MG: { n: 'Mingi', slug: 'mingi', t: 'Cabeza creativa, humor y fuerza.' },
  WY: { n: 'Wooyoung', slug: 'wooyoung', t: 'Alma de la fiesta: expresivo/a y divertido/a.' },
  JH: { n: 'Jongho', slug: 'jongho', t: 'Constancia, poder y un corazón enorme.' }
};
// Formato: [pregunta, [[opción, integrante1, integrante2] x4]]
// Cada pregunta reparte a los 8 integrantes una sola vez, así ninguno parte con ventaja.
window.QUIZ_BANK = [
["¿Cómo tomás el mate?",[["Amargo y sin vueltas","HJ","YS"],["Dulce, con bastante azúcar","WY","YH"],["Soy el cebador oficial de la ronda","SH","JH"],["Mejor un mate cocido con facturas","MG","SN"]]],
["¿Qué rol tenés en el asado?",[["Parrillero/a: yo mando en la parrilla","HJ","JH"],["Me encargo de la música y el ambiente","WY","YH"],["Pongo la mesa y cuido que todos coman","SH","YS"],["Voy por la picada y las ideas raras","MG","SN"]]],
["Viajás en un colectivo o subte lleno. ¿Qué hacés?",[["Auriculares y mi playlist","YS","MG"],["Charlo con cualquiera","WY","SN"],["Cedo el asiento y ayudo a quien lo necesite","SH","JH"],["Voy planificando todo el día","HJ","YH"]]],
["Juega la Selección. ¿Cómo lo vivís?",[["Canto todas las canciones de la cancha","JH","WY"],["Analizo tácticas como un DT","HJ","SH"],["Bailo cada gol","YH","SN"],["Lo miro tranqui con snacks","YS","MG"]]],
["¿Adónde te vas de vacaciones?",[["Bariloche, entre nieve y chocolate","SH","YS"],["Mar del Plata, playa y fiesta","WY","YH"],["Patagonia: aventura y paisajes","SN","HJ"],["Las sierras de Córdoba con amigos","JH","MG"]]],
["Hora de la merienda. ¿Qué elegís?",[["Medialunas calentitas","SH","JH"],["Un alfajor (o tres)","MG","WY"],["Tortas fritas en un día de lluvia","YS","SN"],["Dulce de leche con cuchara","YH","HJ"]]],
["Te cae un finde largo. ¿Qué plan armás?",[["Escapada improvisada","SN","WY"],["Maratón de series en casa","YS","MG"],["Juntada con todos los amigos","HJ","SH"],["Salir a correr, bailar o entrenar","YH","JH"]]],
["En una juntada, ¿qué música no puede faltar?",[["Cumbia para bailar toda la noche","WY","YH"],["Rock nacional y cantar a los gritos","JH","HJ"],["Trap y pop argentino","SN","MG"],["Folclore o baladas tranquilas","SH","YS"]]],
["Tu superpoder sería…",[["Carisma","SN","WY"],["Una voz potente","JH","HJ"],["Creatividad sin límites","MG","YH"],["Calma y elegancia","SH","YS"]]],
["¿Cómo festejás tu cumpleaños?",[["Gran fiesta con todos","WY","YH"],["Cena íntima","SH","YS"],["Algo creativo hecho por mí","SN","MG"],["Karaoke hasta la madrugada","JH","HJ"]]],
["Mañana tenés un examen. ¿Qué hacés?",[["Armo un plan y estudio por bloques","HJ","SH"],["Estudio con amigos y mucha energía","YH","WY"],["Me concentro en silencio con música","YS","MG"],["Confío en mi intuición y me tiro de cabeza","SN","JH"]]],
["Tu emoji más usado:",[["😂","WY","YH"],["🔥","SN","HJ"],["😌","YS","SH"],["💪","JH","MG"]]],
["Te regalan un día libre total. ¿Qué hacés?",[["Salgo de aventura","SN","WY"],["Mimo a mi gente","SH","JH"],["Creo algo nuevo","HJ","MG"],["Descanso y no hago nada","YS","YH"]]],
["Estás perdido/a en una ciudad nueva…",[["Le pregunto a todo el mundo","WY","YH"],["Uso el mapa y mantengo la calma","YS","SH"],["Lo vivo como una aventura","SN","MG"],["Tomo el mando y decido","HJ","JH"]]],
["Tu estilo de ropa:",[["Elegante y prolijo","SH","YS"],["Deportivo y cómodo","YH","JH"],["Llamativo y atrevido","WY","SN"],["Creativo y único","MG","HJ"]]],
["En el karaoke elegís…",[["Una balada para lucirme","JH","SH"],["Un hit para bailar","WY","YH"],["Un rap a toda velocidad","MG","HJ"],["Algo suave y tranquilo","YS","SN"]]],
["En una película de piratas serías…",[["El capitán","HJ","SN"],["El navegante estratega","SH","YS"],["El cocinero del barco","JH","YH"],["El que anima a la tripulación cantando","WY","MG"]]],
["Ante un problema, vos…",[["Busco ideas nuevas","MG","HJ"],["Lo hablo hasta aclararlo","SH","JH"],["Lo tomo con humor","WY","YH"],["Lo pienso solo/a primero","YS","SN"]]],
["Una salida por Buenos Aires:",[["Café en Palermo","SH","YS"],["Recital o boliche","WY","SN"],["Museos y ferias de arte","MG","HJ"],["Plaza con pelota y amigos","YH","JH"]]],
["Tu momento favorito del día:",[["La madrugada","SN","MG"],["La mañana temprano","HJ","SH"],["La tarde","YH","JH"],["La noche","WY","YS"]]]
];

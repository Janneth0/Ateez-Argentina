// ==========================================
// 1. CONFIGURACIÓN
// ==========================================
const YOUTUBE_API_KEY = 'AIzaSyDlGihW21eWD7Y0gKXQcVHU1-SLj3_wpyQ'; // Tu API Key
const YOUTUBE_VIDEO_ID = 'tVJBWoof09Q';    // ID del video 'NASA'
const TARGET_DATE = new Date("2026-11-13T02:00:00-03:00").getTime(); // 13/11 2am AR

// Lista de metas
const goalsData = [
    {
        id: "yt_nasa_mv",
        type: "youtube",
        platform: "YouTube",
        category: "Performance Video",
        title: "ATEEZ - 'NASA' Performance Video",
        target_mth: 30000000, // Meta: 30 Millones al mes
        targetText_mth: "30.000.000 Vistas",
        target_day: 15000000, // Meta 24hs: 15 Millones
        targetText_day: "15.000.000 Vistas",
        link: `https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`
    },
    {
        id: "spotify_ar_daily",
        type: "spotify",
        platform: "Spotify",
        category: "Argentina Daily Top 50",
        title: "Ingresar al Top 50 de Spotify Argentina",
        targetPercent: 70, 
        targetText: "Puesto #30",
        statsText: "Progreso estimado: 70%",
        link: "https://spotify.com"
    },
    {
        id: "shazam_ar_top",
        type: "shazam",
        platform: "Shazam",
        category: "Shazam Argentina",
        title: "Alcanzar 10.000 Shazams en Argentina",
        targetPercent: 40,
        targetText: "10.000 Shazams",
        statsText: "Progreso estimado: 40%",
        link: "https://shazam.com"
    }
];

// ==========================================
// 2. LÓGICA DEL CONTA-REGRESIVO (COUNTDOWN)
// ==========================================
const timer = setInterval(() => {
    const now = new Date().getTime();
    const distance = TARGET_DATE - now;

    const countdownEl = document.getElementById("countdown");
    if (!countdownEl) return;

    if (distance < 0) {
        clearInterval(timer);
        countdownEl.innerHTML = "¡EL COMEBACK YA ESTÁ AQUÍ! 🔥";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    countdownEl.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}, 1000);

// ==========================================
// 3. API DE YOUTUBE DATA v3
// ==========================================
async function fetchYouTubeViews() {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'PEGA_AQUI_TU_API_KEY') {
        console.warn('Agrega una YOUTUBE_API_KEY válida para sincronizar vistas.');
        return null;
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${YOUTUBE_VIDEO_ID}&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            return parseInt(data.items[0].statistics.viewCount, 10);
        }
    } catch (error) {
        console.error('Error al conectar con YouTube API:', error);
    }
    return null;
}

// ==========================================
// 4. RENDERIZADO DE METAS Y LOCALSTORAGE
// ==========================================
async function renderGoals() {
    // Consultar API de YouTube
    const ytViews = await fetchYouTubeViews();

    const userCompleted = JSON.parse(localStorage.getItem('atiny_completed_goals') || '[]');
    const container = document.getElementById('goals-container');
    if (!container) return;
    
    container.innerHTML = '';

    goalsData.forEach(goal => {
        const isDone = userCompleted.includes(goal.id);

        // Estilos de botón según plataforma
        let btnClass = 'btn-yt';
        if (goal.type === 'spotify') btnClass = 'btn-sp';
        if (goal.type === 'shazam') btnClass = 'btn-sh';

        let progressHTML = '';

        if (goal.type === 'youtube') {
            // Vistas actuales o fallback de respaldo
            const views = ytViews || 24122289; 

            // Porcentajes para ambas metas
            const pctMonth = Math.min(100, ((views / goal.target_mth) * 100)).toFixed(1);
            const pctDay = Math.min(100, ((views / goal.target_day) * 100)).toFixed(1);
            const viewsFormatted = views.toLocaleString('es-AR');

            progressHTML = `
              <div class="goal-header">
                <span>[${goal.platform}] MES</span>
                <span>Objetivo: <strong>${goal.targetText_mth}</strong></span>
              </div>
              <div class="progress-bg">
                <div class="progress-fill" style="width: ${pctMonth}%;"></div>
              </div>
              <div class="progress-stats">
                <span>${viewsFormatted} vistas actuales</span>
                <span><strong>${pctMonth}%</strong></span>
              </div>

              <div class="goal-header" style="margin-top: 10px;">
                <span>[${goal.platform}] 24HS</span>
                <span>Objetivo: <strong>${goal.targetText_day}</strong></span>
              </div>
              <div class="progress-bg">
                <div class="progress-fill" style="width: ${pctDay}%;"></div>
              </div>
              <div class="progress-stats">
                <span>  </span>
                <span><strong>${pctDay}%</strong></span>
              </div>
            `;
        } else {
            // Renderizado genérico para Spotify/Shazam
            progressHTML = `
              <div class="goal-header">
                <span>[${goal.platform}]</span>
                <span>Objetivo: <strong>${goal.targetText}</strong></span>
              </div>
              <div class="progress-bg">
                <div class="progress-fill" style="width: ${goal.targetPercent}%;"></div>
              </div>
              <div class="progress-stats">
                <span>${goal.statsText}</span>
                <span><strong>${goal.targetPercent}%</strong></span>
              </div>
            `;
        }

        const card = document.createElement('div');
        card.className = 'goal-card';
        card.innerHTML = `
          <h3 class="goal-title">${goal.title}</h3>
          ${progressHTML}
          <div class="goal-actions" style="margin-top: 15px;">
            <a href="${goal.link}" target="_blank" class="btn ${btnClass}">Reproducir 🎧</a>
            <button class="btn btn-check ${isDone ? 'completed' : ''}" onclick="toggleGoal('${goal.id}')">
              ${isDone ? '✓ ¡Ya cumplí!' : 'Marcar como cumplido'}
            </button>
          </div>
        `;
        container.appendChild(card);
    });
}

// Guardar / Quitar meta en el navegador del usuario
function toggleGoal(goalId) {
    let completed = JSON.parse(localStorage.getItem('atiny_completed_goals') || '[]');
    if (completed.includes(goalId)) {
        completed = completed.filter(id => id !== goalId);
    } else {
        completed.push(goalId);
    }
    localStorage.setItem('atiny_completed_goals', JSON.stringify(completed));
    renderGoals();
}

// Hacer que toggleGoal esté disponible globalmente para el atributo onclick
window.toggleGoal = toggleGoal;

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    renderGoals();
});
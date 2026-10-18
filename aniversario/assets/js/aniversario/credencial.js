// Credencial ATINY: vista previa en vivo, sello animado, descarga y compartir.
// Requiere html2canvas y canvas-confetti (cargados en el HTML).
(function () {
  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // Número de aniversario, fecha y hashtag: se cambian en extras-data.js
  const A = window.ANIV || { n: 8, th: '8TH', hashtag: '#8YearsWithATEEZ' };

  // Confeti con los colores del tema que eligió el admin (global: lo usan las actividades)
  window.launchConfetti = function () {
    if (typeof confetti !== 'function') return;
    const cs = getComputedStyle(document.documentElement);
    const acc = cs.getPropertyValue('--accent-color').trim() || '#d4af37';
    const head = cs.getPropertyValue('--heading-color').trim() || '#ffffff';
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: [acc, head, '#ffffff'] });
  };

  const card = $('atiny-card');
  if (!card) return;
  const stamp = $('card-stamp');

  function biases() {
    const sel = [...document.querySelectorAll('.bias-checkbox input:checked')].map((c) => c.value);
    return sel.length === 0 || sel.length === 8 ? 'OT8 (Todos)' : sel.join(', ');
  }

  function update() {
    stamp.classList.remove('active'); // si cambia algo, hay que volver a estampar
    const loc = $('input-location').value.trim().replace(/,?\s*AR$/i, '');
    $('card-name').textContent = $('input-name').value.trim() || 'TU NOMBRE';
    $('card-bias').textContent = biases();
    $('card-location').textContent = (loc || 'Buenos Aires') + ', AR';
    $('card-song').textContent = $('input-song').value.trim() || 'Crazy Form';
  }

  $('cred-form').addEventListener('input', update);
  $('cred-form').addEventListener('change', update);

  $('input-photo').addEventListener('change', (e) => {
    stamp.classList.remove('active');
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = $('avatar-img');
      img.src = ev.target.result;
      img.style.display = 'block';
      $('avatar-text').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  async function estampar() {
    if (typeof html2canvas !== 'function') throw new Error('html2canvas no cargó');
    stamp.classList.add('active');
    window.launchConfetti();
    await wait(650); // que termine la animación del sello
    return html2canvas(card, { scale: 3, backgroundColor: null, useCORS: true });
  }

  function descargar(canvas) {
    const a = document.createElement('a');
    a.download = 'ATINY_Passport_' + A.n + 'th_' + Date.now() + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  function aviso(texto) {
    const el = $('cred-err');
    if (el) el.textContent = texto || '';
  }

  async function accion(btn, textoOriginal, compartir) {
    aviso('');
    btn.disabled = true;
    btn.textContent = 'Verificando… ✍️';
    try {
      const canvas = await estampar();
      if (!compartir) { descargar(canvas); return; }
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
      const file = new File([blob], 'ATINY_Passport_' + A.n + 'th.png', { type: 'image/png' });
      const data = {
        title: 'ATINY Passport - ' + A.th + ' Anniversary ATEEZ',
        text: '¡Obtuve mi credencial oficial verificada para celebrar los ' + A.n + ' años de ATEEZ en ateezargentina.com.ar! 🏴‍☠️🇦🇷 ' + A.hashtag + ' #ATEEZ #ATINY',
        files: [file]
      };
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share(data); } catch (err) { /* cerró el menú */ }
      } else {
        descargar(canvas); // en PC no hay menú nativo: se descarga
      }
    } catch (err) {
      console.error('Error al generar la credencial:', err);
      aviso('No pudimos generar la imagen. Probá de nuevo o sacale captura de pantalla 📸');
    } finally {
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  }

  $('btn-dl').addEventListener('click', () => accion($('btn-dl'), 'Descargar PNG 💾', false));
  $('btn-share-native').addEventListener('click', () => accion($('btn-share-native'), 'Compartir credencial 📲', true));
  update();
})();

// ============================================================
// NAV.JS - Aniversario: una actividad a la vez
// Al tocar una opcion del menu de actividades se muestra SOLO esa actividad
// (las demas se ocultan), asi la vista queda limpia. Soporta:
//   - links directos:  aniversario/#act-trivia  (abre esa actividad)
//   - boton Atras/Adelante del navegador (cada opcion queda en el historial)
//   - sin hash: se muestra la credencial
// Si el JS no cargara, todas las secciones quedan visibles como antes.
// ============================================================
(function () {
  const wrap = document.getElementById('act-nav-wrap');
  const nav = document.getElementById('act-nav');
  const secciones = Array.from(document.querySelectorAll('main.aniv .act-section'));
  if (!nav || !secciones.length) return;

  const ids = secciones.map((s) => s.id);
  const POR_DEFECTO = 'credencial';

  function offsetHeader() {
    const h = document.getElementById('header');
    return (h ? h.offsetHeight : 0) + 8;
  }

  // Deja la opcion activa a la vista dentro del menu (en celular el menu scrollea de costado)
  function centrarActivo(a) {
    if (!a || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollTo({ left: a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
  }

  function mostrar(id, { scroll = true } = {}) {
    if (!ids.includes(id)) id = POR_DEFECTO;

    secciones.forEach((s) => { s.hidden = s.id !== id; });

    let activo = null;
    nav.querySelectorAll('a[href^="#"]').forEach((a) => {
      const on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('active', on);
      if (on) { a.setAttribute('aria-current', 'page'); activo = a; } else a.removeAttribute('aria-current');
    });
    centrarActivo(activo);

    if (scroll && wrap) {
      // Se sube hasta el menu (que queda justo debajo del header fijo) para ver la actividad desde el principio
      const top = wrap.getBoundingClientRect().top + window.scrollY - offsetHeader();
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }

  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    mostrar(id);
  });

  window.addEventListener('hashchange', () => mostrar(location.hash.slice(1)));

  // Estado inicial (sin scroll: si viene con #act-xxx, main.js ya se ocupa de posicionar la pagina)
  mostrar(location.hash.slice(1), { scroll: false });
})();

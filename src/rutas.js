// Enrutador mínimo con la API de historial. Azure Static Web Apps redirige
// cualquier ruta a index.html (staticwebapp.config.json), así que /r/<token> y
// /acceso funcionan al abrirlos directo.
import { haySesion } from './sesion.js';
import { limpiar } from './ui.js';

const rutas = [];
let contenedor = null;
let vistaNoEncontrada = null;

export function ruta(patron, vista, { requiereSesion = false, titulo = '' } = {}) {
  rutas.push({ patron, vista, requiereSesion, titulo });
}

export function iniciarRutas(elemento, { noEncontrada }) {
  contenedor = elemento;
  vistaNoEncontrada = noEncontrada;
  window.addEventListener('popstate', resolver);
  document.addEventListener('click', interceptarEnlaces);
  return resolver();
}

export function navegar(camino, { reemplazar = false } = {}) {
  if (reemplazar) history.replaceState(null, '', camino);
  else history.pushState(null, '', camino);
  return resolver();
}

// Solo rutas internas: evita redirecciones a otros sitios con ?volver=.
export function caminoSeguro(camino, porDefecto = '/') {
  return typeof camino === 'string' && camino.startsWith('/') && !camino.startsWith('//') ? camino : porDefecto;
}

function interceptarEnlaces(evento) {
  const enlace = evento.target.closest('a[data-ruta]');
  if (!enlace || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey) return;
  evento.preventDefault();
  navegar(enlace.getAttribute('href'));
}

export async function resolver() {
  const camino = location.pathname.replace(/\/+$/, '') || '/';
  for (const r of rutas) {
    const coincidencia = camino.match(r.patron);
    if (!coincidencia) continue;
    if (r.requiereSesion && !haySesion()) {
      return navegar(`/acceso?volver=${encodeURIComponent(camino)}`, { reemplazar: true });
    }
    document.title = r.titulo ? `${r.titulo} · BillCapital` : 'Portal de clientes · BillCapital';
    limpiar(contenedor);
    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent('ruta-cambiada'));
    return r.vista(contenedor, coincidencia.groups || {});
  }
  document.title = 'Página no encontrada · BillCapital';
  limpiar(contenedor);
  window.dispatchEvent(new CustomEvent('ruta-cambiada'));
  return vistaNoEncontrada(contenedor);
}

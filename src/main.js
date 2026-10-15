// Portal de clientes BillCapital (clientes.billcapital.com).
// Solo front: la lógica vive en el back y todo pasa por apiGateway. Nada se guarda en el navegador.
import './estilos.css';
import { h, montar } from './ui.js';
import { ruta, iniciarRutas, navegar } from './rutas.js';
import { haySesion, alCambiarSesion, cerrarSesion } from './sesion.js';
import { VERSION } from './config.js';
import { vistaInicio } from './vistas/inicio.js';
import { vistaRegistro } from './vistas/registro.js';
import { vistaAcceso } from './vistas/acceso.js';
import { vistaCompliance } from './vistas/compliance.js';
import { vistaPendiente } from './vistas/pendiente.js';
import { vistaNoEncontrada } from './vistas/no-encontrada.js';

const SECCIONES = [
  ['/panel', 'Inicio'],
  ['/compliance', 'Compliance'],
  ['/credencial', 'Credencial'],
  ['/permisos', 'Mis permisos'],
];

const menu = h('nav', { clase: 'menu', 'aria-label': 'Secciones del portal' });
const contenido = h('main', { clase: 'contenido', id: 'contenido' });

montar(
  document.getElementById('app'),
  h(
    'div',
    { clase: 'marco' },
    h(
      'header',
      { clase: 'cabecera' },
      h(
        'div',
        { clase: 'cabecera-contenido' },
        h(
          'a',
          { clase: 'marca', href: '/', 'data-ruta': true },
          h('img', { src: '/isotipo.png', alt: '', width: 32, height: 32 }),
          h('span', {}, h('span', { clase: 'marca-nombre', texto: 'BillCapital' }), h('br'), h('span', { clase: 'marca-sub', texto: 'Portal de clientes' })),
        ),
        menu,
      ),
    ),
    contenido,
    h('footer', { clase: 'pie', texto: `BillCapital · Portal de clientes · v${VERSION}` }),
  ),
);

function pintarMenu() {
  while (menu.firstChild) menu.firstChild.remove();
  if (!haySesion()) return;
  for (const [camino, nombre] of SECCIONES) {
    menu.append(h('a', { href: camino, 'data-ruta': true, 'aria-current': location.pathname === camino ? 'page' : false, texto: nombre }));
  }
  menu.append(
    h('button', {
      type: 'button',
      texto: 'Salir',
      eventos: {
        click: () => {
          cerrarSesion();
          navegar('/');
        },
      },
    }),
  );
}
alCambiarSesion(pintarMenu);
window.addEventListener('ruta-cambiada', pintarMenu);

// Con el enlace del MIC se va directo al registro; sin código se muestra la portada.
function inicio(contenedor) {
  const token = new URLSearchParams(location.search).get('t');
  if (token) return vistaRegistro(contenedor, { token }); // enlaces antiguos: /?t=<token>
  if (haySesion()) return navegar('/panel', { reemplazar: true });
  return vistaInicio(contenedor);
}

ruta(/^\/$/, inicio);
ruta(/^\/r\/(?<token>[^/]+)$/, vistaRegistro, { titulo: 'Registro' });
ruta(/^\/registro$/, vistaRegistro, { titulo: 'Registro' });
ruta(/^\/acceso$/, vistaAcceso, { titulo: 'Ingreso' });

// Pantallas del brief que dependen de sub-acciones pedidas al back (#272).
ruta(
  /^\/identidad$/,
  vistaPendiente('Validación de identidad', 'En tu primer ingreso validaremos tu identidad. Esta sección estará disponible muy pronto.'),
  { requiereSesion: true, titulo: 'Validación de identidad' },
);
ruta(
  /^\/autorizacion$/,
  vistaPendiente('Autorización', 'Aquí podrás autorizar a BillCapital a consultar tu información tributaria. Esta sección estará disponible muy pronto.'),
  { requiereSesion: true, titulo: 'Autorización' },
);
ruta(
  /^\/credencial$/,
  vistaPendiente('Credencial tributaria', 'Aquí podrás entregar o cambiar tu credencial tributaria. Esta sección estará disponible muy pronto.'),
  { requiereSesion: true, titulo: 'Credencial tributaria' },
);
ruta(/^\/compliance$/, vistaCompliance, { requiereSesion: true, titulo: 'Compliance' });
ruta(
  /^\/panel$/,
  vistaPendiente('Tu panel', 'Aquí verás tus documentos transables, el estado de cesión y tus ofertas. Esta sección estará disponible muy pronto.'),
  { requiereSesion: true, titulo: 'Inicio' },
);
ruta(
  /^\/permisos$/,
  vistaPendiente('Mis permisos', 'Aquí verás el estado de tu autorización, cada uso de tu credencial y podrás revocarla. Esta sección estará disponible muy pronto.'),
  { requiereSesion: true, titulo: 'Mis permisos' },
);

iniciarRutas(contenido, { noEncontrada: vistaNoEncontrada });

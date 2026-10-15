// Portada del portal: clientes.billcapital.com sin el código del MIC.
// Dos caminos (registrarse o ingresar) y un campo para pegar el enlace del MIC.
// No muestra ningún MIC por defecto: su nombre aparece solo al validar su enlace.
import { h, montar, tarjeta } from '../ui.js';
import { DISPONIBLE } from '../config.js';
import { campoEnlaceMic } from './enlace-mic.js';

export function vistaInicio(contenedor) {
  const ingresoDisponible = DISPONIBLE.accesoPorCorreo || DISPONIBLE.canjeAcceso;

  montar(
    contenedor,
    h(
      'div',
      { clase: 'portada' },
      h(
        'section',
        { clase: 'portada-intro' },
        h('p', { clase: 'portada-rotulo', texto: 'Portal de clientes' }),
        h('h1', { texto: 'Te damos la bienvenida a BillCapital' }),
        h('p', {
          texto: 'Registra tu empresa, mantén tu información al día y revisa tus documentos y el estado de tus operaciones en un solo lugar.',
        }),
      ),
      h(
        'div',
        { clase: 'portada-caminos' },
        tarjeta(
          h('span', { clase: 'etiqueta', texto: 'Nuevo cliente' }),
          h('h2', { texto: 'Quiero registrarme' }),
          h('p', { texto: 'Registra tu empresa en pocos pasos. Si un MIC te invitó, usa el enlace que te envió.' }),
          h('p', {
            clase: 'nota',
            texto: '¿No tienes un MIC? Al registrarte te asignamos uno: será tu contacto directo con BillCapital y te acompañará en cada paso.',
          }),
          h('div', { clase: 'acciones' }, h('a', { clase: 'boton', href: '/registro', 'data-ruta': true, texto: 'Iniciemos' })),
        ),
        tarjeta(
          h('span', { clase: 'etiqueta', texto: 'Ya soy cliente' }),
          h('h2', { texto: 'Ingresar' }),
          h('p', { texto: 'Revisa tu compliance, tus documentos y tus permisos.' }),
          ingresoDisponible ? null : h('p', { clase: 'nota', texto: 'El ingreso con tu correo estará disponible muy pronto.' }),
          h('div', { clase: 'acciones' }, h('a', { clase: 'boton', href: '/acceso', 'data-ruta': true, texto: 'Ingresar' })),
        ),
      ),
      tarjeta(
        h('h2', { texto: '¿Te llegó un enlace de tu MIC?' }),
        h('p', { texto: 'Ábrelo directamente o pégalo aquí para continuar con tu registro.' }),
        campoEnlaceMic(),
      ),
    ),
  );
}

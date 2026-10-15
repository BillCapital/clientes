// Ingreso al portal.
//  · /acceso#t=<token>: enlace de un solo uso que llega por correo. El token se lee y se quita
//    de inmediato de la barra de direcciones. Se valida con micappreferido · resolver_acceso
//    (existente, público, no consume el token). El canje por la sesión es acceso_canjear (#272 punto 1).
//  · /acceso: el cliente pide un enlace con su correo (acceso_solicitar, #272 punto 2).
import { h, montar, aviso, tarjeta } from '../ui.js';
import { llamar } from '../gateway.js';
import { DISPONIBLE } from '../config.js';

const FORMATO_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export async function vistaAcceso(contenedor) {
  const token = leerTokenDelEnlace();
  if (token === null) return vistaIngresoPorCorreo(contenedor);
  if (!FORMATO_TOKEN.test(token)) return mostrarEnlaceVencido(contenedor);
  return vistaEnlace(contenedor, token);
}

// Devuelve el token del fragmento (#t=...) o null si no viene, y lo saca de la barra de direcciones.
function leerTokenDelEnlace() {
  const fragmento = location.hash.startsWith('#') ? location.hash.slice(1) : '';
  if (!fragmento) return null;
  history.replaceState(null, '', location.pathname + location.search);
  return new URLSearchParams(fragmento).get('t') || '';
}

async function vistaEnlace(contenedor, token) {
  montar(contenedor, h('div', { clase: 'angosto' }, tarjeta(h('p', { clase: 'nota', texto: 'Verificando tu enlace…' }))));
  let respuesta;
  try {
    respuesta = await llamar('micappreferido', { sub: 'resolver_acceso', t: token });
  } catch (error) {
    return montar(contenedor, h('div', { clase: 'angosto' }, tarjeta(aviso('error', error.message))));
  }
  if (!respuesta?.valido) return mostrarEnlaceVencido(contenedor);

  const cliente = respuesta.cliente || {};
  const acciones = [];
  if (DISPONIBLE.canjeAcceso) {
    // Pendiente del back (#272 punto 1): acceso_canjear {t} → firebase_custom_token.
    // Con ese token se inicia sesión en Firebase con persistencia en memoria y se llama a establecerSesion().
    acciones.push(aviso('info', 'Ingreso en preparación.'));
  } else {
    acciones.push(
      aviso('info', 'El ingreso al portal estará disponible muy pronto. Si necesitas ayuda, contacta a tu MIC.'),
    );
  }

  montar(
    contenedor,
    h(
      'div',
      { clase: 'angosto' },
      tarjeta(
        h('h1', { texto: 'Tu acceso al portal' }),
        h('p', {}, 'Este enlace es para ', h('b', { texto: cliente.razon_social || 'tu empresa' }), cliente.rut ? ` (${cliente.rut})` : '', '.'),
        acciones,
      ),
    ),
  );
}

function mostrarEnlaceVencido(contenedor) {
  montar(
    contenedor,
    h(
      'div',
      { clase: 'angosto' },
      tarjeta(
        h('h1', { texto: 'Enlace no válido' }),
        h('p', { texto: 'Este enlace no es válido o ya venció. Pide uno nuevo a tu MIC.' }),
        h('a', { href: '/', 'data-ruta': true, clase: 'boton-secundario', texto: 'Ir al inicio' }),
      ),
    ),
  );
}

function vistaIngresoPorCorreo(contenedor) {
  const correo = h('input', { id: 'correo', type: 'email', autocomplete: 'email', required: true, disabled: !DISPONIBLE.accesoPorCorreo });
  const boton = h('button', { clase: 'boton', type: 'submit', disabled: !DISPONIBLE.accesoPorCorreo, texto: 'Enviarme un enlace' });
  const mensajes = h('div', { 'aria-live': 'polite' });

  async function enviar(evento) {
    evento.preventDefault();
    if (!DISPONIBLE.accesoPorCorreo) return;
    const valor = correo.value.trim();
    if (!valor) return;
    boton.disabled = true;
    try {
      // Pendiente del back (#272 punto 2). La respuesta es siempre neutra.
      await llamar('portalcliente', { sub: 'acceso_solicitar', email: valor });
    } catch {
      // No se informa si el correo existe.
    }
    while (mensajes.firstChild) mensajes.firstChild.remove();
    mensajes.append(aviso('ok', 'Si tu correo está registrado, te enviamos un enlace de acceso. Revisa tu bandeja de entrada.'));
    boton.disabled = false;
  }

  montar(
    contenedor,
    h(
      'div',
      { clase: 'angosto' },
      tarjeta(
        h('h1', { texto: 'Ingresa a tu portal' }),
        h('p', { texto: 'Escribe el correo registrado de tu empresa y te enviaremos un enlace de acceso de un solo uso.' }),
        DISPONIBLE.accesoPorCorreo
          ? null
          : aviso('alerta', 'El ingreso con tu correo estará disponible muy pronto. Mientras tanto, usa el enlace que te envió tu MIC.'),
        h(
          'form',
          { novalidate: true, eventos: { submit: enviar } },
          h('label', { clase: 'campo', for: 'correo' }, h('span', { texto: 'Correo' }), correo),
          mensajes,
          boton,
        ),
        h('p', { clase: 'nota' }, '¿Tu empresa aún no está registrada? ', h('a', { href: '/registro', 'data-ruta': true, texto: 'Regístrala aquí' }), '.'),
      ),
    ),
  );
}

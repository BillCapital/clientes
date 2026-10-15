import { h, montar, tarjeta } from '../ui.js';

export function vistaNoEncontrada(contenedor) {
  montar(
    contenedor,
    h(
      'div',
      { clase: 'angosto' },
      tarjeta(
        h('h1', { texto: 'No encontramos esta página' }),
        h('p', { texto: 'Revisa la dirección o vuelve al inicio del portal.' }),
        h('a', { href: '/', 'data-ruta': true, clase: 'boton-secundario', texto: 'Ir al inicio' }),
      ),
    ),
  );
}

// Pantallas del brief que dependen de sub-acciones pedidas al back (#272).
// No se muestran referencias internas al cliente: el número de pedido queda en el código.
import { h, montar, bloquePendiente } from '../ui.js';

export function vistaPendiente(titulo, descripcion) {
  return (contenedor) => montar(contenedor, h('div', { clase: 'angosto' }, bloquePendiente(titulo, descripcion)));
}

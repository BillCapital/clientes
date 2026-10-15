// Utilidades de interfaz.
// Los textos se insertan siempre como texto (nunca como HTML) para no interpretar
// datos que llegan del back o de la URL.

// Crea un elemento. Atributos especiales:
//   clase   → className
//   texto   → textContent
//   eventos → { click: fn, submit: fn, ... }
//   datos   → dataset
// El resto se asigna con setAttribute (true = atributo sin valor; false/null = se omite).
export function h(etiqueta, atributos = {}, ...hijos) {
  const elemento = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(atributos || {})) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave === 'clase') elemento.className = valor;
    else if (clave === 'texto') elemento.textContent = valor;
    else if (clave === 'eventos') {
      for (const [evento, manejador] of Object.entries(valor)) elemento.addEventListener(evento, manejador);
    } else if (clave === 'datos') Object.assign(elemento.dataset, valor);
    else elemento.setAttribute(clave, valor === true ? '' : String(valor));
  }
  agregar(elemento, hijos);
  return elemento;
}

function agregar(elemento, hijos) {
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    elemento.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
}

export function limpiar(elemento) {
  while (elemento.firstChild) elemento.firstChild.remove();
}

export function montar(contenedor, ...nodos) {
  limpiar(contenedor);
  agregar(contenedor, nodos);
}

// tipo: 'info' | 'ok' | 'alerta' | 'error'
export function aviso(tipo, ...contenido) {
  return h('div', { clase: `aviso aviso-${tipo}`, role: tipo === 'error' ? 'alert' : 'status' }, ...contenido);
}

export function tarjeta(...contenido) {
  return h('section', { clase: 'tarjeta' }, ...contenido);
}

export function iniciales(nombre) {
  return String(nombre || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase() || 'BC';
}

// Pantalla que depende de una sub-acción que el back aún no despliega.
export function bloquePendiente(titulo, descripcion, referencia) {
  return tarjeta(
    h('span', { clase: 'etiqueta-pendiente', texto: 'En preparación' }),
    h('h1', { texto: titulo }),
    h('p', { texto: descripcion }),
    referencia ? h('p', { clase: 'nota', texto: referencia }) : null,
  );
}

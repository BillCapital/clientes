// Sesión del cliente, solo en memoria.
// Regla del portal: nada de token, sesión ni credencial en localStorage ni en sessionStorage.
// Al recargar la página la sesión se pierde y el cliente pide un enlace nuevo.

const estado = { token: null, expiraEn: 0, cliente: null };
const oyentes = new Set();

function avisar() {
  for (const oyente of oyentes) oyente(haySesion());
}

// Se llama cuando exista acceso_canjear (#272 punto 1): el back entrega un token personalizado
// de Firebase, el front inicia sesión con persistencia en memoria y deja aquí el token de ID.
export function establecerSesion({ token, expiraEn, cliente }) {
  estado.token = token || null;
  estado.expiraEn = Number(expiraEn) || 0;
  estado.cliente = cliente || null;
  avisar();
}

export function cerrarSesion() {
  estado.token = null;
  estado.expiraEn = 0;
  estado.cliente = null;
  avisar();
}

export function tokenVigente() {
  return estado.token && Date.now() < estado.expiraEn ? estado.token : null;
}

export function haySesion() {
  return Boolean(tokenVigente());
}

export function clienteActual() {
  return estado.cliente;
}

export function alCambiarSesion(oyente) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

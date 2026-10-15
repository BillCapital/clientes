// Cliente del apiGateway. Una sola puerta de entrada al back.
import { GATEWAY } from './config.js';
import { tokenVigente, cerrarSesion } from './sesion.js';

export class ErrorGateway extends Error {
  constructor(mensaje, { codigo = 'error', estado = 0, datos = null } = {}) {
    super(mensaje);
    this.codigo = codigo;
    this.estado = estado;
    this.datos = datos;
  }
}

// accion: nombre de la acción del gateway (p. ej. 'portalregistro').
// cuerpo: objeto que se envía como JSON.
// conSesion: agrega el token del cliente; si no hay sesión vigente, falla sin llamar.
export async function llamar(accion, cuerpo = {}, { conSesion = false } = {}) {
  const encabezados = { 'Content-Type': 'application/json' };
  if (conSesion) {
    const token = tokenVigente();
    if (!token) {
      throw new ErrorGateway('Debes ingresar al portal para continuar.', { codigo: 'sin_sesion', estado: 401 });
    }
    encabezados.Authorization = `Bearer ${token}`;
  }

  let respuesta;
  try {
    respuesta = await fetch(`${GATEWAY}/${accion}`, {
      method: 'POST',
      headers: encabezados,
      body: JSON.stringify(cuerpo),
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch {
    throw new ErrorGateway('No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.', { codigo: 'sin_conexion' });
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (respuesta.status === 401) {
    if (conSesion) cerrarSesion();
    throw new ErrorGateway(datos?.error || 'Tu sesión no es válida o venció. Vuelve a ingresar.', {
      codigo: datos?.codigo || 'sin_sesion',
      estado: 401,
      datos,
    });
  }

  if (!respuesta.ok || datos?.ok === false) {
    throw new ErrorGateway(datos?.mensaje || datos?.error || 'No se pudo completar la acción. Intenta de nuevo.', {
      codigo: datos?.codigo || `http_${respuesta.status}`,
      estado: respuesta.status,
      datos,
    });
  }

  return datos;
}

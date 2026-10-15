// Datos por país: nombre del identificador, de la credencial y textos.
// La fuente es el gateway (portalcliente · config, pedido #272 punto 4). Mientras esa
// sub-acción no esté desplegada se usa este respaldo provisional de Chile y Colombia.
import { DISPONIBLE } from './config.js';
import { llamar } from './gateway.js';

const RESPALDO = {
  1: {
    id_pais: 1,
    iso: 'CL',
    nombre: 'Chile',
    identificador: 'RUT',
    ejemploIdentificador: '76000000-0',
    credencial: 'Clave del SII',
    pideCredencialEnRegistro: true,
  },
  2: {
    id_pais: 2,
    iso: 'CO',
    nombre: 'Colombia',
    identificador: 'NIT',
    ejemploIdentificador: '900000000-0',
    credencial: 'Credencial de la DIAN',
    pideCredencialEnRegistro: false,
  },
};

export const PAISES_ACTIVOS = [RESPALDO[1], RESPALDO[2]];

const cache = new Map();

export async function configPais(idPais) {
  const id = Number(idPais) || 1;
  if (cache.has(id)) return cache.get(id);
  let config = { ...(RESPALDO[id] || RESPALDO[1]), provisional: true };
  if (DISPONIBLE.config) {
    try {
      const respuesta = await llamar('portalcliente', { sub: 'config', id_pais: id });
      if (respuesta?.config) config = { ...config, ...respuesta.config, provisional: false };
    } catch {
      // Sin config del gateway se mantiene el respaldo.
    }
  }
  cache.set(id, config);
  return config;
}

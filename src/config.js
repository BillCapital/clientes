// Configuración del portal de clientes de BillCapital.
// Todo pasa por apiGateway: el portal no usa la llave anon ni llama a tablas directo.

export const GATEWAY = 'https://ybugxmeiwobzrdeuhlzl.supabase.co/functions/v1/apiGateway';

export const VERSION = '0.2.0';

// Sub-acciones pedidas al back en intercambio_equipos #272. Cada una se activa aquí
// cuando el back confirme el despliegue y se valide contra datos reales.
export const DISPONIBLE = {
  config: false,          // #272 punto 4: portalcliente · config (pública)
  accesoPorCorreo: false, // #272 punto 2: portalcliente · acceso_solicitar
  canjeAcceso: false,     // #272 punto 1: portalcliente · acceso_canjear
  registroSinMic: false,  // #272 punto 12: portalregistro sin token de MIC
};

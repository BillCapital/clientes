// Campo para pegar el enlace (o solo el código) de registro que envió el MIC.
// Acepta el enlace completo (…/r/<código> o …/?t=<código>) o el código solo, y abre /r/<código>.
// El código se valida en el back al abrir el registro (portalregistro · resolve).
import { h, aviso, limpiar } from '../ui.js';
import { navegar } from '../rutas.js';

const CODIGO_MIC = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function extraerCodigoMic(texto) {
  const coincidencia = String(texto || '').match(CODIGO_MIC);
  return coincidencia ? coincidencia[0].toLowerCase() : null;
}

export function campoEnlaceMic() {
  const entrada = h('input', {
    id: 'enlace-mic',
    name: 'enlace-mic',
    autocomplete: 'off',
    spellcheck: 'false',
    placeholder: 'Pega aquí el enlace o el código',
  });
  const mensajes = h('div', { 'aria-live': 'polite' });

  function continuar(evento) {
    evento.preventDefault();
    limpiar(mensajes);
    const codigo = extraerCodigoMic(entrada.value);
    if (!codigo) {
      mensajes.append(
        aviso('error', 'No reconocemos ese enlace. Revisa que esté completo o pídele a tu MIC que te lo envíe de nuevo.'),
      );
      return;
    }
    navegar(`/r/${codigo}`);
  }

  return h(
    'form',
    { clase: 'form-enlace', novalidate: true, eventos: { submit: continuar } },
    h('label', { for: 'enlace-mic', texto: 'Enlace o código de tu MIC' }),
    h('div', { clase: 'fila-enlace' }, entrada, h('button', { clase: 'boton-secundario', type: 'submit', texto: 'Continuar' })),
    mensajes,
  );
}

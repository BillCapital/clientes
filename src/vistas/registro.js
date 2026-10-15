// Registro de la empresa del cliente con el enlace de su MIC: /r/<token> (o el antiguo ?t=<token>).
// Usa la acción existente portalregistro (resolve | registrar), que pasa por apiGateway sin llave anon.
// La credencial va directo al back (Vault): el front no la guarda y limpia el campo al terminar.
import { h, montar, aviso, tarjeta, iniciales, bloquePendiente } from '../ui.js';
import { llamar } from '../gateway.js';
import { configPais, PAISES_ACTIVOS } from '../pais.js';
import { DISPONIBLE } from '../config.js';
import { TERMINOS } from '../textos/terminos.js';

const FORMATO_TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function vistaRegistro(contenedor, { token = '' } = {}) {
  const tokenMic = String(token || new URLSearchParams(location.search).get('t') || '').trim().toLowerCase();
  if (!tokenMic) return vistaRegistroSinMic(contenedor);
  if (!FORMATO_TOKEN.test(tokenMic)) return mostrarEnlaceInvalido(contenedor);

  montar(contenedor, h('div', { clase: 'angosto' }, tarjeta(h('p', { clase: 'nota', texto: 'Cargando…' }))));

  let mic;
  try {
    const respuesta = await llamar('portalregistro', { accion: 'resolve', token: tokenMic });
    mic = { nombre: respuesta.mic_nombre || 'tu MIC', idPais: Number(respuesta.id_pais) || null };
  } catch (error) {
    if (error.codigo === 'sin_conexion') {
      return montar(contenedor, h('div', { clase: 'angosto' }, tarjeta(aviso('error', error.message))));
    }
    return mostrarEnlaceInvalido(contenedor);
  }

  await pintarFormulario(contenedor, tokenMic, mic);
}

function vistaRegistroSinMic(contenedor) {
  if (!DISPONIBLE.registroSinMic) {
    // Pendiente del back (#272 punto 12): registro sin token, asignado al MIC de la casa del país.
    return montar(
      contenedor,
      h(
        'div',
        { clase: 'angosto' },
        bloquePendiente(
          'Registro directo',
          'Muy pronto podrás registrar tu empresa directamente aquí. Si un MIC de BillCapital te envió un enlace de registro, ábrelo para continuar.',
        ),
      ),
    );
  }
  return mostrarEnlaceInvalido(contenedor);
}

function mostrarEnlaceInvalido(contenedor) {
  montar(
    contenedor,
    h(
      'div',
      { clase: 'angosto' },
      tarjeta(
        h('h1', { texto: 'Enlace no válido' }),
        h('p', { texto: 'El enlace de registro no es válido o ya no está vigente. Pídele a tu MIC que te lo envíe de nuevo.' }),
      ),
    ),
  );
}

async function pintarFormulario(contenedor, tokenMic, mic) {
  let pais = await configPais(mic.idPais || 1);

  const mensajes = h('div', { 'aria-live': 'polite' });
  const razon = h('input', { id: 'razon', name: 'razon', autocomplete: 'organization', required: true });
  const selectorPais = h(
    'select',
    { id: 'pais', name: 'pais', disabled: Boolean(mic.idPais) },
    PAISES_ACTIVOS.map((p) => h('option', { value: p.id_pais, selected: p.id_pais === pais.id_pais }, p.nombre)),
  );
  const identificador = h('input', { id: 'identificador', name: 'identificador', autocomplete: 'off', required: true });
  const textoIdentificador = h('span');
  const credencial = h('input', { id: 'credencial', name: 'credencial', type: 'password', autocomplete: 'off' });
  const textoCredencial = h('span');
  const campoCredencial = h('label', { clase: 'campo', for: 'credencial' }, textoCredencial, credencial);
  const acepto = h('input', { type: 'checkbox', id: 'acepto' });
  const boton = h('button', { clase: 'boton', type: 'submit', disabled: true, texto: 'Guardar' });
  const dialogo = crearDialogoTerminos();

  function aplicarPais() {
    textoIdentificador.textContent = `${pais.identificador} de la empresa`;
    identificador.placeholder = pais.ejemploIdentificador || '';
    textoCredencial.textContent = pais.credencial;
    campoCredencial.hidden = !pais.pideCredencialEnRegistro;
    credencial.required = Boolean(pais.pideCredencialEnRegistro);
  }
  aplicarPais();

  selectorPais.addEventListener('change', async () => {
    pais = await configPais(selectorPais.value);
    aplicarPais();
  });
  acepto.addEventListener('change', () => {
    boton.disabled = !acepto.checked;
  });

  const formulario = h(
    'form',
    { novalidate: true, eventos: { submit: enviar } },
    h('h1', { texto: 'Registra tu empresa' }),
    h('label', { clase: 'campo', for: 'razon' }, h('span', { texto: 'Razón social' }), razon),
    h('label', { clase: 'campo', for: 'pais' }, h('span', { texto: 'País' }), selectorPais),
    h('label', { clase: 'campo', for: 'identificador' }, textoIdentificador, identificador),
    campoCredencial,
    h(
      'div',
      { clase: 'seguridad' },
      h('span', { 'aria-hidden': 'true', texto: '🔒' }),
      h('span', { texto: 'Tus credenciales viajan cifradas y se guardan de forma segura. Solo se usan para habilitar tus documentos; nunca se comparten ni se muestran.' }),
    ),
    h(
      'label',
      { clase: 'casilla', for: 'acepto' },
      acepto,
      h(
        'span',
        {},
        'He leído y acepto los ',
        h('button', { type: 'button', clase: 'enlace-boton', eventos: { click: () => dialogo.showModal() }, texto: 'términos y condiciones' }),
        '.',
      ),
    ),
    mensajes,
    boton,
    h('p', { clase: 'nota' }, 'Este formulario lo solicitó tu MIC ', h('b', { texto: mic.nombre }), ' de BillCapital. Si no conoces a esta persona, confirma con tu MIC que este sea el sitio correcto.'),
  );

  async function enviar(evento) {
    evento.preventDefault();
    montarMensaje(mensajes, null);
    const datos = {
      razon_social: razon.value.trim(),
      rut: identificador.value.trim(),
      clave: pais.pideCredencialEnRegistro ? credencial.value : '',
    };
    if (!datos.razon_social || !datos.rut) {
      return montarMensaje(mensajes, aviso('error', `Completa la razón social y el ${pais.identificador}.`));
    }
    if (pais.pideCredencialEnRegistro && !datos.clave) {
      return montarMensaje(mensajes, aviso('error', `La ${pais.credencial.toLowerCase()} es obligatoria para continuar.`));
    }
    boton.disabled = true;
    boton.textContent = 'Guardando…';
    try {
      await llamar('portalregistro', {
        accion: 'registrar',
        token: tokenMic,
        rut: datos.rut,
        razon_social: datos.razon_social,
        clave: datos.clave || undefined,
      });
      credencial.value = '';
      montar(
        contenedor,
        h(
          'div',
          { clase: 'angosto' },
          tarjeta(
            h(
              'div',
              { clase: 'listo' },
              h('div', { clase: 'marca-ok', 'aria-hidden': 'true', texto: '✓' }),
              h('h1', { texto: '¡Listo!' }),
              h('p', { texto: 'Recibimos tus datos de forma segura. Tu MIC continuará con el proceso.' }),
            ),
          ),
        ),
      );
    } catch (error) {
      montarMensaje(mensajes, aviso('error', `No pudimos registrar tu empresa: ${error.message}`));
      boton.disabled = !acepto.checked;
      boton.textContent = 'Guardar';
    }
  }

  montar(
    contenedor,
    h(
      'div',
      { clase: 'angosto' },
      tarjeta(
        h(
          'div',
          { clase: 'banda-mic' },
          h('div', { clase: 'avatar', 'aria-hidden': 'true', texto: iniciales(mic.nombre) }),
          h('div', {}, h('div', { clase: 'rotulo', texto: 'Te registras con tu MIC' }), h('div', { clase: 'nombre', texto: mic.nombre })),
        ),
        formulario,
      ),
      dialogo,
    ),
  );
}

function montarMensaje(contenedor, nodo) {
  while (contenedor.firstChild) contenedor.firstChild.remove();
  if (nodo) contenedor.append(nodo);
}

function crearDialogoTerminos() {
  const dialogo = h(
    'dialog',
    { clase: 'modal', 'aria-labelledby': 'titulo-terminos' },
    h('h2', { clase: 'modal-titulo', id: 'titulo-terminos', texto: TERMINOS.titulo }),
    h(
      'div',
      { clase: 'modal-cuerpo' },
      h('p', { texto: TERMINOS.introduccion }),
      TERMINOS.secciones.map((s) => [h('h3', { texto: s.titulo }), h('p', { texto: s.texto })]),
      h('p', { clase: 'nota', texto: TERMINOS.cierre }),
    ),
    h(
      'div',
      { clase: 'modal-pie' },
      h('button', { type: 'button', clase: 'boton-secundario', eventos: { click: () => dialogo.close() }, texto: 'Entendido' }),
    ),
  );
  return dialogo;
}

// Registro de la empresa del cliente.
//  · Con el enlace de su MIC: /r/<token> (o el antiguo ?t=<token>). Pide razón social, RUT/NIT y credencial.
//  · Sin enlace: /registro («Iniciemos»). Pide además la persona de contacto y el representante legal.
//    El back asigna el MIC por defecto del país y registra la aceptación de esa asignación
//    (pedido al back; se activa con DISPONIBLE.registroSinMic).
// Usa la acción existente portalregistro (resolve | registrar), que pasa por apiGateway sin llave anon.
// La credencial va directo al back (Vault): el front no la guarda y limpia el campo al terminar.
import { h, montar, aviso, tarjeta, iniciales, bloquePendiente, limpiar } from '../ui.js';
import { llamar } from '../gateway.js';
import { configPais, PAISES_ACTIVOS } from '../pais.js';
import { DISPONIBLE } from '../config.js';
import { TERMINOS } from '../textos/terminos.js';
import { ASIGNACION_MIC } from '../textos/asignacion-mic.js';
import { campoEnlaceMic } from './enlace-mic.js';

const FORMATO_TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEXTO_SEGURIDAD =
  'Tus credenciales viajan cifradas y se guardan de forma segura. Solo se usan para habilitar tus documentos; nunca se comparten ni se muestran.';

// Errores conocidos del back (portalregistro) → texto para el cliente.
// Cualquier otro error (técnico, del servidor) se muestra con un mensaje genérico.
const ERRORES_REGISTRO = [
  { patron: /identificador invalido/i, texto: (pais) => `El ${pais.identificador} de la empresa no es válido. Revísalo e intenta de nuevo.` },
  { patron: /rut y razon_social obligatorios/i, texto: (pais) => `Completa la razón social y el ${pais.identificador} de la empresa.` },
  { patron: /clave del SII obligatoria/i, texto: () => 'Completa la clave del SII para continuar.' },
  { patron: /token (invalido|no encontrado)/i, conMic: true, texto: () => 'El enlace de registro no es válido o ya no está vigente. Pídele a tu MIC que te lo envíe de nuevo.' },
  { patron: /MIC inactivo/i, conMic: true, texto: () => 'El MIC de este enlace no está activo. Pídele que te envíe un enlace nuevo.' },
];

function mensajeErrorRegistro(error, pais, { sinMic = false } = {}) {
  if (error.codigo === 'sin_conexion') return error.message;
  const conocido = ERRORES_REGISTRO.find((e) => (!e.conMic || !sinMic) && e.patron.test(error.message || ''));
  return conocido
    ? conocido.texto(pais)
    : 'No pudimos completar tu registro en este momento. Intenta de nuevo en unos minutos.';
}

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

  await pintarFormularioMic(contenedor, tokenMic, mic);
}

function vistaRegistroSinMic(contenedor) {
  if (DISPONIBLE.registroSinMic) return pintarFormularioSinMic(contenedor);

  // Pendiente del back: registro sin token, asignado al MIC por defecto del país.
  return montar(
    contenedor,
    h(
      'div',
      { clase: 'angosto' },
      bloquePendiente(
        'Registra tu empresa',
        'Muy pronto podrás registrar tu empresa directamente aquí. Al hacerlo, te asignaremos un MIC como tu contacto directo con BillCapital.',
      ),
      tarjeta(
        h('h2', { texto: '¿Te llegó un enlace de tu MIC?' }),
        h('p', { texto: 'Ábrelo directamente o pégalo aquí para registrarte ahora.' }),
        campoEnlaceMic(),
      ),
      h('p', { clase: 'nota centrada' }, h('a', { href: '/', 'data-ruta': true, texto: 'Volver al inicio' })),
    ),
  );
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
        h('a', { href: '/', 'data-ruta': true, clase: 'boton-secundario', texto: 'Ir al inicio' }),
      ),
    ),
  );
}

// ── Registro con el enlace del MIC ─────────────────────────────────────────

async function pintarFormularioMic(contenedor, tokenMic, mic) {
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
    bloqueSeguridad(),
    casillaTerminos(acepto, dialogo),
    mensajes,
    boton,
    h('p', { clase: 'nota' }, 'Este formulario lo solicitó tu MIC ', h('b', { texto: mic.nombre }), ' de BillCapital. Si no conoces a esta persona, confirma con tu MIC que este sea el sitio correcto.'),
  );

  async function enviar(evento) {
    evento.preventDefault();
    limpiar(mensajes);
    const datos = {
      razon_social: razon.value.trim(),
      rut: identificador.value.trim(),
      clave: pais.pideCredencialEnRegistro ? credencial.value : '',
    };
    if (!datos.razon_social || !datos.rut) {
      return mensajes.append(aviso('error', `Completa la razón social y el ${pais.identificador}.`));
    }
    if (pais.pideCredencialEnRegistro && !datos.clave) {
      return mensajes.append(aviso('error', `Completa la ${minusculaInicial(pais.credencial)} para continuar.`));
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
      mostrarListo(contenedor, 'Recibimos tus datos de forma segura. Tu MIC continuará con el proceso.');
    } catch (error) {
      mensajes.append(aviso('error', mensajeErrorRegistro(error, pais)));
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

// ── Registro sin enlace del MIC («Iniciemos») ──────────────────────────────

async function pintarFormularioSinMic(contenedor) {
  let pais = await configPais(1);

  const mensajes = h('div', { 'aria-live': 'polite' });
  const selectorPais = h(
    'select',
    { id: 'pais', name: 'pais' },
    PAISES_ACTIVOS.map((p) => h('option', { value: p.id_pais, selected: p.id_pais === pais.id_pais }, p.nombre)),
  );
  const razon = entrada('razon', { autocomplete: 'organization' });
  const identificador = entrada('identificador', { autocomplete: 'off' });
  const credencial = entrada('credencial', { type: 'password', autocomplete: 'off' });
  const contactoNombre = entrada('contacto-nombre', { autocomplete: 'name' });
  const contactoCorreo = entrada('contacto-correo', { type: 'email', autocomplete: 'email', inputmode: 'email' });
  const contactoTelefono = entrada('contacto-telefono', { type: 'tel', autocomplete: 'tel', inputmode: 'tel' });
  const repEsContacto = h('input', { type: 'checkbox', id: 'rep-es-contacto' });
  const repNombre = entrada('rep-nombre', { autocomplete: 'off' });
  const repIdentificador = entrada('rep-identificador', { autocomplete: 'off' });
  const repCorreo = entrada('rep-correo', { type: 'email', autocomplete: 'off', inputmode: 'email' });
  const aceptoMic = h('input', { type: 'checkbox', id: 'acepto-mic' });
  const acepto = h('input', { type: 'checkbox', id: 'acepto' });
  const boton = h('button', { clase: 'boton', type: 'submit', disabled: true, texto: 'Registrar mi empresa' });
  const dialogo = crearDialogoTerminos();

  const textoIdentificador = h('span');
  const textoCredencial = h('span');
  const textoRepIdentificador = h('span');
  const campoRepNombre = campo('rep-nombre', 'Nombre completo', repNombre);
  const campoRepCorreo = campo('rep-correo', 'Correo', repCorreo);
  const seccionCredencial = seccion(
    'credencial',
    'Credencial tributaria',
    h('label', { clase: 'campo', for: 'credencial' }, textoCredencial, credencial),
    bloqueSeguridad(),
  );

  function aplicarPais() {
    textoIdentificador.textContent = `${pais.identificador} de la empresa`;
    identificador.placeholder = pais.ejemploIdentificador || '';
    textoCredencial.textContent = pais.credencial;
    seccionCredencial.hidden = !pais.pideCredencialEnRegistro;
    textoRepIdentificador.textContent = pais.identificadorPersona;
    repIdentificador.placeholder = pais.ejemploIdentificadorPersona || '';
    contactoTelefono.placeholder = pais.ejemploTelefono || '';
  }
  aplicarPais();

  selectorPais.addEventListener('change', async () => {
    pais = await configPais(selectorPais.value);
    aplicarPais();
  });

  // Hay que aceptar la asignación del MIC y los términos.
  function actualizarBoton() {
    boton.disabled = !(acepto.checked && aceptoMic.checked);
  }
  acepto.addEventListener('change', actualizarBoton);
  aceptoMic.addEventListener('change', actualizarBoton);

  // Si el contacto es el representante legal, no se repiten su nombre ni su correo.
  repEsContacto.addEventListener('change', () => {
    campoRepNombre.hidden = repEsContacto.checked;
    campoRepCorreo.hidden = repEsContacto.checked;
  });

  const formulario = h(
    'form',
    { novalidate: true, eventos: { submit: enviar } },
    h('h1', { texto: 'Iniciemos tu registro' }),
    h('p', { clase: 'nota', texto: 'Cuéntanos de tu empresa. Con estos datos creamos tu registro y te asignamos un MIC.' }),
    seccion(
      'empresa',
      'Tu empresa',
      h('label', { clase: 'campo', for: 'pais' }, h('span', { texto: 'País' }), selectorPais),
      campo('razon', 'Razón social', razon),
      h('label', { clase: 'campo', for: 'identificador' }, textoIdentificador, identificador),
    ),
    seccionCredencial,
    seccion(
      'contacto',
      'Persona de contacto',
      campo('contacto-nombre', 'Nombre y apellido', contactoNombre),
      campo('contacto-correo', 'Correo', contactoCorreo),
      campo('contacto-telefono', 'Teléfono', contactoTelefono),
    ),
    seccion(
      'representante',
      'Representante legal',
      h('label', { clase: 'casilla', for: 'rep-es-contacto' }, repEsContacto, h('span', { texto: 'La persona de contacto es el representante legal' })),
      campoRepNombre,
      h('label', { clase: 'campo', for: 'rep-identificador' }, textoRepIdentificador, repIdentificador),
      campoRepCorreo,
    ),
    h(
      'div',
      { clase: 'bloque-mic' },
      h('div', { clase: 'avatar avatar-chico', 'aria-hidden': 'true', texto: 'MIC' }),
      h('div', {}, h('strong', { texto: ASIGNACION_MIC.titulo }), h('p', { texto: ASIGNACION_MIC.explicacion })),
    ),
    h('label', { clase: 'casilla', for: 'acepto-mic' }, aceptoMic, h('span', { texto: ASIGNACION_MIC.aceptacion })),
    casillaTerminos(acepto, dialogo),
    mensajes,
    boton,
  );

  function validar(d) {
    if (!d.razon_social) return { mensaje: 'Completa la razón social de la empresa.', campo: razon };
    if (!d.rut) return { mensaje: `Completa el ${pais.identificador} de la empresa.`, campo: identificador };
    if (pais.pideCredencialEnRegistro && !d.clave) {
      return { mensaje: `Completa la ${minusculaInicial(pais.credencial)} para continuar.`, campo: credencial };
    }
    if (!d.contacto.nombre) return { mensaje: 'Completa el nombre de la persona de contacto.', campo: contactoNombre };
    if (!FORMATO_CORREO.test(d.contacto.correo)) return { mensaje: 'Revisa el correo de contacto.', campo: contactoCorreo };
    if (d.contacto.telefono.replace(/\D/g, '').length < 8) {
      return { mensaje: 'Revisa el teléfono de contacto e incluye el código de área.', campo: contactoTelefono };
    }
    const rep = d.representante_legal;
    if (!rep.es_contacto && !rep.nombre_completo) return { mensaje: 'Completa el nombre del representante legal.', campo: repNombre };
    if (!rep.rut) return { mensaje: `Completa ${pais.identificadorPersonaFrase} del representante legal.`, campo: repIdentificador };
    if (!rep.es_contacto && !FORMATO_CORREO.test(rep.correo)) return { mensaje: 'Revisa el correo del representante legal.', campo: repCorreo };
    return null;
  }

  async function enviar(evento) {
    evento.preventDefault();
    limpiar(mensajes);
    const esContacto = repEsContacto.checked;
    const datos = {
      razon_social: razon.value.trim(),
      rut: identificador.value.trim(),
      clave: pais.pideCredencialEnRegistro ? credencial.value : '',
      contacto: {
        nombre: contactoNombre.value.trim(),
        correo: contactoCorreo.value.trim(),
        telefono: contactoTelefono.value.trim(),
      },
      representante_legal: {
        nombre_completo: esContacto ? contactoNombre.value.trim() : repNombre.value.trim(),
        rut: repIdentificador.value.trim(), // RUT en Chile, cédula en Colombia
        correo: esContacto ? contactoCorreo.value.trim() : repCorreo.value.trim(),
        es_contacto: esContacto,
      },
    };
    const problema = validar(datos);
    if (problema) {
      mensajes.append(aviso('error', problema.mensaje));
      problema.campo.focus();
      return;
    }

    boton.disabled = true;
    boton.textContent = 'Registrando…';
    try {
      // Sin token: el back asigna el MIC por defecto del país y registra la aceptación.
      await llamar('portalregistro', {
        accion: 'registrar',
        id_pais: pais.id_pais,
        rut: datos.rut,
        razon_social: datos.razon_social,
        clave: datos.clave || undefined,
        contacto: datos.contacto,
        representante_legal: datos.representante_legal,
        acepta_asignacion_mic: true,
        version_asignacion_mic: ASIGNACION_MIC.version,
        version_terminos: TERMINOS.version,
      });
      credencial.value = '';
      mostrarListo(
        contenedor,
        'Recibimos tus datos de forma segura. Te asignaremos un MIC, que se pondrá en contacto contigo para continuar.',
      );
    } catch (error) {
      mensajes.append(aviso('error', mensajeErrorRegistro(error, pais, { sinMic: true })));
      actualizarBoton();
      boton.textContent = 'Registrar mi empresa';
    }
  }

  montar(contenedor, h('div', { clase: 'angosto' }, tarjeta(formulario), dialogo));
}

// ── Piezas comunes ──────────────────────────────────────────────────────────

function entrada(id, atributos = {}) {
  return h('input', { id, name: id, ...atributos });
}

function campo(id, etiqueta, control) {
  return h('label', { clase: 'campo', for: id }, h('span', { texto: etiqueta }), control);
}

function seccion(clave, titulo, ...contenido) {
  const idTitulo = `seccion-${clave}`;
  return h(
    'div',
    { clase: 'seccion', role: 'group', 'aria-labelledby': idTitulo },
    h('h2', { clase: 'seccion-titulo', id: idTitulo, texto: titulo }),
    ...contenido,
  );
}

function bloqueSeguridad() {
  return h('div', { clase: 'seguridad' }, h('span', { 'aria-hidden': 'true', texto: '🔒' }), h('span', { texto: TEXTO_SEGURIDAD }));
}

function casillaTerminos(acepto, dialogo) {
  return h(
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
  );
}

function mostrarListo(contenedor, mensaje) {
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
          h('p', { texto: mensaje }),
        ),
      ),
    ),
  );
}

// «Clave del SII» → «clave del SII» (sin pasar las siglas a minúsculas).
function minusculaInicial(texto) {
  return texto ? texto.charAt(0).toLowerCase() + texto.slice(1) : '';
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

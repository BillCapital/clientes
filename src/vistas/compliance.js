// Compliance del cliente. Usa portalcliente · mis_empresas (existente). El asistente por secciones
// (compliance_ver / compliance_guardar / compliance_catalogos / compliance_enviar_revision) replica el
// diseño de la webapp y se arma en la siguiente entrega.
import { h, montar, aviso, tarjeta } from '../ui.js';
import { llamar } from '../gateway.js';

export async function vistaCompliance(contenedor) {
  montar(contenedor, tarjeta(h('h1', { texto: 'Compliance' }), h('p', { clase: 'nota', texto: 'Cargando tus empresas…' })));
  let empresas = [];
  try {
    const respuesta = await llamar('portalcliente', { sub: 'mis_empresas' }, { conSesion: true });
    empresas = Array.isArray(respuesta.empresas) ? respuesta.empresas : [];
  } catch (error) {
    return montar(contenedor, tarjeta(h('h1', { texto: 'Compliance' }), aviso('error', error.message)));
  }

  if (!empresas.length) {
    return montar(contenedor, tarjeta(h('h1', { texto: 'Compliance' }), aviso('info', 'Todavía no tienes empresas asociadas a tu acceso.')));
  }

  montar(
    contenedor,
    tarjeta(
      h('h1', { texto: 'Compliance' }),
      h('p', { texto: 'Completa la información de cada empresa. Lo que guardes aquí lo ven tu MIC y BillCapital.' }),
      h(
        'ul',
        { clase: 'lista-empresas' },
        empresas.map((empresa) => {
          const avance = Math.max(0, Math.min(100, Number(empresa?.compliance?.avance_pct) || 0));
          return h(
            'li',
            {},
            h('b', { texto: empresa.razon_social || 'Empresa' }),
            empresa.rut ? h('span', { clase: 'nota', texto: ` · ${empresa.rut}` }) : null,
            h('div', { clase: 'nota', texto: `Avance: ${avance} %` }),
            h('div', { clase: 'barra', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': avance }, h('span', { style: `width:${avance}%` })),
          );
        }),
      ),
      aviso('info', 'El formulario para completar cada sección estará disponible aquí muy pronto.'),
    ),
  );
}

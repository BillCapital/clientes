# Portal de clientes · BillCapital

Sitio de `clientes.billcapital.com`: el canal del **cliente final** (la empresa que cede facturas). Comparte los datos de compliance con la webapp del MIC y el panel.

## Reglas

- Todo en español: código, comentarios, textos y rutas.
- **Solo front.** La lógica vive en el back y todo pasa por `apiGateway`. No se usa la llave anon.
- **Nada en el navegador:** ni token, ni sesión, ni credencial en `localStorage` o `sessionStorage`. La sesión vive en memoria; al recargar se pide un enlace nuevo.
- Los textos y datos por país (identificador, credencial, documentos) llegan del gateway. `src/pais.js` tiene un respaldo provisional mientras no exista `portalcliente · config`.
- La credencial tributaria va directo al back (Vault). El front no la guarda y limpia el campo al terminar.

## Uso

```
npm install
npm run dev        # http://localhost:5174
npm run build      # genera dist/
```

Azure Static Web Apps compila con `npm run build` y publica `dist/` (workflow en `.github/workflows`). `staticwebapp.config.json` redirige cualquier ruta a `index.html`.

## Rutas

| Ruta | Pantalla | Estado |
|---|---|---|
| `/r/<token>` y `/?t=<token>` | Registro con el enlace del MIC (`portalregistro`) | Lista |
| `/registro` | Registro sin MIC | Pendiente del back (#272, punto 12) |
| `/acceso` | Ingreso: pedir enlace por correo (`acceso_solicitar`) | Pendiente del back (#272, punto 2) |
| `/acceso#t=<token>` | Enlace de un solo uso: valida con `resolver_acceso`; el canje es `acceso_canjear` | Validación lista; canje pendiente (#272, punto 1) |
| `/identidad` | Validación de identidad (KYC) | Pendiente (#272, punto 5) |
| `/autorizacion` | Autorización versionada | Pendiente (#272, punto 6) |
| `/credencial` | Credencial tributaria | Pendiente (#272, punto 7) |
| `/compliance` | Compliance (`portalcliente`, existente) | Lista de empresas lista; formulario en la siguiente entrega |
| `/panel` | Documentos transables, cesión y ofertas | Pendiente (#272, puntos 10 y 11) |
| `/permisos` | Mis permisos: autorización, bitácora y revocación | Pendiente (#272, puntos 6 a 8) |

Cuando el back confirme cada sub-acción, se activa en `src/config.js` (`DISPONIBLE`) y se valida contra datos reales.

## Estructura

```
src/
  main.js          entrada: cabecera, menú y rutas
  config.js        URL del gateway y sub-acciones disponibles
  gateway.js       cliente único del apiGateway
  sesion.js        sesión solo en memoria
  rutas.js         enrutador con la API de historial
  pais.js          datos por país (respaldo provisional)
  ui.js            utilidades de interfaz (texto, nunca HTML)
  estilos.css      paleta del manual de marca
  textos/          textos provisionales (términos)
  vistas/          una pantalla por archivo
public/isotipo.png
```

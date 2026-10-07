# clientes-portal · BillCapital

Portal público de clientes de BillCapital. Primera pieza: **registro de cliente**
(el cliente ingresa país, RUT/NIT, razón social y clave SII). Los datos se envían a
nuestra Edge Function `registroClientePublico` a través de `apiGateway/portalregistro` (desde 2026-10-08; sin llave anon), que guarda la clave cifrada en el Vault
de BillCapital y enrola al cliente en Pruff. Pensado para crecer a "sucursal virtual"
(ver info del cliente, firma de documentos, etc.).

## Estructura
- `index.html` — página de registro (self-contained: HTML + CSS + JS).
- `staticwebapp.config.json` — config de Azure Static Web Apps (fallback de rutas `/r/<token>` → index.html).

## Configuración antes de publicar
En `index.html`, dentro del `<script>`:
- `EP`  → URL de la Edge Function (ya apunta a `https://ybugxmeiwobzrdeuhlzl.supabase.co/functions/v1/registroClientePublico`).
- `ANON` → pega aquí la **anon / publishable key** de Supabase (es pública, va en el front).

## URL / token
Cada MIC+país tiene un `registro_token` (tabla `usuario_pruff_pais`). La página lee el token de:
- el path `/r/<token>`, o
- el query `?t=<token>`.
Ejemplo prod: `https://clientes.billcapital.com/r/<token>`.

## Publicar en Azure Static Web Apps
1. Sube este repo a tu cuenta (Azure DevOps o GitHub).
2. Crea un **Static Web App** apuntando a este repo/branch → Azure arma el CI/CD.
   - App location: `/`  ·  Output location: `/` (sitio estático, sin build).
3. En *Custom domains* agrega `clientes.billcapital.com` y crea el CNAME en tu DNS.
   Azure provisiona TLS automático.
4. Cada `git push` al branch → build + deploy automático → se actualiza el subdominio.

## Seguridad
- La clave del cliente **nunca** se guarda en texto plano ni se devuelve; se cifra en el Vault.
- La identidad del MIC sale del token de la URL, no de lo que elige el cliente.
- Se recomienda acotar el CORS de la Edge Function a `https://clientes.billcapital.com` cuando esté productivo.

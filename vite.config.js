import { defineConfig } from 'vite';
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

// Azure Static Web Apps lee staticwebapp.config.json desde la raíz de la carpeta publicada (dist).
// Se copia ahí al terminar el build: sin ese archivo, /r/<código> y las demás rutas no abren index.html.
function copiarConfigAzure() {
  return {
    name: 'copiar-config-azure',
    apply: 'build',
    writeBundle(opciones) {
      copyFileSync('staticwebapp.config.json', join(opciones.dir, 'staticwebapp.config.json'));
    },
  };
}

// Sitio estático: Azure Static Web Apps publica la carpeta dist.
export default defineConfig({
  plugins: [copiarConfigAzure()],
  build: { outDir: 'dist', sourcemap: false },
});

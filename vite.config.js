import { defineConfig } from 'vite';

// Sitio estático: Azure Static Web Apps publica la carpeta dist.
export default defineConfig({
  build: { outDir: 'dist', sourcemap: false },
});

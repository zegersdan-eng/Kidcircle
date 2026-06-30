import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const siteUrl = process.env.VITE_SITE_URL || 'https://kidcircle.ctonew.app';

function htmlReplacePlugin() {
  return {
    name: 'html-replace',
    closeBundle() {
      const distPath = path.resolve(process.cwd(), 'dist/index.html');
      if (fs.existsSync(distPath)) {
        let html = fs.readFileSync(distPath, 'utf-8');
        html = html.replace(/%VITE_SITE_URL%/g, siteUrl);
        fs.writeFileSync(distPath, html, 'utf-8');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), htmlReplacePlugin()],
  define: {
    'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
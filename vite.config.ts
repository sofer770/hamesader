import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// "single" mode bundles everything (JS, CSS, logo) into one HTML file for the shareable preview.
export default defineConfig(({ mode }) => ({
  // Served from a sub-folder on GitHub Pages (/hamesader/); "/" everywhere else, including the Android app
  base: process.env.BASE_PATH || '/',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
  },
}));

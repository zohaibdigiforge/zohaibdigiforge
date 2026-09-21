import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      target: 'es2020',
      sourcemap: false,
      cssCodeSplit: true,
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Deliberately do NOT give React its own manual chunk. React
              // relies on internal helper packages (scheduler, react-is,
              // use-sync-external-store, etc.) whose file paths don't contain
              // "react", so they'd fall into a different chunk and load out
              // of order relative to react/react-dom — causing
              // "Cannot read properties of undefined (reading 'createContext')"
              // crashes. Leaving React ungrouped keeps it and its helpers
              // together in the default chunk, avoiding this fragile split.
              //
              // Only libraries below are large, self-contained, and safe to
              // isolate into their own chunk.
              if (id.includes('/node_modules/motion/') || id.includes('/node_modules/framer-motion/')) return 'vendor-motion';
              if (id.includes('/node_modules/firebase/') || id.includes('/node_modules/@firebase/')) return 'vendor-firebase';
              if (id.includes('/node_modules/lucide-react/')) return 'vendor-icons';
              if (id.includes('/node_modules/xlsx/')) return 'vendor-xlsx';
              if (id.includes('/node_modules/fuse.js/')) return 'vendor-fuse';
              if (id.includes('/node_modules/@google/genai/')) return 'vendor-genai';
              return 'vendor-core';
            }
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/react-icons')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/marked')) {
            return 'vendor-marked';
          }
          if (id.includes('node_modules/fflate')) {
            return 'vendor-fflate';
          }
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'vendor-pdfjs';
          }
          if (id.includes('node_modules/@anthropic-ai') || id.includes('node_modules/uuid')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
})

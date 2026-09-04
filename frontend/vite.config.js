import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('marked') || id.includes('dompurify')) return 'markdown';
          if (id.includes('react') || id.includes('axios') || id.includes('@tanstack')) return 'vendor';
          return undefined;
        }
      }
    }
  }
});

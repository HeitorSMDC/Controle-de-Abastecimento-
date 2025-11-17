// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Usar process.cwd() resolve o caminho da raiz do projeto de forma segura
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      // Isto garante que "@" aponta sempre para a pasta "src" na raiz do projeto
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  // Configuração de Build Otimizada
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-slot',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            'lucide-react'
          ],
          charts: ['recharts'],
          utils: ['date-fns', 'zod', 'clsx', 'tailwind-merge'],
          supabase: ['@supabase/supabase-js', '@tanstack/react-query']
        },
      },
    },
  },
}));
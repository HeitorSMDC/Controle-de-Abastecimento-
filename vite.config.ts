// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Configuração para desenvolvimento local
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "controle-de-abastecimento.onrender.com"
    ],
  },
  // --- ADIÇÃO IMPORTANTE PARA O RENDER (Erro 502) ---
  preview: {
    host: "0.0.0.0", // Permite acesso externo (necessário para o Render)
    port: 8080,      // Garante que usa a porta correta
    allowedHosts: [
      "controle-de-abastecimento.onrender.com"
    ],
  },
  // --------------------------------------------------
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
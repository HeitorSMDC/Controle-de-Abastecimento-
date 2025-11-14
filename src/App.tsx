// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

import Auth from "@/pages/Auth";
import ControleAbastecimento from "@/pages/ControleAbastecimento";
import Motoristas from "@/pages/Motoristas";
import Viaturas from "@/pages/Viaturas";
import Maquinario from "@/pages/Maquinario";
import Manutencao from "@/pages/Manutencao";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

// NOVO: Importar a página Dashboard
import Dashboard from "@/pages/Dashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Auth />} />
              
              {/* NOVO: Rota para o Dashboard (Reativada) */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ControleAbastecimento />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/motoristas"
                element={
                  <ProtectedRoute>
                    <Motoristas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/viaturas"
                element={
                  <ProtectedRoute>
                    <Viaturas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maquinario"
                element={
                  <ProtectedRoute>
                    <Maquinario />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manutencao"
                element={
                  <ProtectedRoute>
                    <Manutencao />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster richColors />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
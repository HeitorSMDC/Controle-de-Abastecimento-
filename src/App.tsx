// src/App.tsx

import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ListSkeleton } from "@/components/ListSkeleton";

// --- IMPORTAÇÕES PREGUIÇOSAS (Lazy Loading) ---
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ControleAbastecimento = lazy(() => import("@/pages/ControleAbastecimento"));
const TanqueCombustivel = lazy(() => import("@/pages/TanqueCombustivel"));
const Motoristas = lazy(() => import("@/pages/Motoristas"));
const Viaturas = lazy(() => import("@/pages/Viaturas"));
const Maquinario = lazy(() => import("@/pages/Maquinario"));
const Manutencao = lazy(() => import("@/pages/Manutencao"));
const Usuarios = lazy(() => import("@/pages/Usuarios"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// --- CONFIGURAÇÃO DO REACT QUERY ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Adicionamos as flags 'future' para remover os avisos do console */}
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <Suspense 
              fallback={
                <div className="container mx-auto p-8 space-y-4">
                  <ListSkeleton />
                </div>
              }
            >
              <Routes>
                <Route path="/login" element={<Auth />} />
                
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
                  path="/tanque"
                  element={
                    <ProtectedRoute>
                      <TanqueCombustivel />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/motoristas"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "coordenador"]}>
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
                
                <Route
                  path="/usuarios"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Usuarios />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster richColors />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
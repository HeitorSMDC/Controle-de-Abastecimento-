// src/components/ProtectedRoute.tsx

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "./Layout";
import { toast } from "sonner"; // Importe o toast para dar feedback

// Defina o tipo UserRole aqui (ou importe de AuthContext se preferir)
type UserRole = "admin" | "coordenador" | "usuario";

// Adicione 'allowedRoles' às props
interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[]; // Lista de permissões permitidas
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // --- NOVA LÓGICA DE VERIFICAÇÃO ---
  // Se 'allowedRoles' foi definido E (o utilizador não tem permissão OU a permissão dele não está na lista)
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    // Damos um feedback e redirecionamos
    toast.error("Acesso Negado", {
      description: "Não tem permissão para aceder a esta página.",
    });
    // Redireciona para o Dashboard (ou qualquer página inicial segura)
    return <Navigate to="/dashboard" replace />;
  }
  // --- FIM DA NOVA LÓGICA ---

  return children ? <>{children}</> : <Outlet />;
}
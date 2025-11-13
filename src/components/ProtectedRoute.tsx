// src/components/ProtectedRoute.tsx

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "./Layout";

// NOVO: A única mudança é aqui
// 'export function ProtectedRoute' tornou-se 'export default function ProtectedRoute'
export default function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth();

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

  return children ? <>{children}</> : <Outlet />;
}
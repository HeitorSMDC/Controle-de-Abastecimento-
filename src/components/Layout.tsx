import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Car, Truck, Users, Gauge, Wrench } from "lucide-react";
import logo from "@/assets/defesa-civil-logo.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, userRole } = useAuth();
  
  const canViewDrivers = userRole === "admin" || userRole === "coordenador";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Defesa Civil" className="h-12 w-12" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Sistema de Controle de Veículos</h1>
                <p className="text-sm text-muted-foreground">Defesa Civil - Campos dos Goytacazes</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut} size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {canViewDrivers && (
              <NavLink
                to="/motoristas"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <Users className="h-4 w-4" />
                Motoristas
              </NavLink>
            )}
            <NavLink
              to="/viaturas"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Car className="h-4 w-4" />
              Viaturas
            </NavLink>
            <NavLink
              to="/maquinario"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Truck className="h-4 w-4" />
              Maquinário
            </NavLink>
            <NavLink
              to="/manutencao"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Wrench className="h-4 w-4" />
              Manutenção
            </NavLink>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Gauge className="h-4 w-4" />
              Controle de Abastecimento
            </NavLink>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

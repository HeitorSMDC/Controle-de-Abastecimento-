// src/components/Layout.tsx

import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
// --- ÍCONE ADICIONADO ---
import { LogOut, Car, Truck, Users, Gauge, Wrench, Menu, LayoutDashboard, ShieldCheck } from "lucide-react";
import logo from "@/assets/defesa-civil-logo.png";

import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, userRole } = useAuth();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const canViewDrivers = userRole === "admin" || userRole === "coordenador";
  const isAdmin = userRole === "admin"; // --- ADICIONADO ---

  const navLinks = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      to: "/",
      label: "Abastecimento",
      icon: Gauge,
      show: true,
    },
    {
      to: "/motoristas",
      label: "Motoristas",
      icon: Users,
      show: canViewDrivers,
    },
    { to: "/viaturas", label: "Viaturas", icon: Car, show: true },
    { to: "/maquinario", label: "Maquinário", icon: Truck, show: true },
    { to: "/manutencao", label: "Manutenção", icon: Wrench, show: true },
    // --- LINK ADICIONADO ---
    {
      to: "/usuarios",
      label: "Utilizadores",
      icon: ShieldCheck,
      show: isAdmin, // Só aparece se for admin
    },
    // --- FIM DA ADIÇÃO ---
  ];

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const renderNavLinks = (isMobileLink = false) => {
    return navLinks
      .filter((link) => link.show)
      .map((link) => {
        
        const isEnd = link.to === "/"; 
        
        const linkContent = (
          <NavLink
            key={link.to}
            to={link.to}
            end={isEnd}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 font-medium transition-colors",
                isMobileLink
                  ? `p-3 rounded-md text-base ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`
                  : `px-4 py-3 text-sm ${
                      isActive
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        );

        return isMobileLink ? (
          <SheetClose key={link.to} asChild>
            {linkContent}
          </SheetClose>
        ) : (
          linkContent
        );
      });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Defesa Civil" className="h-12 w-12" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Sistema de Controle
                </h1>
                <p className="text-sm text-muted-foreground">
                  Defesa Civil - Campos dos Goytacazes
                </p>
              </div>
            </div>

            {isMobile ? (
              // --- VISTA MOBILE ---
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-4">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <img src={logo} alt="Defesa Civil" className="h-10 w-10" />
                    <div>
                      <h2 className="text-lg font-semibold">Defesa Civil</h2>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  
                  <nav className="flex flex-col gap-2 py-4">
                    {renderNavLinks(true)}
                  </nav>

                  <Button
                    variant="outline"
                    onClick={signOut}
                    size="sm"
                    className="mt-auto w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </SheetContent>
              </Sheet>
            ) : (
              // --- VISTA DESKTOP ---
              <Button variant="outline" onClick={signOut} size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            )}
          </div>
        </div>
      </header>

      {!isMobile && (
        <nav className="border-b bg-card">
          <div className="container mx-auto px-4">
            <div className="flex space-x-1">{renderNavLinks(false)}</div>
          </div>
        </nav>
      )}

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
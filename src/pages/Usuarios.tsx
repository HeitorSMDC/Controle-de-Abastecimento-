// src/pages/Usuarios.tsx

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ListSkeleton } from "@/components/ListSkeleton";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { EmptyState } from "@/components/EmptyState";
import { useIsMobile } from "@/hooks/use-mobile";

// Tipos
type AppRole = "admin" | "coordenador" | "usuario";
const ROLES: AppRole[] = ["admin", "coordenador", "usuario"];

// --- INTERFACE ATUALIZADA (para corresponder ao retorno do RPC) ---
interface UsuarioComRole {
  id: string; // profile id
  user_id: string; // auth user id
  nome: string;
  email: string | null;
  user_role: AppRole; // Alterado de "role" para "user_role"
  total_count: number; // A função RPC devolve o total
}

const ITEMS_PER_PAGE = 10;

// --- FUNÇÃO DE FETCH CORRIGIDA (AGORA USA RPC) ---
const fetchUsuarios = async (page: number, searchTerm: string) => {
  const from = (page - 1) * ITEMS_PER_PAGE;
  
  const { data, error } = await supabase.rpc("get_users_with_roles", {
    p_search_term: searchTerm,
    p_page_limit: ITEMS_PER_PAGE,
    p_page_offset: from,
  });

  if (error) {
    console.error("Erro ao buscar usuários:", error);
    // O erro 400 (Bad Request) que estavas a ver vai agora mostrar esta mensagem mais útil
    if (error.message.includes("Acesso negado")) {
        throw new Error("Acesso negado. Apenas administradores podem ver os utilizadores.");
    }
    throw error;
  }

  // O RPC retorna os dados. O 'count' está dentro do primeiro item.
  const totalCount = data.length > 0 ? data[0].total_count : 0;
  
  // O tipo de 'data' é o que a função retorna
  const mappedData = data as UsuarioComRole[];

  return { data: mappedData, count: totalCount };
};
// --- FIM DA CORREÇÃO ---

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth(); // Para não editar o próprio utilizador
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: ["usuarios", page, debouncedSearchTerm],
    queryFn: () => fetchUsuarios(page, debouncedSearchTerm),
    retry: (failureCount, error) => {
      if ((error as any).message.includes("Acesso negado")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const usuarios: UsuarioComRole[] = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Mutação para ATUALIZAR a role de um utilizador
  const { mutate: updateUserRole, isPending: isUpdatingRole } = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string, newRole: AppRole }) => {
      // A tabela 'user_roles' usa o user_id como chave de referência
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;
      return { userId, newRole };
    },
    onSuccess: ({ userId, newRole }) => {
      toast.success(`Permissão atualizada para ${newRole}!`);
      // Atualiza os dados na cache do React Query sem precisar de um novo fetch
      queryClient.setQueryData(["usuarios", page, debouncedSearchTerm], (oldData: any) => {
          if (!oldData) return oldData;
          return {
              ...oldData,
              data: oldData.data.map((u: UsuarioComRole) => 
                  u.user_id === userId ? { ...u, user_role: newRole } : u // Ajuste aqui
              ),
          };
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar permissão");
    },
  });

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    // Impede o admin de alterar a sua própria permissão (para evitar auto-bloqueio)
    if (userId === user?.id) {
      toast.error("Não pode alterar a sua própria permissão.");
      return;
    }
    updateUserRole({ userId, newRole });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // Se houver um erro (ex: acesso negado)
  if (error) {
    return (
        <Layout>
            <EmptyState
                icon={Users}
                title="Erro ao carregar utilizadores"
                description={error.message}
            />
        </Layout>
    );
  }

  const renderContent = () => {
    if (isLoading) {
      return <ListSkeleton />;
    }

    if (totalCount === 0) {
      return (
        <EmptyState
          icon={Users}
          title="Nenhum utilizador encontrado"
          description={searchTerm 
            ? `Nenhum utilizador encontrado para "${searchTerm}"`
            : "Não há outros utilizadores no sistema."
          }
        />
      );
    }
    
    // --- Tabela Desktop ---
    if (!isMobile) {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[200px]">Permissão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.nome}</TableCell>
                <TableCell>{usuario.email || "N/A"}</TableCell>
                <TableCell>
                  <Select
                    value={usuario.user_role || "usuario"} // Ajuste aqui
                    onValueChange={(newRole: AppRole) => handleRoleChange(usuario.user_id, newRole)}
                    disabled={usuario.user_id === user?.id || isUpdatingRole}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    // --- Cards Mobile ---
    return (
        <div className="space-y-4 p-4">
            {usuarios.map(usuario => (
                <Card key={usuario.id}>
                    <CardHeader>
                        <CardTitle className="text-base">{usuario.nome}</CardTitle>
                        <CardDescription>{usuario.email || "N/A"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Label>Permissão</Label>
                         <Select
                            value={usuario.user_role || "usuario"} // Ajuste aqui
                            onValueChange={(newRole: AppRole) => handleRoleChange(usuario.user_id, newRole)}
                            disabled={usuario.user_id === user?.id || isUpdatingRole}
                        >
                            <SelectTrigger>
                            <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                            {ROLES.map(role => (
                                <SelectItem key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gestão de Utilizadores</h1>

        <Card>
          <CardHeader className="p-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {renderContent()}
          </CardContent>
          {totalPages > 1 && (
            <div className="p-4 border-t">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }}
                      aria-disabled={page === 1}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      Página {page} de {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }}
                      aria-disabled={page === totalPages}
                      className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
// src/pages/Motoristas.tsx

import { useState, useMemo, useEffect } from "react"; // useMemo e useEffect removidos para filtro
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react";
import { PasswordField } from "@/components/PasswordField";
import { EmptyState } from "@/components/EmptyState";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motoristaSchema, MotoristaFormData } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { MotoristaCard } from "@/components/cards/MotoristaCard";
import { ListSkeleton } from "@/components/ListSkeleton";

// NOVO: Importar useDebounce e Pagination
import { useDebounce } from "@/hooks/use-debounce";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// NOVO: Constante para itens por página
const ITEMS_PER_PAGE = 10;

interface Motorista {
  id: string;
  nome: string;
  matricula: string;
  senha: string;
}

// NOVO: fetchMotoristas agora aceita paginação e busca
const fetchMotoristas = async (page: number, searchTerm: string) => {
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from("motoristas")
    .select("*", { count: "exact" }); // Pede o 'count' total

  // Se houver um termo de busca, filtra por nome OU matrícula
  if (searchTerm) {
    query = query.or(
      `nome.ilike.%${searchTerm}%,matricula.ilike.%${searchTerm}%`
    );
  }

  // Aplica a ordem e a paginação
  query = query.order("nome").range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: data || [], count: count || 0 };
};


export default function Motoristas() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // NOVO: Estados para paginação e busca "atrasada"
  const [page, setPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const form = useForm<MotoristaFormData>({
    resolver: zodResolver(motoristaSchema),
    defaultValues: {
      nome: "",
      matricula: "",
      senha: "",
    },
  });

  // NOVO: useQuery modificado. Agora depende da 'page' e 'debouncedSearchTerm'
  const { data, isLoading } = useQuery({
    queryKey: ["motoristas", page, debouncedSearchTerm], // A chave de cache inclui a página e a busca
    queryFn: () => fetchMotoristas(page, debouncedSearchTerm),
  });

  // NOVO: Pega os dados e o 'count' do useQuery
  const motoristas: Motorista[] = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // REMOVIDO: O 'useMemo' para 'filteredMotoristas' foi removido.
  // A base de dados já nos entrega os dados filtrados e paginados.

  // ... (Mutations: salvarMotorista, deletarMotorista - sem alterações) ...
  const { mutate: salvarMotorista, isPending: isSaving } = useMutation({
    mutationFn: async (data: MotoristaFormData) => {
      // ...
    },
    onSuccess: (message) => {
      toast.success(message);
      setIsDialogOpen(false);
      resetForm();
      // NOVO: Invalida *todas* as queries de 'motoristas' para garantir que a paginação se atualiza
      queryClient.invalidateQueries({ queryKey: ["motoristas"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar motorista");
    },
  });

  const { mutate: deletarMotorista } = useMutation({
    mutationFn: async (id: string) => {
      // ...
    },
    onSuccess: (message) => {
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ["motoristas"] });
      // NOVO: Se apagamos o último item de uma página, volta para a página anterior
      if (motoristas.length === 1 && page > 1) {
        setPage(page - 1);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir motorista");
    },
  });

  const onSubmit = (data: MotoristaFormData) => {
    salvarMotorista(data);
  };

  const resetForm = () => {
    form.reset();
    setEditingId(null);
  };
  
  const handleEdit = (motorista: Motorista) => {
    form.reset({
      nome: motorista.nome,
      matricula: motorista.matricula,
      senha: motorista.senha,
    });
    setEditingId(motorista.id);
    setIsDialogOpen(true);
  };

  // NOVO: Funções para mudar de página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  // NOVO: Quando a busca muda, volta para a página 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);


  const canEdit = userRole === "admin" || userRole === "coordenador";

  if (!canEdit) {
    // ... (Acesso Negado) ...
  }

  const renderContent = () => {
    if (isLoading) {
      return <ListSkeleton />;
    }

    // NOVO: A lógica do EmptyState agora usa 'totalCount' e 'searchTerm'
    if (totalCount === 0 && debouncedSearchTerm === "") {
      return (
        <EmptyState
          icon={Users}
          title="Nenhum motorista cadastrado"
          description="Comece adicionando o primeiro motorista ao sistema"
          actionLabel="Novo Motorista"
          onAction={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        />
      );
    }
    
    if (motoristas.length === 0 && debouncedSearchTerm !== "") {
      return (
        <div className="p-8 text-center text-muted-foreground">
          Nenhum motorista encontrado para "{searchTerm}"
        </div>
      );
    }

    // NOVO: O conteúdo principal (mobile ou desktop)
    const listContent = isMobile ? (
      <div className="space-y-4 p-4">
        {motoristas.map((motorista) => (
          <MotoristaCard
            key={motorista.id}
            motorista={motorista}
            onEdit={() => handleEdit(motorista)}
            deleteAction={
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Apagar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser revertida. Isto irá apagar
                      permanentemente o motorista
                      <strong className="px-1">{motorista.nome}</strong>
                      (Matrícula: {motorista.matricula}).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deletarMotorista(motorista.id)}>
                      Continuar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            }
          />
        ))}
      </div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Matrícula</TableHead>
            <TableHead>Senha</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {motoristas.map((motorista) => (
            <TableRow key={motorista.id}>
              <TableCell className="font-medium">{motorista.nome}</TableCell>
              <TableCell>{motorista.matricula}</TableCell>
              <TableCell>
                <PasswordField
                  value={motorista.senha}
                  onChange={() => {}}
                  placeholder="••••••••"
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(motorista)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser revertida. Isto irá apagar
                          permanentemente o motorista
                          <strong className="px-1">{motorista.nome}</strong>
                          (Matrícula: {motorista.matricula}).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletarMotorista(motorista.id)}>
                          Continuar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );

    // NOVO: Retorna o conteúdo E a paginação
    return (
      <>
        {listContent}
        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page - 1);
                    }}
                    aria-disabled={page === 1}
                    className={page === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {/* Lógica simples de paginação (pode ser melhorada) */}
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    Página {page} de {totalPages}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page + 1);
                    }}
                    aria-disabled={page === totalPages}
                    className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </>
    );
  };
  

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Motoristas</h1>
          <ResponsiveDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            title={editingId ? "Editar Motorista" : "Novo Motorista"}
            trigger={
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Motorista
              </Button>
            }
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="matricula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matrícula</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha (Anotação)</FormLabel>
                      <FormControl>
                        <PasswordField
                          id="senha"
                          placeholder="Digite a senha para anotação"
                          required
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Esta senha é apenas para referência/anotação
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </form>
            </Form>
          </ResponsiveDialog>
        </div>

        <Card>
          <CardHeader className="p-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou matrícula..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
// src/pages/Manutencao.tsx

import { useState, useMemo, useEffect } from "react"; // Adicionado useEffect
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Edit, Wrench, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { manutencaoSchema, ManutencaoFormData } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormDescription as FormDescriptionValid,
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
  AlertDialogDescription as AlertDialogDescriptionValid,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  statusOptionsManutencao,
  statusVariantMapManutencao,
} from "@/lib/constants";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { ManutencaoCard } from "@/components/cards/ManutencaoCard";
import { Separator } from "@/components/ui/separator";
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

type StatusManutencao = "pendente" | "em_andamento" | "concluida" | "cancelada";

interface Manutencao {
  id: string;
  placa: string;
  tipo_veiculo: string;
  veiculo_nome: string;
  descricao_problema: string;
  pecas_necessarias: string[] | null;
  links_pecas: string[] | null;
  status: StatusManutencao;
  data_registro: string;
  data_conclusao: string | null;
  custo_estimado: number | null;
  custo_real: number | null;
  observacoes: string | null;
  nf_numero: string | null;
  nf_data: string | null;
  nf_fornecedor: string | null;
}

interface Veiculo {
  placa: string;
  nome: string;
}

// NOVO: fetchManutencoes agora aceita paginação e busca
const fetchManutencoes = async (page: number, searchTerm: string) => {
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from("manutencoes")
    .select("*", { count: "exact" }); // Pede o 'count' total

  // Se houver um termo de busca, filtra por nome, placa OU descrição
  if (searchTerm) {
    query = query.or(
      `veiculo_nome.ilike.%${searchTerm}%,placa.ilike.%${searchTerm}%,descricao_problema.ilike.%${searchTerm}%`
    );
  }

  // Aplica a ordem e a paginação
  query = query.order("data_registro", { ascending: false }).range(from, to);
  
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

// Funções de fetch para Viaturas/Maquinário (não precisam de paginação)
const fetchViaturas = async () => {
  const { data, error } = await supabase.from("viaturas").select("placa, nome");
  if (error) throw error;
  return data || [];
};
const fetchMaquinarios = async () => {
  const { data, error } = await supabase.from("maquinario").select("placa, nome");
  if (error) throw error;
  return data || [];
};


export default function Manutencao() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { userRole } = useAuth();
  const canDelete = userRole === "admin" || userRole === "coordenador";
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  // NOVO: Estados para paginação e busca "atrasada"
  const [page, setPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const form = useForm<ManutencaoFormData>({
    // ... (useForm - sem alterações) ...
  });

  const currentStatus = form.watch("status");

  // NOVO: useQuery modificado. Agora depende da 'page' e 'debouncedSearchTerm'
  const { data, isLoading: isLoadingManutencoes } = useQuery({
    queryKey: ["manutencoes", page, debouncedSearchTerm],
    queryFn: () => fetchManutencoes(page, debouncedSearchTerm),
  });
  
  // NOVO: Pega os dados e o 'count' do useQuery
  const manutencoes: Manutencao[] = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Queries para os 'select' do formulário (não mudam)
  const { data: viaturas = [] } = useQuery<Veiculo[]>({
    queryKey: ["viaturas"],
    queryFn: fetchViaturas,
  });
  const { data: maquinarios = [] } = useQuery<Veiculo[]>({
    queryKey: ["maquinario"],
    queryFn: fetchMaquinarios,
  });
  
  // REMOVIDO: O 'useMemo' para 'filteredManutencoes' foi removido.
  
  const { mutate: salvarManutencao, isPending: isSaving } = useMutation({
    mutationFn: async (data: ManutencaoFormData) => {
      // ... (lógica da mutation - sem alterações) ...
    },
    onSuccess: (message) => {
      toast.success(message);
      resetForm();
      setDialogOpen(false);
      // NOVO: Invalida a query base
      queryClient.invalidateQueries({ queryKey: ["manutencoes"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar manutenção");
    },
  });

  const { mutate: deletarManutencao } = useMutation({
    mutationFn: async (id: string) => {
      // ... (lógica da mutation - sem alterações) ...
    },
    onSuccess: (message) => {
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ["manutencoes"] });
      // NOVO: Se apagar o último item, volta a página
      if (manutencoes.length === 1 && page > 1) {
        setPage(page - 1);
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir manutenção");
    }
  });


  const onSubmit = (data: ManutencaoFormData) => {
    salvarManutencao(data);
  };
  
  const handleEdit = (manutencao: Manutencao) => {
    // ... (handleEdit - sem alterações) ...
  };

  const resetForm = () => {
    // ... (resetForm - sem alterações) ...
  };

  const handleVeiculoChange = (placa: string) => {
    // ... (handleVeiculoChange - sem alterações) ...
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


  const renderDetalhesDialogContent = (manutencao: Manutencao) => (
    <>
      {/* ... (Conteúdo do Dialog "Ver Detalhes" - sem alterações) ... */}
    </>
  );


  const renderContent = () => {
    if (isLoadingManutencoes) {
      return <ListSkeleton />;
    }
    
    // NOVO: Lógica de EmptyState atualizada
    if (totalCount === 0 && debouncedSearchTerm === "") {
      return (
        <EmptyState
          icon={Wrench}
          title="Nenhuma manutenção registrada"
          description="Comece registrando a primeira manutenção no sistema."
          actionLabel="Nova Manutenção"
          onAction={() => {
            resetForm();
            setDialogOpen(true);
          }}
        />
      );
    }
    
    if (manutencoes.length === 0 && debouncedSearchTerm !== "") {
      return (
        <div className="p-8 text-center text-muted-foreground">
          Nenhuma manutenção encontrada para "{searchTerm}"
        </div>
      );
    }
    
    // NOVO: O conteúdo principal (mobile ou desktop)
    const listContent = isMobile ? (
      <div className="space-y-4 p-4">
        {manutencoes.map((manutencao) => (
          <ManutencaoCard
            key={manutencao.id}
            manutencao={manutencao}
            onEdit={() => handleEdit(manutencao)}
            detailsAction={
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Detalhes
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  {renderDetalhesDialogContent(manutencao)}
                </DialogContent>
              </Dialog>
            }
            deleteAction={
              canDelete && (
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
                      <AlertDialogDescriptionValid>
                        Esta ação não pode ser revertida. Isto irá apagar
                        permanentemente o registo de manutenção para
                        <strong className="px-1">{manutencao.veiculo_nome}</strong>
                        (Placa: {manutencao.placa}).
                      </AlertDialogDescriptionValid>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletarManutencao(manutencao.id)}>
                        Continuar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )
            }
          />
        ))}
      </div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Veículo</TableHead>
            <TableHead>Placa</TableHead>
            <TableHead>Problema</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Registro</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {manutencoes.map((manutencao) => (
            <TableRow key={manutencao.id}>
              <TableCell className="font-medium">
                {manutencao.veiculo_nome}
              </TableCell>
              <TableCell>{manutencao.placa}</TableCell>
              <TableCell className="max-w-xs truncate">
                {manutencao.descricao_problema}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariantMapManutencao[manutencao.status] || "outline"}>
                  {statusOptionsManutencao.find(s => s.value === manutencao.status)?.label}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(manutencao.data_registro).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell>
                {manutencao.custo_real
                  ? `R$ ${manutencao.custo_real.toFixed(2)}`
                  : manutencao.custo_estimado
                  ? `~R$ ${manutencao.custo_estimado.toFixed(2)}`
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      {renderDetalhesDialogContent(manutencao)}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(manutencao)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                          <AlertDialogDescriptionValid>
                            Esta ação não pode ser revertida. Isto irá apagar
                            permanentemente o registo de manutenção para
                            <strong className="px-1">{manutencao.veiculo_nome}</strong>
                            (Placa: {manutencao.placa}).
                          </AlertDialogDescriptionValid>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletarManutencao(manutencao.id)}>
                            Continuar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manutenção</h1>
            <p className="text-muted-foreground">
              Gerencie as manutenções de veículos e maquinário
            </p>
          </div>
          <ResponsiveDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            title={editingId ? "Editar Manutenção" : "Nova Manutenção"}
            description="Registre os problemas e peças necessárias para o veículo"
            className="max-w-2xl"
            trigger={
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Manutenção
              </Button>
            }
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                
                {/* ... (Formulário de Manutenção - sem alterações, a lógica condicional da NF já está aqui) ... */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo_veiculo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Veículo</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("placa", "");
                            form.setValue("veiculo_nome", "");
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="viatura">Viatura</SelectItem>
                            <SelectItem value="maquinario">Maquinário</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="placa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Veículo</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleVeiculoChange(value);
                          }}
                          value={field.value}
                          disabled={!form.watch("tipo_veiculo")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o veículo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.watch("tipo_veiculo") === "viatura"
                              ? viaturas.map((v) => (
                                  <SelectItem key={v.placa} value={v.placa}>
                                    {v.nome} - {v.placa}
                                  </SelectItem>
                                ))
                              : maquinarios.map((m) => (
                                  <SelectItem key={m.placa} value={m.placa}>
                                    {m.nome} - {m.placa}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="descricao_problema"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Problema</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o problema..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pecas_necessarias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peças Necessárias (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Filtro de óleo, Pastilha de freio..."
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescriptionValid>
                        Separe os itens por vírgula.
                      </FormDescriptionValid>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="links_pecas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Links das Peças (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="https://exemplo.com/peca1, https://exemplo.com/peca2..."
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                       <FormDescriptionValid>
                        Separe os links por vírgula.
                      </FormDescriptionValid>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptionsManutencao.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data_registro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Registro</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="data_conclusao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Conclusão (opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator />
                <h3 className="text-lg font-medium">Informações de Custo</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="custo_estimado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo Estimado (R$) (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {currentStatus !== "pendente" && (
                    <FormField
                      control={form.control}
                      name="custo_real"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custo Real (R$) (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {currentStatus !== "pendente" && (
                  <>
                    <Separator />
                    <h3 className="text-lg font-medium">Informações da Nota Fiscal (opcional)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nf_numero"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número da NF</FormLabel>
                            <FormControl>
                              <Input placeholder="Nº da Nota" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nf_data"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data da NF</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="nf_fornecedor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fornecedor</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do fornecedor" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                <Separator />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                         <Textarea
                          placeholder="Observações adicionais..."
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving
                    ? "Salvando..."
                    : (editingId ? "Atualizar" : "Registrar")}
                </Button>
              </form>
            </Form>
          </ResponsiveDialog>
          
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manutenções Registradas</CardTitle>
            <CardDescription>
              Lista de todas as manutenções cadastradas no sistema
            </CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por veículo, placa ou problema..."
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
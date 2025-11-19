// src/components/GerenciadorDeVeiculos.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LucideIcon, Search } from "lucide-react"; 

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { veiculoSchema, VeiculoFormData } from "@/lib/validations";
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

import {
  statusOptionsVeiculos,
  statusVariantMapVeiculos,
  combustivelOptions,
} from "@/lib/constants";
import { EmptyState } from "@/components/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { VeiculoCard } from "@/components/cards/VeiculoCard";
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

// --- NOVO IMPORT ---
import { FichaRelatorioDialog } from "./FichaRelatorioDialog"; 
// --- FIM NOVO ---

const ITEMS_PER_PAGE = 10;

interface Veiculo {
  id: string;
  nome: string;
  ano: number;
  placa: string;
  cartao: string | null;
  status: "operante" | "inoperante" | "em_manutencao" | "em_reparo" | "reserva";
  anotacoes: string | null;
  tipo_combustivel: string;
}

interface GerenciadorDeVeiculosProps {
  supabaseTable: "viaturas" | "maquinario";
  title: string;
  itemNome: string;
  icon: LucideIcon;
}

const fetchVeiculos = async (
  supabaseTable: "viaturas" | "maquinario",
  page: number,
  searchTerm: string
) => {
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from(supabaseTable)
    .select("*", { count: "exact" });

  if (searchTerm) {
    query = query.or(
      `nome.ilike.%${searchTerm}%,placa.ilike.%${searchTerm}%,tipo_combustivel.ilike.%${searchTerm}%`
    );
  }

  query = query.order("nome").range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: data || [], count: count || 0 };
};


export function GerenciadorDeVeiculos({
  supabaseTable,
  title,
  itemNome,
  icon: Icon,
}: GerenciadorDeVeiculosProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [page, setPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const form = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      nome: "",
      ano: new Date().getFullYear(),
      placa: "",
      cartao: "",
      status: "operante",
      anotacoes: "",
      tipo_combustivel: "Gasolina",
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: [supabaseTable, page, debouncedSearchTerm],
    queryFn: () => fetchVeiculos(supabaseTable, page, debouncedSearchTerm),
  });
  
  const veiculos: Veiculo[] = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  const { mutate: salvarVeiculo, isPending: isSaving } = useMutation({
    mutationFn: async (data: VeiculoFormData) => {
      // Adaptação para garantir que o ano é número e campos vazios viram null
      const payload = {
        ...data,
        ano: Number(data.ano),
        cartao: data.cartao || null,
        anotacoes: data.anotacoes || null
      };

      let response;
      if (editingId) {
        response = await supabase
          .from(supabaseTable)
          .update(payload)
          .eq("id", editingId);
      } else {
        response = await supabase
          .from(supabaseTable)
          .insert(payload);
      }

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success(editingId ? `${itemNome} atualizado!` : `${itemNome} criado com sucesso!`);
      setIsDialogOpen(false); 
      resetForm();
      queryClient.invalidateQueries({ queryKey: [supabaseTable] });
    },
    onError: (error: any) => {
      // Tratamento específico para erro de placa duplicada
      if (error.code === '23505' && error.message.includes('placa_key')) {
          toast.error("Erro: Já existe um veículo com esta placa.");
      } else {
          toast.error(error.message || `Erro ao salvar ${itemNome.toLowerCase()}`);
      }
    },
  });
  
  const { mutate: deletarVeiculo } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(supabaseTable).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${itemNome} apagado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: [supabaseTable] });
      if (veiculos.length === 1 && page > 1) {
        setPage(page - 1);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || `Erro ao excluir ${itemNome.toLowerCase()}`);
    },
  });

  const onSubmit = (data: VeiculoFormData) => {
    salvarVeiculo(data);
  };

  const resetForm = () => {
    form.reset({
      nome: "",
      ano: new Date().getFullYear(),
      placa: "",
      cartao: "",
      status: "operante",
      anotacoes: "",
      tipo_combustivel: supabaseTable === 'viaturas' ? 'Gasolina' : 'Diesel',
    }); 
    setEditingId(null);
  };

  const handleEdit = (veiculo: Veiculo) => {
    form.reset({
      nome: veiculo.nome,
      ano: veiculo.ano,
      placa: veiculo.placa,
      cartao: veiculo.cartao || "",
      status: veiculo.status,
      anotacoes: veiculo.anotacoes || "",
      tipo_combustivel: veiculo.tipo_combustivel,
    });
    setEditingId(veiculo.id);
    setIsDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  const canDelete = userRole === "admin" || userRole === "coordenador";

  const renderContent = () => {
    if (isLoading) {
      return <ListSkeleton />;
    }
    
    if (totalCount === 0 && debouncedSearchTerm === "") {
      return (
         <EmptyState
            icon={Icon}
            title={`Nenhum ${itemNome.toLowerCase()} cadastrado`}
            description={`Comece adicionando o primeiro ${itemNome.toLowerCase()} ao sistema.`}
            actionLabel={`Novo ${itemNome}`}
            onAction={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          />
      );
    }
    
    if (veiculos.length === 0 && debouncedSearchTerm !== "") {
      return (
        <div className="p-8 text-center text-muted-foreground">
          Nenhum {itemNome.toLowerCase()} encontrado para "{searchTerm}"
        </div>
      );
    }
    
    const listContent = isMobile ? (
      <div className="space-y-4 p-4">
        {veiculos.map((veiculo) => (
          <VeiculoCard
            key={veiculo.id}
            veiculo={veiculo}
            icon={Icon}
            onEdit={() => handleEdit(veiculo)}
            // --- NOVO: Adiciona o botão de Relatório no Card Mobile ---
            extraAction={
                <FichaRelatorioDialog 
                    veiculo={veiculo} 
                    tipoVeiculo={supabaseTable}
                />
            }
            // --- FIM NOVO ---
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
                      <AlertDialogDescription>
                        Esta ação não pode ser revertida. Isto irá apagar
                        permanentemente o {itemNome.toLowerCase()}
                        <strong className="px-1">{veiculo.nome}</strong>
                        com placa
                        <strong className="px-1">{veiculo.placa}</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deletarVeiculo(veiculo.id)}
                      >
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
            <TableHead>Nome</TableHead>
            <TableHead>Ano</TableHead>
            <TableHead>Placa</TableHead>
            <TableHead>Combustível</TableHead>
            <TableHead>Cartão</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Anotações</TableHead>
            <TableHead className="w-[150px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {veiculos.map((veiculo) => (
            <TableRow key={veiculo.id}>
              <TableCell className="font-medium">{veiculo.nome}</TableCell>
              <TableCell>{veiculo.ano}</TableCell>
              <TableCell>{veiculo.placa}</TableCell>
              <TableCell>{veiculo.tipo_combustivel}</TableCell>
              <TableCell>{veiculo.cartao || "-"}</TableCell>
              <TableCell>
                <Badge variant={statusVariantMapVeiculos[veiculo.status] || "outline"}>
                  {statusOptionsVeiculos.find((s) => s.value === veiculo.status)?.label}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">{veiculo.anotacoes || "-"}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {/* --- NOVO: Adiciona o botão de Relatório na Tabela Desktop --- */}
                  <FichaRelatorioDialog 
                      veiculo={veiculo} 
                      tipoVeiculo={supabaseTable}
                  />
                  {/* --- FIM NOVO --- */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(veiculo)}
                  >
                    <Pencil className="h-4 w-4" />
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
                          <AlertDialogDescription>
                            Esta ação não pode ser revertida. Isto irá apagar
                            permanentemente o {itemNome.toLowerCase()}
                            <strong className="px-1">{veiculo.nome}</strong>
                            com placa
                            <strong className="px-1">{veiculo.placa}</strong>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletarVeiculo(veiculo.id)}
                          >
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{title}</h1>

        <ResponsiveDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          title={editingId ? `Editar ${itemNome}` : `Novo ${itemNome}`}
          description={`Preencha os detalhes para ${editingId ? 'editar' : 'adicionar'} um ${itemNome.toLowerCase()}.`} // --- LINHA CORRIGIDA ---
          className="max-w-2xl"
          trigger={
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo {itemNome}
            </Button>
          }
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Veículo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Ranger 2.2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="placa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC1234" {...field} 
                          onChange={e => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ano"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} 
                         onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_combustivel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Combustível</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o combustível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {combustivelOptions.map((option) => (
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
                  name="cartao"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Cartão</FormLabel>
                      <FormControl>
                        <Input placeholder="Número do cartão" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptionsVeiculos.map((option) => (
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
                  name="anotacoes"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Anotações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Anotações sobre o veículo..."
                          rows={3}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              placeholder={`Buscar por nome, placa ou combustível...`}
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
  );
}
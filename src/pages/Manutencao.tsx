// src/pages/Manutencao.tsx

import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Edit, Wrench, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { manutencaoSchema, ManutencaoFormData } from "@/lib/validations";
import { Form, FormControl, FormDescription as FormDescriptionValid, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionValid, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { statusOptionsManutencao, statusVariantMapManutencao } from "@/lib/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; 
import { useIsMobile } from "@/hooks/use-mobile";
import { ManutencaoCard } from "@/components/cards/ManutencaoCard";
import { Separator } from "@/components/ui/separator";
import { ListSkeleton } from "@/components/ListSkeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// --- IMPORTAÇÕES PADRONIZADAS ---
import { Manutencao, VeiculoSelecao } from "@/types";
import { formatDate, formatCurrency } from "@/lib/formatters";

const ITEMS_PER_PAGE = 10;

const fetchManutencoes = async (page: number, searchTerm: string) => {
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from("manutencoes")
    .select("*", { count: "exact" });

  if (searchTerm) {
    query = query.or(
      `veiculo_nome.ilike.%${searchTerm}%,placa.ilike.%${searchTerm}%,descricao_problema.ilike.%${searchTerm}%`
    );
  }

  query = query.order("data_registro", { ascending: false }).range(from, to);
  
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data as Manutencao[]) || [], count: count || 0 };
};

const fetchViaturas = async () => {
  const { data, error } = await supabase.from("viaturas").select("placa, nome");
  if (error) throw error;
  return (data as VeiculoSelecao[]) || [];
};
const fetchMaquinarios = async () => {
  const { data, error } = await supabase.from("maquinario").select("placa, nome");
  if (error) throw error;
  return (data as VeiculoSelecao[]) || [];
};

export default function ManutencaoPage() { // Renomeei para evitar conflito com o tipo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { userRole } = useAuth();
  const canDelete = userRole === "admin" || userRole === "coordenador";
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const [page, setPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const form = useForm<ManutencaoFormData>({
    resolver: zodResolver(manutencaoSchema),
    defaultValues: {
      placa: "",
      tipo_veiculo: "viatura",
      veiculo_nome: "",
      descricao_problema: "",
      pecas_necessarias: "",
      links_pecas: "",
      status: "pendente",
      data_registro: new Date().toISOString().split("T")[0],
      data_conclusao: "",
      custo_estimado: "",
      custo_real: "",
      observacoes: "",
      nf_numero: "",
      nf_data: "",
      nf_fornecedor: "",
    },
  });

  const currentStatus = form.watch("status");

  const { data, isLoading: isLoadingManutencoes } = useQuery({
    queryKey: ["manutencoes", page, debouncedSearchTerm],
    queryFn: () => fetchManutencoes(page, debouncedSearchTerm),
  });
  
  const manutencoes = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const { data: viaturas = [] } = useQuery<VeiculoSelecao[]>({
    queryKey: ["viaturas"],
    queryFn: fetchViaturas,
  });
  const { data: maquinarios = [] } = useQuery<VeiculoSelecao[]>({
    queryKey: ["maquinario"],
    queryFn: fetchMaquinarios,
  });
  
  const { mutate: salvarManutencao, isPending: isSaving } = useMutation({
    mutationFn: async (data: ManutencaoFormData) => {
      const record = {
        ...data,
        pecas_necessarias: data.pecas_necessarias ? data.pecas_necessarias.split(",").map(p => p.trim()) : null,
        links_pecas: data.links_pecas ? data.links_pecas.split(",").map(l => l.trim()) : null,
        data_conclusao: data.data_conclusao || null,
        custo_estimado: data.custo_estimado ? parseFloat(data.custo_estimado) : null,
        custo_real: data.custo_real ? parseFloat(data.custo_real) : null,
        observacoes: data.observacoes || null,
        nf_numero: data.nf_numero || null,
        nf_data: data.nf_data || null,
        nf_fornecedor: data.nf_fornecedor || null,
      };

      let response;
      if (editingId) {
        response = await supabase.from("manutencoes").update(record).eq("id", editingId);
      } else {
        response = await supabase.from("manutencoes").insert(record);
      }

      if (response.error) throw response.error;
      return editingId ? "Manutenção atualizada!" : "Manutenção registrada!";
    },
    onSuccess: (message) => {
      toast.success(message);
      resetForm();
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["manutencoes"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar manutenção");
    },
  });

  const { mutate: deletarManutencao } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("manutencoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Manutenção excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["manutencoes"] });
      if (manutencoes.length === 1 && page > 1) {
        setPage(page - 1);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir manutenção");
    }
  });

  const onSubmit = (data: ManutencaoFormData) => {
    salvarManutencao(data);
  };
  
  const handleEdit = (manutencao: Manutencao) => {
    form.reset({
      ...manutencao,
      data_registro: manutencao.data_registro ? manutencao.data_registro.split("T")[0] : "",
      data_conclusao: manutencao.data_conclusao ? manutencao.data_conclusao.split("T")[0] : "",
      pecas_necessarias: manutencao.pecas_necessarias ? manutencao.pecas_necessarias.join(", ") : "",
      links_pecas: manutencao.links_pecas ? manutencao.links_pecas.join(", ") : "",
      custo_estimado: manutencao.custo_estimado?.toString() || "",
      custo_real: manutencao.custo_real?.toString() || "",
      observacoes: manutencao.observacoes || "",
      nf_numero: manutencao.nf_numero || "",
      nf_data: manutencao.nf_data ? manutencao.nf_data.split("T")[0] : "",
      nf_fornecedor: manutencao.nf_fornecedor || "",
    });
    setEditingId(manutencao.id);
    setDialogOpen(true);
  };

  const resetForm = () => {
    form.reset({
      placa: "",
      tipo_veiculo: "viatura",
      veiculo_nome: "",
      descricao_problema: "",
      pecas_necessarias: "",
      links_pecas: "",
      status: "pendente",
      data_registro: new Date().toISOString().split("T")[0],
      data_conclusao: "",
      custo_estimado: "",
      custo_real: "",
      observacoes: "",
      nf_numero: "",
      nf_data: "",
      nf_fornecedor: "",
    });
    setEditingId(null);
  };

  const handleVeiculoChange = (placa: string) => {
    const tipo = form.getValues("tipo_veiculo");
    const lista = tipo === "viatura" ? viaturas : maquinarios;
    const veiculo = lista.find(v => v.placa === placa);
    if (veiculo) {
      form.setValue("veiculo_nome", veiculo.nome);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  const renderDetalhesDialogContent = (manutencao: Manutencao) => {
    const DetailItem = ({ label, value, children }: { label: string; value?: string | number | null; children?: React.ReactNode }) => {
      const displayValue = value || children;
      if (!displayValue) return null; 
      return (
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="text-sm">{displayValue}</div>
        </div>
      );
    };

    const statusInfo = statusOptionsManutencao.find(s => s.value === manutencao.status);
    const statusVariant = statusVariantMapManutencao[manutencao.status] || "outline";

    return (
      <>
        <DialogHeader>
          <DialogTitle>{manutencao.veiculo_nome} ({manutencao.placa})</DialogTitle>
          <DialogDescription>
            <Badge variant={statusVariant} className="mt-2">
              {statusInfo?.label}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
          <Separator />
          <h4 className="font-semibold">Problema e Peças</h4>
          <DetailItem label="Descrição do Problema" value={manutencao.descricao_problema} />
          <DetailItem label="Peças Necessárias">
            {manutencao.pecas_necessarias && manutencao.pecas_necessarias.length > 0 ? (
              <ul className="list-disc pl-5">
                {manutencao.pecas_necessarias.map((peca, i) => <li key={i}>{peca}</li>)}
              </ul>
            ) : "N/A"}
          </DetailItem>
          <DetailItem label="Links das Peças">
            {manutencao.links_pecas && manutencao.links_pecas.length > 0 ? (
              <ul className="space-y-1">
                {manutencao.links_pecas.map((link, i) => (
                  <li key={i}>
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {link.length > 50 ? `${link.substring(0, 50)}...` : link}
                    </a>
                  </li>
                ))}
              </ul>
            ) : "N/A"}
          </DetailItem>

          <Separator />
          <h4 className="font-semibold">Datas e Custos</h4>
          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Data do Registro" value={formatDate(manutencao.data_registro)} />
            <DetailItem label="Data de Conclusão" value={manutencao.data_conclusao ? formatDate(manutencao.data_conclusao) : "N/A"} />
            <DetailItem label="Custo Estimado" value={manutencao.custo_estimado ? formatCurrency(manutencao.custo_estimado) : "N/A"} />
            <DetailItem label="Custo Real" value={manutencao.custo_real ? formatCurrency(manutencao.custo_real) : "N/A"} />
          </div>

          {(manutencao.nf_numero || manutencao.nf_data || manutencao.nf_fornecedor) && (
            <>
              <Separator />
              <h4 className="font-semibold">Nota Fiscal</h4>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Nº da NF" value={manutencao.nf_numero} />
                <DetailItem label="Data da NF" value={manutencao.nf_data ? formatDate(manutencao.nf_data) : null} />
                <DetailItem label="Fornecedor" value={manutencao.nf_fornecedor} className="col-span-2" />
              </div>
            </>
          )}

          <Separator />
          <DetailItem label="Observações" value={manutencao.observacoes} />
        </div>
      </>
    );
  };

  const renderContent = () => {
    if (isLoadingManutencoes) {
      return <ListSkeleton />;
    }
    
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
    
    if (isMobile) {
      return (
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
                          Esta ação não pode ser revertida. O registo de manutenção para
                          <strong className="px-1">{manutencao.veiculo_nome}</strong>
                          será apagado permanentemente.
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
      );
    }

    return (
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
                {formatDate(manutencao.data_registro)}
              </TableCell>
              <TableCell>
                {manutencao.custo_real
                  ? formatCurrency(manutencao.custo_real)
                  : manutencao.custo_estimado
                  ? `~${formatCurrency(manutencao.custo_estimado)}`
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
                            Esta ação não pode ser revertida.
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
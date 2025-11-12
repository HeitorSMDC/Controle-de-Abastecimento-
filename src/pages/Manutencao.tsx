// src/pages/Manutencao.tsx

import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// NOVO: Importações para formulário e validação
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { manutencaoSchema, ManutencaoFormData } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormDescription as FormDescriptionValid, // Renomeado para evitar conflito
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// NOVO: Importações para o AlertDialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionValid, // Renomeado
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
}

interface Veiculo {
  placa: string;
  nome: string;
}

export default function Manutencao() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [viaturas, setViaturas] = useState<Veiculo[]>([]);
  const [maquinarios, setMaquinarios] = useState<Veiculo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { userRole } = useAuth();
  const canDelete = userRole === "admin" || userRole === "coordenador";
  
  // NOVO: Configuração do React Hook Form
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
    },
  });

  useEffect(() => {
    fetchManutencoes();
    fetchVeiculos();
  }, []);

  const fetchManutencoes = async () => {
    // ... (lógica de fetch existente) ...
    const { data, error } = await supabase
      .from("manutencoes")
      .select("*")
      .order("data_registro", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar manutenções");
      return;
    }
    setManutencoes(data || []);
  };

  const fetchVeiculos = async () => {
    // ... (lógica de fetch existente) ...
    const [viaturasRes, maquinariosRes] = await Promise.all([
      supabase.from("viaturas").select("placa, nome"),
      supabase.from("maquinario").select("placa, nome"),
    ]);

    if (viaturasRes.data) setViaturas(viaturasRes.data);
    if (maquinariosRes.data) setMaquinarios(maquinariosRes.data);
  };

  // NOVO: Função de submit do react-hook-form
  const onSubmit = async (data: ManutencaoFormData) => {
    
    // NOVO: Mantemos a lógica de conversão de dados validada
    const dataToSubmit = {
      ...data,
      pecas_necessarias: data.pecas_necessarias
        ? data.pecas_necessarias.split(",").map((p) => p.trim())
        : null,
      links_pecas: data.links_pecas
        ? data.links_pecas.split(",").map((l) => l.trim())
        : null,
      data_conclusao: data.data_conclusao || null,
      custo_estimado: data.custo_estimado ? parseFloat(data.custo_estimado) : null,
      custo_real: data.custo_real ? parseFloat(data.custo_real) : null,
      observacoes: data.observacoes || null,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("manutencoes")
          .update(dataToSubmit)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Manutenção atualizada!");
      } else {
        const { error } = await supabase.from("manutencoes").insert(dataToSubmit);

        if (error) throw error;
        toast.success("Manutenção registrada!");
      }

      resetForm();
      setDialogOpen(false);
      fetchManutencoes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar manutenção");
    }
  };

  // NOVO: Função handleDelete sem 'confirm'
  const handleDelete = async (id: string) => {
    // if (!confirm(...)) return; // LINHA REMOVIDA

    const { error } = await supabase.from("manutencoes").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir manutenção");
      return;
    }

    toast.success("Manutenção excluída!");
    fetchManutencoes();
  };

  // NOVO: handleEdit usa form.reset()
  const handleEdit = (manutencao: Manutencao) => {
    setEditingId(manutencao.id);
    // Converte os dados de volta para o formato do formulário (strings)
    form.reset({
      placa: manutencao.placa,
      tipo_veiculo: manutencao.tipo_veiculo as "viatura" | "maquinario",
      veiculo_nome: manutencao.veiculo_nome,
      descricao_problema: manutencao.descricao_problema,
      pecas_necessarias: manutencao.pecas_necessarias?.join(", ") || "",
      links_pecas: manutencao.links_pecas?.join(", ") || "",
      status: manutencao.status,
      data_registro: manutencao.data_registro,
      data_conclusao: manutencao.data_conclusao || "",
      custo_estimado: manutencao.custo_estimado?.toString() || "",
      custo_real: manutencao.custo_real?.toString() || "",
      observacoes: manutencao.observacoes || "",
    });
    setDialogOpen(true);
  };

  // NOVO: resetForm usa form.reset()
  const resetForm = () => {
    setEditingId(null);
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
    });
  };

  // NOVO: handleVeiculoChange agora usa form.setValue
  const handleVeiculoChange = (placa: string) => {
    const tipo = form.getValues("tipo_veiculo"); // Pega o valor atual do form
    const veiculo =
      tipo === "viatura"
        ? viaturas.find((v) => v.placa === placa)
        : maquinarios.find((m) => m.placa === placa);

    if (veiculo) {
      form.setValue("placa", veiculo.placa);
      form.setValue("veiculo_nome", veiculo.nome);
    }
  };

  // ... (funções getStatusBadge e getStatusLabel - sem alterações) ...
  const getStatusBadge = (status: StatusManutencao) => {
    //...
    const variants: Record<StatusManutencao, string> = {
      pendente: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      em_andamento: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      concluida: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelada: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return variants[status];
  };

  const getStatusLabel = (status: StatusManutencao) => {
    //...
    const labels: Record<StatusManutencao, string> = {
      pendente: "Pendente",
      em_andamento: "Em Andamento",
      concluida: "Concluída",
      cancelada: "Cancelada",
    };
    return labels[status];
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {/* ... (Título da Página) ... */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manutenção</h1>
            <p className="text-muted-foreground">
              Gerencie as manutenções de veículos e maquinário
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Manutenção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Manutenção" : "Nova Manutenção"}
                </DialogTitle>
                <DialogDescription>
                  Registre os problemas e peças necessárias para o veículo
                </DialogDescription>
              </DialogHeader>
              
              {/* NOVO: FormProvider */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                              handleVeiculoChange(value); // Chama a função para atualizar o nome
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
                        <FormLabel>Peças Necessárias</FormLabel>
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
                        <FormLabel>Links das Peças</FormLabel>
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
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="em_andamento">Em Andamento</SelectItem>
                              <SelectItem value="concluida">Concluída</SelectItem>
                              <SelectItem value="cancelada">Cancelada</SelectItem>
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
                        <FormLabel>Data de Conclusão</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="custo_estimado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custo Estimado (R$)</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="custo_real"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custo Real (R$)</FormLabel>
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
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
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

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting
                        ? "Salvando..."
                        : (editingId ? "Atualizar" : "Registrar")}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          {/* ... (CardHeader e Tabela - sem alterações, exceto o botão de apagar) ... */}
          <CardHeader>
            <CardTitle>Manutenções Registradas</CardTitle>
            <CardDescription>
              Lista de todas as manutenções cadastradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    {/* ... (TableCells de dados) ... */}
                    <TableCell className="font-medium">
                      {manutencao.veiculo_nome}
                    </TableCell>
                    <TableCell>{manutencao.placa}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {manutencao.descricao_problema}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(manutencao.status)}>
                        {getStatusLabel(manutencao.status)}
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
                        {/* ... (Dialog de "Ver Detalhes" - sem alterações) ... */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            {/* ... (Conteúdo do Dialog de Detalhes) ... */}
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(manutencao)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {/* NOVO: AlertDialog para confirmação de exclusão */}
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
                                <AlertDialogAction onClick={() => handleDelete(manutencao.id)}>
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
// src/pages/ControleAbastecimento.tsx

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Gauge, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { abastecimentoSchema, AbastecimentoFormData } from "@/lib/validations";
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { EmptyState } from "@/components/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { AbastecimentoCard } from "@/components/cards/AbastecimentoCard";
import { ListSkeleton } from "@/components/ListSkeleton";

interface VeiculoSelecao {
  placa: string;
  nome: string;
  cartao: string | null;
}
interface MotoristaSelecao {
  matricula: string;
  nome: string;
}
interface Abastecimento {
  id: string;
  data: string;
  veiculo: string;
  placa: string;
  cartao: string | null;
  motorista: string;
  matricula: string;
  quantidade_litros: number;
  valor_reais: number;
  semana: number;
  mes: number;
  ano: number;
  odometro: number | null;
  km_percorridos: number | null;
  media_km_l: number | null;
  // --- NOVO CAMPO ---
  posto: string | null;
}

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
};

const fetchAbastecimentos = async (mes: number, ano: number) => {
  const { data, error } = await supabase
    .from("controle_abastecimento")
    .select("*")
    .eq("mes", mes)
    .eq("ano", ano)
    .order("data", { ascending: false });

  if (error) throw error;
  return data || [];
};

const fetchViaturas = async () => {
  const { data, error } = await supabase.from("viaturas").select("placa, nome, cartao");
  if (error) throw error;
  return (data as VeiculoSelecao[]) || [];
};
const fetchMaquinarios = async () => {
  const { data, error } = await supabase.from("maquinario").select("placa, nome, cartao");
  if (error) throw error;
  return (data as VeiculoSelecao[]) || [];
};
const fetchMotoristas = async () => {
  const { data, error } = await supabase.from("motoristas").select("matricula, nome");
  if (error) throw error;
  return (data as MotoristaSelecao[]) || [];
};

export default function ControleAbastecimento() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const [valorUnitario, setValorUnitario] = useState(0);

  const form = useForm<AbastecimentoFormData>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      data: new Date().toISOString().split("T")[0],
      veiculo: "",
      placa: "",
      cartao: "",
      motorista: "",
      matricula: "",
      quantidade_litros: 0,
      valor_reais: 0,
      odometro: 0,
      posto: "Posto Rota 28", // Valor padrão
    },
  });
  
  const watchLitros = form.watch("quantidade_litros");
  const watchValorTotal = form.watch("valor_reais");

  useEffect(() => {
    if (watchLitros > 0 && watchValorTotal > 0) {
      setValorUnitario(watchValorTotal / watchLitros);
    } else if (watchLitros === 0 && watchValorTotal === 0) {
      if (valorUnitario !== 0) setValorUnitario(0);
    }
  }, [watchLitros, watchValorTotal, valorUnitario]);

  const handleValorUnitarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const unitario = parseFloat(e.target.value) || 0;
    setValorUnitario(unitario);
    if (watchLitros > 0) {
      form.setValue("valor_reais", watchLitros * unitario, { shouldValidate: true });
    }
  };
  
  const handleLitrosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const litros = parseFloat(e.target.value) || 0;
    form.setValue("quantidade_litros", litros, { shouldValidate: true });
    if (valorUnitario > 0) {
      form.setValue("valor_reais", litros * valorUnitario, { shouldValidate: true });
    }
  };

  const { data, isLoading } = useQuery<Abastecimento[]>({
    queryKey: ["abastecimentos", selectedMonth, selectedYear],
    queryFn: () => fetchAbastecimentos(selectedMonth, selectedYear),
  });

  const abastecimentos: Abastecimento[] = data || [];

  const { data: viaturas = [] } = useQuery<VeiculoSelecao[]>({
    queryKey: ["viaturasForm"],
    queryFn: fetchViaturas,
  });
  const { data: maquinarios = [] } = useQuery<VeiculoSelecao[]>({
    queryKey: ["maquinarioForm"],
    queryFn: fetchMaquinarios,
  });
  const { data: motoristas = [] } = useQuery<MotoristaSelecao[]>({
    queryKey: ["motoristasForm"],
    queryFn: fetchMotoristas,
  });

  const veiculosList = useMemo(() => [...viaturas, ...maquinarios].sort((a, b) => a.nome.localeCompare(b.nome)), [viaturas, maquinarios]);

  const { mutate: salvarAbastecimento, isPending: isSaving } = useMutation({
    mutationFn: async (data: AbastecimentoFormData) => {
      const { data: validatedData, error: zodError } = abastecimentoSchema.safeParse(data);
      if (zodError) {
        throw new Error(zodError.errors.map((e) => e.message).join(", "));
      }

      const [ano, mes, dia] = validatedData.data.split("-").map(Number);
      const dataObj = new Date(ano, mes - 1, dia);
      const semana = getWeekNumber(dataObj);

      const record = {
        ...validatedData,
        ano,
        mes,
        semana,
        odometro: validatedData.odometro,
      };

      let response;
      if (editingId) {
        response = await supabase
          .from("controle_abastecimento")
          .update(record)
          .eq("id", editingId);
      } else {
        response = await supabase.from("controle_abastecimento").insert(record);
      }

      const { error } = response;
      if (error) throw error;
      
      return { 
        message: editingId ? "Registro atualizado com sucesso!" : "Registro salvo com sucesso!",
        placa: validatedData.placa
      };
    },
    onSuccess: ({ message, placa }) => {
      toast.success(message);
      
      supabase.rpc('recalcular_medias_veiculo', { placa_veiculo: placa })
        .then(({ error }) => {
          if (error) {
            console.error("Erro ao recalcular médias:", error.message);
          }
        });

      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["abastecimentos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar registro");
    },
  });

  const { mutate: deletarAbastecimento } = useMutation({
    mutationFn: async (id: string) => {
      const { data: registro } = await supabase
        .from("controle_abastecimento")
        .select("placa")
        .eq("id", id)
        .single();
      
      const { error } = await supabase.from("controle_abastecimento").delete().eq("id", id);
      if (error) throw error;
      
      return { 
        message: "Registro excluído com sucesso!", 
        placa: registro?.placa 
      };
    },
    onSuccess: ({ message, placa }) => {
      toast.success(message);
      
      if (placa) {
        supabase.rpc('recalcular_medias_veiculo', { placa_veiculo: placa })
          .then(({ error }) => {
            if (error) console.error("Erro ao recalcular médias após deleção:", error.message);
          });
      }
      
      queryClient.invalidateQueries({ queryKey: ["abastecimentos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir registro");
    },
  });

  const onSubmit = (data: AbastecimentoFormData) => {
    salvarAbastecimento(data);
  };

  const resetForm = () => {
    form.reset({
      data: new Date().toISOString().split("T")[0],
      veiculo: "",
      placa: "",
      cartao: "",
      motorista: "",
      matricula: "",
      quantidade_litros: 0,
      valor_reais: 0,
      odometro: 0,
      posto: "Posto Rota 28",
    });
    setEditingId(null);
    setValorUnitario(0);
  };

  const handleEdit = (abastecimento: Abastecimento) => {
    form.reset({
      ...abastecimento,
      cartao: abastecimento.cartao || "",
      odometro: abastecimento.odometro || 0,
      posto: (abastecimento.posto as "Posto Rota 28" | "Posto Universo") || "Posto Rota 28",
    });
    
    if (abastecimento.quantidade_litros > 0 && abastecimento.valor_reais > 0) {
      setValorUnitario(abastecimento.valor_reais / abastecimento.quantidade_litros);
    } else {
      setValorUnitario(0);
    }
    
    setEditingId(abastecimento.id);
    setIsDialogOpen(true);
  };

  const handleVeiculoChange = (placa: string) => {
    const veiculoSelecionado = veiculosList.find(v => v.placa === placa);
    if (veiculoSelecionado) {
      form.setValue("veiculo", veiculoSelecionado.nome);
      form.setValue("placa", veiculoSelecionado.placa);
      form.setValue("cartao", veiculoSelecionado.cartao || "");
    }
  };

  const handleMotoristaChange = (matricula: string) => {
    const motoristaSelecionado = motoristas.find(m => m.matricula === matricula);
    if (motoristaSelecionado) {
      form.setValue("motorista", motoristaSelecionado.nome);
      form.setValue("matricula", motoristaSelecionado.matricula);
    }
  };

  const canDelete = userRole === "admin" || userRole === "coordenador";

  const filteredAbastecimentos = useMemo(() => {
    let items = abastecimentos;

    if (selectedWeek !== "all") {
      items = items.filter((item) => item.semana === selectedWeek);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.veiculo.toLowerCase().includes(lowerSearch) ||
          item.placa.toLowerCase().includes(lowerSearch) ||
          item.motorista.toLowerCase().includes(lowerSearch) ||
          item.matricula.toLowerCase().includes(lowerSearch)
      );
    }

    return items;
  }, [abastecimentos, selectedWeek, searchTerm]);

  const weeklyTotals = useMemo(() => {
    const totals: Record<number, { litros: number; reais: number }> = {};
    abastecimentos.forEach((item) => {
      if (!totals[item.semana]) {
        totals[item.semana] = { litros: 0, reais: 0 };
      }
      totals[item.semana].litros += item.quantidade_litros;
      totals[item.semana].reais += item.valor_reais;
    });
    return Object.entries(totals)
      .map(([semana, data]) => ({
        semana: parseInt(semana),
        ...data,
      }))
      .sort((a, b) => a.semana - b.semana);
  }, [abastecimentos]);

  const monthTotal = useMemo(() => {
    return abastecimentos.reduce(
      (acc, item) => {
        acc.litros += item.quantidade_litros;
        acc.reais += item.valor_reais;
        return acc;
      },
      { litros: 0, reais: 0 }
    );
  }, [abastecimentos]);

  const renderContent = () => {
    if (isLoading) {
      return <ListSkeleton />;
    }

    if (abastecimentos.length === 0 && !isLoading) {
      return (
        <EmptyState
          icon={Gauge}
          title="Nenhum registro no sistema"
          description="Comece adicionando o primeiro registro de abastecimento."
          actionLabel="Novo Registro"
          onAction={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        />
      );
    }

    if (filteredAbastecimentos.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          Nenhum registro encontrado para "{searchTerm}"
          {selectedWeek !== "all" ? ` na Semana ${selectedWeek}` : ""}
        </div>
      );
    }

    if (isMobile) {
      return (
        <div className="space-y-4 p-4">
          {filteredAbastecimentos.map((abastecimento) => (
            <AbastecimentoCard
              key={abastecimento.id}
              abastecimento={abastecimento}
              onEdit={() => handleEdit(abastecimento)}
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
                          permanentemente o registro de
                          <strong className="px-1">{abastecimento.veiculo}</strong>
                          do dia
                          <strong className="px-1">
                            {new Date(abastecimento.data).toLocaleDateString("pt-BR")}
                          </strong>
                          .
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletarAbastecimento(abastecimento.id)}>
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Sem.</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Posto</TableHead>
              <TableHead>Odômetro</TableHead>
              <TableHead>Litros</TableHead>
              <TableHead>Valor (R$)</TableHead>
              <TableHead>R$/L</TableHead>
              <TableHead>Km Perc.</TableHead>
              <TableHead>Média</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAbastecimentos.map((abastecimento) => (
              <TableRow key={abastecimento.id}>
                <TableCell>
                  {new Date(abastecimento.data).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>{abastecimento.semana}</TableCell>
                <TableCell className="font-medium">{abastecimento.veiculo}</TableCell>
                <TableCell>{abastecimento.placa}</TableCell>
                <TableCell>{abastecimento.motorista}</TableCell>
                <TableCell>{abastecimento.posto}</TableCell>
                <TableCell>{abastecimento.odometro || "-"}</TableCell>
                <TableCell>{abastecimento.quantidade_litros.toFixed(2)} L</TableCell>
                <TableCell>R$ {abastecimento.valor_reais.toFixed(2)}</TableCell>
                
                <TableCell>
                  {abastecimento.quantidade_litros > 0
                    ? `R$ ${(abastecimento.valor_reais / abastecimento.quantidade_litros).toFixed(3)}`
                    : "-"}
                </TableCell>
                <TableCell>{abastecimento.km_percorridos || "-"}</TableCell>
                <TableCell>
                  {abastecimento.media_km_l ? `${abastecimento.media_km_l.toFixed(2)} km/L` : "-"}
                </TableCell>
                
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(abastecimento)}
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
                              permanentemente o registro de
                              <strong className="px-1">{abastecimento.veiculo}</strong>
                              do dia
                              <strong className="px-1">
                                {new Date(abastecimento.data).toLocaleDateString("pt-BR")}
                              </strong>
                              .
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deletarAbastecimento(abastecimento.id)}
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
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Controle de Abastecimento</h1>
          <ResponsiveDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            title={editingId ? "Editar Registro" : "Novo Registro de Abastecimento"}
            description="Preencha os dados do abastecimento abaixo."
            className="max-w-2xl"
            trigger={
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Registro
              </Button>
            }
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="data"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data do Abastecimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="odometro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Odômetro (Km)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ex: 150000"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o veículo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {veiculosList.map((v) => (
                              <SelectItem key={v.placa} value={v.placa}>
                                {v.nome} - {v.placa}
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
                    name="matricula" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motorista</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value); 
                            handleMotoristaChange(value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o motorista" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {motoristas.map((m) => (
                              <SelectItem key={m.matricula} value={m.matricula}>
                                {m.nome} - {m.matricula}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="veiculo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Veículo (auto)</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cartao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cartão (auto)</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} readOnly disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="motorista"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Motorista (auto)</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantidade_litros"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade (Litros)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={handleLitrosChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormItem>
                      <FormLabel>Valor Unitário (R$/L)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="0.000"
                          value={valorUnitario > 0 ? valorUnitario.toFixed(3) : ""}
                          onChange={handleValorUnitarioChange}
                        />
                      </FormControl>
                      <FormDescriptionValid>
                        Mude aqui para calcular o valor total.
                      </FormDescriptionValid>
                    </FormItem>
                  <FormField
                    control={form.control}
                    name="valor_reais"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Total (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* --- SELETOR DE POSTO --- */}
                <FormField
                  control={form.control}
                  name="posto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posto de Abastecimento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o posto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Posto Rota 28">Posto Rota 28</SelectItem>
                          <SelectItem value="Posto Universo">Posto Universo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving
                    ? "Salvando..."
                    : (editingId ? "Atualizar Registro" : "Salvar Registro")}
                </Button>
              </form>
            </Form>
          </ResponsiveDialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <Label>Mês</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(0, i).toLocaleString("pt-BR", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Label>Ano</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                    (year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Label>Semana</Label>
              <Select
                value={selectedWeek.toString()}
                onValueChange={(v) =>
                  setSelectedWeek(v === "all" ? "all" : parseInt(v))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Semanas</SelectItem>
                  {weeklyTotals.map((week) => (
                    <SelectItem key={week.semana} value={week.semana.toString()}>
                      Semana {week.semana}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {weeklyTotals
            .filter(
              (week) => selectedWeek === "all" || week.semana === selectedWeek
            )
            .map((week) => (
              <Card key={week.semana}>
                <CardHeader>
                  <CardTitle className="text-lg">Semana {week.semana}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    R$ {week.reais.toFixed(2)}
                  </p>
                  <p className="text-muted-foreground">
                    {week.litros.toFixed(2)} Litros
                  </p>
                </CardContent>
              </Card>
            ))}
          <Card className="md:col-span-3 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Total do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                R$ {monthTotal.reais.toFixed(2)}
              </p>
              <p className="text-lg text-muted-foreground">
                {monthTotal.litros.toFixed(2)} Litros
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="p-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por veículo, placa, motorista..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">{renderContent()}</CardContent>
        </Card>
      </div>
    </Layout>
  );
}
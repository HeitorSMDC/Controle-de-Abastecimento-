import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
}

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export default function ControleAbastecimento() {
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split("T")[0],
    veiculo: "",
    placa: "",
    cartao: "",
    motorista: "",
    matricula: "",
    quantidade_litros: "",
    valor_reais: "",
  });
  const { userRole } = useAuth();

  useEffect(() => {
    fetchAbastecimentos();
  }, [selectedMonth, selectedYear]);

  const fetchAbastecimentos = async () => {
    try {
      const { data, error } = await supabase
        .from("controle_abastecimento")
        .select("*")
        .eq("mes", selectedMonth)
        .eq("ano", selectedYear)
        .order("data", { ascending: false });

      if (error) throw error;
      setAbastecimentos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar abastecimentos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const date = new Date(formData.data);
      const semana = getWeekNumber(date);
      const mes = date.getMonth() + 1;
      const ano = date.getFullYear();

      const dataToSave = {
        ...formData,
        quantidade_litros: parseFloat(formData.quantidade_litros),
        valor_reais: parseFloat(formData.valor_reais),
        semana,
        mes,
        ano,
      };

      if (editingId) {
        const { error } = await supabase
          .from("controle_abastecimento")
          .update(dataToSave)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Abastecimento atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("controle_abastecimento")
          .insert([dataToSave]);
        if (error) throw error;
        toast.success("Abastecimento registrado com sucesso!");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchAbastecimentos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar abastecimento");
    }
  };

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split("T")[0],
      veiculo: "",
      placa: "",
      cartao: "",
      motorista: "",
      matricula: "",
      quantidade_litros: "",
      valor_reais: "",
    });
    setEditingId(null);
  };

  const handleEdit = (abastecimento: Abastecimento) => {
    setFormData({
      data: abastecimento.data,
      veiculo: abastecimento.veiculo,
      placa: abastecimento.placa,
      cartao: abastecimento.cartao || "",
      motorista: abastecimento.motorista,
      matricula: abastecimento.matricula,
      quantidade_litros: abastecimento.quantidade_litros.toString(),
      valor_reais: abastecimento.valor_reais.toString(),
    });
    setEditingId(abastecimento.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    
    try {
      const { error } = await supabase
        .from("controle_abastecimento")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Registro excluído com sucesso!");
      fetchAbastecimentos();
    } catch (error: any) {
      toast.error("Erro ao excluir registro");
    }
  };

  const canDelete = userRole === "admin" || userRole === "coordenador";

  const filteredAbastecimentos = useMemo(() => {
    if (selectedWeek === "all") return abastecimentos;
    return abastecimentos.filter(a => a.semana === selectedWeek);
  }, [abastecimentos, selectedWeek]);

  const weeklyTotals = useMemo(() => {
    const weeks = new Set(abastecimentos.map(a => a.semana));
    return Array.from(weeks).map(week => {
      const weekData = abastecimentos.filter(a => a.semana === week);
      const totalLitros = weekData.reduce((sum, a) => sum + a.quantidade_litros, 0);
      const totalValor = weekData.reduce((sum, a) => sum + a.valor_reais, 0);
      return { week, totalLitros, totalValor, count: weekData.length };
    }).sort((a, b) => a.week - b.week);
  }, [abastecimentos]);

  const monthTotal = useMemo(() => {
    return {
      litros: abastecimentos.reduce((sum, a) => sum + a.quantidade_litros, 0),
      valor: abastecimentos.reduce((sum, a) => sum + a.valor_reais, 0),
    };
  }, [abastecimentos]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Controle de Abastecimento</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar" : "Novo"} Registro de Abastecimento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="veiculo">Veículo</Label>
                    <Input
                      id="veiculo"
                      value={formData.veiculo}
                      onChange={(e) => setFormData({ ...formData, veiculo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placa">Placa</Label>
                    <Input
                      id="placa"
                      value={formData.placa}
                      onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cartao">Cartão</Label>
                    <Input
                      id="cartao"
                      value={formData.cartao}
                      onChange={(e) => setFormData({ ...formData, cartao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motorista">Motorista</Label>
                    <Input
                      id="motorista"
                      value={formData.motorista}
                      onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade_litros">Quantidade (L)</Label>
                    <Input
                      id="quantidade_litros"
                      type="number"
                      step="0.01"
                      value={formData.quantidade_litros}
                      onChange={(e) => setFormData({ ...formData, quantidade_litros: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_reais">Valor (R$)</Label>
                    <Input
                      id="valor_reais"
                      type="number"
                      step="0.01"
                      value={formData.valor_reais}
                      onChange={(e) => setFormData({ ...formData, valor_reais: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtrar por Mês</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {new Date(2000, month - 1).toLocaleDateString("pt-BR", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filtrar por Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filtrar por Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedWeek.toString()} onValueChange={(v) => setSelectedWeek(v === "all" ? "all" : parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Semanas</SelectItem>
                  {weeklyTotals.map(({ week }) => (
                    <SelectItem key={week} value={week.toString()}>
                      Semana {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo por Semana</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyTotals.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum dado disponível</p>
              ) : (
                <div className="space-y-2">
                  {weeklyTotals.map(({ week, totalLitros, totalValor, count }) => (
                    <div key={week} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold">Semana {week}</p>
                        <p className="text-sm text-muted-foreground">{count} registros</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{totalLitros.toFixed(2)} L</p>
                        <p className="text-sm text-primary">R$ {totalValor.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total de Litros</p>
                  <p className="text-3xl font-bold text-primary">{monthTotal.litros.toFixed(2)} L</p>
                </div>
                <div className="p-4 bg-secondary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Gasto</p>
                  <p className="text-3xl font-bold text-secondary">R$ {monthTotal.valor.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">Carregando...</div>
            ) : filteredAbastecimentos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum registro encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Semana</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Cartão</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Qtd (L)</TableHead>
                      <TableHead>Valor (R$)</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAbastecimentos.map((abastecimento) => (
                      <TableRow key={abastecimento.id}>
                        <TableCell>{new Date(abastecimento.data).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>Sem. {abastecimento.semana}</TableCell>
                        <TableCell className="font-medium">{abastecimento.veiculo}</TableCell>
                        <TableCell>{abastecimento.placa}</TableCell>
                        <TableCell>{abastecimento.cartao || "-"}</TableCell>
                        <TableCell>{abastecimento.motorista}</TableCell>
                        <TableCell>{abastecimento.matricula}</TableCell>
                        <TableCell>{abastecimento.quantidade_litros.toFixed(2)}</TableCell>
                        <TableCell>R$ {abastecimento.valor_reais.toFixed(2)}</TableCell>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(abastecimento.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

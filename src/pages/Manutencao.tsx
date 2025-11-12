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

  const [formData, setFormData] = useState({
    placa: "",
    tipo_veiculo: "",
    veiculo_nome: "",
    descricao_problema: "",
    pecas_necessarias: "",
    links_pecas: "",
    status: "pendente" as StatusManutencao,
    data_registro: new Date().toISOString().split("T")[0],
    data_conclusao: "",
    custo_estimado: "",
    custo_real: "",
    observacoes: "",
  });

  const canDelete = userRole === "admin" || userRole === "coordenador";

  useEffect(() => {
    fetchManutencoes();
    fetchVeiculos();
  }, []);

  const fetchManutencoes = async () => {
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
    const [viaturasRes, maquinariosRes] = await Promise.all([
      supabase.from("viaturas").select("placa, nome"),
      supabase.from("maquinario").select("placa, nome"),
    ]);

    if (viaturasRes.data) setViaturas(viaturasRes.data);
    if (maquinariosRes.data) setMaquinarios(maquinariosRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      placa: formData.placa,
      tipo_veiculo: formData.tipo_veiculo,
      veiculo_nome: formData.veiculo_nome,
      descricao_problema: formData.descricao_problema,
      pecas_necessarias: formData.pecas_necessarias
        ? formData.pecas_necessarias.split(",").map((p) => p.trim())
        : null,
      links_pecas: formData.links_pecas
        ? formData.links_pecas.split(",").map((l) => l.trim())
        : null,
      status: formData.status,
      data_registro: formData.data_registro,
      data_conclusao: formData.data_conclusao || null,
      custo_estimado: formData.custo_estimado ? parseFloat(formData.custo_estimado) : null,
      custo_real: formData.custo_real ? parseFloat(formData.custo_real) : null,
      observacoes: formData.observacoes || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("manutencoes")
        .update(dataToSubmit)
        .eq("id", editingId);

      if (error) {
        toast.error("Erro ao atualizar manutenção");
        return;
      }
      toast.success("Manutenção atualizada!");
    } else {
      const { error } = await supabase.from("manutencoes").insert(dataToSubmit);

      if (error) {
        toast.error("Erro ao registrar manutenção");
        return;
      }
      toast.success("Manutenção registrada!");
    }

    resetForm();
    setDialogOpen(false);
    fetchManutencoes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta manutenção?")) return;

    const { error } = await supabase.from("manutencoes").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir manutenção");
      return;
    }

    toast.success("Manutenção excluída!");
    fetchManutencoes();
  };

  const handleEdit = (manutencao: Manutencao) => {
    setEditingId(manutencao.id);
    setFormData({
      placa: manutencao.placa,
      tipo_veiculo: manutencao.tipo_veiculo,
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

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      placa: "",
      tipo_veiculo: "",
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

  const handleVeiculoChange = (placa: string) => {
    const veiculo =
      formData.tipo_veiculo === "viatura"
        ? viaturas.find((v) => v.placa === placa)
        : maquinarios.find((m) => m.placa === placa);

    if (veiculo) {
      setFormData({
        ...formData,
        placa: veiculo.placa,
        veiculo_nome: veiculo.nome,
      });
    }
  };

  const getStatusBadge = (status: StatusManutencao) => {
    const variants: Record<StatusManutencao, string> = {
      pendente: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      em_andamento: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      concluida: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelada: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return variants[status];
  };

  const getStatusLabel = (status: StatusManutencao) => {
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_veiculo">Tipo de Veículo</Label>
                    <Select
                      value={formData.tipo_veiculo}
                      onValueChange={(value) =>
                        setFormData({ ...formData, tipo_veiculo: value, placa: "", veiculo_nome: "" })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viatura">Viatura</SelectItem>
                        <SelectItem value="maquinario">Maquinário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placa">Veículo</Label>
                    <Select
                      value={formData.placa}
                      onValueChange={handleVeiculoChange}
                      disabled={!formData.tipo_veiculo}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.tipo_veiculo === "viatura"
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
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao_problema">Descrição do Problema</Label>
                  <Textarea
                    id="descricao_problema"
                    value={formData.descricao_problema}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao_problema: e.target.value })
                    }
                    placeholder="Descreva o problema..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pecas_necessarias">
                    Peças Necessárias (separadas por vírgula)
                  </Label>
                  <Input
                    id="pecas_necessarias"
                    value={formData.pecas_necessarias}
                    onChange={(e) =>
                      setFormData({ ...formData, pecas_necessarias: e.target.value })
                    }
                    placeholder="Filtro de óleo, Pastilha de freio..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="links_pecas">
                    Links das Peças (URLs separadas por vírgula)
                  </Label>
                  <Textarea
                    id="links_pecas"
                    value={formData.links_pecas}
                    onChange={(e) =>
                      setFormData({ ...formData, links_pecas: e.target.value })
                    }
                    placeholder="https://exemplo.com/peca1, https://exemplo.com/peca2..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: StatusManutencao) =>
                        setFormData({ ...formData, status: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_registro">Data de Registro</Label>
                    <Input
                      id="data_registro"
                      type="date"
                      value={formData.data_registro}
                      onChange={(e) =>
                        setFormData({ ...formData, data_registro: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_conclusao">Data de Conclusão</Label>
                  <Input
                    id="data_conclusao"
                    type="date"
                    value={formData.data_conclusao}
                    onChange={(e) =>
                      setFormData({ ...formData, data_conclusao: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custo_estimado">Custo Estimado (R$)</Label>
                    <Input
                      id="custo_estimado"
                      type="number"
                      step="0.01"
                      value={formData.custo_estimado}
                      onChange={(e) =>
                        setFormData({ ...formData, custo_estimado: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custo_real">Custo Real (R$)</Label>
                    <Input
                      id="custo_real"
                      type="number"
                      step="0.01"
                      value={formData.custo_real}
                      onChange={(e) =>
                        setFormData({ ...formData, custo_real: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    placeholder="Observações adicionais..."
                  />
                </div>

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
                  <Button type="submit">
                    {editingId ? "Atualizar" : "Registrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Manutenção</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold mb-2">Veículo</h3>
                                <p>
                                  {manutencao.veiculo_nome} - {manutencao.placa}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Tipo: {manutencao.tipo_veiculo}
                                </p>
                              </div>
                              <div>
                                <h3 className="font-semibold mb-2">Descrição do Problema</h3>
                                <p>{manutencao.descricao_problema}</p>
                              </div>
                              {manutencao.pecas_necessarias && (
                                <div>
                                  <h3 className="font-semibold mb-2">Peças Necessárias</h3>
                                  <ul className="list-disc list-inside">
                                    {manutencao.pecas_necessarias.map((peca, idx) => (
                                      <li key={idx}>{peca}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {manutencao.links_pecas && (
                                <div>
                                  <h3 className="font-semibold mb-2">Links das Peças</h3>
                                  <div className="space-y-1">
                                    {manutencao.links_pecas.map((link, idx) => (
                                      <a
                                        key={idx}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-primary hover:underline"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        Link {idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-semibold mb-2">Status</h3>
                                  <Badge className={getStatusBadge(manutencao.status)}>
                                    {getStatusLabel(manutencao.status)}
                                  </Badge>
                                </div>
                                <div>
                                  <h3 className="font-semibold mb-2">Datas</h3>
                                  <p className="text-sm">
                                    Registro:{" "}
                                    {new Date(manutencao.data_registro).toLocaleDateString(
                                      "pt-BR"
                                    )}
                                  </p>
                                  {manutencao.data_conclusao && (
                                    <p className="text-sm">
                                      Conclusão:{" "}
                                      {new Date(manutencao.data_conclusao).toLocaleDateString(
                                        "pt-BR"
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-semibold mb-2">Custo Estimado</h3>
                                  <p>
                                    {manutencao.custo_estimado
                                      ? `R$ ${manutencao.custo_estimado.toFixed(2)}`
                                      : "Não informado"}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="font-semibold mb-2">Custo Real</h3>
                                  <p>
                                    {manutencao.custo_real
                                      ? `R$ ${manutencao.custo_real.toFixed(2)}`
                                      : "Não informado"}
                                  </p>
                                </div>
                              </div>
                              {manutencao.observacoes && (
                                <div>
                                  <h3 className="font-semibold mb-2">Observações</h3>
                                  <p>{manutencao.observacoes}</p>
                                </div>
                              )}
                            </div>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(manutencao.id)}
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

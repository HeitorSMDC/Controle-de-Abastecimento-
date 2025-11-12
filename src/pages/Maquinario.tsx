import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Maquina {
  id: string;
  nome: string;
  ano: number;
  placa: string;
  cartao: string | null;
  status: "operante" | "inoperante" | "em_manutencao" | "em_reparo" | "reserva";
  anotacoes: string | null;
}

const statusOptions = [
  { value: "operante", label: "Operante" },
  { value: "inoperante", label: "Inoperante" },
  { value: "em_manutencao", label: "Em Manutenção" },
  { value: "em_reparo", label: "Em Reparo" },
  { value: "reserva", label: "Reserva" },
];

const statusColors: Record<string, string> = {
  operante: "bg-green-500",
  inoperante: "bg-red-500",
  em_manutencao: "bg-yellow-500",
  em_reparo: "bg-orange-500",
  reserva: "bg-blue-500",
};

export default function Maquinario() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    nome: string;
    ano: number;
    placa: string;
    cartao: string;
    status: "operante" | "inoperante" | "em_manutencao" | "em_reparo" | "reserva";
    anotacoes: string;
  }>({
    nome: "",
    ano: new Date().getFullYear(),
    placa: "",
    cartao: "",
    status: "operante",
    anotacoes: "",
  });
  const { userRole } = useAuth();

  useEffect(() => {
    fetchMaquinas();
  }, []);

  const fetchMaquinas = async () => {
    try {
      const { data, error } = await supabase
        .from("maquinario")
        .select("*")
        .order("nome");

      if (error) throw error;
      setMaquinas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar maquinário");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from("maquinario")
          .update(formData)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Maquinário atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("maquinario")
          .insert([formData]);
        if (error) throw error;
        toast.success("Maquinário adicionado com sucesso!");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchMaquinas();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar maquinário");
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      ano: new Date().getFullYear(),
      placa: "",
      cartao: "",
      status: "operante",
      anotacoes: "",
    });
    setEditingId(null);
  };

  const handleEdit = (maquina: Maquina) => {
    setFormData({
      nome: maquina.nome,
      ano: maquina.ano,
      placa: maquina.placa,
      cartao: maquina.cartao || "",
      status: maquina.status,
      anotacoes: maquina.anotacoes || "",
    });
    setEditingId(maquina.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este maquinário?")) return;
    
    try {
      const { error } = await supabase
        .from("maquinario")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Maquinário excluído com sucesso!");
      fetchMaquinas();
    } catch (error: any) {
      toast.error("Erro ao excluir maquinário");
    }
  };

  const canDelete = userRole === "admin" || userRole === "coordenador";

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Maquinário</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Maquinário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar" : "Novo"} Maquinário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Maquinário</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ano">Ano</Label>
                    <Input
                      id="ano"
                      type="number"
                      value={formData.ano}
                      onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
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
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as "operante" | "inoperante" | "em_manutencao" | "em_reparo" | "reserva" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="anotacoes">Anotações</Label>
                    <Textarea
                      id="anotacoes"
                      value={formData.anotacoes}
                      onChange={(e) => setFormData({ ...formData, anotacoes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">Carregando...</div>
            ) : maquinas.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum maquinário cadastrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Cartão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Anotações</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maquinas.map((maquina) => (
                    <TableRow key={maquina.id}>
                      <TableCell className="font-medium">{maquina.nome}</TableCell>
                      <TableCell>{maquina.ano}</TableCell>
                      <TableCell>{maquina.placa}</TableCell>
                      <TableCell>{maquina.cartao || "-"}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[maquina.status]}>
                          {statusOptions.find(s => s.value === maquina.status)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{maquina.anotacoes || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(maquina)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(maquina.id)}
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
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

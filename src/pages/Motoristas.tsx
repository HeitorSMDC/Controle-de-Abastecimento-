import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { PasswordField } from "@/components/PasswordField";
import { EmptyState } from "@/components/EmptyState";
import { motoristaSchema } from "@/lib/validations";

interface Motorista {
  id: string;
  nome: string;
  matricula: string;
  senha: string;
}

export default function Motoristas() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: "", matricula: "", senha: "" });
  const { userRole } = useAuth();

  useEffect(() => {
    fetchMotoristas();
  }, []);

  const fetchMotoristas = async () => {
    try {
      const { data, error } = await supabase
        .from("motoristas")
        .select("*")
        .order("nome");

      if (error) throw error;
      setMotoristas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar motoristas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validar com Zod
      const validated = motoristaSchema.parse(formData);
      
      if (editingId) {
        const { error } = await supabase
          .from("motoristas")
          .update({
            nome: validated.nome,
            matricula: validated.matricula,
            senha: validated.senha
          })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Motorista atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("motoristas")
          .insert([{
            nome: validated.nome,
            matricula: validated.matricula,
            senha: validated.senha
          }]);
        if (error) throw error;
        toast.success("Motorista adicionado com sucesso!");
      }
      setIsDialogOpen(false);
      setFormData({ nome: "", matricula: "", senha: "" });
      setEditingId(null);
      fetchMotoristas();
    } catch (error: any) {
      if (error.errors) {
        // Erro de validação do Zod
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Erro ao salvar motorista");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (motorista: Motorista) => {
    setFormData({
      nome: motorista.nome,
      matricula: motorista.matricula,
      senha: motorista.senha,
    });
    setEditingId(motorista.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este motorista?")) return;
    
    try {
      const { error } = await supabase
        .from("motoristas")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Motorista excluído com sucesso!");
      fetchMotoristas();
    } catch (error: any) {
      toast.error("Erro ao excluir motorista");
    }
  };

  const canEdit = userRole === "admin" || userRole === "coordenador";

  if (!canEdit) {
    return (
      <Layout>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Motoristas</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setFormData({ nome: "", matricula: "", senha: "" }); setEditingId(null); }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Motorista
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar" : "Novo"} Motorista</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
                  <Label htmlFor="senha">Senha (Anotação)</Label>
                  <PasswordField
                    id="senha"
                    value={formData.senha}
                    onChange={(value) => setFormData({ ...formData, senha: value })}
                    required
                    placeholder="Digite a senha para anotação"
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta senha é apenas para referência/anotação
                  </p>
                </div>
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : motoristas.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhum motorista cadastrado"
                description="Comece adicionando o primeiro motorista ao sistema"
                actionLabel="Novo Motorista"
                onAction={() => {
                  setFormData({ nome: "", matricula: "", senha: "" });
                  setEditingId(null);
                  setIsDialogOpen(true);
                }}
              />
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(motorista.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

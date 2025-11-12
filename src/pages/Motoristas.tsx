// src/pages/Motoristas.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Label é usado pelo FormLabel
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { PasswordField } from "@/components/PasswordField";
import { EmptyState } from "@/components/EmptyState";

// NOVO: Importações para formulário e validação
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

// NOVO: Importações para o AlertDialog
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

interface Motorista {
  id: string;
  nome: string;
  matricula: string;
  senha: string;
}

export default function Motoristas() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true); // Loading da tabela
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // O 'loading' do formulário foi removido, o react-hook-form gere isso
  // O 'formData' foi removido e substituído pelo react-hook-form
  const { userRole } = useAuth();

  // NOVO: Configuração do React Hook Form com Zod
  const form = useForm<MotoristaFormData>({
    resolver: zodResolver(motoristaSchema),
    defaultValues: {
      nome: "",
      matricula: "",
      senha: "",
    },
  });

  useEffect(() => {
    fetchMotoristas();
  }, []);

  const fetchMotoristas = async () => {
    try {
      setLoading(true); // Define o loading da tabela
      const { data, error } = await supabase
        .from("motoristas")
        .select("*")
        .order("nome");

      if (error) throw error;
      setMotoristas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar motoristas");
    } finally {
      setLoading(false); // Remove o loading da tabela
    }
  };

  // NOVO: A função de submit agora recebe os dados validados pelo Zod
  const onSubmit = async (data: MotoristaFormData) => {
    // Não precisamos mais do try/catch para validação, o Zod já o fez.
    try {
      if (editingId) {
        const { error } = await supabase
          .from("motoristas")
          .update(data) // Usa os dados validados
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Motorista atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("motoristas")
          .insert([data]); // Usa os dados validados
        if (error) throw error;
        toast.success("Motorista adicionado com sucesso!");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchMotoristas();
    } catch (error: any) {
      // O 'catch' agora foca-se apenas em erros do Supabase
      toast.error(error.message || "Erro ao salvar motorista");
    }
  };

  // NOVO: resetForm agora usa o form.reset()
  const resetForm = () => {
    form.reset();
    setEditingId(null);
  };
  
  // NOVO: handleEdit agora usa o form.reset() para preencher os campos
  const handleEdit = (motorista: Motorista) => {
    form.reset({
      nome: motorista.nome,
      matricula: motorista.matricula,
      senha: motorista.senha,
    });
    setEditingId(motorista.id);
    setIsDialogOpen(true);
  };

  // NOVO: handleDelete não tem mais o window.confirm
  const handleDelete = async (id: string) => {
    // if (!confirm(...)) return; // LINHA REMOVIDA
    
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
    // ... (código de Acesso Negado) ...
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Motoristas</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Motorista
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar" : "Novo"} Motorista</DialogTitle>
              </DialogHeader>

              {/* NOVO: Envolve o formulário com o FormProvider */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  
                  {/* NOVO: Campo Nome com FormField */}
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
                  
                  {/* NOVO: Campo Matrícula com FormField */}
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
                  
                  {/* NOVO: Campo Senha com FormField */}
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
                            {...field} // Passa value, onChange, etc.
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Esta senha é apenas para referência/anotação
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              // ... (código do loading skeleton) ...
              <div className="p-8 text-center">...</div>
            ) : motoristas.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhum motorista cadastrado"
                description="Comece adicionando o primeiro motorista ao sistema"
                actionLabel="Novo Motorista"
                onAction={resetForm}
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
                        {/* Este PasswordField é só para exibição, não precisa de form */}
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
                          
                          {/* NOVO: AlertDialog para confirmação de exclusão */}
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
                                <AlertDialogAction onClick={() => handleDelete(motorista.id)}>
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
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
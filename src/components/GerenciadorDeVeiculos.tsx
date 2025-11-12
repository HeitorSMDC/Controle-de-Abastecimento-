// src/components/GerenciadorDeVeiculos.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

// ... (interface Veiculo, GerenciadorDeVeiculosProps, statusOptions, statusColors) ...
interface Veiculo {
  id: string;
  nome: string;
  ano: number;
  placa: string;
  cartao: string | null;
  status: "operante" | "inoperante" | "em_manutencao" | "em_reparo" | "reserva";
  anotacoes: string | null;
}

interface GerenciadorDeVeiculosProps {
  supabaseTable: "viaturas" | "maquinario";
  title: string;
  itemNome: string;
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

export function GerenciadorDeVeiculos({
  supabaseTable,
  title,
  itemNome,
}: GerenciadorDeVeiculosProps) {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { userRole } = useAuth();

  const form = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      nome: "",
      ano: new Date().getFullYear(),
      placa: "",
      cartao: "",
      status: "operante",
      anotacoes: "",
    },
  });

  useEffect(() => {
    fetchVeiculos();
  }, [supabaseTable]);

  const fetchVeiculos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(supabaseTable)
        .select("*")
        .order("nome");

      if (error) throw error;
      setVeiculos(data || []);
    } catch (error: any) {
      toast.error(`Erro ao carregar ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: VeiculoFormData) => {
    try {
      if (editingId) {
        const { error } = await supabase
          .from(supabaseTable)
          .update(data)
          .eq("id", editingId);
        if (error) throw error;
        toast.success(`${itemNome} atualizado com sucesso!`);
      } else {
        const { error } = await supabase
          .from(supabaseTable)
          .insert([data]);
        if (error) throw error;
        toast.success(`${itemNome} adicionado com sucesso!`);
      }
      setIsDialogOpen(false);
      resetForm();
      fetchVeiculos();
    } catch (error: any) {
      toast.error(error.message || `Erro ao salvar ${itemNome.toLowerCase()}`);
    }
  };

  const resetForm = () => {
    form.reset();
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
    });
    setEditingId(veiculo.id);
    setIsDialogOpen(true);
  };

  // NOVO: A lógica de confirmação 'confirm()' foi removida daqui.
  const handleDelete = async (id: string) => {
    // if (!confirm(...)) return; // LINHA REMOVIDA

    try {
      const { error } = await supabase
        .from(supabaseTable)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success(`${itemNome} excluído com sucesso!`);
      fetchVeiculos(); // Recarrega a lista após apagar
    } catch (error: any) {
      toast.error(`Erro ao excluir ${itemNome.toLowerCase()}`);
    }
  };

  const canDelete = userRole === "admin" || userRole === "coordenador";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{title}</h1>
        {/* ... (O Dialog de Novo/Editar continua igual) ... */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo {itemNome}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Novo"} {itemNome}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    name="cartao"
                    render={({ field }) => (
                      <FormItem>
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
                            {statusOptions.map((option) => (
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
            <div className="p-8 text-center">Carregando...</div>
          ) : veiculos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum {itemNome.toLowerCase()} cadastrado
            </div>
          ) : (
            <Table>
              {/* ... (TableHeader continua igual) ... */}
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
                {veiculos.map((veiculo) => (
                  <TableRow key={veiculo.id}>
                    {/* ... (TableCells de dados continuam iguais) ... */}
                    <TableCell className="font-medium">{veiculo.nome}</TableCell>
                    <TableCell>{veiculo.ano}</TableCell>
                    <TableCell>{veiculo.placa}</TableCell>
                    <TableCell>{veiculo.cartao || "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[veiculo.status]}>
                        {statusOptions.find((s) => s.value === veiculo.status)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{veiculo.anotacoes || "-"}</TableCell>
                    
                    {/* NOVO: A célula de ações agora contém o AlertDialog */}
                    <TableCell>
                      <div className="flex gap-2">
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
                                  onClick={() => handleDelete(veiculo.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
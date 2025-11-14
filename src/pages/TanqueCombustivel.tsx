// src/pages/TanqueCombustivel.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Droplet } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { ListSkeleton } from "@/components/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { TanqueCard, Tanque } from "@/components/cards/TanqueCard"; // Importamos o Card e o Tipo
import { combustivelOptions } from "@/lib/constants"; // Reutilizamos as opções

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tanqueSchema, TanqueFormData, tanqueMovimentacaoSchema, TanqueMovimentacaoFormData } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

// Tipos locais para os formulários
type MovimentacaoType = "entrada" | "saida";

// Função para buscar os tanques
const fetchTanques = async () => {
  const { data, error } = await supabase
    .from("tanques")
    .select("*")
    .order("nome");
  if (error) throw error;
  return data || [];
};

export default function TanqueCombustivel() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  // Estados dos Dialogs (Modais)
  const [isTanqueDialogOpen, setIsTanqueDialogOpen] = useState(false);
  const [isMovimentacaoDialogOpen, setIsMovimentacaoDialogOpen] = useState(false);
  
  // Estados para edição
  const [editingTanque, setEditingTanque] = useState<Tanque | null>(null);
  
  // Estados para nova movimentação
  const [movimentacaoInfo, setMovimentacaoInfo] = useState<{ tanque: Tanque; tipo: MovimentacaoType } | null>(null);

  // Busca de dados
  const { data: tanques = [], isLoading } = useQuery<Tanque[]>({
    queryKey: ["tanques"],
    queryFn: fetchTanques,
  });

  // Formulário para Criar/Editar Tanque
  const tanqueForm = useForm<TanqueFormData>({
    resolver: zodResolver(tanqueSchema),
    defaultValues: {
      nome: "",
      capacidade_litros: 1000,
      litros_atuais: 0,
      tipo_combustivel: "Diesel",
    },
  });

  // Formulário para Movimentação (Entrada/Saída)
  const movimentacaoForm = useForm<TanqueMovimentacaoFormData>({
    resolver: zodResolver(tanqueMovimentacaoSchema),
    defaultValues: {
      tanque_id: "",
      tipo: "entrada",
      litros: 0,
      valor_reais: "",
      responsavel_id: user?.id || "",
      responsavel_nome: "", // Buscaremos o nome
      observacao: "",
    },
  });

  // Busca o nome do perfil do utilizador logado para o form
  useState(() => {
    if (user) {
      supabase.from("profiles").select("nome").eq("user_id", user.id).single()
        .then(({ data }) => {
          if (data?.nome) {
            movimentacaoForm.setValue("responsavel_nome", data.nome);
          }
        });
      movimentacaoForm.setValue("responsavel_id", user.id);
    }
  }, [user, movimentacaoForm]);


  // --- MUTAÇÕES ---

  // Salvar (Criar/Editar) Tanque
  const { mutate: salvarTanque, isPending: isSavingTanque } = useMutation({
    mutationFn: async (data: TanqueFormData) => {
      let response;
      if (editingTanque) {
        response = await supabase.from("tanques").update(data).eq("id", editingTanque.id);
      } else {
        response = await supabase.from("tanques").insert(data);
      }
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success(editingTanque ? "Tanque atualizado!" : "Tanque criado!");
      setIsTanqueDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tanques"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar tanque");
    },
  });

  // Salvar Movimentação (Entrada/Saída)
  const { mutate: salvarMovimentacao, isPending: isSavingMovimentacao } = useMutation({
    mutationFn: async (data: TanqueMovimentacaoFormData) => {
      const { tanque_id, tipo, litros, observacao, responsavel_id, responsavel_nome } = data;
      const valor_reais = data.valor_reais ? parseFloat(data.valor_reais) : null;
      
      const { error } = await supabase.from("tanque_movimentacoes").insert({
        tanque_id,
        tipo,
        litros,
        valor_reais,
        responsavel_id,
        responsavel_nome,
        observacao,
        data: new Date().toISOString()
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Movimentação registrada com sucesso!`);
      setIsMovimentacaoDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tanques"] }); // Invalida os tanques (para atualizar litros_atuais)
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registar movimentação");
    },
  });


  // --- Handlers (Funções de clique) ---

  const handleOpenNovoTanque = () => {
    setEditingTanque(null);
    tanqueForm.reset({
      nome: "",
      capacidade_litros: 1000,
      litros_atuais: 0,
      tipo_combustivel: "Diesel",
    });
    setIsTanqueDialogOpen(true);
  };

  const handleOpenEditarTanque = (tanque: Tanque) => {
    setEditingTanque(tanque);
    tanqueForm.reset({
      nome: tanque.nome,
      capacidade_litros: tanque.capacidade_litros,
      litros_atuais: tanque.litros_atuais,
      tipo_combustivel: tanque.tipo_combustivel,
    });
    setIsTanqueDialogOpen(true);
  };

  const handleOpenMovimentacao = (tanque: Tanque, tipo: MovimentacaoType) => {
    setMovimentacaoInfo({ tanque, tipo });
    movimentacaoForm.reset({
      tanque_id: tanque.id,
      tipo: tipo,
      litros: 0,
      valor_reais: "",
      responsavel_id: user?.id || "",
      responsavel_nome: movimentacaoForm.getValues("responsavel_nome"), // Mantém o nome já buscado
      observacao: "",
    });
    setIsMovimentacaoDialogOpen(true);
  };
  
  const onSubmitTanque = (data: TanqueFormData) => {
    salvarTanque(data);
  };

  const onSubmitMovimentacao = (data: TanqueMovimentacaoFormData) => {
    salvarMovimentacao(data);
  };


  // --- Renderização ---

  const renderContent = () => {
    if (isLoading) {
      return <ListSkeleton />;
    }
    if (tanques.length === 0) {
      return (
        <EmptyState
          icon={Droplet}
          title="Nenhum tanque registado"
          description="Comece por registar o primeiro tanque de combustível."
          actionLabel="Registar Novo Tanque"
          onAction={handleOpenNovoTanque}
        />
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tanques.map((tanque) => (
          <TanqueCard
            key={tanque.id}
            tanque={tanque}
            onEdit={() => handleOpenEditarTanque(tanque)}
            onAddFuel={() => handleOpenMovimentacao(tanque, "entrada")}
            onRemoveFuel={() => handleOpenMovimentacao(tanque, "saida")}
          />
        ))}
      </div>
    );
  };
  

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tanques de Combustível</h1>
          <Button onClick={handleOpenNovoTanque}>
            <Plus className="mr-2 h-4 w-4" />
            Registar Tanque
          </Button>
        </div>

        {renderContent()}
      </div>

      {/* Dialog para Criar/Editar Tanque */}
      <ResponsiveDialog
        open={isTanqueDialogOpen}
        onOpenChange={setIsTanqueDialogOpen}
        title={editingTanque ? "Editar Tanque" : "Registar Novo Tanque"}
        description="Preencha os dados do tanque de armazenamento."
      >
        <Form {...tanqueForm}>
          <form onSubmit={tanqueForm.handleSubmit(onSubmitTanque)} className="space-y-4 pt-4">
            <FormField
              control={tanqueForm.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Tanque</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Tanque Principal (Diesel)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={tanqueForm.control}
              name="tipo_combustivel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Combustível</FormLabel>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={tanqueForm.control}
                name="capacidade_litros"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade Total (Litros)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} 
                       onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={tanqueForm.control}
                name="litros_atuais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Litros Atuais (Inicial)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field}
                       onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                       disabled={!!editingTanque} // Só permite editar na criação
                      />
                    </FormControl>
                    {editingTanque && <FormDescription>O nível atual é atualizado por movimentações.</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSavingTanque}>
              {isSavingTanque ? "Aguarde..." : (editingTanque ? "Atualizar Tanque" : "Salvar Tanque")}
            </Button>
          </form>
        </Form>
      </ResponsiveDialog>

      {/* Dialog para Movimentação (Entrada/Saída) */}
      <ResponsiveDialog
        open={isMovimentacaoDialogOpen}
        onOpenChange={setIsMovimentacaoDialogOpen}
        title={movimentacaoInfo?.tipo === 'entrada' ? 'Registar Entrada de Combustível' : 'Registar Saída de Combustível'}
        description={`Tanque: ${movimentacaoInfo?.tanque.nome}`}
      >
        <Form {...movimentacaoForm}>
          <form onSubmit={movimentacaoForm.handleSubmit(onSubmitMovimentacao)} className="space-y-4 pt-4">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={movimentacaoForm.control}
                name="litros"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade (Litros)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} 
                       onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Mostra o valor apenas se for 'entrada' */}
              {movimentacaoInfo?.tipo === 'entrada' && (
                <FormField
                  control={movimentacaoForm.control}
                  name="valor_reais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total (R$) (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} 
                         value={field.value || ''}
                         onChange={e => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <FormField
              control={movimentacaoForm.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={movimentacaoInfo?.tipo === 'entrada' ? "Ex: Nota Fiscal 123, Posto X..." : "Ex: Abastecimento Viatura Ranger..."} 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={movimentacaoForm.control}
              name="responsavel_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSavingMovimentacao}>
              {isSavingMovimentacao ? "Aguarde..." : "Salvar Movimentação"}
            </Button>
          </form>
        </Form>
      </ResponsiveDialog>

    </Layout>
  );
}
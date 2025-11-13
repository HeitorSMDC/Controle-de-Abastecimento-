// src/pages/ControleAbastecimento.tsx

import { useState, useMemo } from "react";
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

// NOVO: Importar o ListSkeleton
import { ListSkeleton } from "@/components/ListSkeleton";

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
  // ... (função getWeekNumber - sem alterações) ...
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

  const form = useForm<AbastecimentoFormData>({
    // ... (useForm - sem alterações) ...
  });
  
  const { data, isLoading } = useQuery<Abastecimento[]>({
    queryKey: ["abastecimentos", selectedMonth, selectedYear],
    queryFn: () => fetchAbastecimentos(selectedMonth, selectedYear),
  });

  const abastecimentos: Abastecimento[] = data || [];


  const { mutate: salvarAbastecimento, isPending: isSaving } = useMutation({
    // ... (lógica da mutation - sem alterações) ...
  });

  const { mutate: deletarAbastecimento } = useMutation({
    // ... (lógica da mutation - sem alterações) ...
  });

  const onSubmit = (data: AbastecimentoFormData) => {
    salvarAbastecimento(data);
  };

  const resetForm = () => {
    // ... (resetForm - sem alterações) ...
  };

  const handleEdit = (abastecimento: Abastecimento) => {
    // ... (handleEdit - sem alterações) ...
  };

  const canDelete = userRole === "admin" || userRole === "coordenador";

  const filteredAbastecimentos = useMemo(() => {
    // ... (useMemo - sem alterações) ...
  }, [abastecimentos, selectedWeek, searchTerm]);

  const weeklyTotals = useMemo(() => {
    // ... (useMemo - sem alterações) ...
  }, [abastecimentos]);

  const monthTotal = useMemo(() => {
    // ... (useMemo - sem alterações) ...
  }, [abastecimentos]);


  const renderContent = () => {
    // NOVO: Substituído "Carregando..." pelo ListSkeleton
    if (isLoading) {
      return <ListSkeleton />;
    }
    
    if (abastecimentos.length === 0) {
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
                    {/* ... (AlertDialog Trigger & Content - sem alterações) ... */}
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
            {/* ... (TableHeader - sem alterações) ... */}
          </TableHeader>
          <TableBody>
            {filteredAbastecimentos.map((abastecimento) => (
              <TableRow key={abastecimento.id}>
                {/* ... (Table Cells - sem alterações) ... */}
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
                {/* ... (Formulário - sem alterações) ... */}
              </form>
            </Form>
          </ResponsiveDialog>
        </div>

        {/* ... (Cards de Filtro e Resumo - sem alterações) ... */}
        
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
          <CardContent className="p-0">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
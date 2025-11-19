// src/components/FichaRelatorioDialog.tsx

import * as React from "react";
import { ResponsiveDialog } from "./ResponsiveDialog";
import { Button } from "./ui/button";
import { Printer, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
// @ts-ignore
import { useReactToPrint } from "react-to-print"; 
import { toast } from "sonner";

import { RelatorioImpressao } from "./RelatorioImpressao"; 

// Tipos para facilitar
type VeiculoTipo = "viatura" | "maquinario";
type Veiculo = { placa: string; nome: string };

interface FichaRelatorioDialogProps {
  veiculo: Veiculo;
  tipoVeiculo: VeiculoTipo;
}

const currentYear = new Date().getFullYear();
const startYear = 2025;
const yearsList = Array.from(
  { length: currentYear - startYear + 1 },
  (_, i) => (currentYear - i)
);

// Mapeamento de números de mês para labels
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: new Date(0, i).toLocaleString("pt-BR", { month: "long" }),
}));

// Mapeamento de números de semana (até 53 semanas, como no ControleAbastecimento.tsx)
const weekOptions = Array.from({ length: 53 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `Semana ${i + 1}`,
}));


export function FichaRelatorioDialog({ veiculo }: FichaRelatorioDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  // --- Estados dos Filtros ---
  const [selectedYear, setSelectedYear] = React.useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = React.useState<string | "all">("all");
  const [selectedWeek, setSelectedWeek] = React.useState<string | "all">("all");
  
  // Referência para o conteúdo que será impresso
  const componentRef = React.useRef<HTMLDivElement>(null);

  // Hook para impressão
  const handlePrint = useReactToPrint({
    content: () => componentRef.current, 
    documentTitle: `Relatório_${veiculo.placa}_${selectedYear}_${selectedMonth}_${selectedWeek}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 1cm;
      }
      body {
        -webkit-print-color-adjust: exact; 
      }
      .no-print {
        display: none !important;
      }
    `,
  });

  // --- FUNÇÃO CORRIGIDA E ROBUSTA PARA IMPRESSÃO ---
  const handlePrintClick = () => {
      // 1. Verificação básica
      if (!veiculo.placa) {
          toast.error("Selecione um veículo válido.");
          return;
      }

      // 2. Usa setTimeout para garantir que o DOM esteja estável antes de chamar a impressão
      setTimeout(() => {
          // Verifica se o componente de impressão está montado
          if (!componentRef.current) {
              toast.error("O conteúdo do relatório ainda não está pronto. Tente novamente.");
              return;
          }

          // Verifica se o componente de relatório (que é referenciado) retornou um erro
          const isErrorState = componentRef.current.querySelector('.text-destructive');
          if (isErrorState) {
              toast.error("Não é possível imprimir. Houve um erro ao buscar os dados.");
              return;
          }
          
          // Se tudo estiver OK, executa a impressão
          handlePrint();
      }, 100); // Atraso de 100ms para estabilizar a renderização
  };
  // --- FIM FUNÇÃO CORRIGIDA ---

  // Reseta os filtros ao abrir
  React.useEffect(() => {
    if (isDialogOpen) {
      setSelectedYear(currentYear.toString());
      setSelectedMonth("all");
      setSelectedWeek("all");
    }
  }, [isDialogOpen]);
  
  // Se o mês mudar, reseta a semana
  React.useEffect(() => {
    setSelectedWeek("all");
  }, [selectedMonth]);

  // Se o ano mudar, resetamos o mês/semana
  React.useEffect(() => {
    setSelectedMonth("all");
    setSelectedWeek("all");
  }, [selectedYear]);

  // Conversão para números (null se 'all')
  const anoNum = parseInt(selectedYear);
  const mesNum = selectedMonth !== "all" ? parseInt(selectedMonth) : null;
  const semanaNum = selectedWeek !== "all" ? parseInt(selectedWeek) : null;

  return (
    <ResponsiveDialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      title={`Ficha e Relatório de ${veiculo.nome}`}
      description={`Placa: ${veiculo.placa}. Selecione o período para gerar o relatório.`}
      className="max-w-4xl"
      trigger={
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" /> Relatório
        </Button>
      }
    >
      <div className="space-y-6 pt-4">
        
        {/* --- Controles de Filtro (Não aparecem na impressão) --- */}
        <div className="grid grid-cols-4 gap-4 border p-4 rounded-lg no-print">
          <div className="space-y-1">
            <Label>Ano</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearsList.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label>Mês (Opcional)</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger><SelectValue placeholder="Todos os meses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {monthOptions.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label>Semana (Opcional)</Label>
            <Select 
              value={selectedWeek} 
              onValueChange={setSelectedWeek}
              disabled={selectedMonth === "all"} // Desabilita se o Mês não for selecionado
            >
              <SelectTrigger><SelectValue placeholder="Todas as semanas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Semanas</SelectItem>
                {weekOptions.map(w => (
                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handlePrintClick} 
            className="mt-auto h-10" 
            disabled={!veiculo.placa}
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimir Relatório
          </Button>
        </div>

        {/* --- Visualização do Relatório (Conteúdo real a ser impresso) --- */}
        <div className="border rounded-lg max-h-[70vh] overflow-y-auto">
          {/* Passa a ref para o componente que será impresso */}
          <RelatorioImpressao
            ref={componentRef}
            placa={veiculo.placa}
            ano={anoNum}
            mes={mesNum}
            semana={semanaNum}
          />
        </div>
        
      </div>
    </ResponsiveDialog>
  );
}
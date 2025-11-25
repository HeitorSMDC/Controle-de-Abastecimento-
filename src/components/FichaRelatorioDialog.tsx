// src/components/FichaRelatorioDialog.tsx

import * as React from "react";
import { ResponsiveDialog } from "./ResponsiveDialog";
import { Button } from "./ui/button";
import { FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { RelatorioImpressao } from "./RelatorioImpressao"; 

// Importe as interfaces centralizadas
import { Veiculo } from "@/types"; 

type VeiculoTipo = "viatura" | "maquinario";

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

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: new Date(0, i).toLocaleString("pt-BR", { month: "long" }),
}));

const weekOptions = Array.from({ length: 53 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `Semana ${i + 1}`,
}));

export function FichaRelatorioDialog({ veiculo }: FichaRelatorioDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  const [selectedYear, setSelectedYear] = React.useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = React.useState<string | "all">("all");
  const [selectedWeek, setSelectedWeek] = React.useState<string | "all">("all");
  
  // Reseta filtros ao abrir
  React.useEffect(() => {
    if (isDialogOpen) {
      setSelectedYear(currentYear.toString());
      setSelectedMonth("all");
      setSelectedWeek("all");
    }
  }, [isDialogOpen]);
  
  React.useEffect(() => { setSelectedWeek("all"); }, [selectedMonth]);
  React.useEffect(() => { setSelectedMonth("all"); setSelectedWeek("all"); }, [selectedYear]);

  const anoNum = parseInt(selectedYear);
  const mesNum = selectedMonth !== "all" ? parseInt(selectedMonth) : null;
  const semanaNum = selectedWeek !== "all" ? parseInt(selectedWeek) : null;

  return (
    <ResponsiveDialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      title={`Relatório de ${veiculo.nome}`}
      description="Visualize o relatório abaixo. Para imprimir, use o comando do navegador (Ctrl+P ou Cmd+P)."
      className="max-w-5xl h-[95vh] flex flex-col" 
      trigger={
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" /> Relatório
        </Button>
      }
    >
      <div className="flex flex-col h-full gap-4 pt-2">
        
        {/* --- BARRA DE FILTROS --- */}
        <div className="flex flex-wrap gap-4 items-end border p-4 rounded-lg bg-muted/20 shrink-0 no-print">
          <div className="space-y-1 min-w-[120px]">
            <Label>Ano</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearsList.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1 min-w-[160px]">
            <Label>Mês (Opcional)</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {monthOptions.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1 min-w-[160px]">
            <Label>Semana (Opcional)</Label>
            <Select 
              value={selectedWeek} 
              onValueChange={setSelectedWeek}
              disabled={selectedMonth === "all"}
            >
              <SelectTrigger className="bg-white"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Semanas</SelectItem>
                {weekOptions.map(w => (
                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* AQUI ESTAVA O BOTÃO - REMOVIDO */}
          <div className="ml-auto text-sm text-muted-foreground self-center pb-1 hidden md:block">
             Dica: Use <strong>Ctrl + P</strong> para imprimir.
          </div>
        </div>

        {/* --- ÁREA DE VISUALIZAÇÃO --- */}
        <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-100/50 p-4 shadow-inner">
          
          {/* Este ID é usado pelo CSS @media print para mostrar APENAS isto */}
          <div id="area-de-impressao" className="mx-auto bg-white shadow-lg min-h-[29.7cm] w-full max-w-[21cm] transition-all">
             <RelatorioImpressao
                placa={veiculo.placa}
                ano={anoNum}
                mes={mesNum}
                semana={semanaNum}
              />
          </div>

        </div>
        
      </div>
    </ResponsiveDialog>
  );
}
// src/components/RelatorioImpressao.tsx

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ListSkeleton } from "./ListSkeleton";
import { Separator } from "./ui/separator";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import logo from "@/assets/defesa-civil-logo.png";
import { cn } from "@/lib/utils";
import { TableHead, TableCell } from "./ui/table"; 

// Tipos para o retorno da RPC (adaptado de src/integrations/supabase/types.ts)
interface RelatorioRegistro {
  data: string;
  odometro: number | null;
  litros: number;
  valor_total: number;
  posto: string | null;
  km_percorridos: number | null;
  media_km_l: number | null;
}

interface RelatorioData {
  placa: string;
  nome_veiculo: string;
  tipo_combustivel: string;
  filtros_aplicados: {
    ano: number;
    mes: number | null;
    semana: number | null;
  };
  odometro_inicial: number | null;
  total_gasto: number;
  total_litros: number;
  media_km_l: number;
  km_percorridos: number;
  registros: RelatorioRegistro[];
}

interface RelatorioImpressaoProps {
  placa: string;
  ano: number;
  mes: number | null;
  semana: number | null;
}

// Mapeamento de números de mês para nomes em Português
const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const fetchRelatorio = async ({ placa, ano, mes, semana }: RelatorioImpressaoProps): Promise<RelatorioData> => {
  const { data, error } = await supabase.rpc("get_relatorio_veiculo", {
    p_placa: placa,
    p_ano: ano,
    p_mes: mes || undefined,
    p_semana: semana || undefined,
  });

  if (error) {
    console.error("Erro ao buscar relatório:", error);
    throw new Error(error.message || "Erro ao gerar relatório.");
  }
  
  // A RPC retorna um objeto, mas o Supabase client o embrulha em um array de 1 item
  const relatorioArray = data as unknown as RelatorioData[];
  const relatorioData = relatorioArray?.[0];

  if (!relatorioData) {
     // Retorna um objeto válido, mas vazio, se a consulta retornar NULL (ex: filtro muito restritivo)
     return { 
        placa, 
        nome_veiculo: "N/A", 
        tipo_combustivel: "N/A", 
        filtros_aplicados: { ano, mes, semana }, 
        odometro_inicial: null,
        total_gasto: 0, 
        total_litros: 0, 
        media_km_l: 0, 
        km_percorridos: 0, 
        registros: [] 
    } as RelatorioData;
  }
  
  return relatorioData;
};

// Componente principal de conteúdo (usa ref para impressão)
const RelatorioImpressao = React.forwardRef<HTMLDivElement, RelatorioImpressaoProps>(
  ({ placa, ano, mes, semana }, ref) => {
    
    // O queryKey deve ser único para que o React Query busque novos dados ao mudar os filtros
    const { data: relatorio, isLoading, isError } = useQuery<RelatorioData>({
      queryKey: ["relatorioVeiculo", placa, ano, mes, semana],
      queryFn: () => fetchRelatorio({ placa, ano, mes, semana }),
      // Não re-tenta se for erro 404 (veículo não encontrado)
      retry: (failureCount, error) => {
         if (error instanceof Error && error.message.includes("não encontrado")) return false;
         return failureCount < 1; 
      },
      // Habilita refetch se os filtros mudarem
      enabled: !!placa && !!ano,
    });

    if (isLoading) {
      return <ListSkeleton />;
    }

    if (isError || !relatorio) {
      // O REF É PASSADO PARA ESTA DIV, garantindo que o callback do print
      // receba um nó DOM, mesmo que com erro.
      return (
        <div ref={ref} className="text-destructive text-center p-8">
            Erro ao carregar os dados do relatório.
        </div>
      );
    }
    
    // Constrói a descrição do período
    let periodo = `Ano de ${relatorio.filtros_aplicados.ano}`;
    if (mes) {
      periodo = `${monthNames[mes - 1]} / ${periodo}`;
    }
    if (semana) {
      periodo = `Semana ${semana} de ${periodo}`;
    }

    return (
      <div 
        ref={ref} 
        className={cn(
          "p-8 space-y-6 bg-white text-gray-900 print:shadow-none print:p-0",
          "print:text-sm print:space-y-4"
        )}
      >
        
        {/* --- HEADER DO RELATÓRIO (LOGO E TÍTULO) --- */}
        <div className="flex items-center justify-between border-b pb-4 mb-6 print:mb-3">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Defesa Civil" className="h-12 w-12" />
            <div>
              <h1 className="text-2xl font-bold print:text-lg">Relatório de Abastecimento Veicular</h1>
              <p className="text-sm text-gray-600 print:text-xs">Defesa Civil - Campos dos Goytacazes</p>
            </div>
          </div>
          <p className="text-right text-sm print:text-xs">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* --- INFORMAÇÕES GERAIS DO VEÍCULO E FILTRO --- */}
        <div className="grid grid-cols-3 gap-4 border p-4 rounded-lg bg-gray-50 print:p-2 print:border-gray-300 print:bg-white">
          <div>
            <p className="text-xs font-medium text-gray-500">Veículo</p>
            <p className="text-lg font-semibold print:text-base">{relatorio.nome_veiculo}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Placa / Combustível</p>
            <p className="text-lg font-semibold print:text-base">{relatorio.placa} / {relatorio.tipo_combustivel}</p>
          </div>
          <div className={cn({ 'col-span-3': !mes && !semana, 'col-span-1': !!mes || !!semana })}>
            <p className="text-xs font-medium text-gray-500">Período Selecionado</p>
            <p className="text-lg font-semibold print:text-base">{periodo}</p>
          </div>
        </div>
        
        <Separator className="print:hidden" />
        
        {/* --- KPIS DO PERÍODO --- */}
        <h2 className="text-xl font-semibold mb-3 print:text-base print:font-bold">Resumo do Período</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
          <KpiBox title="Total Gasto" value={formatCurrency(relatorio.total_gasto)} isPrimary />
          <KpiBox title="Total Litros" value={`${formatNumber(relatorio.total_litros, 4)} L`} />
          <KpiBox title="Km Percorridos" value={`${formatNumber(relatorio.km_percorridos, 2)} km`} />
          <KpiBox 
            title="Média Km/L" 
            value={relatorio.media_km_l > 0 ? `${formatNumber(relatorio.media_km_l, 4)} km/L` : 'N/A'} 
            isSuccess 
          />
        </div>
        
        <Separator className="print:hidden" />
        
        {/* --- TABELA DE REGISTROS --- */}
        <h2 className="text-xl font-semibold mb-3 print:text-base print:font-bold">Registros de Abastecimento ({relatorio.registros.length})</h2>
        
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full table-auto text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-100">
                <TableHead className="border print:p-1">Data</TableHead>
                <TableHead className="border print:p-1">Odômetro (km)</TableHead>
                <TableHead className="border print:p-1">Litros</TableHead>
                <TableHead className="border print:p-1">Valor (R$)</TableHead>
                <TableHead className="border print:p-1">R$/L</TableHead>
                <TableHead className="border print:p-1">Posto</TableHead>
                <TableHead className="border print:p-1">Km Perc.</TableHead>
                <TableHead className="border print:p-1">Média</TableHead>
              </tr>
            </thead>
            <tbody>
              {relatorio.registros.map((reg, index) => (
                <tr key={index} className="border-b print:border-gray-200">
                  <TableCell className="border print:p-1">{reg.data}</TableCell>
                  <TableCell className="border print:p-1">{reg.odometro || '-'}</TableCell>
                  <TableCell className="border print:p-1">{formatNumber(reg.litros, 4)}</TableCell>
                  <TableCell className="border print:p-1">{formatCurrency(reg.valor_total)}</TableCell>
                  <TableCell className="border print:p-1">
                    {reg.litros > 0 ? formatNumber(reg.valor_total / reg.litros, 4) : '-'}
                  </TableCell>
                  <TableCell className="border print:p-1">{reg.posto || '-'}</TableCell>
                  <TableCell className="border print:p-1">{reg.km_percorridos || '-'}</TableCell>
                  <TableCell className="border print:p-1 text-success font-medium">
                    {reg.media_km_l ? `${formatNumber(reg.media_km_l, 4)}` : '-'}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {relatorio.registros.length === 0 && (
            <div className="text-center text-gray-500 py-4 border-t">Nenhum registro encontrado para o período.</div>
        )}
        
        {/* Espaço para assinatura na impressão */}
        <div className="hidden print:block pt-12">
            <div className="border-t border-gray-400 w-1/3 mx-auto mt-16 pt-2 text-center text-xs">
                Assinatura do Responsável
            </div>
        </div>

      </div>
    );
  }
);
RelatorioImpressao.displayName = "RelatorioImpressao";

// Componente auxiliar para os KPIs
function KpiBox({ title, value, isPrimary = false, isSuccess = false }: { title: string, value: string, isPrimary?: boolean, isSuccess?: boolean }) {
  const colorClass = isPrimary ? "text-primary" : isSuccess ? "text-success" : "text-foreground";
  return (
    <div className="border p-4 rounded-lg bg-white shadow-sm print:border print:p-2 print:rounded-md print:shadow-none">
      <p className="text-xs font-medium text-gray-500 print:text-xs">{title}</p>
      <p className={cn("text-xl font-bold print:text-lg", colorClass)}>{value}</p>
    </div>
  )
}

export { RelatorioImpressao };
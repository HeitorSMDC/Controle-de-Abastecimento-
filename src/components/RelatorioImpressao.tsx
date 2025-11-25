// src/components/RelatorioImpressao.tsx

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "./ui/separator";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import logo from "@/assets/defesa-civil-logo.png";
import { cn } from "@/lib/utils";
import { TableHead, TableCell } from "./ui/table"; 
import { Skeleton } from "./ui/skeleton"; 

// Interfaces
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

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// --- CORREÇÃO CRÍTICA AQUI ---
const fetchRelatorio = async ({ placa, ano, mes, semana }: RelatorioImpressaoProps): Promise<RelatorioData | null> => {
  const { data, error } = await supabase.rpc("get_relatorio_veiculo", {
    p_placa: placa,
    p_ano: ano,
    p_mes: mes || undefined,
    p_semana: semana || undefined,
  });

  if (error) {
    console.error("Erro RPC:", error);
    throw new Error(error.message || "Erro ao gerar relatório.");
  }
  
  // O Supabase pode retornar o objeto direto OU um array contendo o objeto.
  // Esta verificação garante que pegamos os dados corretamente em ambos os casos.
  if (Array.isArray(data)) {
    return data.length > 0 ? (data[0] as RelatorioData) : null;
  }
  
  return (data as RelatorioData) || null;
};

export function RelatorioImpressao({ placa, ano, mes, semana }: RelatorioImpressaoProps) {
    
    const { data: relatorio, isLoading, isError } = useQuery<RelatorioData | null>({
      queryKey: ["relatorioVeiculo", placa, ano, mes, semana],
      queryFn: () => fetchRelatorio({ placa, ano, mes, semana }),
      retry: false,
      enabled: !!placa && !!ano,
    });

    return (
      <div className={cn(
          "p-8 space-y-6 text-gray-900 bg-white min-h-[29.7cm]", 
          "print:p-0 print:space-y-4"
        )}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b pb-4 mb-6 print:mb-4 border-gray-800">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Brasão" className="h-16 w-16 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Relatório Veicular</h1>
              <p className="text-sm font-medium text-gray-700">Defesa Civil - Campos dos Goytacazes</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-xs text-gray-500">Emitido em:</p>
             <p className="text-sm font-medium">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* LOADING */}
        {isLoading && (
          <div className="space-y-6 animate-pulse pt-8">
            <div className="grid grid-cols-3 gap-4">
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {/* ERROR */}
        {isError && (
          <div className="p-8 text-center text-red-600 bg-red-50 rounded-md border border-red-200">
            Não foi possível carregar os dados. Por favor, tente novamente.
          </div>
        )}

        {/* NO DATA STATE (Fallback) */}
        {!isLoading && !isError && !relatorio && (
           <div className="p-12 text-center border-2 border-dashed rounded-lg text-gray-400">
              Nenhum dado encontrado para este veículo neste período.
           </div>
        )}

        {/* DATA CONTENT */}
        {!isLoading && !isError && relatorio && (
          <>
            {/* Info Principal */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-2 gap-6 print:border-gray-300">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Veículo / Placa</span>
                <p className="text-lg font-bold text-gray-900 mt-1">{relatorio.nome_veiculo}</p>
                <p className="text-sm text-gray-700">{relatorio.placa} • {relatorio.tipo_combustivel}</p>
              </div>
              <div className="text-right">
                 <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Período</span>
                 <p className="text-lg font-bold text-gray-900 mt-1">{relatorio.filtros_aplicados.ano}</p>
                 <p className="text-sm text-gray-700">
                    {mes ? monthNames[mes - 1] : "Ano Completo"} 
                    {semana ? ` • Semana ${semana}` : ""}
                 </p>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4 print:gap-2">
               <div className="p-3 border rounded bg-white">
                  <p className="text-xs text-gray-500">Gasto Total</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(relatorio.total_gasto || 0)}</p>
               </div>
               <div className="p-3 border rounded bg-white">
                  <p className="text-xs text-gray-500">Consumo</p>
                  <p className="text-lg font-bold text-gray-900">{formatNumber(relatorio.total_litros || 0, 2)} L</p>
               </div>
               <div className="p-3 border rounded bg-white">
                  <p className="text-xs text-gray-500">Rodagem</p>
                  <p className="text-lg font-bold text-gray-900">{formatNumber(relatorio.km_percorridos || 0, 0)} km</p>
               </div>
               <div className="p-3 border rounded bg-white">
                  <p className="text-xs text-gray-500">Desempenho</p>
                  <p className="text-lg font-bold text-gray-900">
                    {relatorio.media_km_l > 0 ? formatNumber(relatorio.media_km_l, 2) : "-"} <span className="text-xs font-normal">km/l</span>
                  </p>
               </div>
            </div>

            <Separator className="my-2" />

            {/* Tabela */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Histórico de Abastecimentos</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="text-left py-2 font-bold text-gray-900">Data</th>
                    <th className="text-left py-2 font-bold text-gray-900">Posto</th>
                    <th className="text-right py-2 font-bold text-gray-900">Odômetro</th>
                    <th className="text-right py-2 font-bold text-gray-900">Litros</th>
                    <th className="text-right py-2 font-bold text-gray-900">Valor</th>
                    <th className="text-right py-2 font-bold text-gray-900">Média</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(relatorio.registros || []).map((reg, i) => (
                    <tr key={i} className="break-inside-avoid">
                      <td className="py-2 text-gray-700">{reg.data}</td>
                      <td className="py-2 text-gray-700 truncate max-w-[120px]">{reg.posto || "-"}</td>
                      <td className="py-2 text-right text-gray-700">{reg.odometro || "-"}</td>
                      <td className="py-2 text-right text-gray-700">{formatNumber(reg.litros, 2)}</td>
                      <td className="py-2 text-right text-gray-700">{formatCurrency(reg.valor_total)}</td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {reg.media_km_l ? formatNumber(reg.media_km_l, 2) : "-"}
                      </td>
                    </tr>
                  ))}
                  {(!relatorio.registros || relatorio.registros.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 italic">
                        Nenhum abastecimento registrado neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-300 break-inside-avoid">
               <div className="flex justify-between text-xs text-gray-500 px-8">
                  <div className="text-center w-1/3 pt-2 border-t border-gray-400">
                     Responsável pelo Veículo
                  </div>
                  <div className="text-center w-1/3 pt-2 border-t border-gray-400">
                     Gestor da Frota
                  </div>
               </div>
            </div>
          </>
        )}
      </div>
    );
}
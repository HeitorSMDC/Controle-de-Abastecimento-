// src/pages/Dashboard.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { ListSkeleton } from "@/components/ListSkeleton"; // Reutilizamos o skeleton
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// --- ADIÇÃO DE ÍCONE ---
import { TrendingUp } from "lucide-react"; 

// --- Tipos de Dados para o Dashboard ---

interface GastoMes {
  mes: number;
  mes_nome: string;
  total: number;
}

interface GastoVeiculo {
  nome: string;
  total: number;
  fill: string; // Cor adicionada pela função de fetch
}

// --- INTERFACE ATUALIZADA ---
interface DashboardData {
  total_gasto_ano: number;
  total_litros_ano: number;
  gasto_medio_por_litro: number;
  media_km_l_frota: number; // Novo campo
  gastos_por_mes: GastoMes[];
  gastos_por_veiculo: GastoVeiculo[];
  // Removido: total_registros_ano (substituído pela média)
}

// --- Função de Fetch (RPC) ---

const fetchDashboardData = async (ano: number): Promise<DashboardData> => {
  const { data, error } = await supabase.rpc("get_dashboard_stats", {
    ano_selecionado: ano,
  });

  if (error) {
    throw new Error(`Erro ao buscar dados do dashboard: ${error.message}`);
  }
  
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FA8072", "#E0FFFF", "#D2691E", "#FF7F50", "#6495ED"];

  const gastosPorVeiculoComCores = data.gastos_por_veiculo?.map((item: GastoVeiculo, index: number) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  })) || [];


  return { ...data, gastos_por_veiculo: gastosPorVeiculoComCores };
};

// --- Configuração dos Gráficos ---

const chartConfigBar: ChartConfig = {
  total: {
    label: "Total Gasto (R$)",
    color: "hsl(var(--primary))",
  },
};

const chartConfigPie: ChartConfig = {
  total: {
    label: "Total Gasto (R$)",
  },
};


export default function Dashboard() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const { data: stats, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard", currentYear],
    queryFn: () => fetchDashboardData(currentYear),
  });

  // Gera uma lista de anos (ano atual + 5 anos passados)
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  if (isLoading) {
    return (
      <Layout>
        <ListSkeleton />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Erro ao Carregar Dashboard</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <p>Nenhum dado encontrado.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* --- Cabeçalho e Seletor de Ano --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Resumo financeiro e de consumo do ano de {currentYear}
            </p>
          </div>
          <Select
            value={currentYear.toString()}
            onValueChange={(value) => setCurrentYear(parseInt(value))}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Selecione o Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* --- Stats Rápidos (Kpis) --- ATUALIZADO --- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gasto (Ano)</CardTitle>
              <span className="text-lg text-primary">R$</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_gasto_ano.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Consumido (Ano)</CardTitle>
              <span className="text-lg text-secondary">L</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_litros_ano.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })} L
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Médio por Litro</CardTitle>
              <span className="text-lg text-muted-foreground">R$/L</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.gasto_medio_por_litro.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* --- CARTÃO SUBSTITUÍDO --- */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média da Frota (Km/L)</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.media_km_l_frota.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
          {/* --- FIM DA SUBSTITUIÇÃO --- */}
        </div>
        
        {/* --- Gráficos (Sem alterações) --- */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico de Barras: Gasto Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos Mensais (R$)</CardTitle>
              <CardDescription>Total gasto em combustível por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfigBar} className="h-[300px] w-full">
                <BarChart data={stats.gastos_por_mes} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="mes_nome"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${value / 1000}k`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent 
                      formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                    />}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza: Gasto por Veículo */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10: Gastos por Veículo</CardTitle>
              <CardDescription>Veículos com maior gasto no ano</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ChartContainer config={chartConfigPie} className="h-[300px] w-full max-w-sm">
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent 
                      nameKey="nome"
                      formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                      hideLabel
                    />}
                  />
                  <Pie
                    data={stats.gastos_por_veiculo}
                    dataKey="total"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ nome, percent }) => `${nome} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                    fontSize={12}
                  >
                    {stats.gastos_por_veiculo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
}
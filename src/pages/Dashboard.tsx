// src/pages/Dashboard.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { ListSkeleton } from "@/components/ListSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, X, Car, Truck } from "lucide-react"; // Adicionado Car e Truck
import { Button } from "@/components/ui/button";
import { combustivelOptions } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/formatters";

// --- Interfaces Atualizadas ---
interface GastoMes { mes: number; mes_nome: string; total: number; }
interface GastoItem { nome: string; total: number; fill: string; }

interface DashboardData {
  total_gasto_ano: number;
  total_litros_ano: number;
  gasto_medio_por_litro: number;
  media_km_l_frota: number;
  gastos_por_mes: GastoMes[];
  gastos_por_veiculo: GastoItem[];
  gastos_por_posto: GastoItem[];
  // NOVO: Adiciona as médias específicas
  media_km_l_viaturas: number;
  media_km_l_maquinario: number;
}

interface Filters {
  ano: string;
  combustivel: string;
  placa: string;
  posto: string;
}

// --- Função de Fetch Atualizada e Blindada ---
const fetchDashboardData = async (filters: Filters): Promise<DashboardData> => {
  // 1. Prepara os parâmetros garantindo que "all" vira null
  const ano = parseInt(filters.ano, 10);
  const params = {
    p_ano: ano,
    p_combustivel: filters.combustivel === "all" ? null : filters.combustivel,
    p_placa: filters.placa === "all" ? null : filters.placa,
    p_posto: filters.posto === "all" ? null : filters.posto,
  };

  // 2. Chamadas RPC paralelas para eficiência
  const [statsResponse, viaturasMediaResponse, maquinarioMediaResponse] = await Promise.all([
      supabase.rpc("get_dashboard_stats", params),
      supabase.rpc("get_media_km_l_por_tipo", { p_tipo_veiculo: 'viatura', p_ano: ano }),
      supabase.rpc("get_media_km_l_por_tipo", { p_tipo_veiculo: 'maquinario', p_ano: ano }),
  ]);

  if (statsResponse.error) {
    console.error("Erro RPC (get_dashboard_stats):", statsResponse.error);
    throw new Error(statsResponse.error.message);
  }
  
  if (viaturasMediaResponse.error) {
      console.error("Erro RPC (viaturas):", viaturasMediaResponse.error);
      throw new Error(viaturasMediaResponse.error.message);
  }
  
  if (maquinarioMediaResponse.error) {
      console.error("Erro RPC (maquinario):", maquinarioMediaResponse.error);
      throw new Error(maquinarioMediaResponse.error.message);
  }

  // 3. Extrai as médias (o Supabase RPC retorna um array, pegamos o primeiro elemento)
  const mediaKmLViatura = viaturasMediaResponse.data?.[0]?.media || 0;
  const mediaKmLMaquinario = maquinarioMediaResponse.data?.[0]?.media || 0;

  // 4. Prepara os dados para o retorno
  const COLORS_VEICULOS = ["#0ea5e9", "#22c55e", "#eab308", "#f97316", "#ef4444"];
  const COLORS_POSTOS = ["#8b5cf6", "#ec4899", "#06b6d4"];

  const safeData = statsResponse.data || {
      total_gasto_ano: 0,
      total_litros_ano: 0,
      gasto_medio_por_litro: 0,
      media_km_l_frota: 0,
      gastos_por_mes: [],
      gastos_por_veiculo: [],
      gastos_por_posto: []
  };

  const formatChartData = (items: any[], colors: string[]) => 
    (items || []).map((item, index) => ({
      ...item,
      fill: colors[index % colors.length],
    }));

  return { 
    ...safeData, 
    gastos_por_veiculo: formatChartData(safeData.gastos_por_veiculo, COLORS_VEICULOS),
    gastos_por_posto: formatChartData(safeData.gastos_por_posto, COLORS_POSTOS),
    // NOVO: Adiciona as médias ao objeto de retorno
    media_km_l_viaturas: parseFloat(mediaKmLViatura.toFixed(2)),
    media_km_l_maquinario: parseFloat(mediaKmLMaquinario.toFixed(2)),
  };
};

// Buscar listas para os filtros
const fetchFilterOptions = async () => {
  const [viaturas, postos] = await Promise.all([
    supabase.from("viaturas").select("placa, nome").order("nome"),
    supabase.from("postos").select("nome").order("nome"), 
  ]);
  
  return {
    veiculos: viaturas.data || [],
    postos: postos.data || [] 
  };
};

const chartConfig: ChartConfig = {
  total: { label: "Valor", color: "hsl(var(--primary))" },
};

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const startYear = 2025; // Ano de início do projeto
  
  // Gera lista de anos do atual até 2025
  const yearsList = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => (currentYear - i).toString()
  );

  const [filters, setFilters] = useState<Filters>({
    ano: currentYear.toString(),
    combustivel: "all",
    placa: "all",
    posto: "all"
  });

  const { data: stats, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard", filters],
    queryFn: () => fetchDashboardData(filters),
    retry: 1
  });

  const { data: options } = useQuery({
    queryKey: ["dashboard-options"],
    queryFn: fetchFilterOptions,
  });

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      ano: currentYear.toString(),
      combustivel: "all",
      placa: "all",
      posto: "all"
    });
  };

  const hasActiveFilters = filters.combustivel !== "all" || filters.placa !== "all" || filters.posto !== "all";

  if (isLoading) return <Layout><ListSkeleton /></Layout>;
  
  if (error) {
      return (
          <Layout>
              <div className="p-8 text-center text-destructive">
                  <h3 className="text-lg font-bold">Erro ao carregar dashboard</h3>
                  <p>{error.message}</p>
                  <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">Tentar Novamente</Button>
              </div>
          </Layout>
      );
  }

  if (!stats) return <Layout><div>Sem dados disponíveis</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* --- Header e Filtros (Não alterado) --- */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Visão geral e métricas de desempenho.</p>
            </div>
            
            {hasActiveFilters && (
               <Button variant="ghost" onClick={clearFilters} className="md:self-end text-muted-foreground hover:text-destructive">
                 <X className="mr-2 h-4 w-4" /> Limpar Filtros
               </Button>
            )}
          </div>

          {/* Barra de Filtros */}
          <Card className="bg-muted/30 border-none shadow-sm">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Ano</label>
                <Select value={filters.ano} onValueChange={(v) => handleFilterChange("ano", v)}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {yearsList.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Combustível</label>
                <Select value={filters.combustivel} onValueChange={(v) => handleFilterChange("combustivel", v)}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {combustivelOptions.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Veículo</label>
                <Select value={filters.placa} onValueChange={(v) => handleFilterChange("placa", v)}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Veículos</SelectItem>
                    {options?.veiculos.map(v => (
                      <SelectItem key={v.placa} value={v.placa}>{v.nome} - {v.placa}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Posto</label>
                <Select value={filters.posto} onValueChange={(v) => handleFilterChange("posto", v)}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Postos</SelectItem>
                    {options?.postos.map((p: any) => (
                      <SelectItem key={p.nome} value={p.nome}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* --- KPIs ATUALIZADOS --- */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard title="Total Gasto" value={formatCurrency(stats.total_gasto_ano)} icon="R$" color="text-primary" />
          <KpiCard title="Total Consumido" value={`${formatNumber(stats.total_litros_ano)} L`} icon="L" color="text-blue-500" />
          <KpiCard title="Preço Médio/Litro" value={formatCurrency(stats.gasto_medio_por_litro)} icon="Avg" color="text-muted-foreground" />
          
          {/* Métrica Global */}
          <KpiCard title="Média Frota (Km/L)" value={formatNumber(stats.media_km_l_frota)} icon={<TrendingUp className="h-5 w-5" />} color="text-green-600" />
          
          {/* NOVO: Média de Viaturas */}
          <KpiCard 
            title="Média Viaturas" 
            value={formatNumber(stats.media_km_l_viaturas)} 
            icon={<Car className="h-5 w-5" />} 
            color={stats.media_km_l_viaturas > 0 ? "text-green-600" : "text-gray-400"} 
          />
          
          {/* NOVO: Média de Maquinário */}
          <KpiCard 
            title="Média Maquinário" 
            value={formatNumber(stats.media_km_l_maquinario)} 
            icon={<Truck className="h-5 w-5" />} 
            color={stats.media_km_l_maquinario > 0 ? "text-green-600" : "text-gray-400"} 
          />
        </div>
        
        {/* --- Gráficos (Não alterado) --- */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Barras: Gasto Mensal */}
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Evolução Mensal de Gastos</CardTitle>
              <CardDescription>Total gasto em combustível ao longo do ano</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={stats.gastos_por_mes} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="mes_nome" 
                    tickLine={false} 
                    tickMargin={10} 
                    axisLine={false} 
                    fontSize={12}
                    interval={0} 
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$${value}`} 
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Pizza: Veículos e Postos */}
          <div className="grid gap-6 grid-rows-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Top 5 Veículos (Gastos)</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center h-[200px]">
                {stats.gastos_por_veiculo.length > 0 ? (
                  <ChartContainer config={{}} className="h-full w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="nome" formatter={(value) => formatCurrency(Number(value))} />} />
                      <Pie
                        data={stats.gastos_por_veiculo}
                        dataKey="total"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {stats.gastos_por_veiculo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="nome" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center text-muted-foreground text-sm w-full">Sem dados para este filtro</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Distribuição por Posto</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center h-[200px]">
                 {stats.gastos_por_posto.length > 0 ? (
                  <ChartContainer config={{}} className="h-full w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="nome" formatter={(value) => formatCurrency(Number(value))} />} />
                      <Pie
                        data={stats.gastos_por_posto}
                        dataKey="total"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {stats.gastos_por_posto.map((entry, index) => (
                          <Cell key={`cell-p-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="nome" />} />
                    </PieChart>
                  </ChartContainer>
                 ) : (
                  <div className="flex items-center justify-center text-muted-foreground text-sm w-full">Sem dados para este filtro</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function KpiCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode | string, color: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`text-sm font-bold ${color}`}>
          {typeof icon === 'string' ? icon : icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
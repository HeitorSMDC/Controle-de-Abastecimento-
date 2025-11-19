// src/components/cards/AbastecimentoCard.tsx

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Gauge } from "lucide-react"; 
import { Separator } from "@/components/ui/separator"; 
import { formatCurrency, formatNumber, formatDate, formatUnitPrice } from "@/lib/formatters";

// Interface atualizada
interface Abastecimento {
  id: string;
  data: string;
  veiculo: string;
  placa: string;
  motorista: string;
  quantidade_litros: number;
  valor_reais: number;
  semana: number;
  odometro: number | null;
  km_percorridos: number | null;
  media_km_l: number | null;
}

interface AbastecimentoCardProps {
  abastecimento: Abastecimento;
  onEdit: () => void;
  deleteAction: React.ReactNode;
}

export function AbastecimentoCard({
  abastecimento,
  onEdit,
  deleteAction,
}: AbastecimentoCardProps) {
  
  const valorUnitario = abastecimento.quantidade_litros > 0
    ? (abastecimento.valor_reais / abastecimento.quantidade_litros)
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          {abastecimento.veiculo} ({abastecimento.placa})
        </CardTitle>
        <Gauge className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bloco de Custo */}
        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Valor Gasto</p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(abastecimento.valor_reais)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground">Quantidade</p>
            <p className="text-lg font-semibold">
              {formatNumber(abastecimento.quantidade_litros, 4)} L
            </p>
          </div>
        </div>
        
        {/* Bloco de Odômetro e Média */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Odômetro</p>
            <p className="text-sm font-semibold">{abastecimento.odometro || "N/A"} km</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Distância</p>
            <p className="text-sm font-semibold">{abastecimento.km_percorridos || "N/A"} km</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Média</p>
            <p className="text-sm font-semibold text-green-600">
              {abastecimento.media_km_l ? `${formatNumber(abastecimento.media_km_l, 4)} km/L` : "N/A"}
            </p>
          </div>
        </div>

        <Separator />

        {/* Detalhes */}
        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Motorista</p>
            <p className="text-sm">{abastecimento.motorista}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Data (Semana)</p>
            <p className="text-sm">
              {formatDate(abastecimento.data)} (Sem. {abastecimento.semana})
            </p>
          </div>
           <div>
            <p className="text-xs font-medium text-muted-foreground">Valor por Litro</p>
            <p className="text-sm">
              {formatUnitPrice(valorUnitario)}
            </p>
          </div>
        </div>

        {/* Ações (Editar e Apagar) */}
        <div className="flex w-full gap-2 pt-2">
          <Button variant="outline" size="sm" className="w-full" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          {deleteAction}
        </div>
      </CardContent>
    </Card>
  );
}
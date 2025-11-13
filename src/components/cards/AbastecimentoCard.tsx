// src/components/cards/AbastecimentoCard.tsx

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Gauge } from "lucide-react";

// Interface para os dados de Abastecimento
interface Abastecimento {
  id: string;
  data: string;
  veiculo: string;
  placa: string;
  motorista: string;
  quantidade_litros: number;
  valor_reais: number;
  semana: number;
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
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          {abastecimento.veiculo} ({abastecimento.placa})
        </CardTitle>
        <Gauge className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações de Custo e Litros */}
        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Valor Gasto</p>
            <p className="text-xl font-bold text-primary">
              R$ {abastecimento.valor_reais.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground">Quantidade</p>
            <p className="text-lg font-semibold">
              {abastecimento.quantidade_litros.toFixed(2)} L
            </p>
          </div>
        </div>

        {/* Detalhes */}
        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Motorista</p>
            <p className="text-sm">{abastecimento.motorista}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Data e Semana</p>
            <p className="text-sm">
              {new Date(abastecimento.data).toLocaleDateString("pt-BR")} (Sem.{" "}
              {abastecimento.semana})
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
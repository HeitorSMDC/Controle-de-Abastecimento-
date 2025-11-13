// src/components/cards/VeiculoCard.tsx

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, LucideIcon } from "lucide-react";
import { statusOptionsVeiculos, statusVariantMapVeiculos } from "@/lib/constants";

// NOVO: Adicionar 'tipo_combustivel' à interface
interface Veiculo {
  id: string;
  nome: string;
  ano: number;
  placa: string;
  cartao: string | null;
  status: "operante" | "inoperante" | "em_manutencao" | "em_reparo" | "reserva";
  tipo_combustivel: string; // NOVO
}

interface VeiculoCardProps {
  veiculo: Veiculo;
  icon: LucideIcon;
  onEdit: () => void;
  deleteAction: React.ReactNode;
}

export function VeiculoCard({ veiculo, icon: Icon, onEdit, deleteAction }: VeiculoCardProps) {
  const statusLabel = statusOptionsVeiculos.find(s => s.value === veiculo.status)?.label;
  const statusVariant = statusVariantMapVeiculos[veiculo.status] || "outline";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{veiculo.nome}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Badge variant={statusVariant}>{statusLabel}</Badge>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Placa</p>
            <p className="text-sm">{veiculo.placa}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Ano</p>
            <p className="text-sm">{veiculo.ano}</p>
          </div>
        </div>
        
        {/* NOVO: Grid para Combustível e Cartão */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Combustível</p>
            <p className="text-sm">{veiculo.tipo_combustivel}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cartão</p>
            <p className="text-sm">{veiculo.cartao || "N/A"}</p>
          </div>
        </div>

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
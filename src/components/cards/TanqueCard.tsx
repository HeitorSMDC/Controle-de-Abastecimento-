// src/components/cards/TanqueCard.tsx

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Droplet, Plus, Minus } from "lucide-react";

// Tipo para o Tanque (pode ser importado de 'types.ts' no futuro)
export interface Tanque {
  id: string;
  nome: string;
  capacidade_litros: number;
  litros_atuais: number;
  tipo_combustivel: string;
}

interface TanqueCardProps {
  tanque: Tanque;
  onAddFuel: () => void; // Função para "entrada"
  onRemoveFuel: () => void; // Função para "saída"
  onEdit: () => void;
}

export function TanqueCard({ tanque, onAddFuel, onRemoveFuel, onEdit }: TanqueCardProps) {
  // Calcula a percentagem de ocupação
  const percentual = (tanque.litros_atuais / tanque.capacidade_litros) * 100;

  // Define a cor da barra de progresso
  const getProgressColor = () => {
    if (percentual < 20) return "bg-destructive"; // Vermelho (baixo)
    if (percentual < 50) return "bg-warning";   // Amarelo (médio)
    return "bg-success"; // Verde (cheio)
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{tanque.nome}</CardTitle>
            <CardDescription>{tanque.tipo_combustivel}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Indicador Visual */}
        <div>
          <div className="flex justify-between text-sm font-medium mb-1">
            <span className="text-muted-foreground">Nível Atual</span>
            <span>
              {tanque.litros_atuais.toFixed(2)} L / {tanque.capacidade_litros.toFixed(2)} L
            </span>
          </div>
          <Progress value={percentual} className="h-3" indicatorClassName={getProgressColor()} />
          <p className="text-right text-lg font-bold mt-1">{percentual.toFixed(1)}%</p>
        </div>

        {/* Ações Rápidas */}
        <div className="flex w-full gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onAddFuel}>
            <Plus className="mr-2 h-4 w-4" />
            Entrada
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onRemoveFuel}>
            <Minus className="mr-2 h-4 w-4" />
            Saída
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
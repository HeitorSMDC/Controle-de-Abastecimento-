// src/components/cards/ManutencaoCard.tsx

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Wrench } from "lucide-react";
import {
  statusOptionsManutencao,
  statusVariantMapManutencao,
} from "@/lib/constants";

type StatusManutencao = "pendente" | "em_andamento" | "concluida" | "cancelada";

// A interface precisa de todos os dados para o "Ver Detalhes" funcionar
interface Manutencao {
  id: string;
  placa: string;
  tipo_veiculo: string;
  veiculo_nome: string;
  descricao_problema: string;
  pecas_necessarias: string[] | null;
  links_pecas: string[] | null;
  status: StatusManutencao;
  data_registro: string;
  data_conclusao: string | null;
  custo_estimado: number | null;
  custo_real: number | null;
  observacoes: string | null;
  nf_numero: string | null;
  nf_data: string | null;
  nf_fornecedor: string | null;
}

interface ManutencaoCardProps {
  manutencao: Manutencao;
  onEdit: () => void;
  deleteAction: React.ReactNode;
  detailsAction: React.ReactNode;
}

export function ManutencaoCard({
  manutencao,
  onEdit,
  deleteAction,
  detailsAction,
}: ManutencaoCardProps) {
  const statusLabel = statusOptionsManutencao.find(s => s.value === manutencao.status)?.label;
  const statusVariant = statusVariantMapManutencao[manutencao.status] || "outline";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          {manutencao.veiculo_nome} ({manutencao.placa})
        </CardTitle>
        <Wrench className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Badge variant={statusVariant}>{statusLabel}</Badge>

        <div>
          <p className="text-xs font-medium text-muted-foreground">Problema</p>
          <p className="text-sm truncate">{manutencao.descricao_problema}</p>
        </div>
        
        <div>
          <p className="text-xs font-medium text-muted-foreground">Data do Registro</p>
          <p className="text-sm">
            {new Date(manutencao.data_registro).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Ações */}
        <div className="flex w-full gap-2 pt-2">
          {/* O detailsAction é o Dialog completo vindo da página */}
          {detailsAction} 
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          {deleteAction}
        </div>
      </CardContent>
    </Card>
  );
}
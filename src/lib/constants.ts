// src/lib/constants.ts

import { BadgeProps } from "@/components/ui/badge";

// --- Documentação: Status de Veículos ---

export const statusOptionsVeiculos = [
  { value: "operante", label: "Operante" },
  { value: "inoperante", label: "Inoperante" },
  { value: "em_manutencao", label: "Em Manutenção" },
  { value: "em_reparo", label: "Em Reparo" },
  { value: "reserva", label: "Reserva" },
];

export const statusVariantMapVeiculos: Record<string, BadgeProps["variant"]> = {
  operante: "success",
  inoperante: "destructive",
  em_manutencao: "warning",
  em_reparo: "warning",
  reserva: "secondary",
};

// --- Documentação: Status de Manutenção ---

export const statusOptionsManutencao = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

export const statusVariantMapManutencao: Record<string, BadgeProps["variant"]> = {
  pendente: "warning",
  em_andamento: "secondary",
  concluida: "success",
  cancelada: "destructive",
};

// NOVO: Opções de Combustível
export const combustivelOptions = [
  { value: "Gasolina", label: "Gasolina" },
  { value: "Diesel", label: "Diesel" },
  { value: "Etanol", label: "Etanol" },
  { value: "Gás", label: "Gás (GNV)" },
  { value: "Elétrico", label: "Elétrico" },
];
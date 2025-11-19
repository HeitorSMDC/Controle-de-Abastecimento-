// src/lib/validations.ts

import { z } from "zod";

export const motoristaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  senha: z.string().min(4, "Senha deve ter no mínimo 4 caracteres"),
});
export type MotoristaFormData = z.infer<typeof motoristaSchema>;

export const veiculoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  ano: z.number().min(1950, "Ano inválido").max(new Date().getFullYear() + 1, "Ano inválido"),
  placa: z.string().min(7, "Placa deve ter 7 caracteres").max(7, "Placa deve ter 7 caracteres"),
  cartao: z.string().optional().nullable(),
  status: z.enum(["operante", "inoperante", "em_manutencao", "em_reparo", "reserva"]),
  anotacoes: z.string().optional().nullable(),
  tipo_combustivel: z.string().min(1, "Tipo de combustível é obrigatório"),
});
export type VeiculoFormData = z.infer<typeof veiculoSchema>;

export const abastecimentoSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  veiculo: z.string().min(1, "Veículo é obrigatório"),
  placa: z.string().min(1, "Placa é obrigatória"),
  cartao: z.string().optional().nullable(),
  motorista: z.string().min(1, "Motorista é obrigatório"),
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  quantidade_litros: z.number().min(0.0001, "Quantidade deve ser positiva"),
  valor_reais: z.number().min(0.0001, "Valor deve ser positivo"),
  odometro: z.number().min(1, "Odômetro deve ser um número positivo"),
  posto: z.string().min(1, "Selecione o posto de abastecimento"),
});
export type AbastecimentoFormData = z.infer<typeof abastecimentoSchema>;

export const manutencaoSchema = z.object({
  placa: z.string().min(1, "Veículo é obrigatório"),
  tipo_veiculo: z.enum(["viatura", "maquinario"]),
  veiculo_nome: z.string().min(1, "Nome do veículo é obrigatório"),
  descricao_problema: z.string().min(5, "Descrição deve ter no mínimo 5 caracteres"),
  pecas_necessarias: z.string().optional().nullable(),
  links_pecas: z.string().optional().nullable(),
  status: z.enum(["pendente", "em_andamento", "concluida", "cancelada"]),
  data_registro: z.string().min(1, "Data de registro é obrigatória"),
  data_conclusao: z.string().optional().nullable(),
  custo_estimado: z.string().optional().nullable(),
  custo_real: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  nf_numero: z.string().optional().nullable(),
  nf_data: z.string().optional().nullable(),
  nf_fornecedor: z.string().optional().nullable(),
});
export type ManutencaoFormData = z.infer<typeof manutencaoSchema>;

export const tanqueSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  capacidade_litros: z.number().min(1, "A capacidade deve ser positiva"),
  litros_atuais: z.number().min(0, "Os litros atuais não podem ser negativos"),
  tipo_combustivel: z.string().min(1, "O tipo de combustível é obrigatório"),
});
export type TanqueFormData = z.infer<typeof tanqueSchema>;

export const tanqueMovimentacaoSchema = z.object({
  tanque_id: z.string().uuid("ID do tanque inválido"),
  tipo: z.enum(["entrada", "saida"]),
  litros: z.number().min(0.01, "A quantidade de litros deve ser positiva"),
  valor_reais: z.string().optional().nullable(),
  responsavel_id: z.string().uuid("ID do responsável inválido"),
  responsavel_nome: z.string().min(1, "Nome do responsável é obrigatório"),
  observacao: z.string().optional().nullable(),
});
export type TanqueMovimentacaoFormData = z.infer<typeof tanqueMovimentacaoSchema>;
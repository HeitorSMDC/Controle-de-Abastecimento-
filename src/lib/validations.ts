import { z } from "zod";

// Motoristas
export const motoristaSchema = z.object({
  nome: z.string()
    .trim()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  matricula: z.string()
    .trim()
    .min(3, "Matrícula deve ter no mínimo 3 caracteres")
    .max(20, "Matrícula deve ter no máximo 20 caracteres"),
  senha: z.string()
    .trim()
    .min(1, "Senha é obrigatória")
    .max(50, "Senha deve ter no máximo 50 caracteres"),
});

// Viaturas e Maquinário
export const veiculoSchema = z.object({
  nome: z.string()
    .trim()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  placa: z.string()
    .trim()
    .min(7, "Placa deve ter no mínimo 7 caracteres")
    .max(10, "Placa deve ter no máximo 10 caracteres")
    .toUpperCase(),
  ano: z.number()
    .int("Ano deve ser um número inteiro")
    .min(1900, "Ano deve ser maior que 1900")
    .max(new Date().getFullYear() + 1, `Ano não pode ser maior que ${new Date().getFullYear() + 1}`),
  cartao: z.string()
    .trim()
    .max(50, "Cartão deve ter no máximo 50 caracteres")
    .optional()
    .nullable(),
  anotacoes: z.string()
    .trim()
    .max(1000, "Anotações deve ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  status: z.enum(["operante", "manutencao", "inativo"]),
});

// Controle de Abastecimento
export const abastecimentoSchema = z.object({
  placa: z.string()
    .trim()
    .min(7, "Placa é obrigatória"),
  veiculo: z.string()
    .trim()
    .min(3, "Veículo é obrigatório"),
  motorista: z.string()
    .trim()
    .min(3, "Motorista deve ter no mínimo 3 caracteres")
    .max(100, "Motorista deve ter no máximo 100 caracteres"),
  matricula: z.string()
    .trim()
    .min(3, "Matrícula é obrigatória"),
  data: z.string()
    .min(1, "Data é obrigatória"),
  quantidade_litros: z.number()
    .positive("Quantidade deve ser maior que zero")
    .max(1000, "Quantidade não pode exceder 1000 litros"),
  valor_reais: z.number()
    .positive("Valor deve ser maior que zero")
    .max(100000, "Valor muito alto"),
  cartao: z.string()
    .trim()
    .max(50, "Cartão deve ter no máximo 50 caracteres")
    .optional()
    .nullable(),
});

// Manutenção
export const manutencaoSchema = z.object({
  placa: z.string()
    .trim()
    .min(7, "Placa é obrigatória"),
  tipo_veiculo: z.enum(["viatura", "maquinario"]),
  veiculo_nome: z.string()
    .trim()
    .min(3, "Nome do veículo é obrigatório"),
  descricao_problema: z.string()
    .trim()
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres"),
  pecas_necessarias: z.string()
    .trim()
    .max(500, "Lista de peças deve ter no máximo 500 caracteres")
    .optional(),
  links_pecas: z.string()
    .trim()
    .max(1000, "Links devem ter no máximo 1000 caracteres")
    .optional(),
  status: z.enum(["pendente", "em_andamento", "concluida", "cancelada"]),
  data_registro: z.string()
    .min(1, "Data de registro é obrigatória"),
  data_conclusao: z.string()
    .optional(),
  custo_estimado: z.string()
    .optional(),
  custo_real: z.string()
    .optional(),
  observacoes: z.string()
    .trim()
    .max(1000, "Observações deve ter no máximo 1000 caracteres")
    .optional(),
});

export type MotoristaFormData = z.infer<typeof motoristaSchema>;
export type VeiculoFormData = z.infer<typeof veiculoSchema>;
export type AbastecimentoFormData = z.infer<typeof abastecimentoSchema>;
export type ManutencaoFormData = z.infer<typeof manutencaoSchema>;

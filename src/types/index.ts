// src/types/index.ts

// --- Enums e Tipos Básicos ---
export type AppRole = "admin" | "coordenador" | "usuario";
export type StatusVeiculo = "operante" | "inoperante" | "em_manutencao" | "em_reparo" | "reserva";
export type StatusManutencao = "pendente" | "em_andamento" | "concluida" | "cancelada";
export type TipoCombustivel = "Gasolina" | "Diesel" | "Etanol" | "Gás" | "Elétrico";
export type TipoMovimentacaoTanque = "entrada" | "saida";

// --- Entidades Principais ---

export interface Perfil {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
}

export interface Motorista {
  id: string;
  nome: string;
  matricula: string;
  senha?: string; 
}

export interface Veiculo {
  id: string;
  nome: string;
  ano: number;
  placa: string;
  cartao: string | null;
  status: StatusVeiculo;
  anotacoes: string | null;
  tipo_combustivel: string;
  // Auxiliar para o frontend saber de onde veio (viaturas vs maquinario)
  origem?: "viatura" | "maquinario"; 
}

export interface Abastecimento {
  id: string;
  data: string; 
  veiculo: string;
  placa: string;
  cartao: string | null;
  motorista: string;
  matricula: string;
  quantidade_litros: number;
  valor_reais: number;
  semana: number;
  mes: number;
  ano: number;
  odometro: number | null;
  km_percorridos: number | null;
  media_km_l: number | null;
  posto: string | null;
}

export interface Manutencao {
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

export interface Tanque {
  id: string;
  nome: string;
  capacidade_litros: number;
  litros_atuais: number;
  tipo_combustivel: string;
}

// --- Tipos Auxiliares para Selects e Formulários ---
export interface VeiculoSelecao {
  placa: string;
  nome: string;
  cartao: string | null;
}

export interface MotoristaSelecao {
  matricula: string;
  nome: string;
}

export interface PostoSelecao {
  id: string;
  nome: string;
}
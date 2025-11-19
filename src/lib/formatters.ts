// src/lib/formatters.ts

export const formatCurrency = (value: number, precise = false) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    // Para valores monetários (totais), usamos 2 casas.
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  
  // Correção de Fuso Horário para datas YYYY-MM-DD
  // Força a exibição exata da string, sem conversão de timezone do navegador
  if (dateString.includes('-') && dateString.length === 10) {
     const [year, month, day] = dateString.split('-');
     return `${day}/${month}/${year}`;
  }
  
  return new Date(dateString).toLocaleDateString("pt-BR");
};

export const formatNumber = (value: number, decimals = 4) => {
  // O padrão agora é 4 casas decimais para Litros e Médias, para maior precisão.
  const finalDecimals = decimals;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: finalDecimals,
    maximumFractionDigits: finalDecimals,
  }).format(value);
};

// NOVO FORMATTER PARA PREÇO UNITÁRIO (R$/L), COM MÍNIMO DE 3 E MÁXIMO DE 4 CASAS.
export const formatUnitPrice = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  }).format(value);
};
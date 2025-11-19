// src/lib/formatters.ts

export const formatCurrency = (value: number, precise = false) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: precise ? 4 : 2,
    maximumFractionDigits: precise ? 4 : 2,
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

export const formatNumber = (value: number, decimals = 2) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};
// src/lib/formatters.ts

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  
  // Correção de Fuso Horário:
  // Se a data vier no formato YYYY-MM-DD (ex: 2025-11-13),
  // fazemos o parse manual para evitar que o navegador converta para o dia anterior.
  if (dateString.includes('-') && dateString.length === 10) {
     const [year, month, day] = dateString.split('-');
     return `${day}/${month}/${year}`;
  }
  
  // Fallback para outros formatos
  return new Date(dateString).toLocaleDateString("pt-BR");
};

export const formatNumber = (value: number, decimals = 2) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};
// src/lib/formatters.ts

// Formata valores monetários (R$)
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Formata números decimais (Litros, Km, Médias)
export const formatNumber = (value: number, decimals = 4) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Formata preço unitário (ex: R$ 5,899)
export const formatUnitPrice = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  }).format(value);
};

/**
 * Formata uma data de forma segura contra Timezones.
 * Se a data for "YYYY-MM-DD", exibe exatamente esse dia.
 * Se for ISO com hora, converte para local.
 */
export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  
  // Se a string for exatamente YYYY-MM-DD (10 chars), evitamos o new Date() direto
  // para não sofrer com o fuso horário UTC vs Local.
  if (dateString.length === 10 && dateString.includes('-')) {
     const [year, month, day] = dateString.split('-');
     return `${day}/${month}/${year}`;
  }
  
  // Para timestamps completos (com hora), usamos a conversão padrão
  try {
    return new Date(dateString).toLocaleDateString("pt-BR");
  } catch (e) {
    return dateString; // Fallback se a data for inválida
  }
};

/**
 * Função auxiliar para formulários.
 * Pega numa data YYYY-MM-DD e garante que obtemos o número da semana correto,
 * evitando problemas de fuso horário ao instanciar o objeto Date.
 */
export const getDateObjectForWeekCalculation = (dateString: string): Date => {
  // Cria a data ao meio-dia (12:00) para garantir que qualquer desvio de fuso horário
  // (que raramente é maior que 12h) não mude o dia da semana ou do mês.
  const [ano, mes, dia] = dateString.split("-").map(Number);
  return new Date(ano, mes - 1, dia, 12, 0, 0);
};
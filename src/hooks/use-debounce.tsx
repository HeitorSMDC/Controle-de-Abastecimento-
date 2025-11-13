// src/hooks/use-debounce.tsx

import { useState, useEffect } from 'react';

/**
 * Hook customizado para "atrasar" a atualização de um valor.
 * Muito útil para evitar pedidos de API a cada tecla digitada numa busca.
 * @param value O valor que queres "atrasar" (ex: o termo de busca)
 * @param delay O tempo em milissegundos para esperar (ex: 500)
 * @returns O valor "atrasado"
 */
export function useDebounce<T>(value: T, delay: number): T {
  // Estado para guardar o valor "atrasado"
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Cria um "timer" que só vai atualizar o 'debouncedValue'
    // depois que o 'delay' (tempo de espera) passar
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Esta é a parte mágica:
    // Se o 'value' mudar (utilizador digitou outra letra),
    // o useEffect é re-executado e limpa o "timer" anterior.
    // Um novo "timer" é criado.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Só re-executa se o 'value' ou o 'delay' mudarem

  // Retorna o último valor estável
  return debouncedValue;
}
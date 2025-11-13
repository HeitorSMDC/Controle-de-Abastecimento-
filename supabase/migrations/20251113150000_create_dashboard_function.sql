-- supabase/migrations/20251113150000_create_dashboard_function.sql

create or replace function get_dashboard_stats(ano_selecionado int)
returns jsonb
language plpgsql
as $$
declare
  stats jsonb;
begin
  select
    jsonb_build_object(
      'total_gasto_ano',
      coalesce(sum(valor_reais), 0),
      'total_litros_ano',
      coalesce(sum(quantidade_litros), 0),
      'total_registros_ano',
      count(*),
      'gasto_medio_por_litro',
      coalesce(sum(valor_reais) / nullif(sum(quantidade_litros), 0), 0),
      
      'gastos_por_mes',
      (
        select
          jsonb_agg(
            jsonb_build_object(
              'mes', mes_numero,
              'mes_nome', mes_nome,
              'total', total_gasto
            )
          )
        from (
          select
            g.mes_numero,
            to_char(to_timestamp(g.mes_numero::text, 'MM'), 'TMMonth') as mes_nome, -- 'TMMonth' remove espaços
            coalesce(sum(ca.valor_reais), 0) as total_gasto
          from
            generate_series(1, 12) as g(mes_numero) -- Gera todos os 12 meses
          left join
            public.controle_abastecimento as ca
            on g.mes_numero = ca.mes and ca.ano = ano_selecionado
          group by
            g.mes_numero
          order by
            g.mes_numero
        ) as gastos_mensais
      ),

      'gastos_por_veiculo',
      (
        select
          jsonb_agg(
            jsonb_build_object(
              'nome', veiculo,
              'total', total_gasto
            )
          )
        from (
          select
            veiculo,
            sum(valor_reais) as total_gasto
          from
            public.controle_abastecimento
          where
            ano = ano_selecionado
          group by
            veiculo
          order by
            total_gasto desc
          limit 10 -- Pega os 10 veículos com mais gastos
        ) as gastos_veiculos
      )
    )
  into
    stats
  from
    public.controle_abastecimento
  where
    ano = ano_selecionado;

  return stats;
end;
$$;
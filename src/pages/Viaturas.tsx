// src/pages/Viaturas.tsx

import { Layout } from "@/components/Layout";
import { GerenciadorDeVeiculos } from "@/components/GerenciadorDeVeiculos";

export default function Viaturas() {
  return (
    <Layout>
      <GerenciadorDeVeiculos
        supabaseTable="viaturas"
        title="Viaturas"
        itemNome="Viatura"
      />
    </Layout>
  );
}
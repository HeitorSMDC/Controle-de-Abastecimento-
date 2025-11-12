// src/pages/Maquinario.tsx

import { Layout } from "@/components/Layout";
import { GerenciadorDeVeiculos } from "@/components/GerenciadorDeVeiculos";

export default function Maquinario() {
  return (
    <Layout>
      <GerenciadorDeVeiculos
        supabaseTable="maquinario"
        title="Maquinário"
        itemNome="Maquinário"
      />
    </Layout>
  );
}
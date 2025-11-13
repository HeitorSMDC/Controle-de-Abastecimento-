// src/pages/Maquinario.tsx

import { Layout } from "@/components/Layout";
import { GerenciadorDeVeiculos } from "@/components/GerenciadorDeVeiculos";
import { Truck } from "lucide-react"; // NOVO: Importar o ícone

export default function Maquinario() {
  return (
    <Layout>
      <GerenciadorDeVeiculos
        supabaseTable="maquinario"
        title="Maquinário"
        itemNome="Maquinário"
        icon={Truck} // NOVO: Passar o ícone como prop
      />
    </Layout>
  );
}
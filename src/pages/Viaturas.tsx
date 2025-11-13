// src/pages/Viaturas.tsx

import { Layout } from "@/components/Layout";
import { GerenciadorDeVeiculos } from "@/components/GerenciadorDeVeiculos";
import { Car } from "lucide-react"; // NOVO: Importar o ícone

export default function Viaturas() {
  return (
    <Layout>
      <GerenciadorDeVeiculos
        supabaseTable="viaturas"
        title="Viaturas"
        itemNome="Viatura"
        icon={Car} // NOVO: Passar o ícone como prop
      />
    </Layout>
  );
}
// src/components/cards/MotoristaCard.tsx

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/PasswordField";
import { Pencil, Users } from "lucide-react";

// Nota: Duplicamos a interface aqui para manter o componente simples.
// No futuro, poderíamos mover isto para um ficheiro 'src/lib/types.ts'.
interface Motorista {
  id: string;
  nome: string;
  matricula: string;
  senha: string;
}

interface MotoristaCardProps {
  motorista: Motorista;
  onEdit: () => void; // Função para chamar o Dialog de edição
  deleteAction: React.ReactNode; // O Botão de Apagar (com o AlertDialog já configurado)
}

export function MotoristaCard({ motorista, onEdit, deleteAction }: MotoristaCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{motorista.nome}</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Matrícula</p>
          <p className="text-sm">{motorista.matricula}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Senha (Anotação)</p>
          {/* Usamos o PasswordField aqui também para consistência */}
          <PasswordField
            value={motorista.senha}
            onChange={() => {}}
            placeholder="••••••••"
          />
        </div>
        
        {/* Ações (Editar e Apagar) */}
        <div className="flex w-full gap-2 pt-2">
          <Button variant="outline" size="sm" className="w-full" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          {/* O deleteAction já é o botão com o AlertDialog vindo da página principal */}
          {deleteAction}
        </div>
      </CardContent>
    </Card>
  );
}
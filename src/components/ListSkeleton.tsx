// src/components/ListSkeleton.tsx

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Skeleton para um único Card (versão mobile)
 */
function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <div className="flex w-full gap-2 pt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton para a Tabela (versão desktop)
 */
function DesktopTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><Skeleton className="h-5 w-24" /></TableHead>
          <TableHead><Skeleton className="h-5 w-20" /></TableHead>
          <TableHead><Skeleton className="h-5 w-40" /></TableHead>
          <TableHead><Skeleton className="h-5 w-24" /></TableHead>
          <TableHead><Skeleton className="h-5 w-16" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Renderiza 5 linhas de skeleton */}
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Componente principal de Skeleton que decide entre Mobile ou Desktop
 */
export function ListSkeleton() {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className="p-4">
        {/* Skeleton for the search bar */}
        <Skeleton className="h-10 w-full md:w-1/3" />
      </CardHeader>
      <CardContent className="p-0">
        {isMobile ? (
          <div className="space-y-4 p-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <DesktopTableSkeleton />
        )}
      </CardContent>
    </Card>
  );
}
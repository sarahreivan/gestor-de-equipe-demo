import { parseLocalDate, formatDateBR } from "@/lib/dates";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, Eye, ArrowLeft, Search, Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { FeriasTabs } from "@/components/FeriasTabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/StatusBadge";
import { useColaboradores, useFerias } from "@/lib/db";

export const Route = createFileRoute("/ferias/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de Férias — Gestor de Equipe" },
      {
        name: "description",
        content:
          "Consulta individual do histórico completo de períodos de férias de um colaborador.",
      },
      { property: "og:title", content: "Histórico de Férias — Gestor de Equipe" },
      { property: "og:description", content: "Consulta individual do histórico completo de períodos de férias de um colaborador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoricoFeriasPage,
});

function normalize(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.\-\s]/g, "");
}

function HistoricoFeriasPage() {
  const [busca, setBusca] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: colaboradores = [] } = useColaboradores();
  const { data: ferias = [], isLoading } = useFerias();

  const lista = useMemo(() => {
    const q = normalize(busca);
    return colaboradores
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      .filter((c) => {
        if (!q) return true;
        return normalize(c.nome).includes(q) || normalize(c.cpf).includes(q);
      });
  }, [colaboradores, busca]);

  const selecionado = useMemo(
    () => colaboradores.find((c) => c.id === selectedId) ?? null,
    [colaboradores, selectedId],
  );

  const historico = useMemo(() => {
    if (!selectedId) return [];
    return ferias
      .filter((f) => f.colaboradorId === selectedId)
      .slice()
      .sort((a, b) => {
        const da = parseLocalDate(a.inicio)?.getTime() ?? 0;
        const db = parseLocalDate(b.inicio)?.getTime() ?? 0;
        return db - da;
      });
  }, [ferias, selectedId]);

  return (
    <div>
      <PageHeader
        title="Férias"
        description="Períodos de férias dos colaboradores."
        breadcrumbs={[{ label: "Início", to: "/" }, { label: "Férias" }, { label: "Histórico" }]}
      />
      <FeriasTabs />

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-4 space-y-4">
          {!selecionado ? (
            <>
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar colaborador por nome ou CPF..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60">
                      <TableHead>Colaborador</TableHead>
                      <TableHead className="w-[120px] text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="p-0">
                          <EmptyState
                            compact
                            icon={Users}
                            title="Nenhum colaborador encontrado"
                            description="Ajuste a busca para localizar um colaborador."
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      lista.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="py-3 font-medium">{c.nome}</TableCell>
                          <TableCell className="py-3 text-center">
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => setSelectedId(c.id)}
                                    aria-label="Ver histórico"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver histórico</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Info label="Nome" value={selecionado.nome} />
                  <Info label="CPF" value={selecionado.cpf || "—"} />
                  <Info
                    label="Vínculo"
                    value={<StatusBadge value={selecionado.vinculo} />}
                  />
                  <Info label="Cargo" value={selecionado.cargo || "—"} />
                </div>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Carregando histórico…
                </div>
              ) : historico.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Nenhum histórico de férias"
                  description="Ainda não existem períodos de férias cadastrados para este colaborador."
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {historico.map((f) => (
                    <Card key={f.id} className="border-border/70">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            {f.periodoGozo ? `Período aquisitivo ${f.periodoGozo}` : "Período de férias"}
                          </div>
                          <StatusBadge value={f.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <Info label="Início" value={formatDateBR(f.inicio)} />
                          <Info label="Término" value={formatDateBR(f.termino)} />
                          <Info label="Dias" value={String(f.dias ?? 0)} />
                          <Info label="Nº do processo" value={f.numeroProcesso || "—"} />
                        </div>


                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

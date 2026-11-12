import { formatDateBR } from "@/lib/dates";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Eye, Search, CalendarDays, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { FeriasTabs } from "@/components/FeriasTabs";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useColaboradores, useFerias, useDeleteFerias } from "@/lib/db";

export const Route = createFileRoute("/ferias/")({
  head: () => ({
    meta: [
      { title: "Férias — Gestor de Equipe" },
      { name: "description", content: "Gestão e acompanhamento de períodos de férias dos colaboradores." },
      { property: "og:title", content: "Férias — Gestor de Equipe" },
      { property: "og:description", content: "Gestão e acompanhamento de períodos de férias dos colaboradores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeriasPage,
});

function normalize(v: string) {
  return v.toLowerCase().replace(/[.\-\s]/g, "");
}

function FeriasPage() {
  const [busca, setBusca] = useState("");
  const { data: ferias = [], isLoading } = useFerias();
  const { data: colaboradores = [] } = useColaboradores();
  const del = useDeleteFerias();

  const colabIndex = useMemo(() => {
    const m = new Map<string, (typeof colaboradores)[number]>();
    colaboradores.forEach((c) => m.set(c.id, c));
    return m;
  }, [colaboradores]);

  const lista = useMemo(() => {
    const q = normalize(busca);
    return ferias
      .map((f) => ({ ...f, colaborador: colabIndex.get(f.colaboradorId) }))
      .filter((f) => {
        if (!q) return true;
        const nomeOk = f.colaborador && normalize(f.colaborador.nome).includes(q);
        const cpfOk = f.colaborador && normalize(f.colaborador.cpf).includes(q);
        return nomeOk || cpfOk;
      });
  }, [busca, ferias, colabIndex]);

  return (
    <div>
      <PageHeader
        title="Férias"
        description="Períodos de férias dos colaboradores."
        breadcrumbs={[{ label: "Início", to: "/" }, { label: "Férias" }]}
        actions={
          <Button asChild variant="success">
            <Link to="/ferias/nova"><Plus className="mr-1.5 h-4 w-4" /> Nova férias</Link>
          </Button>
        }
      />
      <FeriasTabs />

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-4">
          <div className="mb-4 relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="text-left">Nome</TableHead>
                  <TableHead className="w-[130px] text-left">CPF</TableHead>
                  <TableHead className="w-[120px] text-center">Vínculo</TableHead>
                  <TableHead className="text-left">Cargo</TableHead>
                  <TableHead className="w-[130px] text-center">Período aquisitivo</TableHead>
                  <TableHead className="w-[190px] text-center">Gozo das férias</TableHead>
                  <TableHead className="w-[70px] text-center">Dias</TableHead>
                  <TableHead className="w-[170px] text-left">Nº do processo</TableHead>
                  <TableHead className="w-[120px] text-center">Status</TableHead>
                  <TableHead className="w-[100px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">Carregando…</TableCell></TableRow>
                ) : lista.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="p-0">
                    <EmptyState
                      compact
                      icon={CalendarDays}
                      title="Nenhum período de férias encontrado"
                      description={busca ? "Ajuste a busca para localizar um registro." : "Cadastre um novo período pelo botão \"Nova férias\"."}
                    />
                  </TableCell></TableRow>
                ) : lista.map((f) => {
                  const anoAquisitivo = (f.periodoGozo?.match(/\d{4}/g) ?? []).pop() ?? (f.periodoGozo || "—");
                  const gozo = f.inicio || f.termino
                    ? `${formatDateBR(f.inicio)} — ${formatDateBR(f.termino)}`
                    : "—";
                  return (
                    <TableRow key={f.id} className="align-middle">
                      <TableCell className="py-3 font-medium">{f.colaborador?.nome ?? "—"}</TableCell>
                      <TableCell className="py-3 text-muted-foreground">{f.colaborador?.cpf ?? "—"}</TableCell>
                      <TableCell className="py-3 text-center">
                        {f.colaborador && <StatusBadge value={f.colaborador.vinculo} />}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">{f.colaborador?.cargo || "—"}</TableCell>
                      <TableCell className="py-3 text-center font-medium tabular-nums">{anoAquisitivo}</TableCell>
                      <TableCell className="py-3 text-center whitespace-nowrap tabular-nums">{gozo}</TableCell>
                      <TableCell className="py-3 text-center tabular-nums">{f.dias}</TableCell>
                      <TableCell className="py-3 tabular-nums text-muted-foreground">{f.numeroProcesso || "—"}</TableCell>
                      <TableCell className="py-3 text-center"><StatusBadge value={f.status} /></TableCell>
                      <TableCell className="py-3">
                        <div className="flex justify-center gap-1">
                          {f.colaborador && (
                            <Button asChild size="icon" variant="ghost">
                              <Link to="/colaboradores/$id" params={{ id: f.colaborador.id }} aria-label="Visualizar">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          <Button asChild size="icon" variant="ghost">
                            <Link to="/ferias/$id/editar" params={{ id: f.id }} aria-label="Editar">
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button size="icon" variant="ghost" aria-label="Excluir" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            title="Excluir registro de férias"
                            description="Têm certeza que deseja excluir este registro de férias?"
                            confirmLabel="Excluir"
                            cancelLabel="Cancelar"
                            destructive
                            onConfirm={() =>
                              del.mutate(f.id, {
                                onSuccess: () => toast.success("Registro excluído."),
                                onError: (err) => toast.error(`Erro: ${(err as Error).message}`),
                              })
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

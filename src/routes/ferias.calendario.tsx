import { parseLocalDate } from "@/lib/dates";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FeriasTabs } from "@/components/FeriasTabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FeriasMonthGrid } from "@/components/FeriasMonthGrid";
import { useColaboradores, useFerias } from "@/lib/db";
import { FERIAS_STATUS, VINCULOS } from "@/lib/mock-data";
import type { Ferias, Colaborador } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ferias/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário de Férias — Gestor de Equipe" },
      { name: "description", content: "Visualização mensal dos períodos de férias dos colaboradores." },
      { property: "og:title", content: "Calendário de Férias — Gestor de Equipe" },
      { property: "og:description", content: "Visualização mensal dos períodos de férias dos colaboradores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarioFeriasPage,
});

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
function CalendarioFeriasPage() {
  const now = new Date();
  const [mes, setMes] = useState<number>(now.getMonth());
  const [ano, setAno] = useState<number>(now.getFullYear());
  const [vinculoFiltro, setVinculoFiltro] = useState<string>("todos");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");

  const { data: ferias = [] } = useFerias();
  const { data: colaboradores = [] } = useColaboradores();

  const colabIdx = useMemo(() => {
    const m = new Map<string, Colaborador>();
    colaboradores.forEach((c) => m.set(c.id, c));
    return m;
  }, [colaboradores]);

  const anosDisponiveis = useMemo(() => {
    const set = new Set<number>([now.getFullYear()]);
    ferias.forEach((f) => {
      const i = parseLocalDate(f.inicio); const t = parseLocalDate(f.termino);
      if (i) set.add(i.getFullYear());
      if (t) set.add(t.getFullYear());
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [ferias, now]);

  const filtradas = useMemo(() => {
    return ferias.filter((f) => {
      const c = colabIdx.get(f.colaboradorId);
      if (vinculoFiltro !== "todos" && c?.vinculo !== vinculoFiltro) return false;
      if (statusFiltro !== "todos" && f.status !== statusFiltro) return false;
      return true;
    });
  }, [ferias, colabIdx, vinculoFiltro, statusFiltro]);

  const totalDias = new Date(ano, mes + 1, 0).getDate();

  const monthStart = new Date(ano, mes, 1);
  const monthEnd = new Date(ano, mes, totalDias, 23, 59, 59);

  const periodos = useMemo(() => {
    return filtradas
      .map((f) => {
        const ini = parseLocalDate(f.inicio);
        const fim = parseLocalDate(f.termino);
        if (!ini || !fim) return null;
        if (fim < monthStart || ini > monthEnd) return null;
        return { f, ini, fim };
      })
      .filter((x): x is { f: Ferias; ini: Date; fim: Date } => !!x);
  }, [filtradas, monthStart, monthEnd]);

  function prevMes() {
    if (mes === 0) { setMes(11); setAno(ano - 1); } else setMes(mes - 1);
  }
  function nextMes() {
    if (mes === 11) { setMes(0); setAno(ano + 1); } else setMes(mes + 1);
  }

  // Legenda: vínculos visíveis (usa lista canônica, mas destaca os que aparecem no mês).
  const vinculosNoMes = new Set(
    periodos.map(({ f }) => colabIdx.get(f.colaboradorId)?.vinculo).filter(Boolean) as string[],
  );

  return (
      <div>
        <PageHeader
          title="Férias"
          description="Visualização mensal dos períodos de férias."
          breadcrumbs={[{ label: "Início", to: "/" }, { label: "Férias" }, { label: "Calendário" }]}
        />
        <FeriasTabs />

        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="space-y-4 p-4">
            {/* Filtros — altura e alinhamento uniformes */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-9 w-9" onClick={prevMes} aria-label="Mês anterior">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-9 w-9" onClick={nextMes} aria-label="Próximo mês">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => (<SelectItem key={m} value={String(i)}>{m}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map((a) => (<SelectItem key={a} value={String(a)}>{a}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={vinculoFiltro} onValueChange={setVinculoFiltro}>
                <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Vínculo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os vínculos</SelectItem>
                  {VINCULOS.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  {FERIAS_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {/* Legenda de cores por vínculo */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm">
              <span className="font-semibold uppercase tracking-wide text-muted-foreground">Legenda</span>
              {VINCULOS.map((v) => {
                const ativo = vinculosNoMes.has(v);
                return (
                  <span
                    key={v}
                    data-vinculo={v}
                    data-active={ativo}
                    className={cn(
                      "vacation-tone inline-flex items-center gap-2.5",
                    )}
                  >
                    <span className="vacation-dot inline-block h-3.5 w-3.5 shrink-0 rounded-full" />
                    <span className="text-foreground">{v === "Estágio" ? "Estagiário" : v}</span>
                  </span>
                );
              })}
            </div>

            <FeriasMonthGrid
              vacations={filtradas}
              collaborators={colabIdx}
              year={ano}
              month={mes}
              today={now}
            />

            {periodos.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Nenhum período de férias neste mês para os filtros selecionados.
              </div>
            )}
          </CardContent>
        </Card>

      </div>
  );
}

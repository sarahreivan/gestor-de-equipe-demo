import { formatDateBR, formatLocalDateISO } from "@/lib/dates";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Users, GraduationCap, CalendarClock, AlertTriangle, RefreshCw, Download, Eye,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { diasRestantes, VINCULOS } from "@/lib/mock-data";
import { pessoasComEstagioVigente, useColaboradores, useEstagios, useFerias } from "@/lib/db";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardCsvBlob, dashboardExcelBlob } from "@/lib/dashboard-export";
import { deliverFile } from "@/lib/download";
import { toast } from "sonner";




export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gestor de Equipe" },
      { name: "description", content: "Painel executivo de contratos, estágios e férias da equipe." },
      { property: "og:title", content: "Dashboard — Gestor de Equipe" },
      { property: "og:description", content: "Painel executivo de contratos, estágios e férias da equipe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});




type Periodo = "30d" | "90d" | "ano" | "todos";

// Pastel badge for "Situação" — uniform shape, neutral text, only background varies
type Tone = "success" | "warning" | "info" | "danger" | "muted";
const toneClass: Record<Tone, string> = {
  success: "bg-emerald-100 text-slate-800 ring-emerald-200",
  warning: "bg-amber-100 text-slate-800 ring-amber-200",
  info: "bg-sky-100 text-slate-800 ring-sky-200",
  danger: "bg-rose-100 text-slate-800 ring-rose-200",
  muted: "bg-slate-100 text-slate-700 ring-slate-200",
};
function PastelBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center justify-center rounded-full px-2.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}
function situacaoTone(s: string): Tone {
  const v = s.toLowerCase();
  if (v === "vencido") return "danger";
  if (v === "vencendo" || v === "confirmada") return "warning";
  if (v === "planejada") return "info";
  if (v === "vigente" || v === "realizada") return "success";
  return "muted";
}
function tipoTone(t: string): Tone {
  if (t === "Estágio") return "info";
  if (t === "Férias") return "success";
  return "muted";
}

function DashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>("90d");
  const [vinculo, setVinculo] = useState<string>("todos");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const qc = useQueryClient();

  const { data: colaboradores = [] } = useColaboradores();
  const { data: estagios = [] } = useEstagios();
  const { data: ferias = [] } = useFerias();

  const colabIndex = useMemo(() => {
    const m = new Map<string, (typeof colaboradores)[number]>();
    colaboradores.forEach((c) => m.set(c.id, c));
    return m;
  }, [colaboradores]);

  const filtros = useMemo(() => {
    const colabs = colaboradores.filter((c) => {
      if (vinculo !== "todos" && c.vinculo !== vinculo) return false;
      if (statusFiltro !== "todos" && c.status !== statusFiltro) return false;
      return true;
    });
    const colabIds = new Set(colabs.map((c) => c.id));
    const inWindow = (dataIso: string) => {
      if (!dataIso) return false;
      if (periodo === "todos") return true;
      const dias = { "30d": 30, "90d": 90, "ano": 365 }[periodo];
      const d = diasRestantes(dataIso);
      return Math.abs(d) <= dias;
    };
    return {
      colabs,
      ests: estagios.filter((e) => colabIds.has(e.colaboradorId) && inWindow(e.termino)),
      fers: ferias.filter((f) => colabIds.has(f.colaboradorId) && inWindow(f.inicio)),
    };
  }, [periodo, vinculo, statusFiltro, colaboradores, estagios, ferias]);

  const ativos = filtros.colabs.filter((c) => c.status === "Ativo").length;
  const estagiarios = filtros.colabs.filter((c) => c.vinculo === "Estágio" && c.status === "Ativo").length;
  const feriasProgramadas = filtros.fers.filter((f) => f.status === "Planejada" || f.status === "Confirmada").length;
  // O contrato define se ainda há vencimento a acompanhar.
  const vencendo30 = filtros.ests.filter((e) => {
    if (e.status === "Encerrado" || e.status === "Renovado") return false;
    const d = diasRestantes(e.termino);
    return d >= 0 && d <= 30;
  }).length;


  const kpis = [
    { label: "Colaboradores ativos", value: ativos, icon: Users, tone: "primary" as const },
    { label: "Estagiários ativos", value: estagiarios, icon: GraduationCap, tone: "info" as const },
    { label: "Férias programadas", value: feriasProgramadas, icon: CalendarClock, tone: "success" as const },
    { label: "Contratos vencendo em 30 dias", value: vencendo30, icon: AlertTriangle, tone: "warning" as const },
  ];




  

  // Próximas férias — apenas futuras, ordenadas pela data de início
  const proximasFerias = useMemo(() => {
    const comVinculoVigente = pessoasComEstagioVigente(estagios);
    return filtros.fers
      .filter((f) => {
        const c = colabIndex.get(f.colaboradorId);
        return !!c && (c.status !== "Desligado" || comVinculoVigente.has(f.colaboradorId));
      })
      .filter((f) => f.status === "Planejada" || f.status === "Confirmada")
      .filter((f) => f.inicio && diasRestantes(f.inicio) >= 0)
      .filter((f) => !f.termino || diasRestantes(f.termino) >= 0)
      .map((f) => ({
        id: f.id,
        nome: colabIndex.get(f.colaboradorId)?.nome ?? "—",
        inicio: f.inicio,
        dias: diasRestantes(f.inicio),
      }))
      .sort((a, b) => a.dias - b.dias)
      .slice(0, 8);
  }, [filtros.fers, colabIndex, estagios]);


  // Contratos de estágio vigentes ordenados por dias restantes (asc).
  // Deduplica por colaboradorId (1 estagiário = 1 contrato) para neutralizar
  // eventuais linhas duplicadas retornadas pela tabela `estagios`.
  const estagiosVencimento = useMemo(() => {
    const porPessoa = new Map<string, { id: string; nome: string; instituicao: string; termino: string; dias: number }>();
    filtros.ests
      .filter((e) => colabIndex.get(e.colaboradorId)?.status !== "Desligado")
      .filter((e) => e.status === "Vigente" || e.status === "Vencendo")
      .filter((e) => e.termino && diasRestantes(e.termino) >= 0)
      .forEach((e) => {
        const dias = diasRestantes(e.termino);
        const atual = porPessoa.get(e.colaboradorId);
        if (!atual || dias < atual.dias) {
          porPessoa.set(e.colaboradorId, {
            id: e.id,
            nome: colabIndex.get(e.colaboradorId)?.nome ?? "—",
            instituicao: e.instituicao ?? "—",
            termino: e.termino,
            dias,
          });
        }
      });
    return Array.from(porPessoa.values())
      .sort((a, b) => a.dias - b.dias)
      .slice(0, 10);
  }, [filtros.ests, colabIndex]);


  const alertas = useMemo(() => {
    const alerts: { id: string; tipo: "Estágio" | "Férias"; recordId: string; nome: string; situacao: string; data: string; dias: number }[] = [];
    filtros.ests.forEach((e) => {
      const c = colabIndex.get(e.colaboradorId);
      if (!c || c.status === "Desligado") return;
      if (e.status === "Renovado" || e.status === "Encerrado") return;
      if (!e.termino) return;
      const d = diasRestantes(e.termino);
      if (d >= 0 && d <= 30) {
        alerts.push({ id: `e-${e.id}`, tipo: "Estágio", recordId: e.id, nome: c.nome, situacao: "Vencendo", data: e.termino, dias: d });
      } else if (d < 0) {
        alerts.push({ id: `e-${e.id}`, tipo: "Estágio", recordId: e.id, nome: c.nome, situacao: "Vencido", data: e.termino, dias: d });
      }
    });
    filtros.fers
      .filter((f) => f.status === "Planejada" || f.status === "Confirmada")
      .forEach((f) => {
        const c = colabIndex.get(f.colaboradorId);
        if (!c || c.status === "Desligado") return;
        if (!f.inicio) return;
        if (f.termino && diasRestantes(f.termino) < 0) return; // período já encerrado
        const d = diasRestantes(f.inicio);
        alerts.push({ id: `f-${f.id}`, tipo: "Férias", recordId: f.id, nome: c.nome, situacao: f.status, data: f.inicio, dias: d });
      });
    return alerts.sort((a, b) => Math.abs(a.dias) - Math.abs(b.dias)).slice(0, 12);
  }, [filtros, colabIndex]);


  const exportData = useMemo(() => ({
    alertas, estagios: estagiosVencimento, ferias: proximasFerias,
    filters: {
      periodo: { "30d": "Últimos / próximos 30 dias", "90d": "Últimos / próximos 90 dias", ano: "Últimos / próximos 12 meses", todos: "Todos os períodos" }[periodo],
      vinculo: vinculo === "todos" ? "Todos os vínculos" : vinculo,
      status: statusFiltro === "todos" ? "Todos os status" : statusFiltro,
    },
  }), [alertas, estagiosVencimento, proximasFerias, periodo, vinculo, statusFiltro]);
  const [excelFile, setExcelFile] = useState<{ data: typeof exportData; blob: Blob; filename: string } | null>(null);
  const [excelError, setExcelError] = useState(false);
  const [exportRetry, setExportRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setExcelError(false);
    dashboardExcelBlob(exportData).then((blob) => {
      if (active) setExcelFile({ data: exportData, blob, filename: `Dashboard_Equipe_${formatLocalDateISO(new Date())}.xlsx` });
    }).catch(() => { if (active) setExcelError(true); });
    return () => { active = false; };
  }, [exportData, exportRetry]);
  const excelReady = excelFile?.data === exportData;
  const exportarExcel = () => {
    if (excelError) { setExportRetry((value) => value + 1); return; }
    if (!excelFile || !excelReady) return;
    void deliverFile(excelFile.blob, excelFile.filename).catch(() => toast.error("Não foi possível baixar o Excel. Tente novamente."));
  };
  const exportar = () => {
    void deliverFile(dashboardCsvBlob(exportData), `Dashboard_Equipe_${formatLocalDateISO(new Date())}.csv`).catch(() => toast.error("Não foi possível baixar o CSV. Tente novamente."));
  };


  return (
    <TooltipProvider delayDuration={0}>
      <div>
        <PageHeader
        title="Dashboard executivo"
        description="Visão consolidada e indicadores para apoio à decisão."
        breadcrumbs={[{ label: "Início", to: "/" }, { label: "Dashboard" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries()}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={exportar}>
              <Download className="mr-1.5 h-4 w-4" /> Exportar CSV
            </Button>
            <Button variant="success" size="sm" onClick={exportarExcel} disabled={!excelReady && !excelError}>
              <Download className="mr-1.5 h-4 w-4" /> {excelError ? "Tentar Excel novamente" : excelReady ? "Exportar Excel" : "Preparando Excel…"}
            </Button>
          </div>
        }
      />

      {/* Filtros globais */}
      <Card className="mb-6 shadow-[var(--shadow-card)]">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Período</label>
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Últimos / próximos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos / próximos 90 dias</SelectItem>
                <SelectItem value="ano">Últimos / próximos 12 meses</SelectItem>
                <SelectItem value="todos">Todos os períodos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Vínculo</label>
            <Select value={vinculo} onValueChange={setVinculo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os vínculos</SelectItem>
                {VINCULOS.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Férias">Férias</SelectItem>
                <SelectItem value="Afastado">Afastado</SelectItem>
                <SelectItem value="Licença">Licença</SelectItem>
                <SelectItem value="Desligado">Desligado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((c) => (
          <Card key={c.label} className="shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{c.value}</p>
              </div>
              <div className={`rounded-lg p-2 ${toneBg(c.tone)}`}>
                <c.icon className={`h-5 w-5 ${toneFg(c.tone)}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas operacionais */}
      <Card className="mt-6 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Alertas operacionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertas.length === 0 ? (
            <EmptyState
              compact
              icon={AlertTriangle}
              title="Nenhuma pendência operacional"
              description="Nenhum contrato de estágio ou período de férias exige atenção no período selecionado."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="w-[110px]">Tipo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[140px]">Situação</TableHead>
                    <TableHead className="w-[130px]">Data</TableHead>
                    <TableHead className="w-[160px]">Dias restantes</TableHead>
                    <TableHead className="w-[72px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.map((a) => (
                    <TableRow key={a.id} className="align-middle">
                      <TableCell><PastelBadge tone={tipoTone(a.tipo)}>{a.tipo}</PastelBadge></TableCell>
                      <TableCell className="font-medium text-slate-800">{a.nome}</TableCell>
                      <TableCell><PastelBadge tone={situacaoTone(a.situacao)}>{a.situacao}</PastelBadge></TableCell>
                      <TableCell className="tabular-nums text-slate-700">
                        {formatDateBR(a.data)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <PastelBadge
                          tone={a.dias < 0 ? "danger" : a.dias <= 15 ? "warning" : a.dias <= 30 ? "info" : "muted"}
                        >
                          {a.dias < 0 ? `${Math.abs(a.dias)} dias atrasado` : `${a.dias} dias`}
                        </PastelBadge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                              {a.tipo === "Estágio" ? (
                                <Link to="/estagios/$id/editar" params={{ id: a.recordId }} aria-label="Abrir registro">
                                  <Eye className="h-4 w-4" />
                                </Link>
                              ) : (
                                <Link to="/ferias/$id/editar" params={{ id: a.recordId }} aria-label="Abrir registro">
                                  <Eye className="h-4 w-4" />
                                </Link>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Abrir registro</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contratos de Estágio próximos ao vencimento */}
      <Card className="mt-6 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">Contratos de estágio próximos ao vencimento</CardTitle>
        </CardHeader>
        <CardContent>
          {estagiosVencimento.length === 0 ? (
            <EmptyState
              compact
              icon={GraduationCap}
              title="Nenhum contrato próximo do vencimento"
              description="Nenhum contrato de estágio precisa de atenção no período selecionado."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Instituição</TableHead>
                    <TableHead className="w-[140px]">Término</TableHead>
                    <TableHead className="w-[160px]">Dias restantes</TableHead>
                    <TableHead className="w-[72px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estagiosVencimento.map((e) => (
                    <TableRow key={e.id} className="align-middle">
                      <TableCell className="font-medium">{e.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{e.instituicao}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatDateBR(e.termino)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <PastelBadge
                          tone={e.dias <= 15 ? "danger" : e.dias <= 30 ? "warning" : "success"}
                        >
                          {e.dias === 0 ? "hoje" : `${e.dias} dias`}
                        </PastelBadge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                              <Link to="/estagios/$id/editar" params={{ id: e.id }} aria-label="Abrir registro">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Abrir registro</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximas Férias */}
      <Card className="mt-6 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">Próximas férias</CardTitle>
        </CardHeader>
        <CardContent>
          {proximasFerias.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarClock}
              title="Nenhuma férias programada"
              description="Não há férias programadas no período selecionado."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="w-[160px]">Data de início</TableHead>
                    <TableHead className="w-[160px]">Dias restantes</TableHead>
                    <TableHead className="w-[72px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proximasFerias.map((f) => (
                    <TableRow key={f.id} className="align-middle">
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatDateBR(f.inicio)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <PastelBadge tone={f.dias <= 15 ? "warning" : "info"}>
                          {f.dias === 0 ? "hoje" : `${f.dias} dias`}
                        </PastelBadge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                              <Link to="/ferias/$id/editar" params={{ id: f.id }} aria-label="Abrir registro">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Abrir registro</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      </div>
    </TooltipProvider>
  );
}

function toneBg(t: string) {
  return ({
    primary: "bg-primary/10",
    success: "bg-success/15",
    warning: "bg-warning/20",
    info: "bg-info/15",
    destructive: "bg-destructive/15",
  } as Record<string, string>)[t] ?? "bg-muted";
}
function toneFg(t: string) {
  return ({
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning-foreground",
    info: "text-info",
    destructive: "text-destructive",
  } as Record<string, string>)[t] ?? "text-muted-foreground";
}

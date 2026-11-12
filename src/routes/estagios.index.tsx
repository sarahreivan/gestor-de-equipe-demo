import { parseLocalDate, formatDateBR } from "@/lib/dates";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Search, GraduationCap, AlertTriangle, XCircle, UserMinus } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { EstagiosTabs } from "@/components/EstagiosTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { diasRestantes } from "@/lib/mock-data";
import { sugerirDataRenovacao, useColaboradores, useEstagios } from "@/lib/db";

export const Route = createFileRoute("/estagios/")({
  head: () => ({
    meta: [
      { title: "Estágios — Gestor de Equipe" },
      { name: "description", content: "Acompanhamento de contratos de estágio, vencimentos e renovações." },
      { property: "og:title", content: "Estágios — Gestor de Equipe" },
      { property: "og:description", content: "Acompanhamento de contratos de estágio, vencimentos e renovações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EstagiosPage,
});

function normalize(v: string) {
  return v.toLowerCase().replace(/[.\-\s]/g, "");
}

function situacaoRenovacao(renovacaoIso: string) {
  const renovacao = parseLocalDate(renovacaoIso);
  if (!renovacao) return null;
  const dias = diasRestantes(renovacaoIso);
  if (dias < 0) return { label: "Vencida", className: "bg-destructive/10 text-destructive" };
  if (dias <= 30) return { label: "Próxima", className: "bg-warning/20 text-warning-foreground" };
  return { label: "Futura", className: "bg-success/10 text-success" };
}

function EstagiosPage() {
  const [busca, setBusca] = useState("");
  const { data: estagios = [], isLoading } = useEstagios();
  const { data: colaboradores = [] } = useColaboradores();




  const lista = useMemo(() => {
    const q = normalize(busca);
    const colabPorId = new Map(colaboradores.map((c) => [c.id, c]));

    // Contrato mais recente de cada pessoa: só ele reflete o vínculo atual.
    const maisRecentePorPessoa = new Map<string, string>();
    estagios.forEach((e) => {
      const key = e.colaboradorId || e.nomeEstagiario;
      if (!key) return;
      const atual = estagios.find((x) => x.id === maisRecentePorPessoa.get(key));
      if (!atual || (e.termino || "") > (atual.termino || "")) {
        maisRecentePorPessoa.set(key, e.id);
      }
    });

    // 1 colaborador : N estágios — cada contrato é uma linha de histórico,
    // sempre vinculada ao mesmo colaboradorId.
    const contratos = estagios
      .filter((e) => e.colaboradorId || e.nomeEstagiario)
      .map((e) => {
        const colaborador = e.colaboradorId ? colabPorId.get(e.colaboradorId) ?? null : null;
        // Status pertence ao contrato; o desligamento da pessoa só afeta o
        // contrato atual — históricos anteriores permanecem preservados.
        const status = e.status ?? "Vigente";
        const atual = maisRecentePorPessoa.get(e.colaboradorId || e.nomeEstagiario || "") === e.id;
        const contratoEncerrado = status === "Encerrado" || status === "Renovado";
        return {
          id: e.id,
          colaboradorId: e.colaboradorId ?? "",
          nomeEstagiario: e.nomeEstagiario ?? undefined,
          tipo: e.tipo,
          modalidade: e.modalidade,
          instituicao: e.instituicao,
          inicio: e.inicio ?? "",
          termino: e.termino ?? "",
          dataRenovacao: e.dataRenovacao ?? (e.termino ? sugerirDataRenovacao(e.termino) : ""),
          status,
          hasContrato: true,
          colaborador,
          desligado: contratoEncerrado,
          effectiveStatus: status,
        };
      });


    const comContrato = new Set(contratos.map((c) => c.colaboradorId).filter(Boolean));

    // Estagiários cadastrados em Colaboradores que ainda não têm contrato.
    const semContrato = colaboradores
      .filter((c) => c.vinculo === "Estágio" && !comContrato.has(c.id))
      .map((colaborador) => {
        const desligado = colaborador.status === "Desligado";
        return {
          id: `virtual-${colaborador.id}`,
          colaboradorId: colaborador.id,
          nomeEstagiario: undefined,
          tipo: undefined,
          modalidade: undefined,
          instituicao: undefined,
          inicio: "",
          termino: "",
          dataRenovacao: "",
          status: "Vigente",
          hasContrato: false,
          colaborador,
          desligado,
          effectiveStatus: desligado ? "Desligado" : "Vigente",
        };
      });

    const nomeDe = (e: { colaborador?: { nome: string } | null; nomeEstagiario?: string }) =>
      e.colaborador?.nome ?? e.nomeEstagiario ?? "";

    return [...contratos, ...semContrato]
      .filter((e) => {
        if (!q) return true;
        const nome = nomeDe(e);
        const cpf = e.colaborador?.cpf ?? "";
        return normalize(nome).includes(q) || normalize(cpf).includes(q);
      })
      // Ordenação explícita: alfabética pelo nome do estagiário (independente
      // do status) e, para a mesma pessoa, cronológica pela data de início.
      .sort((a, b) => {
        const porNome = nomeDe(a).localeCompare(nomeDe(b), "pt-BR", { sensitivity: "base" });
        if (porNome !== 0) return porNome;
        return (a.inicio || "").localeCompare(b.inicio || "");
      });
  }, [busca, estagios, colaboradores]);



  const ativos = lista.filter((e) => !e.desligado && (e.status === "Vigente" || e.status === "Vencendo")).length;
  const vencendo = lista.filter((e) => {
    if (e.desligado || !e.termino) return false;
    const d = diasRestantes(e.termino);
    return d >= 0 && d <= 30;
  }).length;
  const vencidos = lista.filter((e) => !e.desligado && e.termino && diasRestantes(e.termino) < 0).length;
  const desligados = lista.filter((e) => e.desligado).length;

  return (
    <div>
      <PageHeader
        title="Estágios"
        description="Contratos de estágio, vencimentos e renovações."
        breadcrumbs={[{ label: "Início", to: "/" }, { label: "Estágios" }]}
        actions={
          <Button asChild variant="success">
            <Link to="/estagios/novo"><Plus className="mr-1.5 h-4 w-4" /> Novo estágio</Link>
          </Button>
        }
      />
      <EstagiosTabs />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Estagiários ativos" value={ativos} icon={GraduationCap} tone="primary" />
        <KpiCard label="Vencendo em 30 dias" value={vencendo} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Vencidos" value={vencidos} icon={XCircle} tone="destructive" />
        <KpiCard label="Desligados" value={desligados} icon={UserMinus} tone="muted" />
      </div>

      <Tabs defaultValue="estagiarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="estagiarios">Estagiários</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="space-y-4">
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="p-5 text-sm text-muted-foreground">
              <p>
                Acompanhe a evolução dos contratos de estágio, prazos críticos e renovações pendentes.
                Use a aba <strong>Estagiários</strong> para gerenciar individualmente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estagiarios">
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
                    <TableHead>Estagiário</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Instituição</TableHead>
                    <TableHead>Início</TableHead>
                     <TableHead>Renovação</TableHead>
                    <TableHead>Término</TableHead>
                    <TableHead>Dias restantes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={11} className="py-12 text-center text-sm text-muted-foreground">Carregando…</TableCell></TableRow>
                    ) : lista.length === 0 ? (
                      <TableRow><TableCell colSpan={11} className="p-0">
                        <EmptyState
                          compact
                          icon={GraduationCap}
                          title="Nenhum estágio encontrado"
                          description={busca ? "Ajuste a busca para localizar um estagiário." : "Cadastre um novo contrato pelo botão \"Novo estágio\"."}
                        />
                      </TableCell></TableRow>
                    ) : lista.map((e) => {
                      const dias = e.termino ? diasRestantes(e.termino) : 0;
                      // Regra crítica: estágio desligado não participa de renovação.
                      const renovacaoIso = e.desligado ? "" : (e.dataRenovacao || "");
                      const situacao = renovacaoIso ? situacaoRenovacao(renovacaoIso) : null;
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.colaborador?.nome ?? e.nomeEstagiario ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{e.colaborador?.cpf ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{e.tipo ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{e.modalidade ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{e.instituicao ?? "—"}</TableCell>
                          <TableCell>{formatDateBR(e.inicio)}</TableCell>
                          <TableCell>
                            {renovacaoIso && situacao ? (
                              <div className="space-y-1">
                                <span className="whitespace-nowrap">{formatDateBR(renovacaoIso)}</span>
                                <span className={`block w-fit rounded px-1.5 py-0.5 text-xs font-medium ${situacao.className}`}>
                                  {situacao.label}
                                </span>
                              </div>
                            ) : "—"}
                          </TableCell>
                          <TableCell>{formatDateBR(e.termino)}</TableCell>
                          <TableCell>
                            {e.desligado || !e.termino ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <span className={dias < 0 ? "text-destructive font-medium" : dias <= 30 ? "text-warning-foreground font-medium" : ""}>
                                {dias < 0 ? `${Math.abs(dias)} dias atrasado` : `${dias} dias`}
                              </span>
                            )}
                          </TableCell>
                          <TableCell><StatusBadge value={e.effectiveStatus} /></TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="icon" variant="ghost">
                              {e.hasContrato ? (
                                <Link to="/estagios/$id/editar" params={{ id: e.id }} aria-label="Editar contrato">
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              ) : (
                                <Link to="/colaboradores/$id/editar" params={{ id: e.colaboradorId }} aria-label="Editar colaborador">
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({
  label, value, icon: Icon, tone,
}: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; tone: "primary" | "warning" | "destructive" | "muted" }) {
  const bg = { primary: "bg-primary/10", warning: "bg-warning/20", destructive: "bg-destructive/15", muted: "bg-muted" }[tone];
  const fg = { primary: "text-primary", warning: "text-warning-foreground", destructive: "text-destructive", muted: "text-muted-foreground" }[tone];
  return (
    <Card className="shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`mt-2 text-3xl font-semibold ${fg}`}>{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${bg}`}>
          <Icon className={`h-5 w-5 ${fg}`} />
        </div>
      </CardContent>
    </Card>
  );
}

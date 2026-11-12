import { parseLocalDate, formatDateBR } from "@/lib/dates";
import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  ArrowRight,
  AlertTriangle,
  Clock,
  UserPlus,
  CalendarCheck,
  GraduationCap as GradIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { diasRestantes } from "@/lib/mock-data";
import { pessoasComEstagioVigente, useColaboradores, useEstagios, useFerias } from "@/lib/db";
import { useAuth } from "@/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Gestor de Equipe" },
      {
        name: "description",
        content:
          "Página inicial do Sistema de Gestão da Equipe para acompanhar colaboradores, contratos, estágios e férias.",
      },
      { property: "og:title", content: "Início — Gestor de Equipe" },
      { property: "og:description", content: "Página inicial do Sistema de Gestão da Equipe para acompanhar colaboradores, contratos, estágios e férias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

const quickLinks = [
  {
    title: "Dashboard",
    desc: "Indicadores executivos e alertas consolidados",
    to: "/dashboard",
    icon: LayoutDashboard,
    tone: "info" as const,
  },
  {
    title: "Colaboradores",
    desc: "Cadastre, edite e consulte colaboradores",
    to: "/colaboradores",
    icon: Users,
    tone: "success" as const,
  },
  {
    title: "Estágios",
    desc: "Acompanhe contratos e renovações",
    to: "/estagios",
    icon: GraduationCap,
    tone: "purple" as const,
  },
  {
    title: "Férias",
    desc: "Programe e registre períodos de férias",
    to: "/ferias",
    icon: CalendarDays,
    tone: "orange" as const,
  },
] as const;

const toneClasses: Record<string, { bg: string; fg: string; hoverBg: string }> = {
  info: { bg: "bg-info/10", fg: "text-info", hoverBg: "group-hover:bg-info" },
  success: { bg: "bg-success/10", fg: "text-success", hoverBg: "group-hover:bg-success" },
  purple: { bg: "bg-[oklch(0.55_0.18_295)]/10", fg: "text-[oklch(0.50_0.18_295)]", hoverBg: "group-hover:bg-[oklch(0.50_0.18_295)]" },
  orange: { bg: "bg-[oklch(0.72_0.16_55)]/15", fg: "text-[oklch(0.58_0.17_50)]", hoverBg: "group-hover:bg-[oklch(0.62_0.17_50)]" },
};

function getSaudacaoNome(fullName: string): string {
  const partes = fullName.trim().split(/\s+/);
  if (partes.length === 0) return "Usuário";
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[1]}`;
}

function formatDataExtenso(d: Date): string {
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const rest = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const s = `${weekday} • ${rest}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function HomePage() {
  const { displayName } = useAuth();
  const { data: colaboradores = [] } = useColaboradores();
  const { data: estagios = [] } = useEstagios();
  const { data: ferias = [] } = useFerias();

  const saudacaoNome = getSaudacaoNome(displayName);
  const hoje = new Date();
  const dataExtenso = formatDataExtenso(hoje);

  const colabById = new Map(colaboradores.map((c) => [c.id, c]));
  // Status do contrato prevalece sobre o status histórico do cadastro.
  const comVinculoVigente = pessoasComEstagioVigente(estagios);
  const colaboradorAtivo = (id: string) => {
    const c = colabById.get(id);
    return !!c && (c.status !== "Desligado" || comVinculoVigente.has(id));
  };

  // Pendências da semana (0–7 dias) — apenas contratos vigentes
  const estagiosVencendo = estagios
    .filter((e) => {
      if (!colabById.get(e.colaboradorId) || e.status === "Renovado" || e.status === "Encerrado") return false;
      const d = diasRestantes(e.termino);
      return d >= 0 && d <= 7;
    })
    .sort((a, b) => diasRestantes(a.termino) - diasRestantes(b.termino));

  const feriasIniciando = ferias
    .filter((f) => {
      if (!colaboradorAtivo(f.colaboradorId)) return false;
      if (f.status !== "Planejada" && f.status !== "Confirmada") return false;
      if (f.termino && diasRestantes(f.termino) < 0) return false;
      const d = diasRestantes(f.inicio);
      return d >= 0 && d <= 7;
    })
    .sort((a, b) => diasRestantes(a.inicio) - diasRestantes(b.inicio));



  // Últimas movimentações — combina datas conhecidas e ordena desc.
  type Mov = {
    id: string;
    titulo: string;
    descricao: string;
    data: string;
    to: string;
    params?: Record<string, string>;
    icon: typeof UserPlus;
    tone: "primary" | "info" | "success";
  };
  const movs: Mov[] = [];
  for (const c of colaboradores) {
    if (c.admissao) {
      movs.push({
        id: `c-${c.id}`,
        titulo: "Colaborador cadastrado",
        descricao: `${c.nome} · ${c.vinculo}`,
        data: c.admissao,
        to: "/colaboradores/$id",
        params: { id: c.id },
        icon: UserPlus,
        tone: "primary",
      });
    }
  }
  for (const e of estagios) {
    if (e.inicio) {
      const nome = colabById.get(e.colaboradorId)?.nome ?? "Estagiário(a)";
      movs.push({
        id: `e-${e.id}`,
        titulo: e.status === "Renovado" ? "Estágio renovado" : "Estágio cadastrado",
        descricao: `${nome}${e.instituicao ? ` · ${e.instituicao}` : ""}`,
        data: e.inicio,
        to: "/estagios/$id/editar",
        params: { id: e.id },
        icon: GradIcon,
        tone: "info",
      });
    }
  }
  for (const f of ferias) {
    if (f.inicio) {
      const nome = colabById.get(f.colaboradorId)?.nome ?? "Colaborador(a)";
      movs.push({
        id: `f-${f.id}`,
        titulo: "Férias cadastradas",
        descricao: `${nome} · ${f.dias} dias`,
        data: f.inicio,
        to: "/ferias/$id/editar",
        params: { id: f.id },
        icon: CalendarCheck,
        tone: "success",
      });
    }
  }
  const ultimasMov = movs
    .filter((m) => parseLocalDate(m.data) !== null)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 6);


  return (
    <div className="flex flex-col gap-6">
      {/* Cartão de boas-vindas */}
      <Card className="overflow-hidden border border-border shadow-[var(--shadow-card)]">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-success" />
        <CardContent className="px-5 py-6 sm:px-6 sm:py-10">
          <div className="flex w-full flex-col items-start text-left">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {dataExtenso}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Olá, {saudacaoNome}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Sou o Caju e vou ajudar você a acompanhar colaboradores, contratos, estágios e férias da sua equipe.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Acesso rápido */}
      <section>
        <SectionHeader
          title="Acesso rápido"
          description=""
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${toneClasses[q.tone].bg} ${toneClasses[q.tone].fg} ${toneClasses[q.tone].hoverBg} group-hover:text-primary-foreground`}>
                  <q.icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                {q.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {q.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Painéis operacionais */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Pendências da semana */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground">
                  <AlertTriangle className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Pendências da semana
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Itens com prazo nos próximos 7 dias
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {estagiosVencendo.length === 0 && feriasIniciando.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma pendência para esta semana.
                </p>
              )}

              {estagiosVencendo.map((e) => {
                const dias = diasRestantes(e.termino);
                const nome =
                  colabById.get(e.colaboradorId)?.nome ?? "Estagiário(a)";
                return (
                  <PendenciaItem
                    key={`pe-${e.id}`}
                    to="/estagios/$id/editar"
                    params={{ id: e.id }}
                    icon={GradIcon}
                    tone="warning"
                    titulo={`Estágio vencendo · ${nome}`}
                    descricao={
                      e.instituicao ? `Instituição: ${e.instituicao}` : "Contrato de estágio"
                    }
                    prazo={dias === 0 ? "Hoje" : `Em ${dias} dia${dias > 1 ? "s" : ""}`}
                  />
                );
              })}

              {feriasIniciando.map((f) => {
                const dias = diasRestantes(f.inicio);
                const nome =
                  colabById.get(f.colaboradorId)?.nome ?? "Colaborador(a)";
                return (
                  <PendenciaItem
                    key={`pf-${f.id}`}
                    to="/ferias/$id/editar"
                    params={{ id: f.id }}
                    icon={CalendarDays}
                    tone="info"
                    titulo={`Férias iniciando · ${nome}`}
                    descricao={`${f.dias} dias de gozo`}
                    prazo={dias === 0 ? "Hoje" : `Em ${dias} dia${dias > 1 ? "s" : ""}`}
                  />
                );
              })}

            </div>
          </CardContent>
        </Card>

        {/* Últimas movimentações */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-info/15 text-info">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Últimas movimentações
                </h2>
                <p className="text-xs text-muted-foreground">
                  Registros mais recentes do sistema
                </p>
              </div>
            </div>

            <div className="divide-y divide-border">
              {ultimasMov.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma movimentação registrada.
                </p>
              )}
              {ultimasMov.map((m) => (
                <Link
                  key={m.id}
                  to={m.to as never}
                  params={m.params as never}
                  className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                      m.tone === "primary"
                        ? "bg-primary/10 text-primary"
                        : m.tone === "info"
                          ? "bg-info/15 text-info"
                          : "bg-success/15 text-success"
                    }`}
                  >
                    <m.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {m.titulo}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.descricao}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateBR(m.data)}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function PendenciaItem({
  to,
  params,
  icon: Icon,
  tone,
  titulo,
  descricao,
  prazo,
}: {
  to: string;
  params?: Record<string, string>;
  icon: typeof UserPlus;
  tone: "warning" | "info" | "success";
  titulo: string;
  descricao: string;
  prazo: string;
}) {
  const toneClass =
    tone === "warning"
      ? "bg-warning/15 text-warning-foreground"
      : tone === "info"
        ? "bg-info/15 text-info"
        : "bg-success/15 text-success";
  return (
    <Link
      to={to as never}
      params={params as never}
      className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
    >

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${toneClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{titulo}</p>
        <p className="truncate text-xs text-muted-foreground">{descricao}</p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
          prazo === "Hoje"
            ? "border-amber-300/70 bg-amber-100 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100"
            : "border-border bg-muted/40 text-foreground",
        )}
      >
        {prazo}
      </span>
    </Link>
  );
}

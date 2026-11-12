import { ReactNode, useMemo } from "react";
import { Search, Bell, LogOut, UserCircle, AlertTriangle, GraduationCap, CalendarClock } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { CajuChat } from "@/components/CajuChat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "@tanstack/react-router";
import mascoteAsset from "@/assets/sgcf-mascote-busto.png.asset.json";
import { useAuth } from "@/auth";
import { pessoasComEstagioVigente, useColaboradores, useEstagios, useFerias } from "@/lib/db";
import { diasRestantes } from "@/lib/mock-data";

type Notificacao =
  | { id: string; kind: "estagio"; recordId: string; nome: string; dias: number }
  | { id: string; kind: "ferias"; recordId: string; nome: string; dias: number };

function useNotificacoes(): Notificacao[] {
  const { data: colaboradores = [] } = useColaboradores();
  const { data: estagios = [] } = useEstagios();
  const { data: ferias = [] } = useFerias();

  return useMemo(() => {
    const nomePorId = new Map(colaboradores.map((c) => [c.id, c.nome]));
    // O status do contrato prevalece: uma pessoa com cadastro histórico
    // desligado, mas com estágio vigente, continua exigindo acompanhamento.
    const comVinculoVigente = pessoasComEstagioVigente(estagios);
    const exigeAcompanhamento = (id: string) => {
      const c = colaboradores.find((x) => x.id === id);
      if (!c) return false;
      return c.status !== "Desligado" || comVinculoVigente.has(id);
    };
    const notifs: Notificacao[] = [];

    estagios.forEach((e) => {
      if (!e.termino) return;
      // Contrato encerrado/renovado não gera pendência.
      if (e.status === "Renovado" || e.status === "Encerrado") return;
      const nome = nomePorId.get(e.colaboradorId);
      if (!nome) return;
      const d = diasRestantes(e.termino);
      if (d <= 30) {
        notifs.push({ id: `e-${e.id}`, kind: "estagio", recordId: e.id, nome, dias: d });
      }
    });

    ferias.forEach((f) => {
      if (!f.inicio) return;
      if (f.status !== "Planejada" && f.status !== "Confirmada") return;
      const nome = nomePorId.get(f.colaboradorId);
      if (!nome || !exigeAcompanhamento(f.colaboradorId)) return;
      // Período já encerrado não exige mais ação.
      if (f.termino && diasRestantes(f.termino) < 0) return;
      const d = diasRestantes(f.inicio);
      if (d >= 0 && d <= 15) {
        notifs.push({ id: `f-${f.id}`, kind: "ferias", recordId: f.id, nome, dias: d });
      }
    });


    return notifs.sort((a, b) => Math.abs(a.dias) - Math.abs(b.dias)).slice(0, 8);
  }, [colaboradores, estagios, ferias]);
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { displayName, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const notificacoes = useNotificacoes();
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "SG";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 sm:px-8 text-foreground shadow-[var(--shadow-soft)]">
            <Link to="/" className="flex items-center gap-3 min-w-0" aria-label="Sistema de Gestão da Equipe — Página inicial">
              <img
                src={mascoteAsset.url}
                alt="Caju, mascote do sistema"
                className="h-9 w-auto object-contain"
                decoding="async"
              />
              <span className="text-base font-semibold tracking-tight text-foreground">Sistema de Gestão da Equipe</span>
            </Link>
            <div className="flex-1" />
            <div className="ml-auto md:ml-0 flex items-center gap-2 sm:gap-3">

              <div className="relative hidden lg:block">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar colaborador, contrato..."
                  className="h-9 w-72 rounded-md border-border bg-muted/40 pl-9 text-sm focus-visible:bg-card focus-visible:ring-primary/30"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Notificações"
                >
                  <Bell className="h-4 w-4" />
                  {notificacoes.length > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[9px] font-semibold text-warning-foreground">
                      {notificacoes.length}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Central de ações</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notificacoes.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                      Nenhuma pendência no momento.
                    </div>
                  ) : (
                    <>
                      {notificacoes.map((n) => {
                        const Icon = n.kind === "estagio" ? GraduationCap : CalendarClock;
                        const isEstagio = n.kind === "estagio";
                        const label = isEstagio
                          ? n.dias < 0
                            ? `Contrato vencido há ${Math.abs(n.dias)} dias`
                            : `Contrato vence em ${n.dias} dias`
                          : n.dias === 0
                            ? "Férias começam hoje"
                            : `Férias em ${n.dias} dias`;
                        return (
                          <DropdownMenuItem key={n.id} asChild>
                            {isEstagio ? (
                              <Link
                                to="/estagios/$id/editar"
                                params={{ id: n.recordId }}
                                className="flex items-start gap-2 py-2"
                              >
                                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs font-medium">{n.nome}</div>
                                  <div className="truncate text-[11px] text-muted-foreground">{label}</div>
                                </div>
                              </Link>
                            ) : (
                              <Link
                                to="/ferias/$id/editar"
                                params={{ id: n.recordId }}
                                className="flex items-start gap-2 py-2"
                              >
                                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs font-medium">{n.nome}</div>
                                  <div className="truncate text-[11px] text-muted-foreground">{label}</div>
                                </div>
                              </Link>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="justify-center text-xs font-medium text-primary">
                          Ver todos no dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-2 ring-transparent transition-all hover:ring-primary/20">
                  {initials}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex-col items-start">
                    <span className="text-xs">{displayName}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {isAdmin ? "Administrador" : "Colaborador"}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" /> Meu perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
                    className="text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-6 sm:p-8 min-w-0 overflow-x-hidden">{children}</main>
        </div>
        <Toaster />
        <CajuChat />
      </div>
    </SidebarProvider>
  );
}

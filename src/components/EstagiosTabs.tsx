import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/estagios", label: "Gestão de Estágios", exact: true },
  { to: "/estagios/instituicoes", label: "Instituições" },
  { to: "/estagios/processos", label: "Processos" },
  { to: "/estagios/desligamentos", label: "Desligamentos" },
] as const;

export function EstagiosTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mb-4 border-b border-border overflow-x-auto">
      <nav className="flex gap-1 min-w-max" aria-label="Subseções de Estágios">
        {TABS.map((t) => {
          const active =
            "exact" in t && t.exact
              ? pathname === "/estagios" || pathname === "/estagios/"
              : pathname === t.to || pathname.startsWith(t.to + "/");
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "relative px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

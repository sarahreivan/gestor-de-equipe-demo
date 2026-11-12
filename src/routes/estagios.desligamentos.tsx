import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { EstagiosTabs } from "@/components/EstagiosTabs";
import { ProcessosPanel } from "@/components/ProcessosPanel";

export const Route = createFileRoute("/estagios/desligamentos")({
  head: () => ({
    meta: [
      { title: "Desligamentos — Estágios — Gestor de Equipe" },
      { name: "description", content: "Registros de desligamento de estagiários." },
      { property: "og:title", content: "Desligamentos — Estágios — Gestor de Equipe" },
      { property: "og:description", content: "Registros de desligamento de estagiários." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DesligamentosPage,
});

function DesligamentosPage() {
  return (
    <div>
      <PageHeader
        title="Estágios"
        description="Registros de desligamento de estagiários."
        breadcrumbs={[{ label: "Início", to: "/" }, { label: "Estágios" }, { label: "Desligamentos" }]}
      />
      <EstagiosTabs />
      <ProcessosPanel
        tipos={["Desligamento"]}
        singular="Desligamento"
        withMotivo
        emptyTitle="Nenhum desligamento registrado"
        emptyDescription="Registre um desligamento para preservar o histórico do contrato."
      />
    </div>
  );
}

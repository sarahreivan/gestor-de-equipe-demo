import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { EstagiosTabs } from "@/components/EstagiosTabs";
import { ProcessosPanel } from "@/components/ProcessosPanel";

export const Route = createFileRoute("/estagios/processos")({
  head: () => ({
    meta: [
      { title: "Processos — Estágios — Gestor de Equipe" },
      { name: "description", content: "Histórico administrativo dos contratos de estágio." },
      { property: "og:title", content: "Processos — Estágios — Gestor de Equipe" },
      { property: "og:description", content: "Histórico administrativo dos contratos de estágio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProcessosPage,
});

function ProcessosPage() {
  return (
    <div>
      <PageHeader
        title="Estágios"
        description="Histórico administrativo dos contratos de estágio."
        breadcrumbs={[{ label: "Início", to: "/" }, { label: "Estágios" }, { label: "Processos" }]}
      />
      <EstagiosTabs />
      <ProcessosPanel
        tipos={["Contratação", "Renovação", "Outro"]}
        singular="Processo"
        emptyTitle="Nenhum processo cadastrado"
        emptyDescription="Cadastre processos de contratação ou renovação para compor o histórico do estagiário."
      />
    </div>
  );
}

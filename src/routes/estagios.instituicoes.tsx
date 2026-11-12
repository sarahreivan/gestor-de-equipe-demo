import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Building2, Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { EstagiosTabs } from "@/components/EstagiosTabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { useColaboradores, useEstagios } from "@/lib/db";

export const Route = createFileRoute("/estagios/instituicoes")({
  head: () => ({
    meta: [
      { title: "Instituições — Gestor de Equipe" },
      { name: "description", content: "Instituições com estagiários vinculados." },
      { property: "og:title", content: "Instituições — Gestor de Equipe" },
      { property: "og:description", content: "Instituições com estagiários vinculados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstituicoesPage,
});

function normalize(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

type Inst = {
  key: string;
  nome: string;
  tipo: "Público" | "Privado";
  estagiarios: { id: string; nome: string }[];
};

function InstituicoesPage() {
  const [busca, setBusca] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { data: estagios = [], isLoading } = useEstagios();
  const { data: colaboradores = [] } = useColaboradores();

  const colabIndex = useMemo(() => {
    const m = new Map<string, (typeof colaboradores)[number]>();
    colaboradores.forEach((c) => m.set(c.id, c));
    return m;
  }, [colaboradores]);

  const instituicoes = useMemo<Inst[]>(() => {
    const m = new Map<string, Inst>();
    estagios.forEach((e) => {
      const nome = (e.instituicao || "Não informada").trim();
      const key = normalize(nome) + "|" + e.tipo;
      const colab = colabIndex.get(e.colaboradorId);
      const inst = m.get(key) ?? { key, nome, tipo: e.tipo, estagiarios: [] };
      if (colab && !inst.estagiarios.some((s) => s.id === colab.id)) {
        inst.estagiarios.push({ id: colab.id, nome: colab.nome });
      }
      m.set(key, inst);
    });
    return Array.from(m.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [estagios, colabIndex]);

  const lista = useMemo(() => {
    const q = normalize(busca);
    if (!q) return instituicoes;
    return instituicoes.filter((i) => normalize(i.nome).includes(q));
  }, [busca, instituicoes]);

  const selecionada = useMemo(
    () => instituicoes.find((i) => i.key === selectedKey) ?? null,
    [instituicoes, selectedKey],
  );

  return (
    <div>
      <PageHeader
        title="Estágios"
        description="Instituições com estagiários vinculados."
        breadcrumbs={[{ label: "Início", to: "/" }, { label: "Estágios" }, { label: "Instituições" }]}
      />
      <EstagiosTabs />

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-4">
          <div className="mb-4 relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome da instituição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead>Instituição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Estagiários vinculados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="py-12 text-center text-sm text-muted-foreground">Carregando…</TableCell></TableRow>
                ) : lista.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="p-0">
                    <EmptyState
                      compact
                      icon={Building2}
                      title="Nenhuma instituição encontrada"
                      description={busca ? "Ajuste a busca para localizar uma instituição." : "As instituições aparecem aqui conforme forem vinculadas a estagiários."}
                    />
                  </TableCell></TableRow>
                ) : lista.map((i) => (
                  <TableRow
                    key={i.key}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setSelectedKey(i.key)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {i.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={i.tipo === "Público" ? "default" : "secondary"}>{i.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{i.estagiarios.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selecionada} onOpenChange={(o) => !o && setSelectedKey(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selecionada && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {selecionada.nome}
                </SheetTitle>
                <SheetDescription>Detalhes da instituição e estagiários vinculados.</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <Info label="Tipo">
                    <Badge variant={selecionada.tipo === "Público" ? "default" : "secondary"}>
                      {selecionada.tipo}
                    </Badge>
                  </Info>
                  <Info label="Estagiários">
                    <span className="text-base font-semibold">{selecionada.estagiarios.length}</span>
                  </Info>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> Estagiários vinculados
                  </div>
                  {selecionada.estagiarios.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum estagiário vinculado.</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-md border border-border">
                      {selecionada.estagiarios
                        .slice()
                        .sort((a, b) => a.nome.localeCompare(b.nome))
                        .map((s) => (
                          <li key={s.id} className="px-3 py-2 text-sm">
                            {s.nome}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}

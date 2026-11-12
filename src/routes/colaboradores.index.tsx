import { formatDateBR } from "@/lib/dates";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Eye, Pencil, Search, Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { COLAB_STATUS, VINCULOS } from "@/lib/mock-data";
import { useColaboradores } from "@/lib/db";

export const Route = createFileRoute("/colaboradores/")({
  head: () => ({
    meta: [
      { title: "Colaboradores — Gestor de Equipe" },
      { name: "description", content: "Lista de colaboradores cadastrados no sistema." },
      { property: "og:title", content: "Colaboradores — Gestor de Equipe" },
      { property: "og:description", content: "Lista de colaboradores cadastrados no sistema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ColaboradoresPage,
});

function normalize(v: string) {
  return v.toLowerCase().replace(/[.\-\s]/g, "");
}

function ColaboradoresPage() {
  const [busca, setBusca] = useState("");
  const [vinculo, setVinculo] = useState<string>("todos");
  const [status, setStatus] = useState<string>("todos");
  const { data: colaboradores = [], isLoading, error } = useColaboradores();

  const filtrados = useMemo(() => {
    const q = normalize(busca);
    return colaboradores.filter((c) => {
      if (q) {
        const matchNome = normalize(c.nome).includes(q);
        const matchCpf = normalize(c.cpf).includes(q);
        if (!matchNome && !matchCpf) return false;
      }
      if (vinculo !== "todos" && c.vinculo !== vinculo) return false;
      if (status !== "todos" && c.status !== status) return false;
      return true;
    });
  }, [busca, vinculo, status, colaboradores]);

  return (
    <div>
      <PageHeader
        title="Colaboradores"
        description="Cadastre, consulte e gerencie todos os colaboradores."
        breadcrumbs={[{ label: "Início", to: "/" }, { label: "Colaboradores" }]}
        actions={
          <Button asChild variant="success">
            <Link to="/colaboradores/novo">
              <Plus className="mr-1.5 h-4 w-4" /> Novo colaborador
            </Link>
          </Button>
        }
      />

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-4">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={vinculo} onValueChange={setVinculo}>
              <SelectTrigger><SelectValue placeholder="Vínculo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os vínculos</SelectItem>
                {VINCULOS.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {COLAB_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admissão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      Carregando colaboradores…
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-destructive">
                      Erro ao carregar os dados. Tente novamente.
                    </TableCell>
                  </TableRow>
                ) : filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        compact
                        icon={Users}
                        title="Nenhum colaborador encontrado"
                        description={busca || vinculo !== "todos" || status !== "todos"
                          ? "Ajuste a busca ou os filtros para localizar um colaborador."
                          : "Cadastre um novo colaborador pelo botão \"Novo colaborador\"."}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((c) => (
                    <TableRow key={c.id} className={c.status === "Desligado" ? "opacity-60" : undefined}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{c.cpf}</TableCell>
                      <TableCell className="text-muted-foreground">{c.cargo || "—"}</TableCell>
                      <TableCell><StatusBadge value={c.vinculo} /></TableCell>
                      <TableCell><StatusBadge value={c.status} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateBR(c.admissao)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild size="icon" variant="ghost">
                            <Link to="/colaboradores/$id" params={{ id: c.id }} aria-label="Visualizar">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild size="icon" variant="ghost">
                            <Link to="/colaboradores/$id/editar" params={{ id: c.id }} aria-label="Editar">
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Mostrando {filtrados.length} de {colaboradores.length} colaboradores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

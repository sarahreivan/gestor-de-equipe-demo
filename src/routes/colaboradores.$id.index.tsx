import { formatDateBR } from "@/lib/dates";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Pencil, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { diasRestantes } from "@/lib/mock-data";
import { useColaborador, useEstagios, useFerias } from "@/lib/db";

export const Route = createFileRoute("/colaboradores/$id/")({
  head: () => ({ meta: [{ title: "Detalhes do colaborador — Gestor de Equipe" },
      { name: "description", content: "Dados cadastrais, contratos de estágio e histórico de férias do colaborador." },
      { property: "og:title", content: "Detalhes do colaborador — Gestor de Equipe" },
      { property: "og:description", content: "Dados cadastrais, contratos de estágio e histórico de férias do colaborador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: DetalhesColaboradorPage,
});

function DetalhesColaboradorPage() {
  const { id } = useParams({ from: "/colaboradores/$id/" });
  const { data: c, isLoading } = useColaborador(id);
  const { data: estagios = [] } = useEstagios();
  const { data: ferias = [] } = useFerias();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }
  if (!c) {
    return (
      <div>
        <PageHeader title="Colaborador não encontrado" />
        <Button asChild variant="outline"><Link to="/colaboradores"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link></Button>
      </div>
    );
  }

  // Estágios do cadastro (mesmo pessoa_id). Cada contrato é um vínculo próprio:
  // o vigente é destacado como atual, os encerrados permanecem como histórico.
  const estagiosCol = estagios
    .filter((e) => e.colaboradorId === id)
    .slice()
    .sort((a, b) => (b.inicio || "").localeCompare(a.inicio || ""));
  const encerrado = (s: string) => s === "Encerrado" || s === "Renovado";
  const estagiosAtuais = estagiosCol.filter((e) => !encerrado(e.status));
  const estagiosHistoricos = estagiosCol.filter((e) => encerrado(e.status));
  const feriasCol = ferias.filter((f) => f.colaboradorId === id);


  return (
    <div>
      <PageHeader
        title={c.nome}
        description={`${c.vinculo} • CPF ${c.cpf}`}
        breadcrumbs={[
          { label: "Colaboradores", to: "/colaboradores" },
          { label: c.nome },
        ]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/colaboradores"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
            </Button>
            <Button asChild >
              <Link to="/colaboradores/$id/editar" params={{ id }}><Pencil className="mr-1 h-4 w-4" /> Editar</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-[var(--shadow-card)] lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Dados cadastrais</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label="Nome" value={c.nome} />
            <Info label="CPF" value={c.cpf} />
            <Info label="Cargo" value={c.cargo || "—"} />
            <Info label="E-mail" value={c.email || "—"} />
            <Info label="Telefone" value={c.telefone || "—"} />
            <Info label="Tipo de vínculo" value={<StatusBadge value={c.vinculo} />} />
            <Info label="Status" value={<StatusBadge value={c.status} />} />
            <Info label="Admissão" value={formatDateBR(c.admissao)} />
            {c.observacoes && <Info label="Observações" value={c.observacoes} />}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle className="text-base">Vínculos de estágio</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {estagiosCol.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem registros de estágio.</p>
              ) : (
                <>
                  {estagiosAtuais.length > 0 && (
                    <TabelaEstagios titulo="Vínculo atual" itens={estagiosAtuais} />
                  )}
                  {estagiosHistoricos.length > 0 && (
                    <TabelaEstagios titulo="Histórico" itens={estagiosHistoricos} historico />
                  )}
                </>
              )}
            </CardContent>
          </Card>


          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle className="text-base">Histórico de férias</CardTitle></CardHeader>
            <CardContent>
              {feriasCol.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem registros de férias.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60">
                      <TableHead>Início</TableHead>
                      <TableHead>Término</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feriasCol.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>{formatDateBR(f.inicio)}</TableCell>
                        <TableCell>{formatDateBR(f.termino)}</TableCell>
                        <TableCell>{f.dias}</TableCell>
                        <TableCell className="text-muted-foreground">{f.periodoGozo || "—"}</TableCell>
                        <TableCell><StatusBadge value={f.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

type EstagioItem = {
  id: string;
  tipo?: string;
  modalidade?: string;
  instituicao?: string;
  inicio: string;
  termino: string;
  status: string;
};

function TabelaEstagios({ titulo, itens, historico }: { titulo: string; itens: EstagioItem[]; historico?: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead>Tipo</TableHead>
            <TableHead>Modalidade</TableHead>
            <TableHead>Instituição</TableHead>
            <TableHead>Início</TableHead>
            <TableHead>Término</TableHead>
            <TableHead>Dias restantes</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((e) => (
            <TableRow key={e.id} className={historico ? "opacity-70" : undefined}>
              <TableCell>{e.tipo || "—"}</TableCell>
              <TableCell className="text-muted-foreground">{e.modalidade || "—"}</TableCell>
              <TableCell className="text-muted-foreground">{e.instituicao || "—"}</TableCell>
              <TableCell>{formatDateBR(e.inicio)}</TableCell>
              <TableCell>{formatDateBR(e.termino)}</TableCell>
              <TableCell>{historico || !e.termino ? "—" : diasRestantes(e.termino)}</TableCell>
              <TableCell><StatusBadge value={e.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

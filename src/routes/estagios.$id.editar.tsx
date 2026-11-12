import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ESTAGIO_STATUS } from "@/lib/mock-data";
import type { EstagioStatus } from "@/lib/mock-data";
import { sugerirDataRenovacao, useColaboradores, useEstagios, useUpdateEstagio } from "@/lib/db";

export const Route = createFileRoute("/estagios/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar estágio — Gestor de Equipe" },
      { name: "description", content: "Atualização dos dados do contrato de estágio." },
      { property: "og:title", content: "Editar estágio — Gestor de Equipe" },
      { property: "og:description", content: "Atualização dos dados do contrato de estágio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditarEstagioPage,
});

function EditarEstagioPage() {
  const { id } = useParams({ from: "/estagios/$id/editar" });
  const { data: estagios = [], isLoading } = useEstagios();
  const { data: colaboradores = [] } = useColaboradores();
  const update = useUpdateEstagio();
  const e = estagios.find((x) => x.id === id);
  const navigate = useNavigate();
  const colaboradorVinculado = colaboradores.find((c) => c.id === e?.colaboradorId);

  const [renovacaoManual, setRenovacaoManual] = useState(false);
  const [form, setForm] = useState({
    nomeEstagiario: "",
    colaboradorId: "",
    tipo: "Público" as "Público" | "Privado",
    modalidade: "Graduação" as "Graduação" | "Pós-graduação",
    duracao: "12",
    instituicao: "",
    inicio: "",
    termino: "",
    renovacao: "",
    status: "Vigente" as EstagioStatus,
    observacoes: "",
  });

  useEffect(() => {
    if (e) {
      const vinculado = colaboradores.find((c) => c.id === e.colaboradorId);
      setForm({
        nomeEstagiario: vinculado?.nome ?? e.nomeEstagiario ?? "",
        colaboradorId: e.colaboradorId ?? "",
        tipo: e.tipo,
        modalidade: e.modalidade ?? "Graduação",
        duracao: String(e.duracaoMeses ?? 12),
        instituicao: e.instituicao ?? "",
        inicio: e.inicio,
        termino: e.termino,
        renovacao: e.dataRenovacao ?? (e.termino ? sugerirDataRenovacao(e.termino) : ""),
        status: e.status,
        observacoes: e.observacoes ?? "",
      });
      setRenovacaoManual(!!e.renovacaoManual);
    }
  }, [e, colaboradores]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div>
      <PageHeader
        title={e ? "Editar estágio" : "Estágio não encontrado"}
        breadcrumbs={[{ label: "Estágios", to: "/estagios" }, { label: "Editar" }]}
      />
      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-6">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (!e) return;
              if (!form.inicio || !form.termino || !form.nomeEstagiario.trim()) {
                toast.error("Preencha os campos obrigatórios.");
                return;
              }
              if (form.inicio > form.termino) {
                toast.error("A data de início não pode ser posterior à data de término.");
                return;
              }
              if (form.renovacao && form.termino && form.renovacao > form.termino) {
                toast.error("A data de renovação deve ser anterior ou igual à data de término.");
                return;
              }
              update.mutate(
                {
                  id,
                  input: {
                    nomeEstagiario: form.nomeEstagiario.trim() || undefined,
                    colaboradorId: form.colaboradorId || undefined,
                    cpf: colaboradorVinculado?.cpf,
                    tipo: form.tipo,
                    modalidade: form.modalidade,
                    duracaoMeses: Number(form.duracao),
                    instituicao: form.instituicao,
                    inicio: form.inicio,
                    termino: form.termino,
                    dataRenovacao: form.renovacao || undefined,
                    renovacaoManual,
                    status: form.status,
                    observacoes: form.observacoes,
                  },
                },
                {
                  onSuccess: async () => {
                    toast.success("Estágio atualizado.");
                    await navigate({ to: "/estagios" });
                  },
                  onError: (err) => toast.error(`Erro: ${(err as Error).message}`),
                },
              );
            }}
          >
            <Field label="Estagiário" full>
              <Input
                className="h-10"
                placeholder="Nome do estagiário"
                value={form.nomeEstagiario}
                onChange={(ev) => setForm({ ...form, nomeEstagiario: ev.target.value })}
                required
              />
            </Field>
            <Field label="Tipo de estágio">
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as "Público" | "Privado" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Público">Público</SelectItem>
                  <SelectItem value="Privado">Privado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Modalidade">
              <Select
                value={form.modalidade}
                onValueChange={(v) => setForm({ ...form, modalidade: v as "Graduação" | "Pós-graduação" })}
              >
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Graduação">Graduação</SelectItem>
                  <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Duração">
              <Select value={form.duracao} onValueChange={(v) => setForm({ ...form, duracao: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Instituição">
              <Input value={form.instituicao} onChange={(ev) => setForm({ ...form, instituicao: ev.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as EstagioStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTAGIO_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Data de início">
              <Input type="date" value={form.inicio} onChange={(ev) => setForm({ ...form, inicio: ev.target.value })} required />
            </Field>
            <Field label="Data de término">
              <Input
                type="date"
                value={form.termino}
                onChange={(ev) => {
                  const termino = ev.target.value;
                  setForm((f) => ({
                    ...f,
                    termino,
                    // Nunca sobrescreve data definida manualmente pela gestão.
                    renovacao: renovacaoManual ? f.renovacao : (termino ? sugerirDataRenovacao(termino) : ""),
                  }));
                }}
                required
              />
            </Field>

            <Field label="Data de renovação">
              <Input
                type="date"
                value={form.renovacao}
                onChange={(ev) => {
                  setRenovacaoManual(true);
                  setForm((f) => ({ ...f, renovacao: ev.target.value }));
                }}
              />
            </Field>
            <Field label="Observações / Setor" full>
              <Textarea rows={4} value={form.observacoes} onChange={(ev) => setForm({ ...form, observacoes: ev.target.value })} />
            </Field>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" asChild><Link to="/estagios">Cancelar</Link></Button>
              <Button type="submit" variant="success" disabled={update.isPending || !e}>
                {update.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "md:col-span-2" : ""}`}>
      <Label>{label}</Label>{children}
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import type { EstagioModalidade, EstagioStatus } from "@/lib/mock-data";
import { sugerirDataRenovacao, useCreateEstagio } from "@/lib/db";

export const Route = createFileRoute("/estagios/novo")({
  head: () => ({ meta: [{ title: "Novo estágio — Gestor de Equipe" },
      { name: "description", content: "Cadastro de contratos de estágio no sistema." },
      { property: "og:title", content: "Novo estágio — Gestor de Equipe" },
      { property: "og:description", content: "Cadastro de contratos de estágio no sistema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: NovoEstagioPage,
});

const MODALIDADES: EstagioModalidade[] = ["Graduação", "Pós-graduação"];

function NovoEstagioPage() {
  const navigate = useNavigate();
  const create = useCreateEstagio();
  const [renovacaoManual, setRenovacaoManual] = useState(false);
  const [form, setForm] = useState({
    nomeEstagiario: "",
    cpf: "",
    tipo: "Público" as "Público" | "Privado",
    modalidade: "Graduação" as EstagioModalidade,
    duracao: "12",
    instituicao: "",
    inicio: "",
    termino: "",
    renovacao: "",
    status: "Vigente" as EstagioStatus,
    observacoes: "",
  });

  return (
    <div>
      <PageHeader
        title="Novo estágio"
        breadcrumbs={[{ label: "Estágios", to: "/estagios" }, { label: "Novo" }]}
      />
      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-6">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (!form.nomeEstagiario.trim()) {
                toast.error("Informe o nome do estagiário.");
                return;
              }
              if (!form.modalidade) {
                toast.error("Selecione a modalidade do estágio.");
                return;
              }
              if (form.renovacao && form.termino && form.renovacao > form.termino) {
                toast.error("A data de renovação deve ser anterior ou igual à data de término.");
                return;
              }
              create.mutate(
                {
                  nomeEstagiario: form.nomeEstagiario.trim(),
                  cpf: form.cpf.trim(),
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
                {
                  onSuccess: () => {
                    toast.success("Estágio cadastrado.");
                    navigate({ to: "/estagios" });
                  },
                  onError: (err) => toast.error(`Erro: ${(err as Error).message}`),
                },
              );
            }}
          >
            <Field label="Estagiário" full>
              <Input
                className="h-10"
                placeholder="Digite o nome do estagiário"
                value={form.nomeEstagiario}
                onChange={(ev) => setForm({ ...form, nomeEstagiario: ev.target.value })}
                required
              />
            </Field>

            <Field label="CPF" full>
              <Input
                className="h-10"
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={(ev) => setForm({ ...form, cpf: ev.target.value })}
              />
            </Field>

            <Field label="Tipo de estágio">
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as "Público" | "Privado" })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Público">Público</SelectItem>
                  <SelectItem value="Privado">Privado</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Modalidade">
              <Select value={form.modalidade} onValueChange={(v) => setForm({ ...form, modalidade: v as EstagioModalidade })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODALIDADES.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Duração">
              <Select value={form.duracao} onValueChange={(v) => setForm({ ...form, duracao: v })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Instituição vinculada">
              <Input
                className="h-10"
                placeholder="Nome da instituição"
                value={form.instituicao}
                onChange={(ev) => setForm({ ...form, instituicao: ev.target.value })}
              />
            </Field>

            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as EstagioStatus })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTAGIO_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Data de início">
              <Input className="h-10" type="date" value={form.inicio} onChange={(ev) => setForm({ ...form, inicio: ev.target.value })} required />
            </Field>

            <Field label="Data de término">
              <Input
                className="h-10"
                type="date"
                value={form.termino}
                onChange={(ev) => {
                  const termino = ev.target.value;
                  setForm((f) => ({
                    ...f,
                    termino,
                    // Sugestão automática apenas enquanto o usuário não definiu manualmente.
                    renovacao: renovacaoManual ? f.renovacao : (termino ? sugerirDataRenovacao(termino) : ""),
                  }));
                }}
                required
              />
            </Field>

            <Field label="Data de renovação">
              <Input
                className="h-10"
                type="date"
                value={form.renovacao}
                onChange={(ev) => {
                  setRenovacaoManual(true);
                  setForm((f) => ({ ...f, renovacao: ev.target.value }));
                }}
              />
            </Field>

            <div className="hidden md:block" />

            <Field label="Observações / Setor" full>
              <Textarea className="min-h-[140px] resize-none" value={form.observacoes} onChange={(ev) => setForm({ ...form, observacoes: ev.target.value })} />
            </Field>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" asChild><Link to="/estagios">Cancelar</Link></Button>
              <Button type="submit" variant="success" disabled={create.isPending}>
                {create.isPending ? "Cadastrando…" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "md:col-span-2" : ""}`}>
      <Label>{label}</Label>{children}
    </div>
  );
}

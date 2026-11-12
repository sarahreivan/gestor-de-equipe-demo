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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COLAB_STATUS, VINCULOS } from "@/lib/mock-data";
import type { ColaboradorStatus, VinculoTipo } from "@/lib/mock-data";
import { useCreateColaborador } from "@/lib/db";

export const Route = createFileRoute("/colaboradores/novo")({
  head: () => ({ meta: [{ title: "Novo colaborador — Gestor de Equipe" },
      { name: "description", content: "Cadastro de colaboradores no sistema." },
      { property: "og:title", content: "Novo colaborador — Gestor de Equipe" },
      { property: "og:description", content: "Cadastro de colaboradores no sistema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: NovoColaboradorPage,
});

function NovoColaboradorPage() {
  const navigate = useNavigate();
  const createColab = useCreateColaborador();
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    cargo: "",
    email: "",
    telefone: "",
    vinculo: "Estágio" as VinculoTipo,
    status: "Ativo" as ColaboradorStatus,
    admissao: "",
    observacoes: "",
  });

  return (
    <div>
      <PageHeader
        title="Novo colaborador"
        description="Preencha os dados do colaborador."
        breadcrumbs={[
          { label: "Colaboradores", to: "/colaboradores" },
          { label: "Novo" },
        ]}
      />
      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-6">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              createColab.mutate(form, {
                onSuccess: () => {
                  toast.success("Colaborador cadastrado com sucesso.");
                  navigate({ to: "/colaboradores" });
                },
                onError: (err) => toast.error(`Erro ao cadastrar: ${(err as Error).message}`),
              });
            }}
          >
            <Field label="Nome completo">
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </Field>
            <Field label="CPF">
              <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" required />
            </Field>
            <Field label="Cargo">
              <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
            </Field>
            <Field label="E-mail institucional">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Telefone">
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </Field>
            <Field label="Data de admissão">
              <Input type="date" value={form.admissao} onChange={(e) => setForm({ ...form, admissao: e.target.value })} />
            </Field>
            <Field label="Tipo de vínculo">
              <Select value={form.vinculo} onValueChange={(v) => setForm({ ...form, vinculo: v as VinculoTipo })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VINCULOS.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ColaboradorStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLAB_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Observações" full>
              <Textarea rows={4} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </Field>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/colaboradores">Cancelar</Link>
              </Button>
              <Button type="submit" variant="success" disabled={createColab.isPending}>
                {createColab.isPending ? "Cadastrando…" : "Cadastrar"}
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
      <Label>{label}</Label>
      {children}
    </div>
  );
}

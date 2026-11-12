import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { useColaborador, useUpdateColaborador } from "@/lib/db";

export const Route = createFileRoute("/colaboradores/$id/editar")({
  head: () => ({ meta: [{ title: "Editar colaborador — Gestor de Equipe" },
      { name: "description", content: "Atualização dos dados cadastrais do colaborador no sistema." },
      { property: "og:title", content: "Editar colaborador — Gestor de Equipe" },
      { property: "og:description", content: "Atualização dos dados cadastrais do colaborador no sistema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: EditarColaboradorPage,
});

function EditarColaboradorPage() {
  const { id } = useParams({ from: "/colaboradores/$id/editar" });
  const { data: c, isLoading } = useColaborador(id);
  const update = useUpdateColaborador();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "", cpf: "", cargo: "", email: "", telefone: "",
    vinculo: "Estágio" as VinculoTipo,
    status: "Ativo" as ColaboradorStatus,
    admissao: "", observacoes: "",
  });

  useEffect(() => {
    if (c) {
      setForm({
        nome: c.nome,
        cpf: c.cpf,
        cargo: c.cargo ?? "",
        email: c.email ?? "",
        telefone: c.telefone ?? "",
        vinculo: c.vinculo,
        status: c.status,
        admissao: c.admissao ?? "",
        observacoes: c.observacoes ?? "",
      });
    }
  }, [c]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  if (!c) {
    return (
      <div>
        <PageHeader title="Colaborador não encontrado" breadcrumbs={[{ label: "Colaboradores", to: "/colaboradores" }]} />
        <Button asChild variant="outline"><Link to="/colaboradores">Voltar</Link></Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Editar: ${c.nome}`}
        breadcrumbs={[
          { label: "Colaboradores", to: "/colaboradores" },
          { label: c.nome, to: "/colaboradores/$id" as const },
          { label: "Editar" },
        ]}
      />
      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-6">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              update.mutate(
                { id, input: form },
                {
                  onSuccess: () => {
                    toast.success("Colaborador atualizado com sucesso.");
                    navigate({ to: "/colaboradores/$id", params: { id } });
                  },
                  onError: (err) => toast.error(`Erro ao atualizar: ${(err as Error).message}`),
                },
              );
            }}
          >
            <Field label="Nome completo">
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </Field>
            <Field label="CPF">
              <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} required />
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
                <Link to="/colaboradores/$id" params={{ id }}>Cancelar</Link>
              </Button>
              <Button type="submit" variant="success" disabled={update.isPending}>
                {update.isPending ? "Salvando…" : "Salvar alterações"}
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

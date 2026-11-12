import { inclusiveDaysBetween } from "@/lib/dates";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FERIAS_STATUS } from "@/lib/mock-data";
import type { FeriasStatus } from "@/lib/mock-data";
import { useColaboradores, useCreateFerias } from "@/lib/db";

export const Route = createFileRoute("/ferias/nova")({
  head: () => ({ meta: [{ title: "Nova férias — Gestor de Equipe" },
      { name: "description", content: "Cadastro de períodos de férias dos colaboradores no sistema." },
      { property: "og:title", content: "Nova férias — Gestor de Equipe" },
      { property: "og:description", content: "Cadastro de períodos de férias dos colaboradores no sistema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: NovaFeriasPage,
});

function NovaFeriasPage() {
  const navigate = useNavigate();
  const { data: colaboradores = [] } = useColaboradores();
  const create = useCreateFerias();
  const [form, setForm] = useState({
    colaboradorId: "", inicio: "", termino: "", periodoGozo: "",
    status: "Planejada" as FeriasStatus,
    numeroProcesso: "",
  });


  const dias = useMemo(() => inclusiveDaysBetween(form.inicio, form.termino), [form.inicio, form.termino]);

  return (
    <div>
      <PageHeader
        title="Nova férias"
        breadcrumbs={[{ label: "Férias", to: "/ferias" }, { label: "Nova" }]}
      />
      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-6">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.colaboradorId) {
                toast.error("Selecione um colaborador.");
                return;
              }
              if (!form.periodoGozo.trim()) {
                toast.error("Informe o Período aquisitivo.");
                return;
              }
              create.mutate(
                {
                  ...form,
                  dias,
                },
                {
                  onSuccess: () => {
                    toast.success("Período de férias cadastrado.");
                    navigate({ to: "/ferias" });
                  },
                  onError: (err) => toast.error(`Erro: ${(err as Error).message}`),
                },
              );

            }}
          >
            <Field label="Colaborador" full>
              <Select value={form.colaboradorId} onValueChange={(v) => setForm({ ...form, colaboradorId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {colaboradores.filter((c) => c.status !== "Desligado").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Data de início">
              <Input type="date" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} required />
            </Field>
            <Field label="Data de término">
              <Input type="date" value={form.termino} onChange={(e) => setForm({ ...form, termino: e.target.value })} required />
            </Field>
            <Field label="Quantidade de dias (calculado)">
              <Input value={dias} readOnly className="bg-muted" />
            </Field>
            <Field label="Período aquisitivo *">
              <Input placeholder="Ex.: 2025" value={form.periodoGozo} onChange={(e) => setForm({ ...form, periodoGozo: e.target.value })} required />
            </Field>
            <Field label="Número do processo">
              <Input placeholder="Ex.: 00050.000123/2025-11" value={form.numeroProcesso} onChange={(e) => setForm({ ...form, numeroProcesso: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as FeriasStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>

                  {FERIAS_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" asChild><Link to="/ferias">Cancelar</Link></Button>
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

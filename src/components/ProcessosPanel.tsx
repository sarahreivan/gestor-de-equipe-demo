import { formatDateBR } from "@/lib/dates";
import { useMemo, useState, Fragment } from "react";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Search, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import {
  useColaboradores,
  useProcessos,
  useCreateProcesso,
  useUpdateProcesso,
  useDeleteProcesso,
  type ProcessoInput,
} from "@/lib/db";
import type { ProcessoAdm, ProcessoTipo } from "@/lib/mock-data";


type Props = {
  tipos: ProcessoTipo[];
  singular: string;
  emptyTitle: string;
  emptyDescription: string;
  withMotivo?: boolean;
};

type FormState = ProcessoInput & { id?: string };

export function ProcessosPanel({
  tipos, singular, emptyTitle, emptyDescription, withMotivo,
}: Props) {
  const { data: colaboradores = [] } = useColaboradores();
  const { data: processos = [], isLoading } = useProcessos();
  const create = useCreateProcesso();
  const update = useUpdateProcesso();
  const del = useDeleteProcesso();

  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const emptyForm: FormState = {
    colaboradorId: "",
    tipo: tipos[0],
    numeroProcesso: "",
    data: "",
    motivo: "",
    observacoes: "",
  };
  const [form, setForm] = useState<FormState>(emptyForm);

  const colabIndex = useMemo(() => {
    const m = new Map<string, (typeof colaboradores)[number]>();
    colaboradores.forEach((c) => m.set(c.id, c));
    return m;
  }, [colaboradores]);

  // Agrupa processos por colaborador (só os tipos permitidos nesta subseção).
  const grupos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const byPessoa = new Map<string, ProcessoAdm[]>();
    for (const p of processos) {
      if (!tipos.includes(p.tipo)) continue;
      if (!p.colaboradorId) continue;
      const arr = byPessoa.get(p.colaboradorId) ?? [];
      arr.push(p);
      byPessoa.set(p.colaboradorId, arr);
    }
    const out = Array.from(byPessoa.entries()).map(([pessoaId, arr]) => {
      const sorted = arr
        .slice()
        .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
      return {
        pessoaId,
        colaborador: colabIndex.get(pessoaId),
        vigente: sorted[0],
        historico: sorted,
      };
    });
    return out
      .filter((g) => {
        if (!q) return true;
        return (
          (g.colaborador?.nome ?? "").toLowerCase().includes(q) ||
          (g.vigente?.numeroProcesso ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        (a.colaborador?.nome ?? "").localeCompare(b.colaborador?.nome ?? "", "pt-BR"),
      );
  }, [processos, colabIndex, tipos, busca]);

  function openCreate() {
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p: ProcessoAdm) {
    setForm({
      id: p.id,
      colaboradorId: p.colaboradorId,
      tipo: p.tipo,
      numeroProcesso: p.numeroProcesso ?? "",
      data: p.data ?? "",
      motivo: p.motivo ?? "",
      observacoes: p.observacoes ?? "",
    });
    setOpen(true);
  }

  function toggleExpand(pessoaId: string) {
    setExpanded((prev) => {
      const s = new Set(prev);
      if (s.has(pessoaId)) s.delete(pessoaId);
      else s.add(pessoaId);
      return s;
    });
  }

  const colspan =
    2 + // Estagiário + Ações
    (tipos.length > 1 ? 1 : 0) +
    1 + // Nº do processo
    1 + // Data
    (withMotivo ? 1 : 0) +
    1; // Observações

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por colaborador ou nº de processo…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="success" size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Novo {singular.toLowerCase()}
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-[40px]" />
                <TableHead>Estagiário</TableHead>
                {tipos.length > 1 && <TableHead className="w-[140px]">Tipo</TableHead>}
                <TableHead className="w-[220px]">Nº do processo</TableHead>
                <TableHead className="w-[120px]">Data</TableHead>
                {withMotivo && <TableHead>Motivo</TableHead>}
                <TableHead>Observações</TableHead>
                <TableHead className="w-[110px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={colspan + 1} className="py-12 text-center text-sm text-muted-foreground">Carregando…</TableCell></TableRow>
              ) : grupos.length === 0 ? (
                <TableRow><TableCell colSpan={colspan + 1} className="p-0">
                  <EmptyState compact icon={FileText} title={emptyTitle} description={emptyDescription} />
                </TableCell></TableRow>
              ) : grupos.map((g) => {
                const p = g.vigente!;
                const isOpen = expanded.has(g.pessoaId);
                const hasHistorico = g.historico.length > 1;
                return (
                  <Fragment key={g.pessoaId}>
                    <TableRow className="align-middle">
                      <TableCell className="py-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => toggleExpand(g.pessoaId)}
                          aria-label={isOpen ? "Recolher histórico" : "Expandir histórico"}
                          aria-expanded={isOpen}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span>{g.colaborador?.nome ?? "—"}</span>
                          {hasHistorico && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {g.historico.length}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {tipos.length > 1 && <TableCell className="py-3">{p.tipo}</TableCell>}
                      <TableCell className="py-3 tabular-nums">{p.numeroProcesso || "—"}</TableCell>
                      <TableCell className="py-3 tabular-nums">
                        {formatDateBR(p.data)}
                      </TableCell>
                      {withMotivo && <TableCell className="py-3 text-muted-foreground">{p.motivo || "—"}</TableCell>}
                      <TableCell className="py-3 text-muted-foreground">
                        <span className="line-clamp-2">{p.observacoes || "—"}</span>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)} aria-label="Editar processo vigente">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={colspan + 1} className="p-0">
                          <div className="px-6 py-4">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Histórico de processos
                            </div>
                            <div className="overflow-hidden rounded-md border border-border bg-background">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/40">
                                    {tipos.length > 1 && <TableHead className="w-[140px]">Tipo</TableHead>}
                                    <TableHead className="w-[220px]">Nº do processo</TableHead>
                                    <TableHead className="w-[120px]">Data</TableHead>
                                    {withMotivo && <TableHead>Motivo</TableHead>}
                                    <TableHead>Observações</TableHead>
                                    <TableHead className="w-[110px] text-center">Ações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {g.historico.map((h, idx) => (
                                    <TableRow key={h.id} className={cn(idx === 0 && "bg-primary/5")}>
                                      {tipos.length > 1 && <TableCell className="py-2">{h.tipo}</TableCell>}
                                      <TableCell className="py-2 tabular-nums">{h.numeroProcesso || "—"}</TableCell>
                                      <TableCell className="py-2 tabular-nums">
                                        {formatDateBR(h.data)}
                                      </TableCell>
                                      {withMotivo && <TableCell className="py-2 text-muted-foreground">{h.motivo || "—"}</TableCell>}
                                      <TableCell className="py-2 text-muted-foreground">
                                        <span className="line-clamp-2">{h.observacoes || "—"}</span>
                                      </TableCell>
                                      <TableCell className="py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(h)} aria-label="Editar">
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setToDelete(h.id)} aria-label="Excluir">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(emptyForm); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form.id ? `Editar ${singular.toLowerCase()}` : `Novo ${singular.toLowerCase()}`}
            </DialogTitle>
          </DialogHeader>
          <form
            id="processo-form"
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.colaboradorId) { toast.error("Selecione um estagiário."); return; }
              const { id, ...input } = form;
              if (id) {
                update.mutate({ id, input }, {
                  onSuccess: () => {
                    toast.success(`${singular} atualizado.`);
                    setOpen(false); setForm(emptyForm);
                  },
                  onError: (err) => toast.error(`Erro: ${(err as Error).message}`),
                });
              } else {
                create.mutate(input, {
                  onSuccess: () => {
                    toast.success(`${singular} registrado.`);
                    setOpen(false); setForm(emptyForm);
                  },
                  onError: (err) => toast.error(`Erro: ${(err as Error).message}`),
                });
              }
            }}
          >
            <div className="space-y-1.5">
              <Label>Estagiário *</Label>
              <Select
                value={form.colaboradorId}
                onValueChange={(v) => setForm({ ...form, colaboradorId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {colaboradores
                    .filter((c) => c.vinculo === "Estágio")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {tipos.length > 1 && (
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm({ ...form, tipo: v as ProcessoTipo })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Número do processo</Label>
                <Input
                  placeholder="Ex.: 00050.000123/2025-11"
                  value={form.numeroProcesso ?? ""}
                  onChange={(e) => setForm({ ...form, numeroProcesso: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.data ?? ""}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
            </div>
            {withMotivo && (
              <div className="space-y-1.5">
                <Label>Motivo</Label>
                <Input
                  value={form.motivo ?? ""}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={form.observacoes ?? ""}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              form="processo-form"
              type="submit"
              variant="success"
              disabled={create.isPending || update.isPending}
            >
              {(create.isPending || update.isPending)
                ? "Salvando…"
                : form.id ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o: boolean) => { if (!o) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {singular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!toDelete) return;
                del.mutate(toDelete, {
                  onSuccess: () => { toast.success("Registro excluído."); setToDelete(null); },
                  onError: (err) => toast.error(`Erro: ${(err as Error).message}`),
                });
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Card>
  );
}

import { inclusiveDaysBetween, parseLocalDate } from "@/lib/dates";
// Acesso a dados via Supabase + React Query.
// AuthGate em __root.tsx garante usuário autenticado antes destas queries rodarem.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Colaborador,
  ColaboradorStatus,
  Estagio,
  EstagioStatus,
  Ferias,
  FeriasStatus,
  ProcessoAdm,
  ProcessoTipo,
  VinculoTipo,
} from "@/lib/mock-data";
import { diasRestantes } from "@/lib/mock-data";


// ============== mappers ==============

// Normaliza string removendo acentos, espaços extras e caixa, p/ lookup tolerante.
function normalizeKey(v: string | null | undefined): string {
  if (!v) return "";
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

const VINCULO_FROM_DB: Record<string, VinculoTipo> = {
  ESTAGIO: "Estágio",
  ESTAGIARIO: "Estágio",
  ESTAGIARIA: "Estágio",
  TERCEIRIZADO: "Terceirizado",
  TERCEIRIZADA: "Terceirizado",
  COMISSIONADO: "Comissionado",
  COMISSIONADA: "Comissionado",
  EFETIVO: "Efetivo",
  EFETIVA: "Efetivo",
  SELETIVO: "Seletivo",
  SELETIVA: "Seletivo",
  CONSULTOR: "Consultor(a)",
  CONSULTORA: "Consultor(a)",
  "CONSULTOR(A)": "Consultor(a)",
};

function toVinculo(v: string | null | undefined): VinculoTipo {
  const key = normalizeKey(v);
  if (!key) return "Efetivo";
  return VINCULO_FROM_DB[key] ?? "Efetivo";
}

const COLAB_STATUS_FROM_DB: Record<string, ColaboradorStatus> = {
  ATIVO: "Ativo",
  SIM: "Ativo",
  S: "Ativo",
  TRUE: "Ativo",
  "1": "Ativo",
  FERIAS: "Férias",
  AFASTADO: "Afastado",
  LICENCA: "Licença",
  DESLIGADO: "Desligado",
  INATIVO: "Desligado",
  NAO: "Desligado",
  N: "Desligado",
  FALSE: "Desligado",
  "0": "Desligado",
};

function toColabStatus(s: string | null | undefined): ColaboradorStatus {
  const key = normalizeKey(s);
  if (!key) return "Ativo";
  return COLAB_STATUS_FROM_DB[key] ?? "Ativo";
}

const FERIAS_STATUS_FROM_DB: Record<string, FeriasStatus> = {
  PLANEJADA: "Planejada",
  PLANEJADO: "Planejada",
  PLANEJAR: "Planejada",
  PROGRAMADA: "Planejada",
  PROGRAMADO: "Planejada",
  AGENDADA: "Planejada",
  AGENDADO: "Planejada",
  CONFIRMADA: "Confirmada",
  CONFIRMADO: "Confirmada",
  CONFIRMAR: "Confirmada",
  REALIZADA: "Realizada",
  REALIZADO: "Realizada",
  REALIZAR: "Realizada",
  CONCLUIDA: "Realizada",
  CONCLUIDO: "Realizada",
  GOZADA: "Realizada",
  GOZADO: "Realizada",
  "NAO REALIZADA": "Não realizada",
  "NAO REALIZADO": "Não realizada",
  CANCELADA: "Não realizada",
  CANCELADO: "Não realizada",
};

function toFeriasStatus(s: string | null | undefined): FeriasStatus {
  const key = normalizeKey(s);
  if (!key) return "Planejada";
  return FERIAS_STATUS_FROM_DB[key] ?? "Planejada";
}

const ESTAGIO_STATUS_FROM_DB: Record<string, EstagioStatus> = {
  VIGENTE: "Vigente",
  ATIVO: "Vigente",
  "EM ANDAMENTO": "Vigente",
  VENCENDO: "Vencendo",
  "A VENCER": "Vencendo",
  VENCIDO: "Vencido",
  EXPIRADO: "Vencido",
  ENCERRADO: "Encerrado",
  FINALIZADO: "Encerrado",
  RENOVADO: "Renovado",
  PRORROGADO: "Renovado",
};

function computeEstagioStatus(terminoIso: string | null): EstagioStatus {
  if (!terminoIso) return "Vigente";
  const d = diasRestantes(terminoIso);
  if (d < 0) return "Vencido";
  if (d <= 30) return "Vencendo";
  return "Vigente";
}

function toEstagioStatus(s: string | null | undefined, termino: string | null): EstagioStatus {
  const key = normalizeKey(s);
  if (key) {
    const mapped = ESTAGIO_STATUS_FROM_DB[key];
    if (mapped) return mapped;
  }
  return computeEstagioStatus(termino);
}

function toEstagioTipo(t: string | null | undefined): "Público" | "Privado" {
  if (!t) return "Público";
  const u = t.trim().toUpperCase();
  if (u.startsWith("PRIV")) return "Privado";
  return "Público";
}

function toEstagioModalidade(t: string | null | undefined): "Graduação" | "Pós-graduação" | undefined {
  if (!t) return undefined;
  const u = t.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (u.includes("POS") || u.includes("PG") || u.includes("MESTRADO") || u.includes("DOUTORADO")) {
    return "Pós-graduação";
  }
  if (u.includes("GRAD") || u.includes("BACHAREL") || u.includes("LICENCIATURA")) {
    return "Graduação";
  }
  return undefined;
}

// ============== row -> domain ==============

type PessoaRow = {
  id: string;
  nome: string;
  cpf: string;
  tipo_vinculo: string;
  ativo: string | null;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  data_admissao: string | null;
  status: string | null;
  observacoes: string | null;
};

function pessoaToColaborador(p: PessoaRow): Colaborador {
  return {
    id: p.id,
    nome: p.nome,
    cpf: p.cpf,
    cargo: p.cargo ?? "",
    email: p.email ?? "",
    telefone: p.telefone ?? "",
    vinculo: toVinculo(p.tipo_vinculo),
    status: toColabStatus(p.status ?? p.ativo),
    admissao: p.data_admissao ?? "",
    observacoes: p.observacoes ?? undefined,
  };
}

type EstagioRow = {
  id: string;
  pessoa_id: string | null;
  nome_estagiario: string | null;
  tipo_estagio: string | null;
  modalidade: string | null;
  duracao_meses: number | null;
  instituicao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  data_renovacao: string | null;
  renovacao_manual: boolean | null;
  status: string | null;
  setor: string | null;
};

// Sugestão padrão: 1 mês antes do término (apenas sugestão inicial).
export function sugerirDataRenovacao(terminoIso: string): string {
  const date = parseLocalDate(terminoIso);
  if (!date) return "";
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const alvoMes = m - 2; // (m-1) - 1, base 0
  const ano = y + Math.floor(alvoMes / 12);
  const mes = ((alvoMes % 12) + 12) % 12;
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  const dia = Math.min(d, ultimoDia);
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function estagioRowToEstagio(e: EstagioRow): Estagio {
  return {
    id: e.id,
    colaboradorId: e.pessoa_id ?? "",
    nomeEstagiario: e.nome_estagiario ?? undefined,
    tipo: toEstagioTipo(e.tipo_estagio),
    modalidade: toEstagioModalidade(e.modalidade),
    duracaoMeses: (e.duracao_meses === 6 || e.duracao_meses === 12 ? e.duracao_meses : undefined) as
      | 6
      | 12
      | undefined,
    instituicao: e.instituicao ?? undefined,
    inicio: e.data_inicio ?? "",
    termino: e.data_fim ?? "",
    dataRenovacao: e.data_renovacao ?? undefined,
    renovacaoManual: !!e.renovacao_manual,
    status: toEstagioStatus(e.status, e.data_fim),
    observacoes: e.setor ?? undefined,
  };
}

type FeriasRow = {
  id: string;
  pessoa_id: string;
  data_inicio: string | null;
  data_fim: string | null;
  data_SIAPE: string | null;
  dias: number | null;
  periodo_gozo: string | null;
  status: string | null;
  numero_processo: string | null;
  exercicio: number | null;
};

function feriasRowToFerias(f: FeriasRow): Ferias {
  const inicio = f.data_inicio ?? "";
  const termino = f.data_fim ?? "";
  return {
    id: f.id,
    colaboradorId: f.pessoa_id,
    inicio,
    termino,
    dataSiape: f.data_SIAPE ?? undefined,
    dias: f.dias ?? inclusiveDaysBetween(inicio, termino),
    status: toFeriasStatus(f.status),
    periodoGozo: f.periodo_gozo ?? "",
    numeroProcesso: f.numero_processo ?? undefined,
    exercicio: f.exercicio ?? undefined,
  };
}


// ============== queries ==============

// Invalida todas as coleções derivadas da fonte central (Pessoas).
async function invalidarTudo(qc: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ["colaboradores"], refetchType: "all" }),
    qc.invalidateQueries({ queryKey: ["estagios"], refetchType: "all" }),
    qc.invalidateQueries({ queryKey: ["ferias"], refetchType: "all" }),
    qc.invalidateQueries({ queryKey: ["processos"], refetchType: "all" }),
  ]);
}

export const qk = {
  colaboradores: ["colaboradores"] as const,
  colaborador: (id: string) => ["colaboradores", id] as const,
  estagios: ["estagios"] as const,
  ferias: ["ferias"] as const,
};

export function useColaboradores() {
  return useQuery({
    queryKey: qk.colaboradores,
    queryFn: async (): Promise<Colaborador[]> => {
      const { data, error } = await supabase
        .from("Pessoas")
        .select("*")
        .order("nome");
      if (error) throw error;
      // Cada cadastro de Pessoas é um vínculo próprio: registros com o mesmo
      // CPF (vínculo anterior encerrado + vínculo novo) são preservados.
      // A única salvaguarda é contra o mesmo ID repetido.
      const vistos = new Map<string, Colaborador>();
      (data as PessoaRow[]).forEach((p) => {
        if (!vistos.has(p.id)) vistos.set(p.id, pessoaToColaborador(p));
      });
      return Array.from(vistos.values()).sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
      );
    },
  });
}

// Pessoas cujo vínculo ainda está vigente segundo os contratos de estágio
// (o status do contrato prevalece sobre o status histórico do cadastro).
export function pessoasComEstagioVigente(estagios: Estagio[]): Set<string> {
  const ids = new Set<string>();
  estagios.forEach((e) => {
    if (!e.colaboradorId) return;
    if (e.status === "Encerrado" || e.status === "Renovado") return;
    ids.add(e.colaboradorId);
  });
  return ids;
}


export function useColaborador(id: string | undefined) {
  return useQuery({
    queryKey: qk.colaborador(id ?? ""),
    enabled: !!id,
    queryFn: async (): Promise<Colaborador | null> => {
      const { data, error } = await supabase
        .from("Pessoas")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data ? pessoaToColaborador(data as PessoaRow) : null;
    },
  });
}

export function useEstagios() {
  return useQuery({
    queryKey: qk.estagios,
    queryFn: async (): Promise<Estagio[]> => {
      const { data, error } = await supabase
        .from("estagios")
        .select("*")
        .order("data_fim", { ascending: true });
      if (error) throw error;
      return (data as unknown as EstagioRow[]).map(estagioRowToEstagio);
    },
  });
}

export function useFerias() {
  return useQuery({
    queryKey: qk.ferias,
    queryFn: async (): Promise<Ferias[]> => {
      const { data, error } = await supabase
        .from("ferias")
        .select("*")
        .order("data_inicio", { ascending: true });
      if (error) throw error;
      return (data as FeriasRow[]).map(feriasRowToFerias);
    },
  });
}

// ============== mutations ==============

const VINCULO_TO_DB: Record<VinculoTipo, string> = {
  "Estágio": "ESTAGIO",
  "Terceirizado": "TERCEIRIZADO",
  "Comissionado": "COMISSIONADO",
  "Efetivo": "EFETIVO",
  "Seletivo": "SELETIVO",
  "Consultor(a)": "CONSULTOR",
};

export interface ColaboradorInput {
  nome: string;
  cpf: string;
  cargo?: string;
  email?: string;
  telefone?: string;
  vinculo: VinculoTipo;
  status: ColaboradorStatus;
  admissao?: string;
  observacoes?: string;
}

export function colaboradorToRow(input: ColaboradorInput) {
  return {
    nome: input.nome,
    cpf: input.cpf,
    tipo_vinculo: VINCULO_TO_DB[input.vinculo] ?? input.vinculo.toUpperCase(),
    cargo: input.cargo || null,
    email: input.email || null,
    telefone: input.telefone || null,
    data_admissao: input.admissao || null,
    status: input.status,
    observacoes: input.observacoes || null,
    ativo: input.status === "Desligado" ? "Não" : "Sim",
  };
}

export function useCreateColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ColaboradorInput) => {
      // Uma pessoa = um colaborador: CPF já existente (com ou sem máscara) atualiza.
      const existenteId = await buscarPessoaExistente(input.cpf, input.nome);
      if (existenteId) {
        const { error: upErr, data: atualizada } = await supabase
          .from("Pessoas")
          .update(colaboradorToRow(input))
          .eq("id", existenteId)
          .select()
          .single();
        if (upErr) throw upErr;
        return atualizada;
      }
      const { error, data } = await supabase
        .from("Pessoas")
        .insert(colaboradorToRow(input))
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await invalidarTudo(qc);
    },
  });
}


export function useUpdateColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; input: ColaboradorInput }) => {
      const { error } = await supabase
        .from("Pessoas")
        .update(colaboradorToRow(args.input))
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: async (_d, vars) => {
      // Pessoa é a fonte central: todos os módulos dependentes precisam recarregar.
      await Promise.all([
        invalidarTudo(qc),
        qc.invalidateQueries({ queryKey: qk.colaborador(vars.id), refetchType: "all" }),
      ]);
    },
  });
}

export interface EstagioInput {
  colaboradorId?: string;
  nomeEstagiario?: string;
  cpf?: string;
  tipo: "Público" | "Privado";
  modalidade?: "Graduação" | "Pós-graduação";
  duracaoMeses?: number;
  instituicao?: string;
  inicio: string;
  termino: string;
  dataRenovacao?: string;
  renovacaoManual?: boolean;
  status: EstagioStatus;
  observacoes?: string;
}

export function estagioToRow(input: EstagioInput) {
  return {
    pessoa_id: input.colaboradorId,
    nome_estagiario: input.nomeEstagiario || null,
    tipo_estagio: input.tipo === "Privado" ? "PRIVADO" : "PUBLICO",
    modalidade: input.modalidade ?? null,
    duracao_meses: input.duracaoMeses ?? null,
    instituicao: input.instituicao || null,
    data_inicio: input.inicio || null,
    data_fim: input.termino || null,
    data_renovacao: input.dataRenovacao || null,
    renovacao_manual: !!input.renovacaoManual,
    status: input.status,
    setor: input.observacoes || null,
  };
}

// CPF é o identificador principal da pessoa: comparação sempre sem máscara.
export function normalizarCpf(cpf?: string | null) {
  return (cpf || "").replace(/\D/g, "");
}

function normalizarNome(nome?: string | null) {
  return (nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// Procura a pessoa central por CPF normalizado (máscara é irrelevante) e,
// como último recurso, por nome normalizado.
async function buscarPessoaExistente(cpf: string, nome: string): Promise<string | null> {
  const cpfDigits = normalizarCpf(cpf);
  const { data: pessoas } = await supabase.from("Pessoas").select("id, nome, cpf");
  const lista = pessoas ?? [];
  if (cpfDigits) {
    const porCpf = lista.find((p) => normalizarCpf(p.cpf) === cpfDigits);
    if (porCpf) return porCpf.id;
    // Um CPF informado identifica a pessoa de forma soberana. Não consolida
    // por nome quando o CPF é diferente, evitando unir homônimos.
    return null;
  }
  const nomeN = normalizarNome(nome);
  if (nomeN) {
    const porNome = lista.find((p) => normalizarNome(p.nome) === nomeN);
    if (porNome) return porNome.id;
  }
  return null;
}

// Localiza (ou cria) o registro central da pessoa em `Pessoas` a partir do
// nome/CPF informado no módulo de Estágios — fonte única de colaboradores.
async function resolverColaboradorEstagio(input: EstagioInput): Promise<string | null> {
  // Edição de um estágio já vinculado nunca cria pessoa nova.
  if (input.colaboradorId) return input.colaboradorId;
  const nome = (input.nomeEstagiario || "").trim();
  const cpf = (input.cpf || "").trim();
  if (!nome && !normalizarCpf(cpf)) return null;

  const existente = await buscarPessoaExistente(cpf, nome);
  if (existente) return existente;

  const { data: criada, error } = await supabase
    .from("Pessoas")
    .insert({
      nome,
      cpf: cpf || "",
      tipo_vinculo: "ESTAGIO",
      ativo: "Sim",
      status: "Ativo",
      cargo: "Estagiário(a)",
    })
    .select("id")
    .single();
  if (error) throw error;
  return criada?.id ?? null;
}


export function useCreateEstagio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EstagioInput) => {
      const colaboradorId = await resolverColaboradorEstagio(input);
      // Nome é dado central do colaborador: não duplicar no contrato quando há vínculo.
      const row = {
        ...estagioToRow(input),
        pessoa_id: colaboradorId,
        nome_estagiario: colaboradorId ? null : (input.nomeEstagiario || null),
      };
      const { error } = await supabase.from("estagios").insert(row as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.estagios });
      qc.invalidateQueries({ queryKey: qk.colaboradores });
    },
  });
}

export function useUpdateEstagio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; input: EstagioInput }) => {
      const colaboradorId = await resolverColaboradorEstagio(args.input);
      // Nome é dado central do colaborador: atualiza o registro único.
      if (colaboradorId && args.input.nomeEstagiario?.trim()) {
        const { error: pErr } = await supabase
          .from("Pessoas")
          .update({ nome: args.input.nomeEstagiario.trim() })
          .eq("id", colaboradorId);
        if (pErr) throw pErr;
      }
      const { data, error } = await supabase
        .from("estagios")
        .update({
          ...estagioToRow(args.input),
          pessoa_id: colaboradorId,
          // Evita segunda fonte de verdade do nome: fica só em `Pessoas`.
          nome_estagiario: colaboradorId ? null : (args.input.nomeEstagiario || null),
        } as any)
        .eq("id", args.id)
        .select("*")
        .single();
      if (error) throw error;
      if (!data) {
        throw new Error("Nenhum registro de estágio foi atualizado.");
      }
      return estagioRowToEstagio(data as unknown as EstagioRow);
    },
    onSuccess: async (updated) => {
      // A resposta persistida substitui imediatamente o mesmo registro na
      // única cache de estágios; a refetch posterior confirma o estado do banco.
      qc.setQueryData<Estagio[]>(qk.estagios, (current = []) => {
        const index = current.findIndex((estagio) => estagio.id === updated.id);
        if (index < 0) return [...current, updated];
        return current.map((estagio) => estagio.id === updated.id ? updated : estagio);
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.estagios, refetchType: "all" }),
        qc.invalidateQueries({ queryKey: qk.colaboradores, refetchType: "all" }),
        qc.invalidateQueries({ queryKey: qk.ferias, refetchType: "all" }),
      ]);
    },
  });
}

export interface FeriasInput {
  colaboradorId: string;
  inicio: string;
  termino: string;
  dataSiape?: string;
  dias: number;
  periodoGozo?: string;
  status: FeriasStatus;
  numeroProcesso?: string;
  exercicio?: number;
}

export function feriasToRow(input: FeriasInput) {
  return {
    pessoa_id: input.colaboradorId,
    data_inicio: input.inicio || null,
    data_fim: input.termino || null,
    data_SIAPE: input.dataSiape || null,
    dias: input.dias || null,
    periodo_gozo: input.periodoGozo || null,
    status: input.status,
    numero_processo: input.numeroProcesso || null,
    exercicio: input.exercicio ?? null,
  };
}

export function useCreateFerias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FeriasInput) => {
      const { error } = await supabase.from("ferias").insert(feriasToRow(input));
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.ferias }),
  });
}

export function useUpdateFerias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; input: FeriasInput }) => {
      const { error } = await supabase
        .from("ferias")
        .update(feriasToRow(args.input))
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.ferias }),
  });
}

export function useDeleteFerias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ferias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.ferias }),
  });
}

// ============== processos administrativos ==============

type ProcessoRow = {
  id: string;
  pessoa_id: string | null;
  estagio_id: string | null;
  tipo_processo: string | null;
  renovacoes: number | null;
  desligamento: string | null;
  sei_protocolo: string | null;
  data_solicitacao: string | null;
  status: string | null;
  motivo: string | null;
  observacoes: string | null;
};

const PROCESSO_TIPO_FROM_DB: Record<string, ProcessoTipo> = {
  CONTRATACAO: "Contratação",
  CONTRATO: "Contratação",
  RENOVACAO: "Renovação",
  PRORROGACAO: "Renovação",
  DESLIGAMENTO: "Desligamento",
  ENCERRAMENTO: "Desligamento",
  RESCISAO: "Desligamento",
};

function toProcessoTipo(t: string | null | undefined): ProcessoTipo {
  const k = normalizeKey(t);
  if (!k) return "Outro";
  return PROCESSO_TIPO_FROM_DB[k] ?? "Outro";
}

function processoRowTo(p: ProcessoRow): ProcessoAdm {
  return {
    id: p.id,
    colaboradorId: p.pessoa_id ?? "",
    tipo: toProcessoTipo(p.tipo_processo),
    numeroProcesso: p.sei_protocolo ?? undefined,
    data: p.data_solicitacao ?? undefined,
    motivo: p.motivo ?? undefined,
    observacoes: p.observacoes ?? undefined,
  };
}

const PROCESSO_TIPO_TO_DB: Record<ProcessoTipo, string> = {
  "Contratação": "CONTRATACAO",
  "Renovação": "RENOVACAO",
  "Desligamento": "DESLIGAMENTO",
  "Outro": "OUTRO",
};

export interface ProcessoInput {
  colaboradorId: string;
  tipo: ProcessoTipo;
  numeroProcesso?: string;
  data?: string;
  motivo?: string;
  observacoes?: string;
}

export function processoToRow(input: ProcessoInput) {
  return {
    pessoa_id: input.colaboradorId,
    tipo_processo: PROCESSO_TIPO_TO_DB[input.tipo],
    sei_protocolo: input.numeroProcesso || null,
    data_solicitacao: input.data || null,
    motivo: input.motivo || null,
    observacoes: input.observacoes || null,
  };
}

export const qkProcessos = ["processos"] as const;

export function useProcessos() {
  return useQuery({
    queryKey: qkProcessos,
    queryFn: async (): Promise<ProcessoAdm[]> => {
      const { data, error } = await supabase
        .from("processos")
        .select("id, pessoa_id, estagio_id, tipo_processo, renovacoes, desligamento, sei_protocolo, data_solicitacao, status, motivo, observacoes, created_at")
        .order("data_solicitacao", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ProcessoRow[]).map(processoRowTo);
    },
  });
}

export function useCreateProcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProcessoInput) => {
      const { error } = await supabase.from("processos").insert(processoToRow(input));
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qkProcessos }),
  });
}

export function useUpdateProcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; input: ProcessoInput }) => {
      const { error } = await supabase
        .from("processos")
        .update(processoToRow(args.input))
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qkProcessos }),
  });
}

export function useDeleteProcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("processos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qkProcessos }),
  });
}


// Types, constants and helpers shared by the UI.
// Real data agora vem do Supabase via src/lib/db.ts.

export type VinculoTipo =
  | "Estágio"
  | "Terceirizado"
  | "Comissionado"
  | "Efetivo"
  | "Seletivo"
  | "Consultor(a)";

export type ColaboradorStatus = "Ativo" | "Férias" | "Afastado" | "Desligado" | "Licença";

export type EstagioStatus = "Vigente" | "Vencendo" | "Vencido" | "Encerrado" | "Renovado";

export type FeriasStatus =
  | "Planejada"
  | "Confirmada"
  | "Realizada"
  | "Não realizada";

export interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  email: string;
  telefone: string;
  vinculo: VinculoTipo;
  status: ColaboradorStatus;
  admissao: string; // YYYY-MM-DD ou ""
  observacoes?: string;
}

export type EstagioModalidade = "Graduação" | "Pós-graduação";

export interface Estagio {
  id: string;
  colaboradorId: string;
  nomeEstagiario?: string;
  tipo: "Público" | "Privado";
  modalidade?: EstagioModalidade;
  duracaoMeses?: 6 | 12;
  instituicao?: string;
  inicio: string;
  termino: string;
  dataRenovacao?: string;
  renovacaoManual?: boolean;
  status: EstagioStatus;
  observacoes?: string;
}

export interface Ferias {
  id: string;
  colaboradorId: string;
  inicio: string;
  termino: string;
  dataSiape?: string;
  dias: number;
  status: FeriasStatus;
  periodoGozo: string;
  numeroProcesso?: string;
  exercicio?: number;
}

export type ProcessoTipo = "Contratação" | "Renovação" | "Desligamento" | "Outro";

export interface ProcessoAdm {
  id: string;
  colaboradorId: string;
  tipo: ProcessoTipo;
  numeroProcesso?: string;
  data?: string;
  motivo?: string;
  observacoes?: string;
}


export { daysRemaining as diasRestantes } from "@/lib/dates";

export const VINCULOS: VinculoTipo[] = [
  "Estágio",
  "Terceirizado",
  "Comissionado",
  "Efetivo",
  "Seletivo",
  "Consultor(a)",
];

export const COLAB_STATUS: ColaboradorStatus[] = [
  "Ativo",
  "Férias",
  "Afastado",
  "Licença",
  "Desligado",
];

export const ESTAGIO_STATUS: EstagioStatus[] = [
  "Vigente",
  "Vencendo",
  "Vencido",
  "Encerrado",
  "Renovado",
];

export const FERIAS_STATUS: FeriasStatus[] = [
  "Planejada",
  "Confirmada",
  "Realizada",
  "Não realizada",
];

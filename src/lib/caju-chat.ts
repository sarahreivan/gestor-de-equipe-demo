import { Users, CalendarDays, FileText, GraduationCap, HelpCircle, type LucideIcon } from "lucide-react";

// ============================================================
// Fluxos do assistente Caju
// Toda a lógica de ações rápidas e respostas simuladas vive aqui.
// Para integrar Supabase/IA, basta substituir `getSimulatedReply`
// por uma função assíncrona mantendo a mesma assinatura.
// ============================================================

export type CajuFlowId = "colaborador" | "ferias" | "contratos" | "estagios" | "duvida";

export type CajuFlow = {
  id: CajuFlowId;
  icon: LucideIcon;
  label: string;
  /** Resposta enviada logo após o usuário acionar a ação rápida. */
  prompt: string;
  /** Resposta enviada nas mensagens seguintes enquanto o fluxo estiver ativo. */
  followUp: string;
};

export const CAJU_FLOWS: CajuFlow[] = [
  {
    id: "colaborador",
    icon: Users,
    label: "Encontrar colaborador",
    prompt: "Informe o nome do colaborador que deseja localizar.",
    followUp: "Entendido. Em breve poderei localizar colaboradores automaticamente.",
  },
  {
    id: "ferias",
    icon: CalendarDays,
    label: "Consultar férias",
    prompt: "Informe o nome do colaborador ou o período que deseja consultar.",
    followUp: "Entendido. Em breve poderei consultar férias cadastradas.",
  },
  {
    id: "contratos",
    icon: FileText,
    label: "Consultar contratos",
    prompt: "Informe o colaborador ou contrato que deseja consultar.",
    followUp: "Entendido. Em breve poderei consultar contratos.",
  },
  {
    id: "estagios",
    icon: GraduationCap,
    label: "Consultar estágios",
    prompt: "Informe o nome do colaborador ou estagiário.",
    followUp: "Entendido. Em breve poderei consultar estágios.",
  },
  {
    id: "duvida",
    icon: HelpCircle,
    label: "Tirar uma dúvida",
    prompt: "Descreva sua dúvida sobre o sistema.",
    followUp:
      "Entendido. Em breve poderei responder automaticamente utilizando as informações do sistema.",
  },
];

export const FALLBACK_REPLY =
  "Anotei sua mensagem. Em breve poderei responder isso automaticamente aqui no assistente.";

export function findFlowByLabel(label: string): CajuFlow | undefined {
  const value = label.trim().toLowerCase();
  return CAJU_FLOWS.find((f) => f.label.toLowerCase() === value);
}

export function getFlow(id: CajuFlowId | null): CajuFlow | undefined {
  return id ? CAJU_FLOWS.find((f) => f.id === id) : undefined;
}

/**
 * Resolve a resposta simulada considerando o contexto (fluxo) atual.
 * Retorna também o novo contexto a ser mantido na conversa.
 */
export function getSimulatedReply(
  userText: string,
  currentFlow: CajuFlowId | null,
): { reply: string; flow: CajuFlowId | null } {
  const flowFromLabel = findFlowByLabel(userText);
  if (flowFromLabel) {
    return { reply: flowFromLabel.prompt, flow: flowFromLabel.id };
  }

  const active = getFlow(currentFlow);
  if (active) {
    return { reply: active.followUp, flow: active.id };
  }

  return { reply: FALLBACK_REPLY, flow: null };
}

export function buildWelcomeText(firstName: string): string {
  const nome = firstName ? `, ${firstName}` : "";
  return `Olá${nome}! 👋\n\nSou o Caju, assistente da equipe.\n\nPosso ajudar você a localizar colaboradores, consultar contratos, acompanhar estágios e férias ou esclarecer dúvidas sobre o sistema.\n\nComo posso ajudar?`;
}

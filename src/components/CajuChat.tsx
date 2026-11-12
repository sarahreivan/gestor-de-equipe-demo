import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Send, X, ChevronRight, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth";
import mascoteAsset from "@/assets/sgcf-mascote-busto.png.asset.json";
import cajuHead from "@/assets/caju-avatar-head.png";
import {
  CAJU_FLOWS,
  buildWelcomeText,
  getSimulatedReply,
  type CajuFlowId,
} from "@/lib/caju-chat";

// ============================================================
// Tipos
// ============================================================

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

function buildInitialMessage(firstName: string): Message {
  return { id: "welcome", role: "bot", content: buildWelcomeText(firstName) };
}

// ============================================================
// Cabeçalho
// ============================================================

function ChatHeader({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <img src={mascoteAsset.url} alt="" className="h-9 w-9 object-contain" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span>Caju</span>
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
        </div>
        <div className="text-[11px] text-muted-foreground">Assistente da equipe</div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <RotateCcw className="h-3 w-3" />
        Nova conversa
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}

// ============================================================
// Histórico
// ============================================================

function Bubble({ role, children }: { role: Message["role"]; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex w-full animate-in fade-in slide-in-from-bottom-1 duration-200",
        role === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-[var(--shadow-soft)]",
          role === "user"
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Ações rápidas
// ============================================================

function QuickActionsList({ onSelect }: { onSelect: (label: string) => void }) {
  return (
    <div className="flex flex-col gap-2 pt-1 animate-in fade-in duration-300">
      {CAJU_FLOWS.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a.label)}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm font-medium text-foreground shadow-[var(--shadow-soft)] transition-all hover:-translate-y-[1px] hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1 truncate">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CollapsibleQuickActions({ onSelect }: { onSelect: (label: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-1.5 rounded-md px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
        Ações rápidas
      </button>
      {expanded && <QuickActionsList onSelect={onSelect} />}
    </div>
  );
}

// ============================================================
// Indicador de digitação
// ============================================================

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in duration-200">
      <span className="inline-flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
      </span>
      Caju está digitando...
    </div>
  );
}

// ============================================================
// Campo de mensagem
// ============================================================

function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex items-end gap-2 border-t border-border bg-card px-3 py-3"
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite sua pergunta..."
        rows={1}
        className="flex max-h-32 min-h-10 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
        autoComplete="off"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled}
        aria-label="Enviar mensagem"
        className="h-10 w-10 shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

// ============================================================
// Componente principal
// ============================================================

export function CajuChat() {
  const { displayName } = useAuth();
  const firstName = useMemo(() => (displayName?.trim().split(/\s+/)[0] ?? ""), [displayName]);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [buildInitialMessage(firstName)]);
  const [flow, setFlow] = useState<CajuFlowId | null>(null);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Atualiza a saudação se o nome do usuário chegar depois do primeiro render.
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].id !== "welcome") return prev;
      return [buildInitialMessage(firstName)];
    });
  }, [firstName]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(t);
  }, [open]);

  const sendMessage = (text: string) => {
    const value = text.trim();
    if (!value) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: value }]);
    setInput("");
    setTyping(true);

    window.setTimeout(() => {
      const { reply, flow: nextFlow } = getSimulatedReply(value, flow);
      setFlow(nextFlow);
      setMessages((prev) => [...prev, { id: `b-${Date.now()}`, role: "bot", content: reply }]);
      setTyping(false);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }, 900);
  };

  const resetConversation = () => {
    setMessages([buildInitialMessage(firstName)]);
    setFlow(null);
    setInput("");
    setTyping(false);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const hasUserMessage = messages.some((m) => m.role === "user");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir assistente Caju"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-card ring-1 ring-border shadow-[var(--shadow-elevated)] transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <img src={cajuHead} alt="" width={816} height={816} loading="lazy" className="h-11 w-11 object-contain" decoding="async" />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-card" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]">
        <ChatHeader onClose={() => setOpen(false)} onReset={resetConversation} />

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-background px-4 py-4">
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role}>
              {m.content}
            </Bubble>
          ))}

          {!hasUserMessage && !typing && <QuickActionsList onSelect={sendMessage} />}
          {hasUserMessage && !typing && <CollapsibleQuickActions onSelect={sendMessage} />}

          {typing && <TypingIndicator />}
        </div>

        <Composer
          value={input}
          onChange={setInput}
          onSubmit={() => sendMessage(input)}
          disabled={!input.trim() || typing}
          inputRef={inputRef}
        />
      </SheetContent>
    </Sheet>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import mascoteAsset from "@/assets/sgcf-mascote-v2.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowRight, BellRing, CalendarDays, Eye, EyeOff, GraduationCap, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/auth";
import { validateLoginFields } from "@/lib/login-validation";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Entrar — Gestor de Equipe" },
    { name: "description", content: "Acesso ao Sistema de Gestão da Equipe para acompanhar colaboradores, contratos, estágios e férias." },
    { property: "og:title", content: "Entrar — Gestor de Equipe" },
    { property: "og:description", content: "Acesso ao Sistema de Gestão da Equipe para acompanhar colaboradores, contratos, estágios e férias." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { property: "og:image", content: mascoteAsset.url },
    { name: "twitter:image", content: mascoteAsset.url },
  ] }),
  component: LoginPage,
});

type Mode = "signin" | "forgot";

function FieldError({ id, children }: { id: string; children?: string | null }) {
  if (!children) return null;
  return <p id={id} role="alert" className="flex items-start gap-2 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{children}</p>;
}

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateLoginFields>>({ email: undefined, password: undefined });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setError(null);
    setFieldErrors({ email: undefined, password: undefined });
    setSenha("");
    setShowPassword(false);
    setMode(next);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const errors = validateLoginFields(email, senha);
    setFieldErrors(errors);
    if (errors.email || errors.password) return;
    setBusy(true);
    try {
      const { error } = await signIn(email, senha);
      if (error) {
        setError("E-mail ou senha inválidos.");
        return;
      }
      navigate({ to: "/" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-screen flex min-h-dvh items-center justify-center bg-background text-foreground px-4 py-8 sm:px-8">
      <div className="grid w-full max-w-[1080px] overflow-hidden rounded-[16px] border border-card bg-card shadow-[var(--shadow-login)] md:grid-cols-2">
        <section className="hidden flex-col items-center justify-center border-r border-primary/10 bg-gradient-to-b from-login-panel to-login-panel-end px-10 py-10 text-center md:flex lg:px-12">
          <div className="login-mascot relative flex h-[310px] w-full max-w-[340px] items-center justify-center">
            <img src={mascoteAsset.url} alt="Caju, mascote do sistema" className="relative h-[310px] w-full max-w-[340px] object-contain [filter:drop-shadow(var(--shadow-mascot))]" decoding="async" />
          </div>
          <h2 className="mt-6 max-w-sm text-[28px] font-semibold leading-tight text-primary-foreground">Sistema de Gestão da Equipe</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-primary-foreground/85">Plataforma para acompanhar colaboradores, contratos, estágios e férias em um só lugar.</p>
          <ul className="mt-7 flex w-full max-w-xs flex-col gap-4 text-left text-sm font-medium text-primary-foreground">
            {[{ icon: GraduationCap, label: "Estágios e renovações" }, { icon: CalendarDays, label: "Controle de férias" }, { icon: BellRing, label: "Alertas de prazos" }].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3"><Icon className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />{label}</li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col justify-center bg-card px-6 py-9 sm:px-10 md:px-10 md:py-12 lg:px-14">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <img src={mascoteAsset.url} alt="Caju, mascote do sistema" className="h-16 w-14 object-contain" decoding="async" />
            <span className="max-w-56 text-lg font-semibold leading-snug text-primary">Sistema de Gestão da Equipe</span>
          </div>
          <div className="login-lock mb-6 flex size-11 items-center justify-center rounded-lg text-success"><LockKeyhole className="size-5" strokeWidth={1.8} aria-hidden="true" /></div>
          <h1 className="text-[28px] font-semibold leading-tight text-foreground">{mode === "signin" ? "Entrar" : "Recuperar acesso"}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{mode === "signin" ? "Acesse com seu e-mail e senha." : "A recuperação de senha é feita pelo administrador. Contate a equipe administradora."}</p>

          {mode === "signin" ? (
            <form className="mt-8 space-y-6" onSubmit={onSubmit} noValidate aria-busy={busy}>
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-[15px]">E-mail</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="email" type="email" placeholder="seu.nome@empresa.com" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: undefined })); setError(null); }} required disabled={busy} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} className="h-11 bg-card pl-10 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary aria-invalid:border-destructive" />
                </div>
                <FieldError id="email-error">{fieldErrors.email}</FieldError>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="senha" className="text-[15px]">Senha</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="senha" type={showPassword ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" value={senha} onChange={(e) => { setSenha(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })); setError(null); }} minLength={6} required disabled={busy} aria-invalid={Boolean(fieldErrors.password || error)} aria-describedby={fieldErrors.password || error ? "senha-error" : undefined} className="h-11 bg-card pl-10 pr-12 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary aria-invalid:border-destructive" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-primary" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} title={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff /> : <Eye />}</Button>
                </div>
                <FieldError id="senha-error">{fieldErrors.password || error}</FieldError>
                <div className="flex justify-end"><Button type="button" variant="link" className="h-auto px-0 py-1 text-sm" onClick={() => switchMode("forgot")}>Esqueci minha senha</Button></div>
              </div>
              <Button type="submit" variant="success" className="login-submit h-11 w-full text-[15px] motion-safe:transition-all motion-safe:hover:-translate-y-0.5" disabled={busy}>{busy ? <><LoaderCircle className="motion-safe:animate-spin" />Aguarde…</> : <>Entrar<ArrowRight /></>}</Button>
              <p className="text-center text-xs leading-5 text-muted-foreground">O acesso é restrito. Solicite o cadastro à equipe administradora.</p>
            </form>
          ) : (
            <div className="mt-8 space-y-6">
              <p className="border-l-2 border-primary/30 pl-4 text-sm leading-6 text-foreground">A redefinição de senha é feita internamente pelo administrador. Solicite a redefinição enviando uma mensagem à equipe responsável.</p>
              <Button variant="outline" className="h-11 w-full" onClick={() => switchMode("signin")}>Voltar ao login</Button>
            </div>
          )}
          <footer className="mt-9 border-t border-border pt-5 text-center text-xs text-muted-foreground"><span className="inline-flex items-center justify-center gap-2"><ShieldCheck className="size-3.5" aria-hidden="true" />© Gestor de Equipe (Demo)</span></footer>
        </section>
      </div>
    </main>
  );
}

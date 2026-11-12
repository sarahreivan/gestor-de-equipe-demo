import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — Gestor de Equipe" },
      { name: "description", content: "Dados pessoais e acesso do usuário ao sistema." },
      { property: "og:title", content: "Meu perfil — Gestor de Equipe" },
      { property: "og:description", content: "Dados pessoais e acesso do usuário ao sistema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: PerfilPage,
});

function PerfilPage() {
  const { profile, displayName, isAdmin, updateProfile } = useAuth();
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [savingPerfil, setSavingPerfil] = useState(false);

  useEffect(() => {
    setNome(profile?.nome_completo ?? "");
    setCargo(profile?.cargo ?? "");
    setTelefone(profile?.telefone ?? "");
  }, [profile]);

  const [senha1, setSenha1] = useState("");
  const [senha2, setSenha2] = useState("");
  const [savingSenha, setSavingSenha] = useState(false);

  const salvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPerfil(true);
    const { error } = await updateProfile({ nome_completo: nome, cargo, telefone });
    setSavingPerfil(false);
    if (error) toast.error("Erro ao salvar: " + error);
    else toast.success("Perfil atualizado.");
  };

  const trocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha1.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres.");
    if (senha1 !== senha2) return toast.error("As senhas não coincidem.");
    setSavingSenha(true);
    const { error } = await supabase.auth.updateUser({ password: senha1 });
    setSavingSenha(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Senha alterada com sucesso.");
      setSenha1("");
      setSenha2("");
    }
  };

  return (
    <div>
      <PageHeader
        title="Meu perfil"
        description="Atualize seus dados pessoais e gerencie sua senha de acesso."
        breadcrumbs={[{ label: "Início", to: "/" }, { label: "Meu perfil" }]}
      />

      <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
          {displayName.split(/\s+/).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("")}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? "Administrador" : "Colaborador"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={salvarPerfil} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cargo">Cargo / Função</Label>
                <Input id="cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex.: Analista administrativo" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tel">Telefone</Label>
                <Input id="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(86) 0 0000-0000" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="success" disabled={savingPerfil}>
                  {savingPerfil ? "Salvando…" : "Salvar alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Alterar senha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={trocarSenha} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="s1">Nova senha</Label>
                <Input id="s1" type="password" value={senha1} onChange={(e) => setSenha1(e.target.value)} minLength={6} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s2">Confirmar nova senha</Label>
                <Input id="s2" type="password" value={senha2} onChange={(e) => setSenha2(e.target.value)} minLength={6} required />
              </div>
              <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
              <div className="flex justify-end">
                <Button type="submit" variant="success" disabled={savingSenha}>
                  {savingSenha ? "Alterando…" : "Atualizar senha"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

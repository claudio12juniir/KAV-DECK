import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { apiClient } from "../../lib/apiClient.js";
import { supabase } from "../../lib/supabaseClient.js";

function AlterarSenhaCard() {
  const toast = useToast();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (senha !== confirmarSenha) {
      toast.error("As senhas não conferem.");
      return;
    }
    if (senha.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setSalvando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      setSenha("");
      setConfirmarSenha("");
      toast.success("Senha atualizada.");
    } catch {
      toast.error("Não foi possível atualizar a senha agora.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card style={{ maxWidth: "480px", marginTop: "20px" }}>
      <h2 style={{ marginTop: 0 }}>Alterar senha</h2>
      <form className="crud-form" onSubmit={handleSubmit}>
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <Input
          label="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          required
        />
        <Button type="submit" loading={salvando}>
          Salvar nova senha
        </Button>
      </form>
    </Card>
  );
}

function MfaCard() {
  const toast = useToast();
  const { me } = useAuth();
  const [etapa, setEtapa] = useState("inicial"); // inicial | enroll | desativando
  const [fator, setFator] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function iniciarAtivacao() {
    setCarregando(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;
      setFator(data);
      setEtapa("enroll");
    } catch {
      toast.error("Não foi possível iniciar a ativação do 2FA agora.");
    } finally {
      setCarregando(false);
    }
  }

  async function cancelarAtivacao() {
    if (fator) await supabase.auth.mfa.unenroll({ factorId: fator.id }).catch(() => {});
    setFator(null);
    setCodigo("");
    setEtapa("inicial");
  }

  async function confirmarAtivacao(e) {
    e.preventDefault();
    setCarregando(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fator.id, code: codigo.trim() });
      if (error) throw error;
      await apiClient.post("/me/mfa/ativar");
      toast.success("Autenticação em duas etapas ativada.");
      window.location.reload();
    } catch {
      toast.error("Código inválido ou expirado. Tente novamente.");
      setCarregando(false);
    }
  }

  async function desativar() {
    setCarregando(true);
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      for (const f of data?.totp ?? []) {
        await supabase.auth.mfa.unenroll({ factorId: f.id }).catch(() => {});
      }
      await apiClient.post("/me/mfa/desativar");
      toast.success("Autenticação em duas etapas desativada.");
      window.location.reload();
    } catch {
      toast.error("Não foi possível desativar o 2FA agora.");
      setCarregando(false);
    }
  }

  return (
    <Card style={{ maxWidth: "480px", marginTop: "20px" }}>
      <h2 style={{ marginTop: 0 }}>Autenticação em duas etapas</h2>

      {etapa === "inicial" && (
        <>
          <p>
            {me?.mfaAtivo
              ? "Ativa. Além da senha, seu login pede um código do aplicativo autenticador."
              : "Desativada. Ative para exigir um código do aplicativo autenticador a cada login."}
          </p>
          {me?.mfaAtivo ? (
            <Button variant="secondary" loading={carregando} onClick={desativar}>
              Desativar 2FA
            </Button>
          ) : (
            <Button loading={carregando} onClick={iniciarAtivacao}>
              Ativar 2FA
            </Button>
          )}
        </>
      )}

      {etapa === "enroll" && fator && (
        <form className="crud-form" onSubmit={confirmarAtivacao}>
          <p>
            Escaneie o QR code com um aplicativo autenticador (Google Authenticator, Authy, 1Password etc.) e digite
            o código de 6 dígitos gerado.
          </p>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={fator.totp.qr_code}
            alt="QR code para configurar o autenticador"
            style={{ width: "200px", height: "200px", alignSelf: "center" }}
          />
          <p style={{ fontSize: "var(--text-sm)", wordBreak: "break-all" }}>
            Não consegue escanear? Digite manualmente: <code>{fator.totp.secret}</code>
          </p>
          <Input
            label="Código de verificação"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            required
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <Button type="submit" loading={carregando} disabled={codigo.length !== 6}>
              Confirmar e ativar
            </Button>
            <Button type="button" variant="secondary" onClick={cancelarAtivacao}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

export function MinhaContaPage() {
  const { me } = useAuth();

  return (
    <div>
      <h1>Minha Conta</h1>
      <p>
        {me?.nome} — {me?.email}
      </p>

      <AlterarSenhaCard />
      <MfaCard />
    </div>
  );
}

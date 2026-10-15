import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import "./LoginPage.css";

// Mostrada depois de senha correta quando a conta tem 2FA ativo mas esta
// sessão ainda não passou pelo desafio TOTP (aal1) — ver AuthContext.jsx
// (precisaConfirmarMfa) e src/middlewares/auth.js (MFA_REQUIRED). O
// recarregamento completo no sucesso é de propósito: é a forma mais simples
// de fazer o resto do app (AuthProvider, Socket.io etc.) repartir do zero já
// com a sessão elevada a aal2, sem precisar expor um "recarregar" dedicado
// no contexto só para este caso raro.
export function MfaChallengePage() {
  const { encerrarSessaoLocal } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setConfirmando(true);
    try {
      const { data: factors, error: erroFactors } = await supabase.auth.mfa.listFactors();
      if (erroFactors) throw erroFactors;
      const fator = factors.totp[0];
      if (!fator) throw new Error("sem-fator");

      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fator.id, code: codigo.trim() });
      if (error) throw error;

      window.location.assign("/");
    } catch {
      setErro("Código inválido ou expirado. Confira o app autenticador e tente novamente.");
      setConfirmando(false);
    }
  }

  async function cancelar() {
    await encerrarSessaoLocal("Login cancelado.");
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-brand">KAV DECK</div>
        <p className="login-sub">
          Abra seu aplicativo autenticador e digite o código de 6 dígitos para confirmar que é você.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Código de verificação"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            required
          />
          {erro && (
            <p className="login-error" role="alert" aria-live="assertive">
              {erro}
            </p>
          )}
          <Button type="submit" loading={confirmando} disabled={codigo.length !== 6} style={{ width: "100%" }}>
            Confirmar
          </Button>
        </form>
        <p style={{ textAlign: "center", marginTop: "16px" }}>
          <button type="button" className="login-link-button" onClick={cancelar}>
            Sem acesso ao autenticador? Saia e fale com o administrador da sua empresa.
          </button>
        </p>
      </Card>
    </div>
  );
}

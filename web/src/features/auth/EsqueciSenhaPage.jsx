import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { AuthBackButton } from "./AuthBackButton.jsx";
import "./LoginPage.css";

// Dispara o e-mail de recuperação de senha do Supabase (o link de dentro do
// e-mail cai em PreAuthRoutes -> /redefinir-senha, ver App.jsx). Faltava
// exatamente esta tela: RedefinirSenhaPage já existia pra receber o link,
// mas nada no app disparava o envio dele — "esqueci minha senha" não tinha
// como ser acionado pelo usuário.
export function EsqueciSenhaPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      // Sempre mostra sucesso, exista ou não esse e-mail cadastrado — não dá
      // pra um visitante usar esta tela pra descobrir quais e-mails têm
      // conta no sistema.
      setEnviado(true);
    } catch {
      setErro("Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <AuthBackButton onClick={() => navigate("/login")} label="Voltar para o login" />
        <div className="login-brand">KAV DECK</div>

        {enviado ? (
          <>
            <p className="login-sub" role="status">
              Se <strong>{email.trim()}</strong> tiver uma conta cadastrada, enviamos um e-mail com o link para
              criar uma nova senha. Verifique também a caixa de spam.
            </p>
            <Button style={{ width: "100%" }} onClick={() => navigate("/login")}>
              Voltar para o login
            </Button>
          </>
        ) : (
          <>
            <p className="login-sub">Informe seu e-mail para receber o link de redefinição de senha.</p>
            <form onSubmit={handleSubmit} className="login-form">
              <Input
                label="E-mail"
                type="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {erro && (
                <p className="login-error" role="alert" aria-live="assertive">
                  {erro}
                </p>
              )}
              <Button type="submit" loading={carregando} style={{ width: "100%" }}>
                Enviar link de recuperação
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

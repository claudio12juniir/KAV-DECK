import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { AuthBackButton } from "./AuthBackButton.jsx";
import "./LoginPage.css";

// Alcançada só pelo link de e-mail de recuperação de senha (Supabase Auth
// injeta a sessão de recuperação na URL antes de chegar aqui — ver
// supabaseClient.js, detectSessionInUrl é o padrão do client). Sem essa
// tela, o link de recuperação não tinha onde terminar.
export function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function voltarParaLogin() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setCarregando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      navigate("/", { replace: true });
    } catch {
      setErro("Não foi possível redefinir a senha. Peça um novo link de recuperação e tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <AuthBackButton onClick={voltarParaLogin} label="Voltar para o login" />
        <div className="login-brand">KAV DECK</div>
        <p className="login-sub">Escolha uma nova senha para sua conta.</p>

        <form onSubmit={handleSubmit} className="login-form">
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
          {erro && <p className="login-error">{erro}</p>}
          <Button type="submit" loading={carregando} style={{ width: "100%" }}>
            Salvar nova senha
          </Button>
        </form>
      </Card>
    </div>
  );
}

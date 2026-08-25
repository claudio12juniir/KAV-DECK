import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { AuthBackButton } from "./AuthBackButton.jsx";
import "./LoginPage.css";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await signIn(email, senha);
      navigate("/", { replace: true });
    } catch {
      setErro("E-mail ou senha inválidos. Confira os dados e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <AuthBackButton onClick={() => navigate("/entrada")} label="Voltar para a entrada" />
        <div className="login-brand">KAV DECK</div>
        <p className="login-sub">Entre com sua conta para continuar.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="E-mail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          {erro && <p className="login-error">{erro}</p>}
          <Button type="submit" loading={carregando} style={{ width: "100%" }}>
            Entrar
          </Button>
        </form>
        <p style={{ textAlign: "center", marginTop: "16px" }}>
          Ainda não tem conta? <Link to="/criar-conta">Cadastre sua empresa</Link>
        </p>
      </Card>
    </div>
  );
}

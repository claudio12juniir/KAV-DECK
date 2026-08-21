import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import logoKavDeck from "../../assets/logo-kav-deck.png";
import "./EntradaPage.css";

// Tela alcançada por quem ainda não tem sessão (ver ProtectedRoute) — separa
// "já sou cliente" de "quero comprar o primeiro acesso" antes de cair direto
// num formulário, em vez de esconder o cadastro atrás de um link discreto na
// tela de login.
export function EntradaPage() {
  const navigate = useNavigate();

  return (
    <div className="entrada-page">
      <div className="entrada-hero">
        <img src={logoKavDeck} alt="KAV DECK" className="entrada-logo" />
      </div>
      <div className="entrada-painel">
        <div className="entrada-conteudo">
          <h1 className="entrada-titulo">Bem-vindo(a)</h1>
          <p className="entrada-subtitulo">Entre com sua conta ou faça o primeiro acesso pra começar a usar.</p>
          <div className="entrada-acoes">
            <Button style={{ width: "100%" }} onClick={() => navigate("/login")}>
              Fazer login
            </Button>
            <Button variant="secondary" style={{ width: "100%" }} onClick={() => navigate("/criar-conta")}>
              Primeiro acesso
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

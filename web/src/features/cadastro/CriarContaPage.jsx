import { useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { apiClient } from "../../lib/apiClient.js";
import { supabase } from "../../lib/supabaseClient.js";
import "../auth/LoginPage.css";

export function CriarContaPage() {
  const [etapa, setEtapa] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [empresa, setEmpresa] = useState({ razaoSocial: "", cnpj: "", nomeAdmin: "", email: "", senha: "" });

  function atualizarEmpresa(campo, valor) {
    setEmpresa((atual) => ({ ...atual, [campo]: valor }));
  }

  // Cria o usuário direto no Supabase Auth (igual ao login normal — o
  // backend nunca vê a senha) e, em seguida, cria a Empresa/Usuario/ponto
  // principal via /cadastro/empresa, usando o JWT recém-criado.
  async function handleEtapa1(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: empresa.email, password: empresa.senha });
      if (error) throw error;

      if (!data.session) {
        setErro("Conta criada! Confirme seu e-mail (verifique sua caixa de entrada) e depois volte pra continuar.");
        return;
      }

      await apiClient.post("/cadastro/empresa", {
        razaoSocial: empresa.razaoSocial,
        cnpj: empresa.cnpj,
        nomeAdmin: empresa.nomeAdmin,
      });

      setEtapa(2);
    } catch (err) {
      setErro(err.message ?? "Não foi possível criar a conta. Confira os dados e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  // O cartão é sempre confirmado no checkout hospedado do próprio Mercado
  // Pago (nunca no nosso formulário) — pedimos o link ao backend e
  // redirecionamos o navegador pra lá. Quando o cliente terminar, o MP volta
  // pro nosso domínio, e o webhook (assíncrono, do lado do MP) é quem ativa
  // a assinatura de verdade — ver src/modules/cadastro/webhookMercadoPago.js.
  async function handleEtapa2() {
    setErro("");
    setCarregando(true);
    try {
      const { initPoint } = await apiClient.post("/cadastro/pagamento");
      window.location.href = initPoint;
    } catch (err) {
      setErro(err.message ?? "Não foi possível iniciar o pagamento. Tente novamente.");
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-brand">KAV DECK</div>
        <p className="login-sub">
          {etapa === 1
            ? "Crie a conta da sua empresa — o primeiro acesso (admin) custa R$ 180,00/mês."
            : "Cadastre o cartão para ativar a assinatura."}
        </p>

        {etapa === 1 ? (
          <form onSubmit={handleEtapa1} className="login-form">
            <Input
              label="Razão social"
              value={empresa.razaoSocial}
              onChange={(e) => atualizarEmpresa("razaoSocial", e.target.value)}
              required
            />
            <Input
              label="CNPJ"
              value={empresa.cnpj}
              onChange={(e) => atualizarEmpresa("cnpj", e.target.value)}
              required
            />
            <Input
              label="Seu nome"
              value={empresa.nomeAdmin}
              onChange={(e) => atualizarEmpresa("nomeAdmin", e.target.value)}
              required
            />
            <Input
              label="E-mail"
              type="email"
              autoComplete="username"
              value={empresa.email}
              onChange={(e) => atualizarEmpresa("email", e.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={empresa.senha}
              onChange={(e) => atualizarEmpresa("senha", e.target.value)}
              required
            />
            {erro && <p className="login-error">{erro}</p>}
            <Button type="submit" loading={carregando} style={{ width: "100%" }}>
              Continuar
            </Button>
          </form>
        ) : (
          <div className="login-form">
            <p>
              Sua empresa foi criada. Falta só confirmar o cartão no checkout seguro do Mercado Pago pra
              ativar a assinatura (R$ 180,00/mês).
            </p>
            {erro && <p className="login-error">{erro}</p>}
            <Button loading={carregando} onClick={handleEtapa2} style={{ width: "100%" }}>
              Ir para o pagamento
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

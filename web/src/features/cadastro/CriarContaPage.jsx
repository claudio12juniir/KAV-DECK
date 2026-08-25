import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { apiClient } from "../../lib/apiClient.js";
import { supabase } from "../../lib/supabaseClient.js";
import { AuthBackButton } from "../auth/AuthBackButton.jsx";
import "../auth/LoginPage.css";

// Guarda os dados da empresa (nunca a senha) entre o clique em "Continuar" e
// a confirmação do e-mail: quando o Supabase exige confirmação, o signUp
// não devolve sessão e POST /cadastro/empresa não roda — o usuário só volta
// pro site depois de clicar no link do e-mail, em outra carga de página (ou
// outra aba), com os campos do formulário perdidos.
const RASCUNHO_KEY = "kav_cadastro_pendente";

function salvarRascunho(dados) {
  localStorage.setItem(RASCUNHO_KEY, JSON.stringify(dados));
}

function lerRascunho() {
  try {
    return JSON.parse(localStorage.getItem(RASCUNHO_KEY) ?? "null");
  } catch {
    return null;
  }
}

function limparRascunho() {
  localStorage.removeItem(RASCUNHO_KEY);
}

export function CriarContaPage() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [retomandoCadastro, setRetomandoCadastro] = useState(true);
  const [erro, setErro] = useState("");

  const [empresa, setEmpresa] = useState({ razaoSocial: "", cnpj: "", nomeAdmin: "", email: "", senha: "" });

  function atualizarEmpresa(campo, valor) {
    setEmpresa((atual) => ({ ...atual, [campo]: valor }));
  }

  async function voltarParaEntrada() {
    const { data } = await supabase.auth.getSession();
    if (data.session) await supabase.auth.signOut();
    navigate("/entrada", { replace: true });
  }

  // Cobre a volta do link de confirmação de e-mail: se já existe uma sessão
  // Supabase mas o Usuario ainda não foi criado (POST /cadastro/empresa
  // nunca rodou), retoma sozinho usando o rascunho salvo antes do signUp. Se
  // o Usuario já existe e só falta pagar, pula direto pra etapa 2.
  useEffect(() => {
    let ativo = true;
    async function retomarSeNecessario() {
      const { data } = await supabase.auth.getSession();
      if (!ativo) return;
      if (!data.session) {
        setRetomandoCadastro(false);
        return;
      }

      const rascunho = lerRascunho();
      if (rascunho) setEmpresa((atual) => ({ ...atual, ...rascunho }));

      try {
        await apiClient.get("/me");
        // Já tem Usuario e assinatura ativa — não devia ter caído aqui
        // (App.jsx só chega em /criar-conta quando `me` é null), mas se
        // acontecer não há nada a retomar.
        limparRascunho();
        if (ativo) setRetomandoCadastro(false);
        return;
      } catch (err) {
        if (err.code === "ASSINATURA_PENDENTE") {
          if (ativo) {
            setEtapa(2);
            setRetomandoCadastro(false);
          }
          return;
        }
        // Qualquer outro erro (em especial USUARIO_NAO_CADASTRADO) cai pra
        // tentativa de retomada abaixo.
      }

      if (rascunho) {
        try {
          await apiClient.post("/cadastro/empresa", rascunho);
          limparRascunho();
          if (ativo) setEtapa(2);
        } catch (err) {
          // Outra aba/tentativa já criou a empresa nesse meio-tempo — só
          // seguir pro pagamento em vez de mostrar erro.
          if (err.code === "CONFLICT") {
            limparRascunho();
            if (ativo) setEtapa(2);
          } else if (ativo) {
            setErro("Não foi possível retomar seu cadastro automaticamente. Confira os dados abaixo e continue.");
          }
        }
      }
      if (ativo) setRetomandoCadastro(false);
    }
    retomarSeNecessario();
    return () => {
      ativo = false;
    };
  }, []);

  // Cria o usuário direto no Supabase Auth (igual ao login normal — o
  // backend nunca vê a senha) e, em seguida, cria a Empresa/Usuario/ponto
  // principal via /cadastro/empresa, usando o JWT recém-criado.
  async function handleEtapa1(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const rascunho = { razaoSocial: empresa.razaoSocial, cnpj: empresa.cnpj, nomeAdmin: empresa.nomeAdmin };
      salvarRascunho(rascunho);

      const { data, error } = await supabase.auth.signUp({ email: empresa.email, password: empresa.senha });
      if (error) throw error;

      if (!data.session) {
        setErro(
          "Conta criada! Confirme seu e-mail (verifique sua caixa de entrada) — ao clicar no link, voltamos" +
            " pra cá e continuamos sozinhos.",
        );
        return;
      }

      await apiClient.post("/cadastro/empresa", rascunho);
      limparRascunho();
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

  if (retomandoCadastro) return null;

  return (
    <div className="login-page">
      <Card className="login-card">
        <AuthBackButton onClick={voltarParaEntrada} label="Voltar para a entrada" />
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

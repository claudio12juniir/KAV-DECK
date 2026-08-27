import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { apiClient } from "../../lib/apiClient.js";
import { supabase } from "../../lib/supabaseClient.js";
import { AuthBackButton } from "../auth/AuthBackButton.jsx";
import "../auth/LoginPage.css";

// Guarda apenas no navegador (nunca no banco e nunca a senha) os dados
// necessários para retomar o cadastro depois do checkout e da confirmação
// de e-mail. O backend só persiste esses dados após validar o pagamento.
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
  const { session } = useAuth();
  const [etapa, setEtapa] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [retomandoCadastro, setRetomandoCadastro] = useState(true);
  const [erro, setErro] = useState("");

  const [empresa, setEmpresa] = useState({ razaoSocial: "", cnpj: "", nomeAdmin: "", email: "", senha: "" });

  function atualizarEmpresa(campo, valor) {
    setEmpresa((atual) => ({ ...atual, [campo]: valor }));
  }

  async function voltarParaEntrada() {
    if (session) await supabase.auth.signOut();
    navigate("/entrada", { replace: true });
  }

  // Retoma tanto a volta do Mercado Pago quanto a confirmação do e-mail.
  // Antes do pagamento não existe login no Supabase nem registro local.
  useEffect(() => {
    let ativo = true;
    async function retomarSeNecessario() {
      const rascunho = lerRascunho();
      if (rascunho) setEmpresa((atual) => ({ ...atual, ...rascunho }));

      if (session && rascunho?.preapprovalId) {
        try {
          await apiClient.post("/cadastro/empresa", rascunho);
          limparRascunho();
          if (ativo) window.location.replace("/");
          return;
        } catch (err) {
          if (err.code === "CONFLICT") {
            limparRascunho();
            if (ativo) window.location.replace("/");
            return;
          } else if (ativo) {
            setErro(err.message ?? "Não foi possível finalizar o cadastro após o pagamento.");
          }
        }
      }

      if (!session && rascunho?.preapprovalId) {
        try {
          const pagamento = await apiClient.get(`/cadastro/pagamento/${rascunho.preapprovalId}`);
          if (ativo && pagamento.autorizado) setEtapa(2);
          else if (ativo) setErro("O pagamento ainda não foi confirmado. Conclua o checkout para continuar.");
        } catch (err) {
          if (ativo) setErro(err.message ?? "Não foi possível consultar o pagamento.");
        }
      }
      if (ativo) setRetomandoCadastro(false);
    }
    retomarSeNecessario();
    return () => {
      ativo = false;
    };
  }, [navigate, session]);

  // Primeiro cria somente o checkout. Empresa, usuário e login ainda não
  // são persistidos; o rascunho fica exclusivamente neste navegador.
  async function handleEtapa1(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const rascunho = {
        razaoSocial: empresa.razaoSocial,
        cnpj: empresa.cnpj,
        nomeAdmin: empresa.nomeAdmin,
        email: empresa.email,
      };
      const { initPoint, preapprovalId } = await apiClient.post("/cadastro/pagamento", {
        email: empresa.email,
        cnpj: empresa.cnpj,
      });
      salvarRascunho({ ...rascunho, preapprovalId });
      window.location.href = initPoint;
    } catch (err) {
      setErro(err.message ?? "Não foi possível iniciar o pagamento. Confira os dados e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  // Só depois de o backend confirmar o pagamento cria o login. Se o projeto
  // exigir confirmação de e-mail, os registros locais serão criados quando
  // o cliente voltar pelo link recebido.
  async function handleEtapa2(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const rascunho = lerRascunho();
      if (!rascunho?.preapprovalId) throw new Error("Pagamento confirmado não encontrado neste navegador.");

      const pagamento = await apiClient.get(`/cadastro/pagamento/${rascunho.preapprovalId}`);
      if (!pagamento.autorizado) throw new Error("O pagamento ainda não foi confirmado pelo Mercado Pago.");

      const { data, error } = await supabase.auth.signUp({ email: rascunho.email, password: empresa.senha });
      if (error) throw error;

      if (!data.session) {
        setErro("Pagamento confirmado! Confirme seu e-mail para concluir a criação da conta.");
        return;
      }

      await apiClient.post("/cadastro/empresa", rascunho);
      limparRascunho();
      window.location.replace("/");
    } catch (err) {
      setErro(err.message ?? "Não foi possível finalizar a criação da conta.");
    } finally {
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
            ? "Crie a conta da sua empresa — o primeiro acesso (admin) custa R$ 5,00/mês."
            : "Pagamento confirmado — agora crie a senha do seu acesso."}
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
            {erro && <p className="login-error">{erro}</p>}
            <Button type="submit" loading={carregando} style={{ width: "100%" }}>
              Ir para o pagamento
            </Button>
          </form>
        ) : (
          <form onSubmit={handleEtapa2} className="login-form">
            <Input label="E-mail" type="email" value={empresa.email} disabled />
            <Input
              label="Crie sua senha"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={empresa.senha}
              onChange={(e) => atualizarEmpresa("senha", e.target.value)}
              required
            />
            {erro && <p className="login-error">{erro}</p>}
            <Button type="submit" loading={carregando} style={{ width: "100%" }}>
              Criar minha conta
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

import { useEffect } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes, useNavigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell.jsx";
import { ToastProvider, useToast } from "./components/ui/Toast.jsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { RealtimeProvider } from "./contexts/RealtimeContext.jsx";
import { supabase } from "./lib/supabaseClient.js";
import { EntradaPage } from "./features/auth/EntradaPage.jsx";
import { EsqueciSenhaPage } from "./features/auth/EsqueciSenhaPage.jsx";
import { LoginPage } from "./features/auth/LoginPage.jsx";
import { MfaChallengePage } from "./features/auth/MfaChallengePage.jsx";
import { PrivacidadePage } from "./features/auth/PrivacidadePage.jsx";
import { RedefinirSenhaPage } from "./features/auth/RedefinirSenhaPage.jsx";
import { CriarContaPage } from "./features/cadastro/CriarContaPage.jsx";

function PreAuthRoutes() {
  const { session, me, precisaFinalizarCadastro, precisaConfirmarMfa, sessaoEncerradaMotivo, limparAvisoSessaoEncerrada } =
    useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessaoEncerradaMotivo) return;
    toast.error(sessaoEncerradaMotivo, { duration: 8000 });
    limparAvisoSessaoEncerrada();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessaoEncerradaMotivo]);

  // O link do e-mail de recuperação de senha redireciona pra Site URL (a
  // raiz do app), não pra uma rota específica — o Supabase client detecta o
  // token da URL e dispara este evento antes de qualquer outra coisa
  // renderizar, então é aqui que mandamos pra tela de definir nova senha em
  // vez de deixar cair direto no dashboard com a sessão de recuperação.
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") navigate("/redefinir-senha", { replace: true });
    });
    return () => subscription.subscription.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/entrada" element={session ? <Navigate to="/" replace /> : <EntradaPage />} />
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/esqueci-senha" element={session ? <Navigate to="/" replace /> : <EsqueciSenhaPage />} />
      {/* Não gateia por `session`/`me` de propósito — ver comentário original
          preservado abaixo, ainda vale: a sessão de recuperação já existe
          nesse ponto, mas isso não deveria empurrar o usuário pra lugar
          nenhum além desta tela. */}
      <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
      <Route path="/criar-conta" element={me ? <Navigate to="/" replace /> : <CriarContaPage />} />
      <Route path="/privacidade" element={<PrivacidadePage />} />
      {/* Qualquer outra URL enquanto não autenticado — AppGate só entra aqui
          quando falta login, falta terminar o cadastro, a assinatura está
          pendente, ou falta confirmar o 2FA (ver `precisaFinalizarCadastro`
          e `precisaConfirmarMfa` em AuthContext.jsx). */}
      <Route
        path="*"
        element={
          !session ? (
            <Navigate to="/entrada" replace />
          ) : precisaConfirmarMfa ? (
            <MfaChallengePage />
          ) : precisaFinalizarCadastro ? (
            <Navigate to="/criar-conta" replace />
          ) : null
        }
      />
    </Routes>
  );
}

// Decide entre "mostrar as páginas de fora" (login/cadastro/recuperação de
// senha) e "mostrar o workspace autenticado" (AppShell) — ambos vivem sob o
// mesmo <BrowserRouter> real, com URL endereçável de ponta a ponta.
// `/redefinir-senha` é a única exceção: mesmo com sessão válida (a de
// recuperação), sempre passa por PreAuthRoutes primeiro.
function AppGate() {
  const { session, me, loading, precisaFinalizarCadastro, precisaConfirmarMfa } = useAuth();

  if (loading) return null;

  const rotaRecuperacaoSenha = window.location.pathname === "/redefinir-senha";
  const autenticado = !rotaRecuperacaoSenha && session && me && !precisaFinalizarCadastro && !precisaConfirmarMfa;

  return <Router>{autenticado ? <AppShell /> : <PreAuthRoutes />}</Router>;
}

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <ToastProvider>
          <AppGate />
        </ToastProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}

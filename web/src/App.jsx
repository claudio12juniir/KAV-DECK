import { useEffect } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes, useNavigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell.jsx";
import { ToastProvider, useToast } from "./components/ui/Toast.jsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { RealtimeProvider } from "./contexts/RealtimeContext.jsx";
import { supabase } from "./lib/supabaseClient.js";
import { EntradaPage } from "./features/auth/EntradaPage.jsx";
import { LoginPage } from "./features/auth/LoginPage.jsx";
import { RedefinirSenhaPage } from "./features/auth/RedefinirSenhaPage.jsx";
import { CriarContaPage } from "./features/cadastro/CriarContaPage.jsx";

// Só as páginas de fora da área logada moram atrás de um <BrowserRouter> de
// verdade — a área autenticada (AppShell) nunca fica aninhada dentro dele
// (ver AppGate mais abaixo pro porquê): cada aba do workspace cria seu
// próprio <MemoryRouter>, e o React Router recusa em runtime renderizar um
// <Router> dentro de outro <Router>, então AppShell precisa ser a raiz da
// própria árvore de routers, não uma descendente desta.
function PreAuthRoutes() {
  const { session, me, precisaFinalizarCadastro, sessaoEncerradaMotivo, limparAvisoSessaoEncerrada } = useAuth();
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
      {/* Não gateia por `session`/`me` de propósito — ver comentário original
          preservado abaixo, ainda vale: a sessão de recuperação já existe
          nesse ponto, mas isso não deveria empurrar o usuário pra lugar
          nenhum além desta tela. */}
      <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
      <Route path="/criar-conta" element={me ? <Navigate to="/" replace /> : <CriarContaPage />} />
      {/* Qualquer outra URL enquanto não autenticado — AppGate só entra aqui
          quando falta login, falta terminar o cadastro, ou a assinatura
          está pendente (ver `precisaFinalizarCadastro` em AuthContext.jsx). */}
      <Route
        path="*"
        element={
          !session ? (
            <Navigate to="/entrada" replace />
          ) : precisaFinalizarCadastro ? (
            <Navigate to="/criar-conta" replace />
          ) : null
        }
      />
    </Routes>
  );
}

// Decide entre "mostrar as páginas de fora" (dentro de um <BrowserRouter>
// de verdade, porque login/cadastro/recuperação de senha precisam de URL
// real e endereçável) e "mostrar o workspace autenticado" (AppShell, sem
// nenhum Router ao redor — ele monta os próprios por aba). `/redefinir-senha`
// é a única exceção: mesmo com sessão válida (a de recuperação), sempre passa
// por PreAuthRoutes primeiro.
function AppGate() {
  const { session, me, loading, precisaFinalizarCadastro } = useAuth();

  if (loading) return null;

  const rotaRecuperacaoSenha = window.location.pathname === "/redefinir-senha";
  if (!rotaRecuperacaoSenha && session && me && !precisaFinalizarCadastro) {
    return <AppShell />;
  }

  return (
    <Router>
      <PreAuthRoutes />
    </Router>
  );
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

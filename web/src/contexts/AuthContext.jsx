import { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient.js";
import { clearSessionId, getOrCreateSessionId, renewSessionId } from "../lib/sessionId.js";
import { supabase } from "../lib/supabaseClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessaoEncerradaMotivo, setSessaoEncerradaMotivo] = useState(null);
  // true quando o login no Supabase já existe mas a Empresa/Usuario ainda
  // não foi criada (POST /cadastro/empresa nunca rodou) ou existe mas a
  // assinatura está AGUARDANDO_PAGAMENTO — nos dois casos a sessão
  // continua válida de propósito (ver App.jsx, AppGate), diferente de
  // encerrarSessaoLocal, porque o usuário precisa dela pra terminar o
  // cadastro/pagamento em /criar-conta.
  const [precisaFinalizarCadastro, setPrecisaFinalizarCadastro] = useState(false);

  async function encerrarSessaoLocal(motivo) {
    clearSessionId();
    await supabase.auth.signOut();
    setSessaoEncerradaMotivo(motivo || "Sua sessão foi encerrada.");
  }

  useEffect(() => {
    let ativo = true;

    // Reivindica a sessão deste dispositivo (ver web/src/lib/sessionId.js)
    // antes de qualquer outra chamada — é o que faz o "quem sou eu" abaixo
    // já valer a checagem de sessão única no backend. Retorna true quando o
    // claim foi recusado por limite de acessos ou assinatura suspensa — aí
    // não faz sentido seguir tentando carregar o resto do app.
    async function reivindicarSessao() {
      try {
        await apiClient.post("/me/sessao", {
          sessaoId: getOrCreateSessionId(),
          dispositivo: navigator.userAgent?.slice(0, 200),
        });
        return false;
      } catch (err) {
        if (err.code === "LIMITE_ACESSOS_ATINGIDO" || err.code === "ASSINATURA_SUSPENSA" || err.code === "USUARIO_INATIVO") {
          await encerrarSessaoLocal(err.message);
          return true;
        }
        if (err.code === "ASSINATURA_PENDENTE" || err.code === "USUARIO_NAO_CADASTRADO") {
          if (ativo) setPrecisaFinalizarCadastro(true);
          return true;
        }
        // Melhor esforço: se o claim falhar por outro motivo (rede etc.), a
        // checagem de sessão única simplesmente não vai bloquear ninguém
        // até o próximo.
        return false;
      }
    }

    async function carregarMe() {
      if (ativo) setPrecisaFinalizarCadastro(false);
      const bloqueado = await reivindicarSessao();
      if (bloqueado) return;
      try {
        const dados = await apiClient.get("/me");
        if (ativo) setMe(dados);
      } catch {
        if (ativo) setMe(null);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setSession(data.session);
      if (data.session) carregarMe().finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao);
      if (novaSessao) {
        // O Supabase mantém um lock interno enquanto notifica os listeners.
        // `carregarMe` usa apiClient, que chama auth.getSession(); executá-lo
        // diretamente neste callback pode criar um deadlock no primeiro
        // signUp e impedir que /cadastro/empresa avance para o pagamento.
        // Adia a chamada até o evento de autenticação terminar por completo.
        setTimeout(() => {
          if (ativo) carregarMe();
        }, 0);
      } else {
        setMe(null);
      }
    });

    function handleSessaoRevogada(event) {
      encerrarSessaoLocal(event.detail?.message);
    }
    window.addEventListener("kav-session-revoked", handleSessaoRevogada);

    return () => {
      ativo = false;
      subscription.subscription.unsubscribe();
      window.removeEventListener("kav-session-revoked", handleSessaoRevogada);
    };
  }, []);

  async function signIn(email, password) {
    renewSessionId();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    try {
      await apiClient.delete("/me/sessao");
    } catch {
      // melhor esforço — o logout local acontece de qualquer forma
    }
    clearSessionId();
    await supabase.auth.signOut();
  }

  function limparAvisoSessaoEncerrada() {
    setSessaoEncerradaMotivo(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        me,
        loading,
        signIn,
        signOut,
        sessaoEncerradaMotivo,
        limparAvisoSessaoEncerrada,
        encerrarSessaoLocal,
        precisaFinalizarCadastro,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  return context;
}

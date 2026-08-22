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
        if (err.code === "LIMITE_ACESSOS_ATINGIDO" || err.code === "ASSINATURA_SUSPENSA") {
          await encerrarSessaoLocal(err.message);
          return true;
        }
        // Melhor esforço: se o claim falhar por outro motivo (rede etc.), a
        // checagem de sessão única simplesmente não vai bloquear ninguém
        // até o próximo.
        return false;
      }
    }

    async function carregarMe() {
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
      if (novaSessao) carregarMe();
      else setMe(null);
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

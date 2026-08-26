import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { apiClient } from "../lib/apiClient.js";
import { on } from "../lib/eventBus.js";
import { clearSessionId, getOrCreateSessionId, renewSessionId } from "../lib/sessionId.js";
import { supabase } from "../lib/supabaseClient.js";

const AuthContext = createContext(null);

function descricaoDispositivo() {
  return `${Platform.OS === "ios" ? "iOS" : "Android"} ${Platform.Version} (app)`;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessaoEncerradaMotivo, setSessaoEncerradaMotivo] = useState(null);

  async function encerrarSessaoLocal(motivo) {
    await clearSessionId();
    await supabase.auth.signOut();
    setSessaoEncerradaMotivo(motivo || "Sua sessão foi encerrada.");
  }

  useEffect(() => {
    let ativo = true;

    // Reivindica a sessão deste aparelho (ver src/lib/sessionId.js) antes
    // de qualquer outra chamada — é o que faz o "quem sou eu" abaixo já
    // valer a checagem de sessão única no backend.
    async function reivindicarSessao() {
      try {
        await apiClient.post("/me/sessao", {
          sessaoId: await getOrCreateSessionId(),
          dispositivo: descricaoDispositivo(),
        });
      } catch {
        // Melhor esforço: se o claim falhar (rede etc.), a checagem de
        // sessão única simplesmente não vai bloquear ninguém até o próximo.
      }
    }

    async function carregarMe() {
      await reivindicarSessao();
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

    const removerListener = on("kav-session-revoked", (detalhe) => {
      encerrarSessaoLocal(detalhe?.message);
    });

    return () => {
      ativo = false;
      subscription.subscription.unsubscribe();
      removerListener();
    };
  }, []);

  async function signIn(email, password) {
    await renewSessionId();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    try {
      await apiClient.delete("/me/sessao");
    } catch {
      // melhor esforço — o logout local acontece de qualquer forma
    }
    await clearSessionId();
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

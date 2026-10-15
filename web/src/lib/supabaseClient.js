import { createClient } from "@supabase/supabase-js";

// Explícito em vez de depender dos defaults da lib: é o que garante "entrou
// uma vez, continua entrado" mesmo fechando a aba/navegador — a sessão (e o
// refresh token) fica em localStorage e é renovada sozinha antes de expirar.
// detectSessionInUrl é o que faz o link de recuperação de senha (e o de
// confirmação de e-mail) funcionar, ver App.jsx PASSWORD_RECOVERY.
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

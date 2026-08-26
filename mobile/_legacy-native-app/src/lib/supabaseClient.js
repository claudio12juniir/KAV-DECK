import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Sem fluxo de redirect por URL (magic link/OAuth) neste app ainda —
      // login é só e-mail/senha, então isso evita o supabase-js tentar
      // interpretar a URL de abertura do app como retorno de auth.
      detectSessionInUrl: false,
    },
  },
);

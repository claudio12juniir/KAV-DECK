import AsyncStorage from "@react-native-async-storage/async-storage";

// Equivalente ao web/src/lib/sessionId.js, mas com AsyncStorage (assíncrono)
// no lugar de localStorage — por isso os getters aqui também são
// assíncronos, e mantêm um cache em memória pra não bater no storage a
// cada requisição. Identifica este aparelho para a sessão única (ver
// prisma/schema.prisma:SessaoAtiva no backend); só muda num login novo
// explícito, nunca só por reabrir o app.
const KEY = "kav-deck:session-id";
let cache;

function gerar() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function carregarCache() {
  if (cache === undefined) {
    cache = await AsyncStorage.getItem(KEY);
  }
  return cache;
}

export async function getSessionId() {
  return carregarCache();
}

export async function getOrCreateSessionId() {
  const atual = await carregarCache();
  if (atual) return atual;
  cache = gerar();
  await AsyncStorage.setItem(KEY, cache);
  return cache;
}

export async function renewSessionId() {
  cache = gerar();
  await AsyncStorage.setItem(KEY, cache);
  return cache;
}

export async function clearSessionId() {
  cache = null;
  await AsyncStorage.removeItem(KEY);
}

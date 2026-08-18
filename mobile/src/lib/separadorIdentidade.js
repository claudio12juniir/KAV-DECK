import AsyncStorage from "@react-native-async-storage/async-storage";

// Colaborador (tabela de negócio, sem vínculo com Usuario/login no schema —
// ver prisma/schema.prisma:Colaborador) que este aparelho está usando como
// "eu" no Terminal de Separadores. Guardado localmente porque o backend não
// tem como inferir isso a partir de quem logou; ver
// src/features/vendas/api.js:separarPedidoVenda.
const KEY = "kav-deck:separador-colaborador";
let cache;

export async function getSeparadorSalvo() {
  if (cache === undefined) {
    const bruto = await AsyncStorage.getItem(KEY);
    cache = bruto ? JSON.parse(bruto) : null;
  }
  return cache;
}

export async function salvarSeparador(colaborador) {
  cache = colaborador;
  await AsyncStorage.setItem(KEY, JSON.stringify(colaborador));
}

export async function limparSeparador() {
  cache = null;
  await AsyncStorage.removeItem(KEY);
}

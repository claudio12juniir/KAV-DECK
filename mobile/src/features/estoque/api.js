import { apiClient } from "../../lib/apiClient.js";

// Já vem ordenado por dataValidade asc (FEFO) no backend — primeiro a
// vencer, primeiro a sair. Filtra localmente lotes zerados porque a rota
// não exclui quantidadeAtual <= 0 (ela serve também pra telas de kardex,
// onde ver o lote zerado é útil).
export async function listLotesDisponiveis(produtoId) {
  const { items } = await apiClient.get("/estoque/lotes", { produtoId, pageSize: 50 });
  return items.filter((lote) => Number(lote.quantidadeAtual) > 0);
}

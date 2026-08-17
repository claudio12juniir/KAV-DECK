import {
  agregarComprasPorFornecedor,
  agregarVendasPorCliente,
  agregarVendasPorProduto,
  classificarAbc,
} from "../shared/agregacoes.js";

export async function curvaAbcProdutos({ empresaId, dataInicial, dataFinal }) {
  const itens = await agregarVendasPorProduto({ empresaId, dataInicial, dataFinal });
  return classificarAbc(itens);
}

export async function curvaAbcClientes({ empresaId, dataInicial, dataFinal }) {
  const itens = await agregarVendasPorCliente({ empresaId, dataInicial, dataFinal });
  return classificarAbc(itens);
}

export async function curvaAbcFornecedores({ empresaId, dataInicial, dataFinal }) {
  const itens = await agregarComprasPorFornecedor({ empresaId, dataInicial, dataFinal });
  return classificarAbc(itens);
}

import { prisma } from "../../../lib/prisma.js";

// Conferência de recebimento: cada lote já carrega SIF/temperatura/veículo/
// validade desde que foi criado em pedidosCompra.receber() — aqui é só a
// tela de consulta que faltava pra olhar isso tudo junto, com o pedido de
// origem anexado.
export async function consultar({ empresaId, fornecedorId, produtoId, dataInicial, dataFinal }) {
  const where = {
    empresaId,
    ...(fornecedorId ? { fornecedorId } : {}),
    ...(produtoId ? { produtoId } : {}),
    ...(dataInicial || dataFinal
      ? { dataRecebimento: { ...(dataInicial ? { gte: dataInicial } : {}), ...(dataFinal ? { lte: dataFinal } : {}) } }
      : {}),
  };

  const lotes = await prisma.lote.findMany({
    where,
    select: {
      id: true,
      dataRecebimento: true,
      dataValidade: true,
      sif: true,
      temperaturaRecebimento: true,
      veiculo: true,
      quantidadeInicial: true,
      quantidadeAtual: true,
      produto: { select: { codigo: true, descricao: true } },
      fornecedor: { select: { participante: { select: { razaoSocial: true } } } },
      movimentosEstoque: {
        where: { tipo: "ENTRADA" },
        select: { pedidoCompraId: true },
        take: 1,
      },
    },
    orderBy: { dataRecebimento: "desc" },
  });

  return lotes.map(({ movimentosEstoque, ...lote }) => ({
    ...lote,
    pedidoCompraId: movimentosEstoque[0]?.pedidoCompraId ?? null,
  }));
}

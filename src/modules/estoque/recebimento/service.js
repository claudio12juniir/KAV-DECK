import { prisma } from "../../../lib/prisma.js";

// Conferência de recebimento: cada lote já carrega SIF/temperatura/veículo/
// validade desde que foi criado em pedidosCompra.receber() — aqui é só a
// tela de consulta que faltava pra olhar isso tudo junto, com o pedido de
// origem anexado.
export async function consultar({ empresaId, fornecedorId, produtoId, departamentoId, dataInicial, dataFinal, apenasPendente }) {
  const where = {
    empresaId,
    ...(fornecedorId ? { fornecedorId } : {}),
    ...(produtoId ? { produtoId } : {}),
    ...(departamentoId ? { produto: { categoria: { departamentoId } } } : {}),
    ...(dataInicial || dataFinal
      ? { dataRecebimento: { ...(dataInicial ? { gte: dataInicial } : {}), ...(dataFinal ? { lte: dataFinal } : {}) } }
      : {}),
    // "Apenas pendente" da referência = lote ainda com saldo, ou seja, o
    // recebimento ainda não foi totalmente consumido em vendas/ajustes.
    ...(apenasPendente ? { quantidadeAtual: { gt: 0 } } : {}),
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
      produto: { select: { codigo: true, descricao: true, unidadeMedida: { select: { sigla: true } } } },
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

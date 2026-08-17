import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

// DevolucaoVenda não tem empresaId próprio — o tenant é sempre resolvido via
// pedidoVenda.empresaId, então toda consulta filtra por essa relação.
const SELECT_DETAIL = {
  id: true,
  pedidoVendaId: true,
  motivo: true,
  data: true,
  itens: {
    select: {
      id: true,
      produtoId: true,
      quantidade: true,
      produto: { select: { codigo: true, descricao: true } },
    },
  },
};

async function getPedidoVendaOrThrow({ empresaId, id }) {
  const pedido = await prisma.pedidoVenda.findFirst({
    where: { id, empresaId },
    select: { id: true, status: true, itens: { select: { produtoId: true, quantidade: true } } },
  });
  if (!pedido) throw new AppError(404, "NOT_FOUND", "Pedido de venda não encontrado.");
  return pedido;
}

export async function list({ empresaId, skip, take, pedidoVendaId }) {
  const where = { pedidoVenda: { empresaId }, ...(pedidoVendaId ? { pedidoVendaId } : {}) };
  const [items, total] = await Promise.all([
    prisma.devolucaoVenda.findMany({ where, select: SELECT_DETAIL, skip, take, orderBy: { data: "desc" } }),
    prisma.devolucaoVenda.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const devolucao = await prisma.devolucaoVenda.findFirst({
    where: { id, pedidoVenda: { empresaId } },
    select: SELECT_DETAIL,
  });
  if (!devolucao) throw new AppError(404, "NOT_FOUND", "Devolução não encontrada.");
  return devolucao;
}

// Registra a devolução e devolve a quantidade ao estoque num lote novo
// (o lote original do recebimento pode já ter sido total ou parcialmente
// consumido — não dá pra assumir que ainda existe saldo nele pra "voltar").
// Valida que a soma das devoluções de um produto nunca passe do que foi
// realmente vendido naquele pedido.
export async function create({ empresaId, usuarioId, pedidoVendaId, motivo, itens }) {
  const pedido = await getPedidoVendaOrThrow({ empresaId, id: pedidoVendaId });
  if (pedido.status !== "FATURADO") {
    throw new AppError(409, "PEDIDO_NAO_DEVOLVIVEL", "Só é possível devolver itens de um pedido já faturado.");
  }

  const vendidoPorProduto = new Map();
  for (const item of pedido.itens) {
    const atual = vendidoPorProduto.get(item.produtoId) ?? new Prisma.Decimal(0);
    vendidoPorProduto.set(item.produtoId, atual.plus(item.quantidade));
  }

  const devolvidoAnteriormente = await prisma.itemDevolucaoVenda.groupBy({
    by: ["produtoId"],
    where: { devolucaoVenda: { pedidoVendaId } },
    _sum: { quantidade: true },
  });
  const jaDevolvidoPorProduto = new Map(devolvidoAnteriormente.map((d) => [d.produtoId, d._sum.quantidade]));

  for (const item of itens) {
    const vendido = vendidoPorProduto.get(item.produtoId);
    if (!vendido) {
      throw new AppError(
        422,
        "PRODUTO_FORA_DO_PEDIDO",
        `Produto ${item.produtoId} não faz parte deste pedido de venda.`,
      );
    }
    const jaDevolvido = new Prisma.Decimal(jaDevolvidoPorProduto.get(item.produtoId) ?? 0);
    const saldoDevolvivel = vendido.minus(jaDevolvido);
    if (new Prisma.Decimal(item.quantidade).gt(saldoDevolvivel)) {
      throw new AppError(
        409,
        "QUANTIDADE_EXCEDE_VENDIDO",
        `Quantidade a devolver do produto ${item.produtoId} excede o saldo ainda devolvível (${saldoDevolvivel.toFixed(4)}).`,
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const devolucao = await tx.devolucaoVenda.create({
      data: {
        pedidoVendaId,
        motivo,
        itens: { create: itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })) },
      },
      select: SELECT_DETAIL,
    });

    for (const item of itens) {
      // eslint-disable-next-line no-await-in-loop
      const lote = await tx.lote.create({
        data: {
          empresaId,
          produtoId: item.produtoId,
          quantidadeInicial: item.quantidade,
          quantidadeAtual: item.quantidade,
        },
      });
      // eslint-disable-next-line no-await-in-loop
      await tx.movimentoEstoque.create({
        data: {
          empresaId,
          produtoId: item.produtoId,
          loteId: lote.id,
          tipo: "DEVOLUCAO",
          quantidade: item.quantidade,
          pedidoVendaId,
          motivo,
          usuarioId,
        },
      });
    }

    return devolucao;
  });
}

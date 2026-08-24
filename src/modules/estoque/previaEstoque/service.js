import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";

const PEDIDO_COMPRA_PENDENTE = ["ABERTO", "APROVADO", "RECEBIDO_PARCIAL"];
const PEDIDO_VENDA_PENDENTE = ["ABERTO", "SEPARACAO"];

// Saldo projetado = o que já está fisicamente em estoque, mais o que ainda
// vai entrar (pedidos de compra em aberto, descontando o que desses
// pedidos já foi recebido), menos o que ainda vai sair (pedidos de venda
// em aberto — que só decrementam o saldo real no faturamento).
export async function consultar({ empresaId, produtoId }) {
  const filtroProduto = produtoId ? { produtoId } : {};

  const [lotes, itensCompraPendente, entradasDeCompraPendente, itensVendaPendente] = await Promise.all([
    prisma.lote.groupBy({
      by: ["produtoId"],
      where: { empresaId, ...filtroProduto },
      _sum: { quantidadeAtual: true },
    }),
    prisma.itemPedidoCompra.groupBy({
      by: ["produtoId"],
      where: { pedidoCompra: { empresaId, status: { in: PEDIDO_COMPRA_PENDENTE } }, ...filtroProduto },
      _sum: { quantidade: true },
    }),
    prisma.movimentoEstoque.groupBy({
      by: ["produtoId"],
      where: {
        empresaId,
        tipo: "ENTRADA",
        pedidoCompra: { status: { in: PEDIDO_COMPRA_PENDENTE } },
        ...filtroProduto,
      },
      _sum: { quantidade: true },
    }),
    prisma.itemPedidoVenda.groupBy({
      by: ["produtoId"],
      where: { pedidoVenda: { empresaId, status: { in: PEDIDO_VENDA_PENDENTE } }, ...filtroProduto },
      _sum: { quantidade: true },
    }),
  ]);

  const produtoIds = new Set([
    ...lotes.map((l) => l.produtoId),
    ...itensCompraPendente.map((i) => i.produtoId),
    ...itensVendaPendente.map((i) => i.produtoId),
  ]);
  if (!produtoIds.size) return [];

  const produtos = await prisma.produto.findMany({
    where: { id: { in: [...produtoIds] } },
    select: {
      id: true,
      codigo: true,
      descricao: true,
      unidadeMedida: { select: { sigla: true, fatorConversao: true } },
    },
  });

  const mapaSaldo = new Map(lotes.map((l) => [l.produtoId, l._sum.quantidadeAtual]));
  const mapaPedidoCompra = new Map(itensCompraPendente.map((i) => [i.produtoId, i._sum.quantidade]));
  const mapaJaRecebido = new Map(entradasDeCompraPendente.map((i) => [i.produtoId, i._sum.quantidade]));
  const mapaPedidoVenda = new Map(itensVendaPendente.map((i) => [i.produtoId, i._sum.quantidade]));

  return produtos.map((produto) => {
    const saldoAtual = new Prisma.Decimal(mapaSaldo.get(produto.id) ?? 0);
    const totalPedidoCompra = new Prisma.Decimal(mapaPedidoCompra.get(produto.id) ?? 0);
    const jaRecebido = new Prisma.Decimal(mapaJaRecebido.get(produto.id) ?? 0);
    const aReceber = Prisma.Decimal.max(totalPedidoCompra.minus(jaRecebido), 0);
    const aEntregar = new Prisma.Decimal(mapaPedidoVenda.get(produto.id) ?? 0);
    const saldoPrevisto = saldoAtual.plus(aReceber).minus(aEntregar);

    return {
      produtoId: produto.id,
      codigo: produto.codigo,
      descricao: produto.descricao,
      unidadeMedida: produto.unidadeMedida,
      saldoAtual: saldoAtual.toFixed(4),
      aReceber: aReceber.toFixed(4),
      aEntregar: aEntregar.toFixed(4),
      saldoPrevisto: saldoPrevisto.toFixed(4),
    };
  });
}

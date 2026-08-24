import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";

const PEDIDO_VENDA_PENDENTE = ["ABERTO", "SEPARACAO"];

// Confronta o saldo físico com o mínimo/máximo cadastrado do produto e com
// o que já está comprometido em pedidos de venda ainda não faturados — dá
// pra ver de cara se o físico já teria dado conta da demanda represada, sem
// entrar no mérito de reposição por compra (isso é a Prévia do Estoque).
export async function consultar({ empresaId, produtoId }) {
  const produtos = await prisma.produto.findMany({
    where: { empresaId, ativo: true, ...(produtoId ? { id: produtoId } : {}) },
    select: {
      id: true,
      codigo: true,
      descricao: true,
      estoqueMinimo: true,
      estoqueMaximo: true,
      unidadeMedida: { select: { sigla: true, fatorConversao: true } },
    },
  });
  if (!produtos.length) return [];

  const produtoIds = produtos.map((produto) => produto.id);

  const [lotes, itensVendaPendente] = await Promise.all([
    prisma.lote.groupBy({
      by: ["produtoId"],
      where: { empresaId, produtoId: { in: produtoIds } },
      _sum: { quantidadeAtual: true },
    }),
    prisma.itemPedidoVenda.groupBy({
      by: ["produtoId"],
      where: { pedidoVenda: { empresaId, status: { in: PEDIDO_VENDA_PENDENTE } }, produtoId: { in: produtoIds } },
      _sum: { quantidade: true },
    }),
  ]);

  const mapaSaldo = new Map(lotes.map((l) => [l.produtoId, l._sum.quantidadeAtual]));
  const mapaPrevistoVenda = new Map(itensVendaPendente.map((i) => [i.produtoId, i._sum.quantidade]));

  return produtos.map((produto) => {
    const saldo = new Prisma.Decimal(mapaSaldo.get(produto.id) ?? 0);
    const previstoVenda = new Prisma.Decimal(mapaPrevistoVenda.get(produto.id) ?? 0);
    return {
      produtoId: produto.id,
      codigo: produto.codigo,
      descricao: produto.descricao,
      unidadeMedida: produto.unidadeMedida,
      saldo: saldo.toFixed(4),
      minimo: produto.estoqueMinimo,
      maximo: produto.estoqueMaximo,
      previstoVenda: previstoVenda.toFixed(4),
      saldoPrevisto: saldo.minus(previstoVenda).toFixed(4),
    };
  });
}

import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";

export function filtroPeriodo(campo, { dataInicial, dataFinal }) {
  if (!dataInicial && !dataFinal) return {};
  return { [campo]: { ...(dataInicial ? { gte: dataInicial } : {}), ...(dataFinal ? { lte: dataFinal } : {}) } };
}

function valorItem(item) {
  return new Prisma.Decimal(item.quantidade).times(item.precoUnitario).minus(item.desconto ?? 0);
}

// Reaproveitado pelo Analytics (curva ABC) e pelos Relatórios Gerenciais
// (vendas por cliente/produto) — a agregação bruta é a mesma, só muda o
// que cada um faz com ela depois (classificar ABC ou só listar).
export async function agregarVendasPorProduto({ empresaId, dataInicial, dataFinal }) {
  const itens = await prisma.itemPedidoVenda.findMany({
    where: {
      pedidoVenda: { empresaId, status: "FATURADO", ...filtroPeriodo("dataEmissao", { dataInicial, dataFinal }) },
    },
    select: {
      produtoId: true,
      quantidade: true,
      precoUnitario: true,
      desconto: true,
      produto: { select: { codigo: true, descricao: true } },
    },
  });

  const porProduto = new Map();
  for (const item of itens) {
    if (!porProduto.has(item.produtoId)) {
      porProduto.set(item.produtoId, {
        produtoId: item.produtoId,
        codigo: item.produto.codigo,
        descricao: item.produto.descricao,
        quantidade: new Prisma.Decimal(0),
        valor: new Prisma.Decimal(0),
      });
    }
    const entrada = porProduto.get(item.produtoId);
    entrada.quantidade = entrada.quantidade.plus(item.quantidade);
    entrada.valor = entrada.valor.plus(valorItem(item));
  }

  return [...porProduto.values()].sort((a, b) => b.valor.comparedTo(a.valor));
}

export async function agregarVendasPorCliente({ empresaId, dataInicial, dataFinal }) {
  const pedidos = await prisma.pedidoVenda.findMany({
    where: { empresaId, status: "FATURADO", ...filtroPeriodo("dataEmissao", { dataInicial, dataFinal }) },
    select: {
      clienteId: true,
      cliente: { select: { participante: { select: { razaoSocial: true } } } },
      itens: { select: { quantidade: true, precoUnitario: true, desconto: true } },
    },
  });

  const porCliente = new Map();
  for (const pedido of pedidos) {
    if (!porCliente.has(pedido.clienteId)) {
      porCliente.set(pedido.clienteId, {
        clienteId: pedido.clienteId,
        razaoSocial: pedido.cliente.participante.razaoSocial,
        pedidos: 0,
        valor: new Prisma.Decimal(0),
      });
    }
    const entrada = porCliente.get(pedido.clienteId);
    entrada.pedidos += 1;
    entrada.valor = entrada.valor.plus(pedido.itens.reduce((soma, item) => soma.plus(valorItem(item)), new Prisma.Decimal(0)));
  }

  return [...porCliente.values()].sort((a, b) => b.valor.comparedTo(a.valor));
}

export async function agregarComprasPorFornecedor({ empresaId, dataInicial, dataFinal }) {
  const pedidos = await prisma.pedidoCompra.findMany({
    where: {
      empresaId,
      status: { in: ["RECEBIDO", "RECEBIDO_PARCIAL"] },
      ...filtroPeriodo("dataEmissao", { dataInicial, dataFinal }),
    },
    select: {
      fornecedorId: true,
      fornecedor: { select: { participante: { select: { razaoSocial: true } } } },
      itens: { select: { quantidade: true, precoUnitario: true } },
    },
  });

  const porFornecedor = new Map();
  for (const pedido of pedidos) {
    if (!porFornecedor.has(pedido.fornecedorId)) {
      porFornecedor.set(pedido.fornecedorId, {
        fornecedorId: pedido.fornecedorId,
        razaoSocial: pedido.fornecedor.participante.razaoSocial,
        pedidos: 0,
        valor: new Prisma.Decimal(0),
      });
    }
    const entrada = porFornecedor.get(pedido.fornecedorId);
    entrada.pedidos += 1;
    entrada.valor = entrada.valor.plus(
      pedido.itens.reduce((soma, item) => soma.plus(new Prisma.Decimal(item.quantidade).times(item.precoUnitario)), new Prisma.Decimal(0)),
    );
  }

  return [...porFornecedor.values()].sort((a, b) => b.valor.comparedTo(a.valor));
}

export function classificarAbc(itensOrdenadosPorValorDesc) {
  const valorTotal = itensOrdenadosPorValorDesc.reduce((soma, item) => soma.plus(item.valor), new Prisma.Decimal(0));
  let acumulado = new Prisma.Decimal(0);
  return itensOrdenadosPorValorDesc.map((item) => {
    acumulado = acumulado.plus(item.valor);
    const percentualAcumulado = valorTotal.isZero() ? new Prisma.Decimal(0) : acumulado.dividedBy(valorTotal).times(100);
    const classe = percentualAcumulado.lte(80) ? "A" : percentualAcumulado.lte(95) ? "B" : "C";
    return {
      ...item,
      quantidade: item.quantidade?.toFixed?.(4),
      valor: item.valor.toFixed(2),
      percentualAcumulado: percentualAcumulado.toFixed(2),
      classe,
    };
  });
}

export function paraValoresFixos(itens) {
  return itens.map((item) => ({ ...item, quantidade: item.quantidade?.toFixed?.(4), valor: item.valor.toFixed(2) }));
}

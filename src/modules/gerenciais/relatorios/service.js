import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { agregarVendasPorCliente, agregarVendasPorProduto, paraValoresFixos } from "../shared/agregacoes.js";

export async function vendasPorCliente({ empresaId, dataInicial, dataFinal }) {
  const itens = await agregarVendasPorCliente({ empresaId, dataInicial, dataFinal });
  return paraValoresFixos(itens);
}

export async function vendasPorProduto({ empresaId, dataInicial, dataFinal }) {
  const itens = await agregarVendasPorProduto({ empresaId, dataInicial, dataFinal });
  return paraValoresFixos(itens);
}

// DRE simplificado: não é um demonstrativo contábil formal (não há
// classificação de contas por natureza no plano de contas atual pra
// sustentar isso) — é uma leitura gerencial rápida a partir do que o
// sistema já registra: vendas faturadas, devoluções, compras recebidas
// (proxy de CMV) e títulos a pagar avulsos (proxy de despesa operacional).
export async function dre({ empresaId, dataInicial, dataFinal }) {
  const periodo = { dataEmissao: { gte: dataInicial, lte: dataFinal } };

  const [pedidosVenda, devolucoes, pedidosCompra, despesasAvulsas] = await Promise.all([
    prisma.pedidoVenda.findMany({
      where: { empresaId, status: "FATURADO", ...periodo },
      select: { itens: { select: { quantidade: true, precoUnitario: true, desconto: true } } },
    }),
    prisma.devolucaoVenda.findMany({
      where: { pedidoVenda: { empresaId }, data: { gte: dataInicial, lte: dataFinal } },
      select: {
        itens: { select: { produtoId: true, quantidade: true } },
        pedidoVenda: { select: { itens: { select: { produtoId: true, precoUnitario: true } } } },
      },
    }),
    prisma.pedidoCompra.findMany({
      where: { empresaId, status: { in: ["RECEBIDO", "RECEBIDO_PARCIAL"] }, ...periodo },
      select: { itens: { select: { quantidade: true, precoUnitario: true } } },
    }),
    prisma.tituloFinanceiro.aggregate({
      where: { empresaId, tipo: "PAGAR", pedidoCompraId: null, vencimento: { gte: dataInicial, lte: dataFinal } },
      _sum: { valor: true },
    }),
  ]);

  const receitaBruta = pedidosVenda.reduce(
    (soma, pedido) =>
      soma.plus(
        pedido.itens.reduce(
          (s, item) => s.plus(new Prisma.Decimal(item.quantidade).times(item.precoUnitario).minus(item.desconto ?? 0)),
          new Prisma.Decimal(0),
        ),
      ),
    new Prisma.Decimal(0),
  );

  let deducoes = new Prisma.Decimal(0);
  for (const devolucao of devolucoes) {
    const precoPorProduto = new Map(devolucao.pedidoVenda.itens.map((item) => [item.produtoId, item.precoUnitario]));
    for (const item of devolucao.itens) {
      const preco = precoPorProduto.get(item.produtoId) ?? new Prisma.Decimal(0);
      deducoes = deducoes.plus(new Prisma.Decimal(item.quantidade).times(preco));
    }
  }

  const receitaLiquida = receitaBruta.minus(deducoes);

  const custoMercadorias = pedidosCompra.reduce(
    (soma, pedido) =>
      soma.plus(
        pedido.itens.reduce((s, item) => s.plus(new Prisma.Decimal(item.quantidade).times(item.precoUnitario)), new Prisma.Decimal(0)),
      ),
    new Prisma.Decimal(0),
  );

  const lucroBruto = receitaLiquida.minus(custoMercadorias);
  const despesasOperacionais = new Prisma.Decimal(despesasAvulsas._sum.valor ?? 0);
  const resultado = lucroBruto.minus(despesasOperacionais);

  return {
    periodo: { dataInicial, dataFinal },
    receitaBruta: receitaBruta.toFixed(2),
    deducoes: deducoes.toFixed(2),
    receitaLiquida: receitaLiquida.toFixed(2),
    custoMercadorias: custoMercadorias.toFixed(2),
    lucroBruto: lucroBruto.toFixed(2),
    despesasOperacionais: despesasOperacionais.toFixed(2),
    resultado: resultado.toFixed(2),
    simplificado: true,
  };
}

export async function dfc({ empresaId, dataInicial, dataFinal }) {
  const [movimentosAnteriores, movimentosPeriodo] = await Promise.all([
    prisma.movimentoCaixa.findMany({ where: { empresaId, data: { lt: dataInicial } }, select: { tipo: true, valor: true } }),
    prisma.movimentoCaixa.findMany({
      where: { empresaId, data: { gte: dataInicial, lte: dataFinal } },
      select: { tipo: true, valor: true },
    }),
  ]);

  function saldoDe(movimentos) {
    return movimentos.reduce(
      (soma, m) => (m.tipo === "ENTRADA" ? soma.plus(m.valor) : soma.minus(m.valor)),
      new Prisma.Decimal(0),
    );
  }

  const saldoInicial = saldoDe(movimentosAnteriores);
  const entradas = movimentosPeriodo
    .filter((m) => m.tipo === "ENTRADA")
    .reduce((soma, m) => soma.plus(m.valor), new Prisma.Decimal(0));
  const saidas = movimentosPeriodo
    .filter((m) => m.tipo === "SAIDA")
    .reduce((soma, m) => soma.plus(m.valor), new Prisma.Decimal(0));
  const saldoFinal = saldoInicial.plus(entradas).minus(saidas);

  return {
    periodo: { dataInicial, dataFinal },
    saldoInicial: saldoInicial.toFixed(2),
    entradas: entradas.toFixed(2),
    saidas: saidas.toFixed(2),
    saldoFinal: saldoFinal.toFixed(2),
  };
}

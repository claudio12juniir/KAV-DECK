import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import {
  agregarComprasPorFornecedor,
  agregarVendasPorCliente,
  agregarVendasPorProduto,
  paraValoresFixos,
} from "../shared/agregacoes.js";

// Soma o custo mensal corrente (não histórico/prorateado por período) de
// todos os colaboradores ativos — ver Colaborador.valorSalario e afins no
// schema. Reaproveitado pelo DRE (como despesa de pessoal) e pelo relatório
// dedicado de custos de colaboradores.
async function somarCustosColaboradores({ empresaId }) {
  const colaboradores = await prisma.colaborador.findMany({
    where: { empresaId, ativo: true },
    select: {
      id: true,
      nome: true,
      tipo: true,
      valorSalario: true,
      valorValeAlimentacao: true,
      valorValeTransporte: true,
      valorInss: true,
      valorOutrosEncargos: true,
    },
    orderBy: { nome: "asc" },
  });

  const itens = colaboradores.map((c) => {
    const custoTotal = new Prisma.Decimal(c.valorSalario)
      .plus(c.valorValeAlimentacao)
      .plus(c.valorValeTransporte)
      .plus(c.valorInss)
      .plus(c.valorOutrosEncargos);
    return {
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      valorSalario: new Prisma.Decimal(c.valorSalario).toFixed(2),
      valorValeAlimentacao: new Prisma.Decimal(c.valorValeAlimentacao).toFixed(2),
      valorValeTransporte: new Prisma.Decimal(c.valorValeTransporte).toFixed(2),
      valorInss: new Prisma.Decimal(c.valorInss).toFixed(2),
      valorOutrosEncargos: new Prisma.Decimal(c.valorOutrosEncargos).toFixed(2),
      custoTotal: custoTotal.toFixed(2),
    };
  });

  const totalGeral = itens.reduce((soma, item) => soma.plus(item.custoTotal), new Prisma.Decimal(0));
  return { itens, totalGeral };
}

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
// (proxy de CMV), títulos a pagar avulsos e custo de pessoal (proxy de
// despesa operacional). Custo de pessoal usa o valor mensal CORRENTE dos
// colaboradores ativos, não prorateado pelo período do relatório — se o
// período não for exatamente um mês, o número não é proporcional (
// simplificação deliberada, documentada também no retorno via
// `custosPessoal`).
export async function dre({ empresaId, dataInicial, dataFinal }) {
  const periodo = { dataEmissao: { gte: dataInicial, lte: dataFinal } };

  const [pedidosVenda, devolucoes, pedidosCompra, despesasAvulsas, custosPessoal] = await Promise.all([
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
    somarCustosColaboradores({ empresaId }),
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
  const despesasAvulsasTotal = new Prisma.Decimal(despesasAvulsas._sum.valor ?? 0);
  const despesasOperacionais = despesasAvulsasTotal.plus(custosPessoal.totalGeral);
  const resultado = lucroBruto.minus(despesasOperacionais);

  return {
    periodo: { dataInicial, dataFinal },
    receitaBruta: receitaBruta.toFixed(2),
    deducoes: deducoes.toFixed(2),
    receitaLiquida: receitaLiquida.toFixed(2),
    custoMercadorias: custoMercadorias.toFixed(2),
    lucroBruto: lucroBruto.toFixed(2),
    despesasAvulsas: despesasAvulsasTotal.toFixed(2),
    custosPessoal: custosPessoal.totalGeral.toFixed(2),
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

export async function comprasPorFornecedor({ empresaId, dataInicial, dataFinal }) {
  const itens = await agregarComprasPorFornecedor({ empresaId, dataInicial, dataFinal });
  return paraValoresFixos(itens);
}

// Não é uma "taxa" cobrada por emitir a nota — é o total dos tributos
// (ICMS/IPI/PIS/COFINS) das notas fiscais de saída autorizadas no período,
// que é o número que costuma interessar num relatório gerencial de custos
// fiscais.
export async function resumoFiscal({ empresaId, dataInicial, dataFinal }) {
  const notas = await prisma.notaFiscal.findMany({
    where: {
      empresaId,
      status: "AUTORIZADO",
      tipoOperacao: "SAIDA",
      dataEmissao: { gte: dataInicial, lte: dataFinal },
    },
    select: {
      itens: {
        select: {
          quantidade: true,
          valorUnitario: true,
          valorIcms: true,
          valorIpi: true,
          valorPis: true,
          valorCofins: true,
        },
      },
    },
  });

  let valorTotalNotas = new Prisma.Decimal(0);
  let totalIcms = new Prisma.Decimal(0);
  let totalIpi = new Prisma.Decimal(0);
  let totalPis = new Prisma.Decimal(0);
  let totalCofins = new Prisma.Decimal(0);

  for (const nota of notas) {
    for (const item of nota.itens) {
      valorTotalNotas = valorTotalNotas.plus(new Prisma.Decimal(item.quantidade).times(item.valorUnitario));
      totalIcms = totalIcms.plus(item.valorIcms);
      totalIpi = totalIpi.plus(item.valorIpi);
      totalPis = totalPis.plus(item.valorPis);
      totalCofins = totalCofins.plus(item.valorCofins);
    }
  }

  const totalTributos = totalIcms.plus(totalIpi).plus(totalPis).plus(totalCofins);

  return {
    periodo: { dataInicial, dataFinal },
    quantidadeNotas: notas.length,
    valorTotalNotas: valorTotalNotas.toFixed(2),
    totalIcms: totalIcms.toFixed(2),
    totalIpi: totalIpi.toFixed(2),
    totalPis: totalPis.toFixed(2),
    totalCofins: totalCofins.toFixed(2),
    totalTributos: totalTributos.toFixed(2),
  };
}

export async function custosColaboradores({ empresaId }) {
  const { itens, totalGeral } = await somarCustosColaboradores({ empresaId });
  return { itens, totalGeral: totalGeral.toFixed(2) };
}

// O relatório "principal" pedido pelo usuário: uma leitura única com tudo
// que os outros relatórios individuais mostram separado — pra abrir uma
// tela só e já ver o retrato completo do período, sem navegar entre abas.
export async function relatorioPrincipal({ empresaId, dataInicial, dataFinal }) {
  const [dreResultado, dfcResultado, fiscal, pessoal, porCliente, porProduto, porFornecedor] = await Promise.all([
    dre({ empresaId, dataInicial, dataFinal }),
    dfc({ empresaId, dataInicial, dataFinal }),
    resumoFiscal({ empresaId, dataInicial, dataFinal }),
    custosColaboradores({ empresaId }),
    vendasPorCliente({ empresaId, dataInicial, dataFinal }),
    vendasPorProduto({ empresaId, dataInicial, dataFinal }),
    comprasPorFornecedor({ empresaId, dataInicial, dataFinal }),
  ]);

  return {
    periodo: { dataInicial, dataFinal },
    dre: dreResultado,
    dfc: dfcResultado,
    fiscal,
    pessoal,
    vendasPorCliente: porCliente,
    vendasPorProduto: porProduto,
    comprasPorFornecedor: porFornecedor,
  };
}

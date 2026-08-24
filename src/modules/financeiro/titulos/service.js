import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT_HEADER = {
  id: true,
  tipo: true,
  participanteId: true,
  numero: true,
  valor: true,
  vencimento: true,
  formaPagamento: true,
  status: true,
  boleto: true,
  nossoNumero: true,
  pedidoCompraId: true,
  pedidoVendaId: true,
  criadoEm: true,
  atualizadoEm: true,
  participante: { select: { razaoSocial: true, cpfCnpj: true } },
};

const SELECT_DETAIL = {
  ...SELECT_HEADER,
  baixas: { select: { id: true, dataBaixa: true, valorBaixado: true, formaBaixa: true } },
};

function dividirEmParcelas(valorTotal, numeroParcelas) {
  const total = new Prisma.Decimal(valorTotal);
  const valorParcela = total.dividedBy(numeroParcelas).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);
  const parcelas = Array(numeroParcelas - 1).fill(valorParcela);
  const somaParcelasAnteriores = valorParcela.times(numeroParcelas - 1);
  parcelas.push(total.minus(somaParcelasAnteriores));
  return parcelas;
}

function addDias(data, dias) {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

// Reaproveitado por Compras (receber) e Vendas (faturar) dentro da própria
// transação — título nasce junto com o efeito físico que o origina, nunca
// como ação manual desacompanhada.
export async function gerarTitulos({
  tx,
  empresaId,
  tipo,
  participanteId,
  valorTotal,
  condicaoPagamentoId,
  pedidoCompraId,
  pedidoVendaId,
}) {
  const dataEmissao = new Date();
  const numeroBase = pedidoCompraId ?? pedidoVendaId;

  let parcelas;
  let formaPagamento = "A_DEFINIR";

  if (condicaoPagamentoId) {
    const condicao = await tx.condicaoPagamento.findFirst({
      where: { id: condicaoPagamentoId, empresaId },
      select: { descricao: true, numeroParcelas: true, intervaloDias: true },
    });
    if (!condicao) throw new AppError(422, "INVALID_REFERENCE", "Condição de pagamento informada não existe.");

    formaPagamento = condicao.descricao;
    parcelas = dividirEmParcelas(valorTotal, condicao.numeroParcelas).map((valor, index) => ({
      valor,
      vencimento: addDias(dataEmissao, condicao.intervaloDias * (index + 1)),
    }));
  } else {
    parcelas = [{ valor: new Prisma.Decimal(valorTotal), vencimento: dataEmissao }];
  }

  const titulos = [];
  for (const [index, parcela] of parcelas.entries()) {
    // eslint-disable-next-line no-await-in-loop
    const titulo = await tx.tituloFinanceiro.create({
      data: {
        empresaId,
        tipo,
        participanteId,
        numero: `${numeroBase}-${index + 1}`,
        valor: parcela.valor,
        vencimento: parcela.vencimento,
        formaPagamento,
        pedidoCompraId,
        pedidoVendaId,
      },
      select: { id: true },
    });
    titulos.push(titulo);
  }
  return titulos;
}

async function getTituloOrThrow({ empresaId, id, select = SELECT_DETAIL, client = prisma }) {
  const titulo = await client.tituloFinanceiro.findFirst({ where: { id, empresaId }, select });
  if (!titulo) throw new AppError(404, "NOT_FOUND", "Título financeiro não encontrado.");
  return titulo;
}

export async function list({
  empresaId,
  skip,
  take,
  tipo,
  status,
  participanteId,
  q,
  vencimentoInicial,
  vencimentoFinal,
  ordenarPor = "vencimento",
  ordem = "asc",
}) {
  const where = {
    empresaId,
    ...(tipo ? { tipo } : {}),
    ...(status ? { status } : {}),
    ...(participanteId ? { participanteId } : {}),
    ...(vencimentoInicial || vencimentoFinal
      ? { vencimento: { ...(vencimentoInicial ? { gte: vencimentoInicial } : {}), ...(vencimentoFinal ? { lte: vencimentoFinal } : {}) } }
      : {}),
    // Busca por número do título OU nome do participante — cobre os dois
    // jeitos mais comuns de alguém procurar um título ("qual o da nota
    // 123" vs. "quanto o Mercado X me deve").
    ...(q
      ? {
          OR: [
            { numero: { contains: q, mode: "insensitive" } },
            { participante: { razaoSocial: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.tituloFinanceiro.findMany({
      where,
      select: SELECT_HEADER,
      skip,
      take,
      orderBy: { [ordenarPor]: ordem },
    }),
    prisma.tituloFinanceiro.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  return getTituloOrThrow({ empresaId, id });
}

async function aplicarBaixa(tx, { empresaId, tituloId, valorBaixado, formaBaixa, dataBaixa }) {
  const titulo = await tx.tituloFinanceiro.findFirst({
    where: { id: tituloId, empresaId },
    select: { id: true, status: true, valor: true, baixas: { select: { valorBaixado: true } } },
  });
  if (!titulo) throw new AppError(404, "NOT_FOUND", `Título ${tituloId} não encontrado.`);
  if (titulo.status !== "ABERTO") {
    throw new AppError(409, "TITULO_NAO_BAIXAVEL", `Título ${tituloId} não está aberto para baixa.`);
  }

  const jaBaixado = titulo.baixas.reduce((soma, b) => soma.plus(b.valorBaixado), new Prisma.Decimal(0));
  const totalAposBaixa = jaBaixado.plus(valorBaixado);

  await tx.baixaTitulo.create({
    data: {
      tituloFinanceiroId: tituloId,
      valorBaixado,
      formaBaixa,
      dataBaixa: dataBaixa ?? new Date(),
    },
  });

  if (totalAposBaixa.gte(titulo.valor)) {
    await tx.tituloFinanceiro.update({ where: { id: tituloId }, data: { status: "BAIXADO" } });
  }
}

export async function baixar({ empresaId, id, valorBaixado, formaBaixa, dataBaixa }) {
  await prisma.$transaction((tx) =>
    aplicarBaixa(tx, { empresaId, tituloId: id, valorBaixado, formaBaixa, dataBaixa }),
  );
  return getTituloOrThrow({ empresaId, id });
}

export async function baixarLote({ empresaId, baixas }) {
  await prisma.$transaction(async (tx) => {
    for (const baixa of baixas) {
      // eslint-disable-next-line no-await-in-loop
      await aplicarBaixa(tx, {
        empresaId,
        tituloId: baixa.tituloId,
        valorBaixado: baixa.valorBaixado,
        formaBaixa: baixa.formaBaixa,
        dataBaixa: baixa.dataBaixa,
      });
    }
  });
  return { processados: baixas.length };
}

export async function cancelar({ empresaId, id }) {
  const titulo = await getTituloOrThrow({ empresaId, id, select: { id: true, status: true, baixas: { select: { id: true } } } });
  if (titulo.status !== "ABERTO") {
    throw new AppError(409, "TITULO_NAO_CANCELAVEL", "Só é possível cancelar um título em aberto.");
  }
  if (titulo.baixas.length > 0) {
    throw new AppError(409, "TITULO_COM_BAIXA", "Título já possui baixa registrada e não pode ser cancelado.");
  }

  return prisma.tituloFinanceiro.update({ where: { id }, data: { status: "CANCELADO" }, select: SELECT_DETAIL });
}

export async function reverterBaixa({ empresaId, id }) {
  return prisma.$transaction(async (tx) => {
    const titulo = await tx.tituloFinanceiro.findFirst({
      where: { id, empresaId },
      select: {
        id: true,
        status: true,
        valor: true,
        baixas: { select: { id: true, valorBaixado: true }, orderBy: { criadoEm: "desc" } },
      },
    });
    if (!titulo) throw new AppError(404, "NOT_FOUND", "Título financeiro não encontrado.");

    const [ultimaBaixa, ...restantes] = titulo.baixas;
    if (!ultimaBaixa) {
      throw new AppError(409, "TITULO_SEM_BAIXA", "Este título não possui nenhuma baixa para reverter.");
    }

    await tx.baixaTitulo.delete({ where: { id: ultimaBaixa.id } });

    const totalRestante = restantes.reduce((soma, b) => soma.plus(b.valorBaixado), new Prisma.Decimal(0));
    const novoStatus = totalRestante.gte(titulo.valor) ? "BAIXADO" : "ABERTO";
    await tx.tituloFinanceiro.update({ where: { id }, data: { status: novoStatus } });

    return getTituloOrThrow({ empresaId, id, client: tx });
  });
}

// Divide um título ABERTO (sem baixas) em N títulos filhos, cada um com seu
// próprio vencimento, somando exatamente o valor original. O título de
// origem vira SUBSTITUIDO — não some do histórico, só para de contar como
// pendência em aberto.
export async function parcelar({ empresaId, id, parcelas }) {
  const somaParcelas = parcelas.reduce((soma, p) => soma.plus(p.valor), new Prisma.Decimal(0));

  return prisma.$transaction(async (tx) => {
    const titulo = await tx.tituloFinanceiro.findFirst({
      where: { id, empresaId },
      select: {
        id: true,
        tipo: true,
        participanteId: true,
        numero: true,
        valor: true,
        formaPagamento: true,
        status: true,
        baixas: { select: { id: true } },
      },
    });
    if (!titulo) throw new AppError(404, "NOT_FOUND", "Título financeiro não encontrado.");
    if (titulo.status !== "ABERTO") {
      throw new AppError(409, "TITULO_NAO_PARCELAVEL", "Só é possível parcelar um título em aberto.");
    }
    if (titulo.baixas.length > 0) {
      throw new AppError(409, "TITULO_COM_BAIXA", "Título já possui baixa registrada e não pode ser parcelado.");
    }
    if (!somaParcelas.equals(titulo.valor)) {
      throw new AppError(
        422,
        "SOMA_PARCELAS_DIVERGENTE",
        `A soma das parcelas (${somaParcelas.toFixed(2)}) precisa ser igual ao valor do título (${new Prisma.Decimal(titulo.valor).toFixed(2)}).`,
      );
    }

    const filhos = [];
    for (const [index, parcela] of parcelas.entries()) {
      // eslint-disable-next-line no-await-in-loop
      const filho = await tx.tituloFinanceiro.create({
        data: {
          empresaId,
          tipo: titulo.tipo,
          participanteId: titulo.participanteId,
          numero: `${titulo.numero}-P${index + 1}`,
          valor: parcela.valor,
          vencimento: parcela.vencimento,
          formaPagamento: titulo.formaPagamento,
          tituloOrigemId: titulo.id,
        },
        select: SELECT_HEADER,
      });
      filhos.push(filho);
    }

    await tx.tituloFinanceiro.update({ where: { id: titulo.id }, data: { status: "SUBSTITUIDO" } });

    return { tituloOrigemId: titulo.id, parcelas: filhos };
  });
}

// Cria um título novo e independente com os mesmos dados — não herda
// vínculo com pedido de compra/venda nem parcelamento/agrupamento de
// origem, porque duplicar é uma ação manual do financeiro, não um
// desdobramento automático de outro fluxo.
export async function duplicar({ empresaId, id }) {
  const titulo = await getTituloOrThrow({
    empresaId,
    id,
    select: { tipo: true, participanteId: true, numero: true, valor: true, vencimento: true, formaPagamento: true },
  });

  return prisma.tituloFinanceiro.create({
    data: {
      empresaId,
      tipo: titulo.tipo,
      participanteId: titulo.participanteId,
      numero: `${titulo.numero}-COPIA`,
      valor: titulo.valor,
      vencimento: titulo.vencimento,
      formaPagamento: titulo.formaPagamento,
    },
    select: SELECT_DETAIL,
  });
}

// Junta N títulos ABERTOS do mesmo participante e tipo num único título
// consolidado (soma dos valores); os originais viram SUBSTITUIDO — mesmo
// vocabulário de status usado no parcelamento, porque é a mesma ideia
// (a dívida virou outra coisa, não foi cancelada nem paga).
export async function agrupar({ empresaId, tituloIds, vencimento }) {
  return prisma.$transaction(async (tx) => {
    const titulos = await tx.tituloFinanceiro.findMany({
      where: { id: { in: tituloIds }, empresaId },
      select: {
        id: true,
        tipo: true,
        participanteId: true,
        valor: true,
        vencimento: true,
        formaPagamento: true,
        status: true,
        baixas: { select: { id: true } },
      },
    });

    if (titulos.length !== tituloIds.length) {
      throw new AppError(422, "INVALID_REFERENCE", "Um ou mais títulos informados não existem.");
    }
    const tiposDistintos = new Set(titulos.map((t) => t.tipo));
    const participantesDistintos = new Set(titulos.map((t) => t.participanteId));
    if (tiposDistintos.size > 1) {
      throw new AppError(
        422,
        "TITULOS_INCOMPATIVEIS",
        "Só é possível agrupar títulos do mesmo tipo (a pagar ou a receber).",
      );
    }
    if (participantesDistintos.size > 1) {
      throw new AppError(422, "TITULOS_INCOMPATIVEIS", "Só é possível agrupar títulos do mesmo participante.");
    }
    if (titulos.some((t) => t.status !== "ABERTO" || t.baixas.length > 0)) {
      throw new AppError(409, "TITULO_NAO_AGRUPAVEL", "Só é possível agrupar títulos em aberto e sem baixa.");
    }

    const [{ tipo, participanteId }] = titulos;
    const valorTotal = titulos.reduce((soma, t) => soma.plus(t.valor), new Prisma.Decimal(0));
    const vencimentoFinal =
      vencimento ?? titulos.reduce((maior, t) => (t.vencimento > maior ? t.vencimento : maior), titulos[0].vencimento);

    const consolidado = await tx.tituloFinanceiro.create({
      data: {
        empresaId,
        tipo,
        participanteId,
        numero: `AGRUPADO-${Date.now()}`,
        valor: valorTotal,
        vencimento: vencimentoFinal,
        formaPagamento: "AGRUPADO",
      },
      select: SELECT_DETAIL,
    });

    await tx.tituloFinanceiro.updateMany({
      where: { id: { in: tituloIds } },
      data: { status: "SUBSTITUIDO", tituloAgrupadoId: consolidado.id },
    });

    return consolidado;
  });
}

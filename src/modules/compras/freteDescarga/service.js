import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT_PEDIDO = {
  id: true,
  dataEmissao: true,
  valorFrete: true,
  transportadoraId: true,
  fornecedor: { select: { participante: { select: { razaoSocial: true } } } },
};

export async function consultar({ empresaId, transportadoraId }) {
  const where = {
    empresaId,
    valorFrete: { gt: 0 },
    freteFaturado: false,
    ...(transportadoraId ? { transportadoraId } : { transportadoraId: { not: null } }),
  };
  const pedidos = await prisma.pedidoCompra.findMany({ where, select: SELECT_PEDIDO, orderBy: { dataEmissao: "asc" } });
  const valorTotal = pedidos.reduce((soma, p) => soma.plus(p.valorFrete), new Prisma.Decimal(0));
  return { itens: pedidos, valorTotal: valorTotal.toFixed(2) };
}

// Gera um único título a pagar pra transportadora somando o frete dos
// pedidos selecionados. Exige que a transportadora já tenha um Participante
// vinculado (Transportadora não é Participante por padrão neste sistema —
// só passa a ser cobrável quando alguém faz esse vínculo no cadastro).
export async function gerarFatura({ empresaId, pedidoIds }) {
  const pedidos = await prisma.pedidoCompra.findMany({
    where: { id: { in: pedidoIds }, empresaId },
    select: { id: true, valorFrete: true, transportadoraId: true, freteFaturado: true },
  });
  if (pedidos.length !== pedidoIds.length) {
    throw new AppError(422, "INVALID_REFERENCE", "Um ou mais pedidos informados não existem.");
  }

  const transportadorasDistintas = new Set(pedidos.map((p) => p.transportadoraId));
  if (transportadorasDistintas.size > 1 || pedidos.some((p) => !p.transportadoraId)) {
    throw new AppError(
      422,
      "PEDIDOS_INCOMPATIVEIS",
      "Todos os pedidos selecionados precisam ser da mesma transportadora.",
    );
  }
  if (pedidos.some((p) => p.freteFaturado)) {
    throw new AppError(409, "FRETE_JA_FATURADO", "Um ou mais pedidos já tiveram o frete faturado.");
  }

  const valorTotal = pedidos.reduce((soma, p) => soma.plus(p.valorFrete), new Prisma.Decimal(0));
  if (valorTotal.isZero()) {
    throw new AppError(422, "SEM_FRETE", "Nenhum dos pedidos selecionados tem valor de frete a faturar.");
  }

  const transportadora = await prisma.transportadora.findFirst({
    where: { id: pedidos[0].transportadoraId, empresaId },
    select: { participanteId: true },
  });
  if (!transportadora?.participanteId) {
    throw new AppError(
      422,
      "TRANSPORTADORA_SEM_PARTICIPANTE",
      "Esta transportadora ainda não tem um participante vinculado — cadastre o vínculo antes de gerar a fatura.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const titulo = await tx.tituloFinanceiro.create({
      data: {
        empresaId,
        tipo: "PAGAR",
        participanteId: transportadora.participanteId,
        numero: `FRETE-${Date.now()}`,
        valor: valorTotal,
        vencimento: new Date(),
        formaPagamento: "FRETE",
      },
      select: { id: true, numero: true, valor: true, vencimento: true, status: true },
    });
    await tx.pedidoCompra.updateMany({ where: { id: { in: pedidoIds } }, data: { freteFaturado: true } });
    return titulo;
  });
}

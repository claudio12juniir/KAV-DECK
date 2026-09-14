import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  data: true,
  periodo: true,
  rotaEntregaId: true,
  transportadoraId: true,
  placaVeiculo: true,
  valorFrete: true,
  faturaGerada: true,
  rotaEntrega: { select: { nome: true } },
  transportadora: { select: { razaoSocial: true } },
  pedidos: {
    select: {
      id: true,
      status: true,
      cliente: { select: { participante: { select: { razaoSocial: true } } } },
    },
  },
};

function inicioDoDia(data) {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

async function ensureRotaEntrega({ empresaId, rotaEntregaId }) {
  const rota = await prisma.rotaEntrega.findFirst({
    where: { id: rotaEntregaId, empresaId },
    select: { id: true, transportadoraId: true },
  });
  if (!rota) throw new AppError(422, "INVALID_REFERENCE", "Rota de entrega informada não existe.");
  return rota;
}

export async function getById({ empresaId, id }) {
  const itinerario = await prisma.itinerario.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!itinerario) throw new AppError(404, "NOT_FOUND", "Itinerário não encontrado.");
  return itinerario;
}

// "Adicionar itinerário" (menu do painel esquerdo, seção 14) — criação
// manual. transportadoraId, quando omitido, herda o da rota cadastrada.
export async function criar({ empresaId, data, periodo, rotaEntregaId, transportadoraId, placaVeiculo }) {
  const rota = await ensureRotaEntrega({ empresaId, rotaEntregaId });
  return prisma.itinerario.create({
    data: {
      empresaId,
      data,
      periodo,
      rotaEntregaId,
      transportadoraId: transportadoraId ?? rota.transportadoraId,
      placaVeiculo,
    },
    select: SELECT,
  });
}

// "Gerar automático" (achado de agilidade, seção 17.9 do mapeamento):
// agrupa por rota os pedidos já FATURADOS do dia (e período, se informado)
// que têm rotaEntregaId definido mas ainda não entraram em nenhum
// itinerário — um Itinerario por rota, com todos os pedidos elegíveis já
// vinculados de uma vez.
export async function gerarAutomatico({ empresaId, data, periodo }) {
  const inicio = inicioDoDia(data);
  const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);

  const pedidos = await prisma.pedidoVenda.findMany({
    where: {
      empresaId,
      status: "FATURADO",
      itinerarioId: null,
      rotaEntregaId: { not: null },
      dataEmissao: { gte: inicio, lt: fim },
      ...(periodo ? { turno: periodo } : {}),
    },
    select: { id: true, rotaEntregaId: true },
  });

  if (!pedidos.length) {
    throw new AppError(
      409,
      "NADA_PARA_GERAR",
      "Nenhum pedido faturado com rota definida e sem itinerário foi encontrado para esta data.",
    );
  }

  const pedidosPorRota = new Map();
  for (const pedido of pedidos) {
    if (!pedidosPorRota.has(pedido.rotaEntregaId)) pedidosPorRota.set(pedido.rotaEntregaId, []);
    pedidosPorRota.get(pedido.rotaEntregaId).push(pedido.id);
  }

  const rotas = await prisma.rotaEntrega.findMany({
    where: { id: { in: [...pedidosPorRota.keys()] }, empresaId },
    select: { id: true, transportadoraId: true },
  });

  const itinerarios = await prisma.$transaction(
    rotas.map((rota) =>
      prisma.itinerario.create({
        data: {
          empresaId,
          data,
          periodo,
          rotaEntregaId: rota.id,
          transportadoraId: rota.transportadoraId,
          pedidos: { connect: pedidosPorRota.get(rota.id).map((id) => ({ id })) },
        },
        select: SELECT,
      }),
    ),
  );

  return itinerarios;
}

export async function vincularPedido({ empresaId, id, pedidoId }) {
  await getById({ empresaId, id });
  const pedido = await prisma.pedidoVenda.findFirst({
    where: { id: pedidoId, empresaId, status: "FATURADO" },
    select: { id: true },
  });
  if (!pedido) {
    throw new AppError(422, "INVALID_REFERENCE", "Pedido informado não existe ou ainda não foi faturado.");
  }
  await prisma.pedidoVenda.update({ where: { id: pedidoId }, data: { itinerarioId: id } });
  return getById({ empresaId, id });
}

export async function atualizar({ empresaId, id, placaVeiculo, valorFrete }) {
  await getById({ empresaId, id });
  return prisma.itinerario.update({
    where: { id },
    data: { ...(placaVeiculo !== undefined ? { placaVeiculo } : {}), ...(valorFrete !== undefined ? { valorFrete } : {}) },
    select: SELECT,
  });
}

// Tela "Consultar" (seção 14): filtros por intervalo de data, período, rota,
// transportadora e placa — grid com soma de frete selecionado no frontend.
export async function consultar({ empresaId, dataInicial, dataFinal, periodo, rotaEntregaId, transportadoraId }) {
  const where = {
    empresaId,
    ...(rotaEntregaId ? { rotaEntregaId } : {}),
    ...(transportadoraId ? { transportadoraId } : {}),
    ...(periodo ? { periodo } : {}),
    ...(dataInicial || dataFinal
      ? { data: { ...(dataInicial ? { gte: dataInicial } : {}), ...(dataFinal ? { lte: dataFinal } : {}) } }
      : {}),
  };
  return prisma.itinerario.findMany({ where, select: SELECT, orderBy: { data: "desc" } });
}

// Mesmo padrão de src/modules/compras/freteDescarga/service.js#gerarFatura —
// consolida N itinerários da mesma transportadora num único título a pagar.
export async function gerarFatura({ empresaId, itinerarioIds }) {
  const itinerarios = await prisma.itinerario.findMany({
    where: { id: { in: itinerarioIds }, empresaId },
    select: { id: true, valorFrete: true, transportadoraId: true, faturaGerada: true },
  });
  if (itinerarios.length !== itinerarioIds.length) {
    throw new AppError(422, "INVALID_REFERENCE", "Um ou mais itinerários informados não existem.");
  }

  const transportadorasDistintas = new Set(itinerarios.map((i) => i.transportadoraId));
  if (transportadorasDistintas.size > 1 || itinerarios.some((i) => !i.transportadoraId)) {
    throw new AppError(
      422,
      "ITINERARIOS_INCOMPATIVEIS",
      "Todos os itinerários selecionados precisam ser da mesma transportadora.",
    );
  }
  if (itinerarios.some((i) => i.faturaGerada)) {
    throw new AppError(409, "FRETE_JA_FATURADO", "Um ou mais itinerários já tiveram a fatura gerada.");
  }

  const valorTotal = itinerarios.reduce((soma, i) => soma.plus(i.valorFrete), new Prisma.Decimal(0));
  if (valorTotal.isZero()) {
    throw new AppError(422, "SEM_FRETE", "Nenhum dos itinerários selecionados tem valor de frete a faturar.");
  }

  const transportadora = await prisma.transportadora.findFirst({
    where: { id: itinerarios[0].transportadoraId, empresaId },
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
    // itinerarioId no título é só um ponteiro de referência pro primeiro
    // itinerário do lote (a FK é singular) — o estado real de "já faturado"
    // de cada itinerário é o campo faturaGerada, atualizado abaixo pra
    // todos os selecionados, mesmo padrão do freteFaturado em PedidoCompra.
    const titulo = await tx.tituloFinanceiro.create({
      data: {
        empresaId,
        tipo: "PAGAR",
        participanteId: transportadora.participanteId,
        numero: `ITINERARIO-${Date.now()}`,
        valor: valorTotal,
        vencimento: new Date(),
        formaPagamento: "FRETE",
        itinerarioId: itinerarios[0].id,
      },
      select: { id: true, numero: true, valor: true, vencimento: true, status: true },
    });
    await tx.itinerario.updateMany({ where: { id: { in: itinerarioIds } }, data: { faturaGerada: true } });
    return titulo;
  });
}

import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";
import { gerarTitulos } from "../../financeiro/titulos/service.js";

// RECEBIDO_PARCIAL e RECEBIDO só são alcançados via receber() — são
// consequência de mercadoria física entrar em estoque, não de uma troca de
// status solta pelo endpoint genérico.
const ALLOWED_TRANSITIONS = {
  ABERTO: ["APROVADO", "CANCELADO"],
  APROVADO: ["CANCELADO"],
  RECEBIDO_PARCIAL: ["CANCELADO"],
  RECEBIDO: [],
  CANCELADO: [],
};

const SELECT_HEADER = {
  id: true,
  fornecedorId: true,
  compradorId: true,
  condicaoPagamentoId: true,
  transportadoraId: true,
  valorFrete: true,
  freteFaturado: true,
  dataEmissao: true,
  status: true,
  arquivado: true,
  criadoEm: true,
  atualizadoEm: true,
  fornecedor: { select: { participante: { select: { razaoSocial: true, cpfCnpj: true } } } },
};

const SELECT_DETAIL = {
  ...SELECT_HEADER,
  itens: {
    select: {
      id: true,
      produtoId: true,
      loteId: true,
      quantidade: true,
      precoUnitario: true,
      produto: { select: { codigo: true, descricao: true } },
    },
  },
};

async function ensureFornecedor({ empresaId, fornecedorId }) {
  const fornecedor = await prisma.fornecedor.findFirst({
    where: { participanteId: fornecedorId, participante: { empresaId } },
    select: { participanteId: true },
  });
  if (!fornecedor) throw new AppError(422, "INVALID_REFERENCE", "Fornecedor informado não existe.");
}

async function ensureComprador({ empresaId, compradorId }) {
  if (!compradorId) return;
  const comprador = await prisma.colaborador.findFirst({
    where: { id: compradorId, empresaId },
    select: { id: true },
  });
  if (!comprador) throw new AppError(422, "INVALID_REFERENCE", "Comprador informado não existe.");
}

async function ensureCondicaoPagamento({ empresaId, condicaoPagamentoId }) {
  if (!condicaoPagamentoId) return;
  const condicao = await prisma.condicaoPagamento.findFirst({
    where: { id: condicaoPagamentoId, empresaId },
    select: { id: true },
  });
  if (!condicao) throw new AppError(422, "INVALID_REFERENCE", "Condição de pagamento informada não existe.");
}

async function ensureProdutos({ empresaId, produtoIds }) {
  if (!produtoIds.length) return;
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, empresaId },
    select: { id: true },
  });
  if (produtos.length !== new Set(produtoIds).size) {
    throw new AppError(422, "INVALID_REFERENCE", "Um ou mais produtos informados não existem.");
  }
}

async function getPedidoOrThrow({ empresaId, id, select = SELECT_DETAIL }) {
  const pedido = await prisma.pedidoCompra.findFirst({ where: { id, empresaId }, select });
  if (!pedido) throw new AppError(404, "NOT_FOUND", "Pedido de compra não encontrado.");
  return pedido;
}

// Mesmo raciocínio do filtro de PedidoVenda (ver whereDoFiltro em
// vendas/pedidosVenda/service.js) — aqui não existe "AGRUPADO" porque
// PedidoCompra não tem equivalente ao agrupamento de NF de venda.
function whereDoFiltro(filtro) {
  switch (filtro) {
    case "EM_ABERTO":
      return { status: "ABERTO", arquivado: false };
    case "CANCELADO":
      return { status: "CANCELADO", arquivado: false };
    case "LIQUIDADO":
      return {
        status: "RECEBIDO",
        arquivado: false,
        titulosFinanceiros: { some: {} },
        NOT: { titulosFinanceiros: { some: { status: { not: "BAIXADO" } } } },
      };
    case "ARQUIVADO":
      return { arquivado: true };
    default:
      return {};
  }
}

export async function list({ empresaId, skip, take, status, filtro }) {
  const where = { empresaId, ...(status ? { status } : {}), ...whereDoFiltro(filtro) };
  const [items, total] = await Promise.all([
    prisma.pedidoCompra.findMany({ where, select: SELECT_HEADER, skip, take, orderBy: { dataEmissao: "desc" } }),
    prisma.pedidoCompra.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  return getPedidoOrThrow({ empresaId, id });
}

export async function create({ empresaId, data }) {
  const { itens = [], ...rest } = data;

  await Promise.all([
    ensureFornecedor({ empresaId, fornecedorId: rest.fornecedorId }),
    ensureComprador({ empresaId, compradorId: rest.compradorId }),
    ensureCondicaoPagamento({ empresaId, condicaoPagamentoId: rest.condicaoPagamentoId }),
    ensureProdutos({ empresaId, produtoIds: itens.map((item) => item.produtoId) }),
  ]);

  return prisma.pedidoCompra.create({
    data: {
      ...rest,
      empresaId,
      itens: itens.length ? { create: itens } : undefined,
    },
    select: SELECT_DETAIL,
  });
}

export async function updateStatus({ empresaId, id, status }) {
  const pedido = await getPedidoOrThrow({ empresaId, id, select: { id: true, status: true } });

  if (!ALLOWED_TRANSITIONS[pedido.status].includes(status)) {
    throw new AppError(
      400,
      "INVALID_TRANSITION",
      `Não é possível mudar o status de ${pedido.status} para ${status}.`,
    );
  }

  return prisma.pedidoCompra.update({ where: { id }, data: { status }, select: SELECT_DETAIL });
}

export async function addItem({ empresaId, pedidoId, data }) {
  const pedido = await getPedidoOrThrow({ empresaId, id: pedidoId, select: { id: true, status: true } });
  if (pedido.status !== "ABERTO") {
    throw new AppError(409, "PEDIDO_NAO_EDITAVEL", "Só é possível alterar itens de um pedido em aberto.");
  }

  await ensureProdutos({ empresaId, produtoIds: [data.produtoId] });

  return prisma.itemPedidoCompra.create({
    data: { ...data, pedidoCompraId: pedidoId },
    select: { id: true, produtoId: true, loteId: true, quantidade: true, precoUnitario: true },
  });
}

export async function removeItem({ empresaId, pedidoId, itemId }) {
  const pedido = await getPedidoOrThrow({ empresaId, id: pedidoId, select: { id: true, status: true } });
  if (pedido.status !== "ABERTO") {
    throw new AppError(409, "PEDIDO_NAO_EDITAVEL", "Só é possível alterar itens de um pedido em aberto.");
  }

  const item = await prisma.itemPedidoCompra.findFirst({
    where: { id: itemId, pedidoCompraId: pedidoId },
    select: { id: true },
  });
  if (!item) throw new AppError(404, "NOT_FOUND", "Item não encontrado neste pedido.");

  await prisma.itemPedidoCompra.delete({ where: { id: itemId } });
}

export async function receber({ empresaId, id, itens }) {
  const pedido = await prisma.pedidoCompra.findFirst({
    where: { id, empresaId },
    select: {
      id: true,
      status: true,
      fornecedorId: true,
      condicaoPagamentoId: true,
      itens: { select: { produtoId: true, quantidade: true, precoUnitario: true } },
    },
  });
  if (!pedido) throw new AppError(404, "NOT_FOUND", "Pedido de compra não encontrado.");
  if (!["APROVADO", "RECEBIDO_PARCIAL"].includes(pedido.status)) {
    throw new AppError(
      409,
      "PEDIDO_NAO_RECEBIVEL",
      "Pedido precisa estar aprovado (ou parcialmente recebido) para receber mercadoria.",
    );
  }

  const produtosDoPedido = new Set(pedido.itens.map((item) => item.produtoId));
  for (const item of itens) {
    if (!produtosDoPedido.has(item.produtoId)) {
      throw new AppError(
        422,
        "PRODUTO_FORA_DO_PEDIDO",
        `Produto ${item.produtoId} não faz parte deste pedido de compra.`,
      );
    }
  }

  await ensureProdutos({ empresaId, produtoIds: itens.map((item) => item.produtoId) });

  await prisma.$transaction(async (tx) => {
    for (const item of itens) {
      const lote = await tx.lote.create({
        data: {
          empresaId,
          produtoId: item.produtoId,
          fornecedorId: pedido.fornecedorId,
          dataValidade: item.dataValidade,
          sif: item.sif,
          temperaturaRecebimento: item.temperaturaRecebimento,
          veiculo: item.veiculo,
          quantidadeInicial: item.quantidade,
          quantidadeAtual: item.quantidade,
        },
      });

      await tx.movimentoEstoque.create({
        data: {
          empresaId,
          produtoId: item.produtoId,
          loteId: lote.id,
          tipo: "ENTRADA",
          quantidade: item.quantidade,
          pedidoCompraId: id,
        },
      });
    }

    // Título a pagar nasce uma única vez, no primeiro recebimento (parcial
    // ou total) — recebimentos parciais seguintes não geram título de novo.
    const tituloJaGerado = await tx.tituloFinanceiro.findFirst({
      where: { pedidoCompraId: id },
      select: { id: true },
    });
    if (!tituloJaGerado) {
      const valorTotal = pedido.itens.reduce(
        (soma, item) => soma.plus(new Prisma.Decimal(item.quantidade).times(item.precoUnitario)),
        new Prisma.Decimal(0),
      );
      await gerarTitulos({
        tx,
        empresaId,
        tipo: "PAGAR",
        participanteId: pedido.fornecedorId,
        valorTotal,
        condicaoPagamentoId: pedido.condicaoPagamentoId,
        pedidoCompraId: id,
      });
    }
  });

  const [pedidoItens, entradas] = await Promise.all([
    prisma.itemPedidoCompra.groupBy({
      by: ["produtoId"],
      where: { pedidoCompraId: id },
      _sum: { quantidade: true },
    }),
    prisma.movimentoEstoque.groupBy({
      by: ["produtoId"],
      where: { pedidoCompraId: id, tipo: "ENTRADA" },
      _sum: { quantidade: true },
    }),
  ]);

  const recebidoPorProduto = new Map(entradas.map((e) => [e.produtoId, e._sum.quantidade]));
  const totalmenteRecebido = pedidoItens.every((pi) => {
    const recebido = recebidoPorProduto.get(pi.produtoId) ?? new Prisma.Decimal(0);
    return new Prisma.Decimal(recebido).gte(pi._sum.quantidade);
  });

  return prisma.pedidoCompra.update({
    where: { id },
    data: { status: totalmenteRecebido ? "RECEBIDO" : "RECEBIDO_PARCIAL" },
    select: SELECT_DETAIL,
  });
}

// Clona cabeçalho + itens como um pedido novo em ABERTO. Não copia loteId
// dos itens — lote é físico, amarrado ao recebimento original, não faz
// sentido herdar num pedido que ainda nem foi comprado de novo.
export async function duplicar({ empresaId, id }) {
  const pedido = await getPedidoOrThrow({
    empresaId,
    id,
    select: {
      fornecedorId: true,
      compradorId: true,
      condicaoPagamentoId: true,
      itens: { select: { produtoId: true, quantidade: true, precoUnitario: true } },
    },
  });

  return prisma.pedidoCompra.create({
    data: {
      empresaId,
      fornecedorId: pedido.fornecedorId,
      compradorId: pedido.compradorId,
      condicaoPagamentoId: pedido.condicaoPagamentoId,
      itens: {
        create: pedido.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
        })),
      },
    },
    select: SELECT_DETAIL,
  });
}

// Estorna (cancela) vários pedidos de uma vez — mesma regra de transição de
// updateStatus, só que aplicada a uma lista. Pedidos que já não podem ir pra
// CANCELADO (RECEBIDO ou já CANCELADO) entram no relatório como "ignorado",
// a chamada não falha por causa de um pedido fora de posição.
export async function estornarLote({ empresaId, pedidoIds }) {
  const pedidos = await prisma.pedidoCompra.findMany({
    where: { id: { in: pedidoIds }, empresaId },
    select: { id: true, status: true },
  });

  const encontrados = new Set(pedidos.map((p) => p.id));
  const resultado = { cancelados: [], ignorados: [] };

  for (const pedidoId of pedidoIds) {
    if (!encontrados.has(pedidoId)) {
      resultado.ignorados.push({ id: pedidoId, motivo: "NOT_FOUND" });
      continue;
    }
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!ALLOWED_TRANSITIONS[pedido.status].includes("CANCELADO")) {
      resultado.ignorados.push({ id: pedidoId, motivo: `Não é possível estornar um pedido ${pedido.status}.` });
      continue;
    }
    resultado.cancelados.push(pedidoId);
  }

  if (resultado.cancelados.length) {
    await prisma.pedidoCompra.updateMany({
      where: { id: { in: resultado.cancelados } },
      data: { status: "CANCELADO" },
    });
  }

  return resultado;
}

// "Consulta de Itens" do balcão de compras: visão por item entre pedidos,
// não por pedido — útil pra achar rápido "quanto compramos desse produto
// nesse período", sem abrir pedido por pedido.
export async function listarItens({ empresaId, skip, take, produtoId, dataInicial, dataFinal }) {
  const where = {
    pedidoCompra: {
      empresaId,
      ...(dataInicial || dataFinal
        ? { dataEmissao: { ...(dataInicial ? { gte: dataInicial } : {}), ...(dataFinal ? { lte: dataFinal } : {}) } }
        : {}),
    },
    ...(produtoId ? { produtoId } : {}),
  };
  const select = {
    id: true,
    produtoId: true,
    quantidade: true,
    precoUnitario: true,
    produto: { select: { codigo: true, descricao: true } },
    pedidoCompra: {
      select: {
        id: true,
        dataEmissao: true,
        status: true,
        fornecedor: { select: { participante: { select: { razaoSocial: true } } } },
      },
    },
  };
  const [items, total] = await Promise.all([
    prisma.itemPedidoCompra.findMany({
      where,
      select,
      skip,
      take,
      orderBy: { pedidoCompra: { dataEmissao: "desc" } },
    }),
    prisma.itemPedidoCompra.count({ where }),
  ]);
  return { items, total };
}

// "Favoritos" no balcão: em vez de guardar uma lista fixa, calcula os
// produtos mais comprados desse fornecedor no histórico — sempre reflete o
// que de fato costuma ser pedido, sem precisar de tela própria de cadastro.
export async function favoritos({ empresaId, fornecedorId, limite = 10 }) {
  const agrupado = await prisma.itemPedidoCompra.groupBy({
    by: ["produtoId"],
    where: { pedidoCompra: { empresaId, fornecedorId } },
    _count: { produtoId: true },
    _max: { precoUnitario: true },
    orderBy: { _count: { produtoId: "desc" } },
    take: limite,
  });
  if (!agrupado.length) return [];

  const produtos = await prisma.produto.findMany({
    where: { id: { in: agrupado.map((item) => item.produtoId) } },
    select: { id: true, codigo: true, descricao: true },
  });
  const produtoPorId = new Map(produtos.map((produto) => [produto.id, produto]));

  return agrupado.map((item) => ({
    produtoId: item.produtoId,
    produto: produtoPorId.get(item.produtoId),
    vezesComprado: item._count.produtoId,
    ultimoPreco: item._max.precoUnitario,
  }));
}

// Copia os itens de outro pedido (de qualquer fornecedor/data) pro pedido
// atual — atalho de balcão pra repetir uma compra parecida sem digitar tudo
// de novo. Só funciona com o pedido de destino ainda ABERTO.
export async function importarItens({ empresaId, id, pedidoOrigemId }) {
  const pedido = await getPedidoOrThrow({ empresaId, id, select: { id: true, status: true } });
  if (pedido.status !== "ABERTO") {
    throw new AppError(409, "PEDIDO_NAO_EDITAVEL", "Só é possível importar itens pra um pedido em aberto.");
  }

  const origem = await getPedidoOrThrow({
    empresaId,
    id: pedidoOrigemId,
    select: { itens: { select: { produtoId: true, quantidade: true, precoUnitario: true } } },
  });
  if (!origem.itens.length) {
    throw new AppError(422, "PEDIDO_SEM_ITENS", "O pedido de origem não tem itens pra importar.");
  }

  await prisma.itemPedidoCompra.createMany({
    data: origem.itens.map((item) => ({
      pedidoCompraId: id,
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
    })),
  });

  return getPedidoOrThrow({ empresaId, id });
}

// "Aplicar valor total de frete": define o frete do pedido inteiro de uma
// vez (usado depois pelo Controle de Frete/Descarga pra faturar a
// transportadora). Exige transportadora já selecionada no pedido.
export async function aplicarFrete({ empresaId, id, transportadoraId, valorFrete }) {
  const pedido = await getPedidoOrThrow({ empresaId, id, select: { id: true } });

  if (transportadoraId) {
    const transportadora = await prisma.transportadora.findFirst({
      where: { id: transportadoraId, empresaId },
      select: { id: true },
    });
    if (!transportadora) throw new AppError(422, "INVALID_REFERENCE", "Transportadora informada não existe.");
  }

  return prisma.pedidoCompra.update({
    where: { id: pedido.id },
    data: { valorFrete, ...(transportadoraId ? { transportadoraId } : {}) },
    select: SELECT_DETAIL,
  });
}

// Arquivar é só visibilidade, funciona em qualquer status — ver comentário
// do campo arquivado no schema.prisma.
export async function arquivar({ empresaId, id, arquivado }) {
  await getPedidoOrThrow({ empresaId, id, select: { id: true } });
  return prisma.pedidoCompra.update({ where: { id }, data: { arquivado }, select: SELECT_DETAIL });
}

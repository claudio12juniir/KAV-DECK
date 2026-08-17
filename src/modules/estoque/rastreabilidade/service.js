import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

function filtroData({ dataInicial, dataFinal }) {
  if (!dataInicial && !dataFinal) return {};
  return {
    data: {
      ...(dataInicial ? { gte: dataInicial } : {}),
      ...(dataFinal ? { lte: dataFinal } : {}),
    },
  };
}

export async function entradas({ empresaId, skip, take, produtoId, dataInicial, dataFinal }) {
  const where = {
    empresaId,
    tipo: "ENTRADA",
    ...(produtoId ? { produtoId } : {}),
    ...filtroData({ dataInicial, dataFinal }),
  };
  const select = {
    id: true,
    produtoId: true,
    quantidade: true,
    data: true,
    produto: { select: { codigo: true, descricao: true } },
    lote: { select: { id: true, dataValidade: true, sif: true } },
    pedidoCompra: {
      select: { id: true, fornecedor: { select: { participante: { select: { razaoSocial: true } } } } },
    },
  };
  const [items, total] = await Promise.all([
    prisma.movimentoEstoque.findMany({ where, select, skip, take, orderBy: { data: "desc" } }),
    prisma.movimentoEstoque.count({ where }),
  ]);
  return { items, total };
}

export async function saidas({ empresaId, skip, take, produtoId, dataInicial, dataFinal }) {
  const where = {
    empresaId,
    tipo: "SAIDA",
    ...(produtoId ? { produtoId } : {}),
    ...filtroData({ dataInicial, dataFinal }),
  };
  const select = {
    id: true,
    produtoId: true,
    loteId: true,
    quantidade: true,
    data: true,
    produto: { select: { codigo: true, descricao: true } },
    pedidoVenda: {
      select: { id: true, cliente: { select: { participante: { select: { razaoSocial: true } } } } },
    },
  };
  const [items, total] = await Promise.all([
    prisma.movimentoEstoque.findMany({ where, select, skip, take, orderBy: { data: "desc" } }),
    prisma.movimentoEstoque.count({ where }),
  ]);
  return { items, total };
}

export async function lotes({ empresaId, skip, take, produtoId }) {
  const where = { empresaId, ...(produtoId ? { produtoId } : {}) };
  const select = {
    id: true,
    dataRecebimento: true,
    dataValidade: true,
    quantidadeInicial: true,
    quantidadeAtual: true,
    produto: { select: { codigo: true, descricao: true } },
    fornecedor: { select: { participante: { select: { razaoSocial: true } } } },
  };
  const [items, total] = await Promise.all([
    prisma.lote.findMany({ where, select, skip, take, orderBy: { dataRecebimento: "desc" } }),
    prisma.lote.count({ where }),
  ]);
  return { items, total };
}

// O núcleo da rastreabilidade: pega um lote específico e mostra toda a
// linha do tempo de movimentos dele — de onde entrou até todos os destinos
// pra onde saiu (venda, devolução, ajuste, perda).
export async function porLote({ empresaId, loteId }) {
  const lote = await prisma.lote.findFirst({
    where: { id: loteId, empresaId },
    select: {
      id: true,
      dataRecebimento: true,
      dataValidade: true,
      sif: true,
      temperaturaRecebimento: true,
      veiculo: true,
      quantidadeInicial: true,
      quantidadeAtual: true,
      produto: { select: { codigo: true, descricao: true } },
      fornecedor: { select: { participante: { select: { razaoSocial: true } } } },
    },
  });
  if (!lote) throw new AppError(404, "NOT_FOUND", "Lote não encontrado.");

  const movimentos = await prisma.movimentoEstoque.findMany({
    where: { loteId },
    select: {
      id: true,
      tipo: true,
      quantidade: true,
      data: true,
      motivo: true,
      pedidoCompra: { select: { id: true, fornecedor: { select: { participante: { select: { razaoSocial: true } } } } } },
      pedidoVenda: { select: { id: true, cliente: { select: { participante: { select: { razaoSocial: true } } } } } },
    },
    orderBy: { data: "asc" },
  });

  return { lote, movimentos };
}

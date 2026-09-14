import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  pedidoVendaId: true,
  clienteId: true,
  tipo: true,
  motivo: true,
  resolucao: true,
  data: true,
  cliente: { select: { participante: { select: { razaoSocial: true } } } },
  itens: {
    select: {
      id: true,
      produtoId: true,
      quantidade: true,
      valor: true,
      produto: { select: { codigo: true, descricao: true } },
    },
  },
};

async function ensureReferencias({ empresaId, pedidoVendaId, clienteId, produtoIds = [] }) {
  const checks = [];
  if (pedidoVendaId) {
    checks.push(
      prisma.pedidoVenda.findFirst({ where: { id: pedidoVendaId, empresaId }, select: { id: true } }).then((r) => {
        if (!r) throw new AppError(422, "INVALID_REFERENCE", "Pedido de venda informado não existe.");
      }),
    );
  }
  if (clienteId) {
    checks.push(
      prisma.cliente
        .findFirst({ where: { participanteId: clienteId, participante: { empresaId } }, select: { participanteId: true } })
        .then((r) => {
          if (!r) throw new AppError(422, "INVALID_REFERENCE", "Cliente informado não existe.");
        }),
    );
  }
  if (produtoIds.length) {
    checks.push(
      prisma.produto.findMany({ where: { id: { in: produtoIds }, empresaId }, select: { id: true } }).then((produtos) => {
        if (produtos.length !== new Set(produtoIds).size) {
          throw new AppError(422, "INVALID_REFERENCE", "Um ou mais produtos informados na ocorrência não existem.");
        }
      }),
    );
  }
  await Promise.all(checks);
}

export async function list({ empresaId, skip, take, pedidoVendaId, clienteId, dataInicial, dataFinal }) {
  const where = {
    empresaId,
    ...(pedidoVendaId ? { pedidoVendaId } : {}),
    ...(clienteId ? { clienteId } : {}),
    ...(dataInicial || dataFinal
      ? { data: { ...(dataInicial ? { gte: dataInicial } : {}), ...(dataFinal ? { lte: dataFinal } : {}) } }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.ocorrencia.findMany({ where, select: SELECT, skip, take, orderBy: { data: "desc" } }),
    prisma.ocorrencia.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const ocorrencia = await prisma.ocorrencia.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!ocorrencia) throw new AppError(404, "NOT_FOUND", "Ocorrência não encontrada.");
  return ocorrencia;
}

export async function create({ empresaId, data }) {
  const { itens = [], ...rest } = data;
  await ensureReferencias({
    empresaId,
    pedidoVendaId: rest.pedidoVendaId,
    clienteId: rest.clienteId,
    produtoIds: itens.map((item) => item.produtoId),
  });

  return prisma.ocorrencia.create({
    data: { ...rest, empresaId, itens: itens.length ? { create: itens } : undefined },
    select: SELECT,
  });
}

// Alimenta o combobox "creatable" de Tipo/Resolução no frontend (seção 13 e
// 17.12 do mapeamento) — não existe cadastro à parte pra essas duas colunas
// (são texto livre no schema), então a lista de sugestão é só os valores já
// usados por esta empresa, mais recentes primeiro.
export async function listarOpcoes({ empresaId }) {
  const [tipos, resolucoes] = await Promise.all([
    prisma.ocorrencia.findMany({
      where: { empresaId },
      distinct: ["tipo"],
      select: { tipo: true },
      orderBy: { data: "desc" },
      take: 50,
    }),
    prisma.ocorrencia.findMany({
      where: { empresaId, resolucao: { not: null } },
      distinct: ["resolucao"],
      select: { resolucao: true },
      orderBy: { data: "desc" },
      take: 50,
    }),
  ]);
  return {
    tipos: tipos.map((t) => t.tipo),
    resolucoes: resolucoes.map((r) => r.resolucao),
  };
}

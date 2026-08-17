import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  pedidoVendaId: true,
  clienteId: true,
  tipo: true,
  motivo: true,
  data: true,
  cliente: { select: { participante: { select: { razaoSocial: true } } } },
};

async function ensureReferencias({ empresaId, pedidoVendaId, clienteId }) {
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
  await ensureReferencias({ empresaId, pedidoVendaId: data.pedidoVendaId, clienteId: data.clienteId });
  return prisma.ocorrencia.create({ data: { ...data, empresaId }, select: SELECT });
}

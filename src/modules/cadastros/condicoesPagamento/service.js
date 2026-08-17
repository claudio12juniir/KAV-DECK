import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  descricao: true,
  numeroParcelas: true,
  intervaloDias: true,
  criadoEm: true,
  atualizadoEm: true,
};

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.condicaoPagamento.findMany({
      where: { empresaId },
      select: SELECT,
      skip,
      take,
      orderBy: { descricao: "asc" },
    }),
    prisma.condicaoPagamento.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const condicao = await prisma.condicaoPagamento.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!condicao) throw new AppError(404, "NOT_FOUND", "Condição de pagamento não encontrada.");
  return condicao;
}

export async function create({ empresaId, data }) {
  return prisma.condicaoPagamento.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  return prisma.condicaoPagamento.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.condicaoPagamento.delete({ where: { id } });
}

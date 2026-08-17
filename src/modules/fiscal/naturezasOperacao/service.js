import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = { id: true, descricao: true, cfopPadraoId: true };

async function ensureCfop({ cfopPadraoId }) {
  const cfop = await prisma.cfop.findUnique({ where: { id: cfopPadraoId }, select: { id: true } });
  if (!cfop) throw new AppError(422, "INVALID_REFERENCE", "CFOP padrão informado não existe.");
}

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.naturezaOperacao.findMany({
      where: { empresaId },
      select: SELECT,
      skip,
      take,
      orderBy: { descricao: "asc" },
    }),
    prisma.naturezaOperacao.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const natureza = await prisma.naturezaOperacao.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!natureza) throw new AppError(404, "NOT_FOUND", "Natureza de operação não encontrada.");
  return natureza;
}

export async function create({ empresaId, data }) {
  await ensureCfop({ cfopPadraoId: data.cfopPadraoId });
  return prisma.naturezaOperacao.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  if (data.cfopPadraoId) await ensureCfop({ cfopPadraoId: data.cfopPadraoId });
  return prisma.naturezaOperacao.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.naturezaOperacao.delete({ where: { id } });
}

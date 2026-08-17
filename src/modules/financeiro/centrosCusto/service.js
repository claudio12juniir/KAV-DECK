import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = { id: true, codigo: true, nome: true };

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.centroCusto.findMany({ where: { empresaId }, select: SELECT, skip, take, orderBy: { codigo: "asc" } }),
    prisma.centroCusto.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const centro = await prisma.centroCusto.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!centro) throw new AppError(404, "NOT_FOUND", "Centro de custo não encontrado.");
  return centro;
}

export async function create({ empresaId, data }) {
  return prisma.centroCusto.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  return prisma.centroCusto.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.centroCusto.delete({ where: { id } });
}

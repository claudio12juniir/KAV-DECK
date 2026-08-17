import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = { id: true, banco: true, agencia: true, conta: true, criadoEm: true };

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.contaBancaria.findMany({ where: { empresaId }, select: SELECT, skip, take, orderBy: { banco: "asc" } }),
    prisma.contaBancaria.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const conta = await prisma.contaBancaria.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!conta) throw new AppError(404, "NOT_FOUND", "Conta bancária não encontrada.");
  return conta;
}

export async function create({ empresaId, data }) {
  return prisma.contaBancaria.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  return prisma.contaBancaria.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.contaBancaria.delete({ where: { id } });
}

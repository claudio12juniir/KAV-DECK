import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = { id: true, codigo: true, nome: true, tipo: true, contaPaiId: true };

async function ensureContaPai({ empresaId, id, contaPaiId }) {
  if (!contaPaiId) return;
  if (contaPaiId === id) {
    throw new AppError(422, "INVALID_REFERENCE", "Uma conta não pode ser pai dela mesma.");
  }
  const contaPai = await prisma.planoContas.findFirst({ where: { id: contaPaiId, empresaId }, select: { id: true } });
  if (!contaPai) throw new AppError(422, "INVALID_REFERENCE", "Conta pai informada não existe.");
}

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.planoContas.findMany({ where: { empresaId }, select: SELECT, skip, take, orderBy: { codigo: "asc" } }),
    prisma.planoContas.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const conta = await prisma.planoContas.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!conta) throw new AppError(404, "NOT_FOUND", "Conta do plano de contas não encontrada.");
  return conta;
}

export async function create({ empresaId, data }) {
  await ensureContaPai({ empresaId, id: undefined, contaPaiId: data.contaPaiId });
  return prisma.planoContas.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  await ensureContaPai({ empresaId, id, contaPaiId: data.contaPaiId });
  return prisma.planoContas.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.planoContas.delete({ where: { id } });
}

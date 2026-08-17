import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = { id: true, codigo: true, nome: true, criadoEm: true, atualizadoEm: true };

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.departamento.findMany({ where: { empresaId }, select: SELECT, skip, take, orderBy: { nome: "asc" } }),
    prisma.departamento.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const departamento = await prisma.departamento.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!departamento) throw new AppError(404, "NOT_FOUND", "Departamento não encontrado.");
  return departamento;
}

export async function create({ empresaId, data }) {
  return prisma.departamento.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  return prisma.departamento.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.departamento.delete({ where: { id } });
}

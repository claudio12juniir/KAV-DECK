import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = { id: true, nome: true, criadoEm: true, atualizadoEm: true };

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.grupoEmpresas.findMany({ where: { empresaId }, select: SELECT, skip, take, orderBy: { nome: "asc" } }),
    prisma.grupoEmpresas.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const grupo = await prisma.grupoEmpresas.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!grupo) throw new AppError(404, "NOT_FOUND", "Grupo de empresas não encontrado.");
  return grupo;
}

export async function create({ empresaId, data }) {
  return prisma.grupoEmpresas.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  return prisma.grupoEmpresas.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.grupoEmpresas.delete({ where: { id } });
}

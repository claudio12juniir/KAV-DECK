import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  sigla: true,
  descricao: true,
  fatorConversao: true,
  criadoEm: true,
  atualizadoEm: true,
};

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.unidadeMedida.findMany({ where: { empresaId }, select: SELECT, skip, take, orderBy: { sigla: "asc" } }),
    prisma.unidadeMedida.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const unidade = await prisma.unidadeMedida.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!unidade) throw new AppError(404, "NOT_FOUND", "Unidade de medida não encontrada.");
  return unidade;
}

export async function create({ empresaId, data }) {
  return prisma.unidadeMedida.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  return prisma.unidadeMedida.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.unidadeMedida.delete({ where: { id } });
}

import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  nome: true,
  tipo: true,
  ativo: true,
  valorSalario: true,
  valorValeAlimentacao: true,
  valorValeTransporte: true,
  valorInss: true,
  valorOutrosEncargos: true,
  criadoEm: true,
  atualizadoEm: true,
};

export async function list({ empresaId, skip, take, tipo }) {
  const where = { empresaId, ...(tipo ? { tipo } : {}) };
  const [items, total] = await Promise.all([
    prisma.colaborador.findMany({ where, select: SELECT, skip, take, orderBy: { nome: "asc" } }),
    prisma.colaborador.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const colaborador = await prisma.colaborador.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!colaborador) throw new AppError(404, "NOT_FOUND", "Colaborador não encontrado.");
  return colaborador;
}

export async function create({ empresaId, data }) {
  return prisma.colaborador.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  return prisma.colaborador.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.colaborador.delete({ where: { id } });
}

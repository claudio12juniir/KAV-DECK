import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  codigo: true,
  nome: true,
  departamentoId: true,
  criadoEm: true,
  atualizadoEm: true,
};

async function ensureDepartamento({ empresaId, departamentoId }) {
  const departamento = await prisma.departamento.findFirst({
    where: { id: departamentoId, empresaId },
    select: { id: true },
  });
  if (!departamento) throw new AppError(422, "INVALID_REFERENCE", "Departamento informado não existe.");
}

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.categoria.findMany({ where: { empresaId }, select: SELECT, skip, take, orderBy: { nome: "asc" } }),
    prisma.categoria.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const categoria = await prisma.categoria.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!categoria) throw new AppError(404, "NOT_FOUND", "Categoria não encontrada.");
  return categoria;
}

export async function create({ empresaId, data }) {
  await ensureDepartamento({ empresaId, departamentoId: data.departamentoId });
  return prisma.categoria.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  if (data.departamentoId) {
    await ensureDepartamento({ empresaId, departamentoId: data.departamentoId });
  }
  return prisma.categoria.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.categoria.delete({ where: { id } });
}

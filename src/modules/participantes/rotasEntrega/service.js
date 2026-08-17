import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = { id: true, nome: true, transportadoraId: true, criadoEm: true, atualizadoEm: true };

async function ensureTransportadora({ empresaId, transportadoraId }) {
  if (!transportadoraId) return;
  const transportadora = await prisma.transportadora.findFirst({
    where: { id: transportadoraId, empresaId },
    select: { id: true },
  });
  if (!transportadora) throw new AppError(422, "INVALID_REFERENCE", "Transportadora informada não existe.");
}

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.rotaEntrega.findMany({ where: { empresaId }, select: SELECT, skip, take, orderBy: { nome: "asc" } }),
    prisma.rotaEntrega.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const rota = await prisma.rotaEntrega.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!rota) throw new AppError(404, "NOT_FOUND", "Rota de entrega não encontrada.");
  return rota;
}

export async function create({ empresaId, data }) {
  await ensureTransportadora({ empresaId, transportadoraId: data.transportadoraId });
  return prisma.rotaEntrega.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  await ensureTransportadora({ empresaId, transportadoraId: data.transportadoraId });
  return prisma.rotaEntrega.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.rotaEntrega.delete({ where: { id } });
}

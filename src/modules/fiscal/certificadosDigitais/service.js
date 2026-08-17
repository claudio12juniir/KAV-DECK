import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = { id: true, nome: true, dataVencimento: true };

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.certificadoDigital.findMany({
      where: { empresaId },
      select: SELECT,
      skip,
      take,
      orderBy: { dataVencimento: "asc" },
    }),
    prisma.certificadoDigital.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const certificado = await prisma.certificadoDigital.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!certificado) throw new AppError(404, "NOT_FOUND", "Certificado digital não encontrado.");
  return certificado;
}

export async function create({ empresaId, data }) {
  return prisma.certificadoDigital.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  return prisma.certificadoDigital.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.certificadoDigital.delete({ where: { id } });
}

import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = { id: true, codigo: true, descricao: true };

export async function list({ skip, take }) {
  const [items, total] = await Promise.all([
    prisma.cfop.findMany({ select: SELECT, skip, take, orderBy: { codigo: "asc" } }),
    prisma.cfop.count(),
  ]);
  return { items, total };
}

export async function getById({ id }) {
  const cfop = await prisma.cfop.findUnique({ where: { id }, select: SELECT });
  if (!cfop) throw new AppError(404, "NOT_FOUND", "CFOP não encontrado.");
  return cfop;
}

import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  participanteId: true,
  criadoEm: true,
  participante: { select: { razaoSocial: true, cpfCnpj: true, isProdutorRural: true, ativo: true } },
};

export async function getFornecedorTenant({ empresaId, participanteId }) {
  const fornecedor = await prisma.fornecedor.findFirst({
    where: { participanteId, participante: { empresaId } },
    select: SELECT,
  });
  if (!fornecedor) throw new AppError(404, "NOT_FOUND", "Fornecedor não encontrado.");
  return fornecedor;
}

export async function list({ empresaId, skip, take, q }) {
  const where = {
    participante: {
      empresaId,
      ...(q
        ? {
            OR: [
              { razaoSocial: { contains: q, mode: "insensitive" } },
              { nomeFantasia: { contains: q, mode: "insensitive" } },
              { cpfCnpj: { contains: q } },
            ],
          }
        : {}),
    },
  };
  const [items, total] = await Promise.all([
    prisma.fornecedor.findMany({
      where,
      select: SELECT,
      skip,
      take,
      orderBy: { participante: { razaoSocial: "asc" } },
    }),
    prisma.fornecedor.count({ where }),
  ]);
  return { items, total };
}

import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  produtoId: true,
  fornecedorId: true,
  dataRecebimento: true,
  dataValidade: true,
  sif: true,
  temperaturaRecebimento: true,
  veiculo: true,
  quantidadeInicial: true,
  quantidadeAtual: true,
  criadoEm: true,
  atualizadoEm: true,
  produto: { select: { codigo: true, descricao: true } },
};

export async function list({ empresaId, skip, take, produtoId, dataValidadeAte }) {
  const where = {
    empresaId,
    ...(produtoId ? { produtoId } : {}),
    ...(dataValidadeAte ? { dataValidade: { lte: dataValidadeAte } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.lote.findMany({ where, select: SELECT, skip, take, orderBy: { dataValidade: "asc" } }),
    prisma.lote.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const lote = await prisma.lote.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!lote) throw new AppError(404, "NOT_FOUND", "Lote não encontrado.");
  return lote;
}

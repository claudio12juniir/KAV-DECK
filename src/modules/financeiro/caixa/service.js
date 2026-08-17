import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  contaBancariaId: true,
  tipo: true,
  valor: true,
  descricao: true,
  data: true,
};

async function ensureContaBancaria({ empresaId, contaBancariaId }) {
  if (!contaBancariaId) return;
  const conta = await prisma.contaBancaria.findFirst({ where: { id: contaBancariaId, empresaId }, select: { id: true } });
  if (!conta) throw new AppError(422, "INVALID_REFERENCE", "Conta bancária informada não existe.");
}

export async function list({ empresaId, skip, take, contaBancariaId, dataInicio, dataFim }) {
  const where = {
    empresaId,
    ...(contaBancariaId ? { contaBancariaId } : {}),
    ...(dataInicio || dataFim
      ? { data: { ...(dataInicio ? { gte: dataInicio } : {}), ...(dataFim ? { lte: dataFim } : {}) } }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.movimentoCaixa.findMany({ where, select: SELECT, skip, take, orderBy: { data: "desc" } }),
    prisma.movimentoCaixa.count({ where }),
  ]);
  return { items, total };
}

export async function create({ empresaId, data }) {
  await ensureContaBancaria({ empresaId, contaBancariaId: data.contaBancariaId });
  return prisma.movimentoCaixa.create({ data: { ...data, empresaId }, select: SELECT });
}

import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  produtoId: true,
  cfopId: true,
  icmsId: true,
  ipiId: true,
  pisId: true,
  cofinsId: true,
  produto: { select: { codigo: true, descricao: true } },
  cfop: { select: { codigo: true, descricao: true } },
  icms: { select: { descricao: true, aliquota: true } },
  ipi: { select: { descricao: true, aliquota: true } },
  pis: { select: { descricao: true, aliquota: true } },
  cofins: { select: { descricao: true, aliquota: true } },
};

// Confere que cada regra informada (se houver) é da própria empresa —
// mesmo cuidado que ensureItensReferences faz em fiscal/notasFiscais, pra
// não deixar uma empresa referenciar a RegraIcms de outro tenant.
async function ensureReferences({ empresaId, produtoId, cfopId, icmsId, ipiId, pisId, cofinsId }) {
  const checks = [
    prisma.produto.findFirst({ where: { id: produtoId, empresaId }, select: { id: true } }).then((r) => {
      if (!r) throw new AppError(422, "INVALID_REFERENCE", "Produto informado não existe.");
    }),
    prisma.cfop.findFirst({ where: { id: cfopId }, select: { id: true } }).then((r) => {
      if (!r) throw new AppError(422, "INVALID_REFERENCE", "CFOP informado não existe.");
    }),
  ];
  if (icmsId) {
    checks.push(
      prisma.regraIcms.findFirst({ where: { id: icmsId, empresaId }, select: { id: true } }).then((r) => {
        if (!r) throw new AppError(422, "INVALID_REFERENCE", "Regra de ICMS informada não existe.");
      }),
    );
  }
  if (ipiId) {
    checks.push(
      prisma.regraIpi.findFirst({ where: { id: ipiId, empresaId }, select: { id: true } }).then((r) => {
        if (!r) throw new AppError(422, "INVALID_REFERENCE", "Regra de IPI informada não existe.");
      }),
    );
  }
  if (pisId) {
    checks.push(
      prisma.regraPis.findFirst({ where: { id: pisId, empresaId }, select: { id: true } }).then((r) => {
        if (!r) throw new AppError(422, "INVALID_REFERENCE", "Regra de PIS informada não existe.");
      }),
    );
  }
  if (cofinsId) {
    checks.push(
      prisma.regraCofins.findFirst({ where: { id: cofinsId, empresaId }, select: { id: true } }).then((r) => {
        if (!r) throw new AppError(422, "INVALID_REFERENCE", "Regra de COFINS informada não existe.");
      }),
    );
  }
  await Promise.all(checks);
}

export async function list({ empresaId, produtoId }) {
  const where = { empresaId, ...(produtoId ? { produtoId } : {}) };
  return prisma.tributacaoProdutoCfop.findMany({ where, select: SELECT, orderBy: { cfop: { codigo: "asc" } } });
}

async function getOrThrow({ empresaId, id }) {
  const item = await prisma.tributacaoProdutoCfop.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!item) throw new AppError(404, "NOT_FOUND", "Tributação de produto não encontrada.");
  return item;
}

export async function create({ empresaId, data }) {
  await ensureReferences({ empresaId, ...data });
  try {
    return await prisma.tributacaoProdutoCfop.create({ data: { ...data, empresaId }, select: SELECT });
  } catch (err) {
    if (err.code === "P2002") {
      throw new AppError(409, "CONFLICT", "Este produto já tem uma tributação cadastrada para esse CFOP.");
    }
    throw err;
  }
}

export async function update({ empresaId, id, data }) {
  const existente = await getOrThrow({ empresaId, id });
  await ensureReferences({ empresaId, produtoId: existente.produtoId, cfopId: existente.cfopId, ...data });
  return prisma.tributacaoProdutoCfop.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getOrThrow({ empresaId, id });
  await prisma.tributacaoProdutoCfop.delete({ where: { id } });
}

import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  fornecedorId: true,
  produtoId: true,
  preco: true,
  vigenciaEm: true,
  fornecedor: { select: { participante: { select: { razaoSocial: true } } } },
  produto: { select: { codigo: true, descricao: true } },
};

async function ensureFornecedor({ empresaId, fornecedorId }) {
  const fornecedor = await prisma.fornecedor.findFirst({
    where: { participanteId: fornecedorId, participante: { empresaId } },
    select: { participanteId: true },
  });
  if (!fornecedor) throw new AppError(422, "INVALID_REFERENCE", "Fornecedor informado não existe.");
}

async function ensureProduto({ empresaId, produtoId }) {
  const produto = await prisma.produto.findFirst({ where: { id: produtoId, empresaId }, select: { id: true } });
  if (!produto) throw new AppError(422, "INVALID_REFERENCE", "Produto informado não existe.");
}

export async function list({ empresaId, skip, take, fornecedorId, produtoId }) {
  const where = {
    empresaId,
    ...(fornecedorId ? { fornecedorId } : {}),
    ...(produtoId ? { produtoId } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.precoCompra.findMany({ where, select: SELECT, skip, take, orderBy: { atualizadoEm: "desc" } }),
    prisma.precoCompra.count({ where }),
  ]);
  return { items, total };
}

// upsert: "Terminal de Preços" é sempre o valor vigente por fornecedor+produto,
// não um histórico — lançar de novo simplesmente atualiza o preço e a data
// de vigência.
export async function upsert({ empresaId, fornecedorId, produtoId, preco }) {
  await Promise.all([
    ensureFornecedor({ empresaId, fornecedorId }),
    ensureProduto({ empresaId, produtoId }),
  ]);
  return prisma.precoCompra.upsert({
    where: { fornecedorId_produtoId: { fornecedorId, produtoId } },
    update: { preco, vigenciaEm: new Date() },
    create: { empresaId, fornecedorId, produtoId, preco },
    select: SELECT,
  });
}

export async function remove({ empresaId, id }) {
  const preco = await prisma.precoCompra.findFirst({ where: { id, empresaId }, select: { id: true } });
  if (!preco) throw new AppError(404, "NOT_FOUND", "Preço de compra não encontrado.");
  await prisma.precoCompra.delete({ where: { id } });
}

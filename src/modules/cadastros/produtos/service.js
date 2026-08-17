import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  codigo: true,
  descricao: true,
  unidadeMedidaId: true,
  categoriaId: true,
  ncm: true,
  cstCfopPadrao: true,
  estoqueMinimo: true,
  estoqueMaximo: true,
  perecivel: true,
  controlaLote: true,
  precoReferencia: true,
  ativo: true,
  criadoEm: true,
  atualizadoEm: true,
};

async function ensureReferences({ empresaId, unidadeMedidaId, categoriaId }) {
  const checks = [];
  if (unidadeMedidaId) {
    checks.push(
      prisma.unidadeMedida
        .findFirst({ where: { id: unidadeMedidaId, empresaId }, select: { id: true } })
        .then((r) => {
          if (!r) throw new AppError(422, "INVALID_REFERENCE", "Unidade de medida informada não existe.");
        }),
    );
  }
  if (categoriaId) {
    checks.push(
      prisma.categoria
        .findFirst({ where: { id: categoriaId, empresaId }, select: { id: true } })
        .then((r) => {
          if (!r) throw new AppError(422, "INVALID_REFERENCE", "Categoria informada não existe.");
        }),
    );
  }
  await Promise.all(checks);
}

export async function list({ empresaId, skip, take, ativo, q }) {
  const where = {
    empresaId,
    ...(ativo !== undefined ? { ativo } : {}),
    ...(q
      ? {
          OR: [{ codigo: { contains: q, mode: "insensitive" } }, { descricao: { contains: q, mode: "insensitive" } }],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.produto.findMany({ where, select: SELECT, skip, take, orderBy: { descricao: "asc" } }),
    prisma.produto.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const produto = await prisma.produto.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!produto) throw new AppError(404, "NOT_FOUND", "Produto não encontrado.");
  return produto;
}

export async function create({ empresaId, data }) {
  await ensureReferences({ empresaId, unidadeMedidaId: data.unidadeMedidaId, categoriaId: data.categoriaId });
  return prisma.produto.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  await ensureReferences({ empresaId, unidadeMedidaId: data.unidadeMedidaId, categoriaId: data.categoriaId });
  return prisma.produto.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.produto.delete({ where: { id } });
}

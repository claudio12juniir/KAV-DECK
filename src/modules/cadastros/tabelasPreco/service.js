import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  nome: true,
  vigenciaInicio: true,
  vigenciaFim: true,
  ativa: true,
  criadoEm: true,
  atualizadoEm: true,
};

const SELECT_WITH_ITENS = {
  ...SELECT,
  itens: {
    select: {
      id: true,
      produtoId: true,
      preco: true,
      produto: { select: { codigo: true, descricao: true } },
    },
  },
};

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.tabelaPreco.findMany({ where: { empresaId }, select: SELECT, skip, take, orderBy: { nome: "asc" } }),
    prisma.tabelaPreco.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const tabela = await prisma.tabelaPreco.findFirst({ where: { id, empresaId }, select: SELECT_WITH_ITENS });
  if (!tabela) throw new AppError(404, "NOT_FOUND", "Tabela de preço não encontrada.");
  return tabela;
}

async function ensureOwnership({ empresaId, id }) {
  const tabela = await prisma.tabelaPreco.findFirst({ where: { id, empresaId }, select: { id: true } });
  if (!tabela) throw new AppError(404, "NOT_FOUND", "Tabela de preço não encontrada.");
}

export async function create({ empresaId, data }) {
  return prisma.tabelaPreco.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await ensureOwnership({ empresaId, id });
  return prisma.tabelaPreco.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await ensureOwnership({ empresaId, id });
  await prisma.tabelaPreco.delete({ where: { id } });
}

export async function upsertItem({ empresaId, tabelaPrecoId, produtoId, preco }) {
  await ensureOwnership({ empresaId, id: tabelaPrecoId });
  const produto = await prisma.produto.findFirst({ where: { id: produtoId, empresaId }, select: { id: true } });
  if (!produto) throw new AppError(422, "INVALID_REFERENCE", "Produto informado não existe.");

  return prisma.itemTabelaPreco.upsert({
    where: { tabelaPrecoId_produtoId: { tabelaPrecoId, produtoId } },
    update: { preco },
    create: { tabelaPrecoId, produtoId, preco },
    select: { id: true, produtoId: true, preco: true },
  });
}

export async function removeItem({ empresaId, tabelaPrecoId, produtoId }) {
  await ensureOwnership({ empresaId, id: tabelaPrecoId });
  await prisma.itemTabelaPreco.delete({
    where: { tabelaPrecoId_produtoId: { tabelaPrecoId, produtoId } },
  });
}

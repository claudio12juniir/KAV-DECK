import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  quantidade: true,
  precoUnitario: true,
  desconto: true,
  observacao: true,
  impresso: true,
  produto: {
    select: {
      id: true,
      codigo: true,
      descricao: true,
      unidadeMedida: { select: { sigla: true } },
    },
  },
  pedidoVenda: {
    select: {
      id: true,
      dataEmissao: true,
      turno: true,
      status: true,
      cliente: { select: { participante: { select: { razaoSocial: true } } } },
    },
  },
};

function inicioDoDia(data) {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

// Base de filtro compartilhada pelas 4 telas do mapeamento SpaceSoft que são
// literalmente a mesma tabela de itens de venda vista por ângulos diferentes
// (seção 15): Consulta de Itens (sem filtro extra), Controle de Produção
// (filtro `data` de um dia só), Listagem para Compra (filtro `impresso`) e
// Terminal de Preços (filtro `valorZero`, ligado por padrão no frontend).
function buildWhere({
  empresaId,
  dataInicial,
  dataFinal,
  data,
  clienteTexto,
  produtoTexto,
  categoriaId,
  departamentoId,
  periodo,
  impresso,
  valorZero,
}) {
  const produtoWhere = {};
  if (produtoTexto) produtoWhere.descricao = { contains: produtoTexto, mode: "insensitive" };
  if (categoriaId) produtoWhere.categoriaId = categoriaId;
  if (departamentoId) produtoWhere.departamentoId = departamentoId;

  const pedidoWhere = {
    empresaId,
    arquivado: false,
    status: { not: "CANCELADO" },
  };
  if (periodo) pedidoWhere.turno = periodo;
  if (data) {
    const inicio = inicioDoDia(data);
    pedidoWhere.dataEmissao = { gte: inicio, lt: new Date(inicio.getTime() + 24 * 60 * 60 * 1000) };
  } else if (dataInicial || dataFinal) {
    pedidoWhere.dataEmissao = {
      ...(dataInicial ? { gte: dataInicial } : {}),
      ...(dataFinal ? { lte: dataFinal } : {}),
    };
  }
  if (clienteTexto) {
    pedidoWhere.cliente = { participante: { razaoSocial: { contains: clienteTexto, mode: "insensitive" } } };
  }

  return {
    ...(Object.keys(produtoWhere).length ? { produto: produtoWhere } : {}),
    pedidoVenda: pedidoWhere,
    ...(impresso !== undefined ? { impresso } : {}),
    ...(valorZero ? { precoUnitario: 0 } : {}),
  };
}

export async function listar({ skip, take, ...filtros }) {
  const where = buildWhere(filtros);
  const [items, total] = await Promise.all([
    prisma.itemPedidoVenda.findMany({
      where,
      select: SELECT,
      skip,
      take,
      orderBy: { pedidoVenda: { dataEmissao: "desc" } },
    }),
    prisma.itemPedidoVenda.count({ where }),
  ]);
  return { items, total };
}

// "Exibir totais" (seção 10 do mapeamento): agrega por produto, some a
// quantidade total no período filtrado — troca instantânea entre auditoria
// transação-por-transação e "quanto vendemos de cada coisa".
export async function totais(filtros) {
  const where = buildWhere(filtros);
  const grupos = await prisma.itemPedidoVenda.groupBy({
    by: ["produtoId"],
    where,
    _sum: { quantidade: true },
    orderBy: { _sum: { quantidade: "desc" } },
  });

  const produtos = await prisma.produto.findMany({
    where: { id: { in: grupos.map((g) => g.produtoId) } },
    select: { id: true, codigo: true, descricao: true, unidadeMedida: { select: { sigla: true } } },
  });
  const produtoPorId = new Map(produtos.map((p) => [p.id, p]));

  return grupos.map((grupo) => ({
    produtoId: grupo.produtoId,
    quantidadeTotal: grupo._sum.quantidade,
    produto: produtoPorId.get(grupo.produtoId) ?? null,
  }));
}

export async function marcarImpresso({ empresaId, id, impresso }) {
  const item = await prisma.itemPedidoVenda.findFirst({
    where: { id, pedidoVenda: { empresaId } },
    select: { id: true },
  });
  if (!item) throw new AppError(404, "NOT_FOUND", "Item de pedido de venda não encontrado.");

  return prisma.itemPedidoVenda.update({
    where: { id },
    data: { impresso },
    select: { id: true, impresso: true },
  });
}

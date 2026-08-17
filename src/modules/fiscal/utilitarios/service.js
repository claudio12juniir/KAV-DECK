import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";

function filtroData({ dataInicial, dataFinal }) {
  if (!dataInicial && !dataFinal) return {};
  return {
    dataEmissao: {
      ...(dataInicial ? { gte: dataInicial } : {}),
      ...(dataFinal ? { lte: dataFinal } : {}),
    },
  };
}

export async function porCfop({ empresaId, dataInicial, dataFinal }) {
  const itens = await prisma.itemNotaFiscal.findMany({
    where: { notaFiscal: { empresaId, ...filtroData({ dataInicial, dataFinal }) } },
    select: { cfopId: true, quantidade: true, valorUnitario: true, cfop: { select: { codigo: true, descricao: true } } },
  });

  const porCfopMap = new Map();
  for (const item of itens) {
    const chave = item.cfopId;
    if (!porCfopMap.has(chave)) {
      porCfopMap.set(chave, { cfopId: chave, codigo: item.cfop.codigo, descricao: item.cfop.descricao, quantidade: new Prisma.Decimal(0), valorTotal: new Prisma.Decimal(0) });
    }
    const entrada = porCfopMap.get(chave);
    entrada.quantidade = entrada.quantidade.plus(item.quantidade);
    entrada.valorTotal = entrada.valorTotal.plus(new Prisma.Decimal(item.quantidade).times(item.valorUnitario));
  }

  return [...porCfopMap.values()].map((e) => ({ ...e, quantidade: e.quantidade.toFixed(4), valorTotal: e.valorTotal.toFixed(2) }));
}

export async function porCfopUf({ empresaId, dataInicial, dataFinal }) {
  const itens = await prisma.itemNotaFiscal.findMany({
    where: { notaFiscal: { empresaId, ...filtroData({ dataInicial, dataFinal }) } },
    select: {
      quantidade: true,
      valorUnitario: true,
      cfop: { select: { codigo: true } },
      notaFiscal: {
        select: {
          participante: {
            select: { enderecos: { where: { tipo: "PRINCIPAL" }, select: { uf: true }, take: 1 } },
          },
        },
      },
    },
  });

  const porChaveMap = new Map();
  for (const item of itens) {
    const uf = item.notaFiscal.participante.enderecos[0]?.uf ?? "N/D";
    const chave = `${item.cfop.codigo}-${uf}`;
    if (!porChaveMap.has(chave)) {
      porChaveMap.set(chave, { cfop: item.cfop.codigo, uf, quantidade: new Prisma.Decimal(0), valorTotal: new Prisma.Decimal(0) });
    }
    const entrada = porChaveMap.get(chave);
    entrada.quantidade = entrada.quantidade.plus(item.quantidade);
    entrada.valorTotal = entrada.valorTotal.plus(new Prisma.Decimal(item.quantidade).times(item.valorUnitario));
  }

  return [...porChaveMap.values()].map((e) => ({ ...e, quantidade: e.quantidade.toFixed(4), valorTotal: e.valorTotal.toFixed(2) }));
}

export async function porProduto({ empresaId, dataInicial, dataFinal }) {
  const itens = await prisma.itemNotaFiscal.findMany({
    where: { notaFiscal: { empresaId, ...filtroData({ dataInicial, dataFinal }) } },
    select: { produtoId: true, quantidade: true, valorUnitario: true, produto: { select: { codigo: true, descricao: true } } },
  });

  const porProdutoMap = new Map();
  for (const item of itens) {
    const chave = item.produtoId;
    if (!porProdutoMap.has(chave)) {
      porProdutoMap.set(chave, { produtoId: chave, codigo: item.produto.codigo, descricao: item.produto.descricao, quantidade: new Prisma.Decimal(0), valorTotal: new Prisma.Decimal(0) });
    }
    const entrada = porProdutoMap.get(chave);
    entrada.quantidade = entrada.quantidade.plus(item.quantidade);
    entrada.valorTotal = entrada.valorTotal.plus(new Prisma.Decimal(item.quantidade).times(item.valorUnitario));
  }

  return [...porProdutoMap.values()].map((e) => ({ ...e, quantidade: e.quantidade.toFixed(4), valorTotal: e.valorTotal.toFixed(2) }));
}

import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";
import { enviarNotaPorEmail } from "./email.js";
import { gerarXmlNota } from "./xml.js";

const ALLOWED_TRANSITIONS = {
  EM_DIGITACAO: ["EM_PROCESSAMENTO", "CANCELADO"],
  EM_PROCESSAMENTO: ["AUTORIZADO", "REJEICAO", "USO_DENEGADO"],
  AUTORIZADO: ["CANCELADO"],
  REJEICAO: ["EM_DIGITACAO"],
  USO_DENEGADO: [],
  CANCELADO: [],
  ARQUIVO_CRIADO: [],
};

const TIPOS_EVENTO_TERMINAL = new Set(["CONFIRMACAO", "DESCONHECIMENTO", "NAO_REALIZADA"]);

const SELECT_HEADER = {
  id: true,
  serie: true,
  numero: true,
  chaveAcesso: true,
  naturezaOperacaoId: true,
  tipoOperacao: true,
  modeloDocumento: true,
  status: true,
  participanteId: true,
  certificadoDigitalId: true,
  pedidoCompraId: true,
  pedidoVendaId: true,
  dataEmissao: true,
  criadoEm: true,
  atualizadoEm: true,
  participante: { select: { razaoSocial: true, cpfCnpj: true } },
};

const SELECT_DETAIL = {
  ...SELECT_HEADER,
  itens: {
    select: {
      id: true,
      produtoId: true,
      cfopId: true,
      quantidade: true,
      valorUnitario: true,
      valorIcms: true,
      valorIpi: true,
      valorPis: true,
      valorCofins: true,
      produto: { select: { codigo: true, descricao: true } },
    },
  },
  manifestacoes: { select: { id: true, tipoEvento: true, data: true } },
};

async function ensureReferences({ empresaId, naturezaOperacaoId, participanteId, certificadoDigitalId, pedidoCompraId, pedidoVendaId }) {
  const checks = [
    prisma.naturezaOperacao
      .findFirst({ where: { id: naturezaOperacaoId, empresaId }, select: { id: true } })
      .then((r) => {
        if (!r) throw new AppError(422, "INVALID_REFERENCE", "Natureza de operação informada não existe.");
      }),
    prisma.participante.findFirst({ where: { id: participanteId, empresaId }, select: { id: true } }).then((r) => {
      if (!r) throw new AppError(422, "INVALID_REFERENCE", "Participante informado não existe.");
    }),
  ];
  if (certificadoDigitalId) {
    checks.push(
      prisma.certificadoDigital
        .findFirst({ where: { id: certificadoDigitalId, empresaId }, select: { id: true } })
        .then((r) => {
          if (!r) throw new AppError(422, "INVALID_REFERENCE", "Certificado digital informado não existe.");
        }),
    );
  }
  if (pedidoCompraId) {
    checks.push(
      prisma.pedidoCompra.findFirst({ where: { id: pedidoCompraId, empresaId }, select: { id: true } }).then((r) => {
        if (!r) throw new AppError(422, "INVALID_REFERENCE", "Pedido de compra informado não existe.");
      }),
    );
  }
  if (pedidoVendaId) {
    checks.push(
      prisma.pedidoVenda.findFirst({ where: { id: pedidoVendaId, empresaId }, select: { id: true } }).then((r) => {
        if (!r) throw new AppError(422, "INVALID_REFERENCE", "Pedido de venda informado não existe.");
      }),
    );
  }
  await Promise.all(checks);
}

async function ensureItensReferences({ empresaId, itens }) {
  if (!itens.length) return;
  const produtoIds = [...new Set(itens.map((item) => item.produtoId))];
  const cfopIds = [...new Set(itens.map((item) => item.cfopId))];

  const [produtos, cfops] = await Promise.all([
    prisma.produto.findMany({ where: { id: { in: produtoIds }, empresaId }, select: { id: true } }),
    prisma.cfop.findMany({ where: { id: { in: cfopIds } }, select: { id: true } }),
  ]);
  if (produtos.length !== produtoIds.length) {
    throw new AppError(422, "INVALID_REFERENCE", "Um ou mais produtos informados não existem.");
  }
  if (cfops.length !== cfopIds.length) {
    throw new AppError(422, "INVALID_REFERENCE", "Um ou mais CFOPs informados não existem.");
  }
}

// Preenche valorIcms/valorIpi/valorPis/valorCofins de quem não mandou
// explicitamente, usando a regra cadastrada em TributacaoProdutoCfop pra
// esse (produto, CFOP) — ver o comentário do model no schema.prisma. Item
// sem regra configurada pra essa combinação fica com os valores em 0 (não é
// erro: nem todo produto/CFOP tem tributação cadastrada ainda) e o CST
// digitado na mão continua funcionando pra quem prefere não usar a regra.
// RegraIcms.baseCalculo é tratado como um percentual de redução sobre o
// valor do próprio item (comum em produtos de cesta básica), não um valor
// fixo — só assim o campo faz sentido reutilizado entre itens de valores
// diferentes.
async function calcularImpostosItens({ empresaId, itens }) {
  if (!itens.length) return itens;

  const pares = itens.map((item) => ({ produtoId: item.produtoId, cfopId: item.cfopId }));
  const regras = await prisma.tributacaoProdutoCfop.findMany({
    where: { empresaId, OR: pares },
    include: { icms: true, ipi: true, pis: true, cofins: true },
  });
  const porChave = new Map(regras.map((r) => [`${r.produtoId}:${r.cfopId}`, r]));

  return itens.map((item) => {
    const regra = porChave.get(`${item.produtoId}:${item.cfopId}`);
    if (!regra) return item;

    const valorItem = new Prisma.Decimal(item.quantidade).times(item.valorUnitario);
    const calculado = {};

    if (item.valorIcms === undefined && regra.icms) {
      const baseCalculo = valorItem.times(regra.icms.baseCalculo).dividedBy(100);
      calculado.valorIcms = baseCalculo.times(regra.icms.aliquota).dividedBy(100).toFixed(4);
    }
    if (item.valorIpi === undefined && regra.ipi) {
      calculado.valorIpi = valorItem.times(regra.ipi.aliquota).dividedBy(100).toFixed(4);
    }
    if (item.valorPis === undefined && regra.pis) {
      calculado.valorPis = valorItem.times(regra.pis.aliquota).dividedBy(100).toFixed(4);
    }
    if (item.valorCofins === undefined && regra.cofins) {
      calculado.valorCofins = valorItem.times(regra.cofins.aliquota).dividedBy(100).toFixed(4);
    }

    return { ...item, ...calculado };
  });
}

async function getNotaOrThrow({ empresaId, id, select = SELECT_DETAIL }) {
  const nota = await prisma.notaFiscal.findFirst({ where: { id, empresaId }, select });
  if (!nota) throw new AppError(404, "NOT_FOUND", "Nota fiscal não encontrada.");
  return nota;
}

export async function list({ empresaId, skip, take, tipoOperacao, modeloDocumento, status, participanteId }) {
  const where = {
    empresaId,
    ...(tipoOperacao ? { tipoOperacao } : {}),
    ...(modeloDocumento ? { modeloDocumento } : {}),
    ...(status ? { status } : {}),
    ...(participanteId ? { participanteId } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.notaFiscal.findMany({ where, select: SELECT_HEADER, skip, take, orderBy: { dataEmissao: "desc" } }),
    prisma.notaFiscal.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  return getNotaOrThrow({ empresaId, id });
}

export async function create({ empresaId, data }) {
  const { itens = [], ...rest } = data;

  await ensureReferences({ empresaId, ...rest });
  await ensureItensReferences({ empresaId, itens });
  const itensComImpostos = await calcularImpostosItens({ empresaId, itens });

  return prisma.notaFiscal.create({
    data: { ...rest, empresaId, itens: itensComImpostos.length ? { create: itensComImpostos } : undefined },
    select: SELECT_DETAIL,
  });
}

export async function addItem({ empresaId, notaFiscalId, data }) {
  const nota = await getNotaOrThrow({ empresaId, id: notaFiscalId, select: { id: true, status: true } });
  if (nota.status !== "EM_DIGITACAO") {
    throw new AppError(409, "NOTA_NAO_EDITAVEL", "Só é possível alterar itens de uma nota em digitação.");
  }

  await ensureItensReferences({ empresaId, itens: [data] });
  const [itemComImpostos] = await calcularImpostosItens({ empresaId, itens: [data] });

  return prisma.itemNotaFiscal.create({
    data: { ...itemComImpostos, notaFiscalId },
    select: {
      id: true,
      produtoId: true,
      cfopId: true,
      quantidade: true,
      valorUnitario: true,
      valorIcms: true,
      valorIpi: true,
      valorPis: true,
      valorCofins: true,
    },
  });
}

export async function removeItem({ empresaId, notaFiscalId, itemId }) {
  const nota = await getNotaOrThrow({ empresaId, id: notaFiscalId, select: { id: true, status: true } });
  if (nota.status !== "EM_DIGITACAO") {
    throw new AppError(409, "NOTA_NAO_EDITAVEL", "Só é possível alterar itens de uma nota em digitação.");
  }

  const item = await prisma.itemNotaFiscal.findFirst({
    where: { id: itemId, notaFiscalId },
    select: { id: true },
  });
  if (!item) throw new AppError(404, "NOT_FOUND", "Item não encontrado nesta nota fiscal.");

  await prisma.itemNotaFiscal.delete({ where: { id: itemId } });
}

export async function updateStatus({ empresaId, id, status, chaveAcesso }) {
  const nota = await getNotaOrThrow({ empresaId, id, select: { id: true, status: true } });

  if (!ALLOWED_TRANSITIONS[nota.status].includes(status)) {
    throw new AppError(
      400,
      "INVALID_TRANSITION",
      `Não é possível mudar o status de ${nota.status} para ${status}.`,
    );
  }

  return prisma.notaFiscal.update({
    where: { id },
    data: { status, ...(status === "AUTORIZADO" ? { chaveAcesso } : {}) },
    select: SELECT_DETAIL,
  });
}

export async function addManifestacao({ empresaId, notaFiscalId, tipoEvento }) {
  const nota = await getNotaOrThrow({
    empresaId,
    id: notaFiscalId,
    select: { id: true, manifestacoes: { select: { tipoEvento: true } } },
  });

  const jaTemEventoTerminal = nota.manifestacoes.some((m) => TIPOS_EVENTO_TERMINAL.has(m.tipoEvento));
  if (jaTemEventoTerminal) {
    throw new AppError(
      409,
      "MANIFESTACAO_JA_FINALIZADA",
      "Esta nota fiscal já possui um evento de manifestação terminal (confirmação, desconhecimento ou não realizada).",
    );
  }

  return prisma.manifestacaoDestinatario.create({
    data: { notaFiscalId, tipoEvento },
    select: { id: true, tipoEvento: true, data: true },
  });
}

const SELECT_PARA_XML = {
  id: true,
  serie: true,
  numero: true,
  chaveAcesso: true,
  dataEmissao: true,
  modeloDocumento: true,
  participante: { select: { razaoSocial: true, cpfCnpj: true } },
  itens: {
    select: {
      quantidade: true,
      valorUnitario: true,
      valorIcms: true,
      valorIpi: true,
      valorPis: true,
      valorCofins: true,
      produto: { select: { codigo: true, descricao: true } },
      cfop: { select: { codigo: true } },
    },
  },
};

export async function listarParaXml({ empresaId, ids }) {
  const notas = await prisma.notaFiscal.findMany({ where: { id: { in: ids }, empresaId }, select: SELECT_PARA_XML });
  if (!notas.length) throw new AppError(404, "NOT_FOUND", "Nenhuma nota fiscal encontrada para os IDs informados.");
  return notas;
}

export async function listarItens({ empresaId, skip, take, produtoId, cfopId, tipoOperacao, status, dataInicial, dataFinal }) {
  const where = {
    notaFiscal: {
      empresaId,
      ...(tipoOperacao ? { tipoOperacao } : {}),
      ...(status ? { status } : {}),
      ...(dataInicial || dataFinal
        ? { dataEmissao: { ...(dataInicial ? { gte: dataInicial } : {}), ...(dataFinal ? { lte: dataFinal } : {}) } }
        : {}),
    },
    ...(produtoId ? { produtoId } : {}),
    ...(cfopId ? { cfopId } : {}),
  };
  const select = {
    id: true,
    produtoId: true,
    cfopId: true,
    quantidade: true,
    valorUnitario: true,
    valorIcms: true,
    valorIpi: true,
    valorPis: true,
    valorCofins: true,
    produto: { select: { codigo: true, descricao: true } },
    cfop: { select: { codigo: true, descricao: true } },
    notaFiscal: {
      select: {
        id: true,
        serie: true,
        numero: true,
        status: true,
        dataEmissao: true,
        participante: { select: { razaoSocial: true } },
      },
    },
  };
  const [items, total] = await Promise.all([
    prisma.itemNotaFiscal.findMany({ where, select, skip, take, orderBy: { notaFiscal: { dataEmissao: "desc" } } }),
    prisma.itemNotaFiscal.count({ where }),
  ]);
  return { items, total };
}

export async function enviarPorEmail({ empresaId, id, destinatario }) {
  const [nota] = await listarParaXml({ empresaId, ids: [id] });
  const xml = gerarXmlNota(nota);
  await enviarNotaPorEmail({ destinatario, nota, xml });
  return { enviado: true, destinatario };
}

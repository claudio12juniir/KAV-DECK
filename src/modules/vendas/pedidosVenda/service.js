import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";
import { getClienteTenant } from "../../participantes/clientes/service.js";
import { gerarTitulos } from "../../financeiro/titulos/service.js";

// FATURADO só é alcançado via faturar() — é consequência de baixa real de
// estoque por lote, não de uma troca de status solta pelo endpoint genérico.
const ALLOWED_TRANSITIONS = {
  ABERTO: ["SEPARACAO", "CANCELADO"],
  SEPARACAO: ["CANCELADO"],
  FATURADO: [],
  CANCELADO: [],
};

const SELECT_HEADER = {
  id: true,
  clienteId: true,
  vendedorId: true,
  separadorId: true,
  tabelaPrecoId: true,
  condicaoPagamentoId: true,
  rotaEntregaId: true,
  turno: true,
  dataEmissao: true,
  status: true,
  arquivado: true,
  criadoEm: true,
  atualizadoEm: true,
  cliente: { select: { participante: { select: { razaoSocial: true, cpfCnpj: true } } } },
};

const SELECT_DETAIL = {
  ...SELECT_HEADER,
  itens: {
    select: {
      id: true,
      produtoId: true,
      quantidade: true,
      precoUnitario: true,
      desconto: true,
      produto: { select: { codigo: true, descricao: true } },
    },
  },
};

async function ensureCliente({ empresaId, clienteId }) {
  const cliente = await getClienteTenant({ empresaId, participanteId: clienteId });
  if (cliente.bloqueioFinanceiro === "BLOQUEADO") {
    throw new AppError(
      409,
      "CLIENTE_BLOQUEADO",
      "Cliente está com bloqueio financeiro ativo e não pode gerar novo pedido de venda.",
    );
  }
}

async function ensureVendedor({ empresaId, vendedorId }) {
  if (!vendedorId) return;
  const vendedor = await prisma.colaborador.findFirst({ where: { id: vendedorId, empresaId }, select: { id: true } });
  if (!vendedor) throw new AppError(422, "INVALID_REFERENCE", "Vendedor informado não existe.");
}

async function ensureTabelaPreco({ empresaId, tabelaPrecoId }) {
  if (!tabelaPrecoId) return;
  const tabela = await prisma.tabelaPreco.findFirst({
    where: { id: tabelaPrecoId, empresaId },
    select: { id: true },
  });
  if (!tabela) throw new AppError(422, "INVALID_REFERENCE", "Tabela de preço informada não existe.");
}

async function ensureCondicaoPagamento({ empresaId, condicaoPagamentoId }) {
  if (!condicaoPagamentoId) return;
  const condicao = await prisma.condicaoPagamento.findFirst({
    where: { id: condicaoPagamentoId, empresaId },
    select: { id: true },
  });
  if (!condicao) throw new AppError(422, "INVALID_REFERENCE", "Condição de pagamento informada não existe.");
}

async function ensureRotaEntrega({ empresaId, rotaEntregaId }) {
  if (!rotaEntregaId) return;
  const rota = await prisma.rotaEntrega.findFirst({ where: { id: rotaEntregaId, empresaId }, select: { id: true } });
  if (!rota) throw new AppError(422, "INVALID_REFERENCE", "Rota de entrega informada não existe.");
}

async function ensureProdutos({ empresaId, produtoIds }) {
  if (!produtoIds.length) return;
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, empresaId },
    select: { id: true },
  });
  if (produtos.length !== new Set(produtoIds).size) {
    throw new AppError(422, "INVALID_REFERENCE", "Um ou mais produtos informados não existem.");
  }
}

async function getPedidoOrThrow({ empresaId, id, select = SELECT_DETAIL }) {
  const pedido = await prisma.pedidoVenda.findFirst({ where: { id, empresaId }, select });
  if (!pedido) throw new AppError(404, "NOT_FOUND", "Pedido de venda não encontrado.");
  return pedido;
}

// Filtro de "lançamento" pedido pelo usuário — 5 baldes que não mapeiam 1:1
// pro enum StatusPedidoVenda: LIQUIDADO e AGRUPADO são derivados de
// relações (títulos baixados / entrou num agrupamento de NF), ARQUIVADO é a
// flag nova, e todos excluem arquivado=true (arquivar esconde da lista
// independente do status por baixo — ver comentário do campo no schema).
// EM_ABERTO/CANCELADO continuam batendo direto no enum. Quem não passar
// nenhum filtro continua vendo tudo (comportamento anterior preservado).
function whereDoFiltro(filtro) {
  switch (filtro) {
    case "EM_ABERTO":
      return { status: "ABERTO", arquivado: false };
    case "CANCELADO":
      return { status: "CANCELADO", arquivado: false };
    case "LIQUIDADO":
      return {
        status: "FATURADO",
        arquivado: false,
        titulosFinanceiros: { some: {} },
        NOT: { titulosFinanceiros: { some: { status: { not: "BAIXADO" } } } },
      };
    case "AGRUPADO":
      return { arquivado: false, pedidosVendaAgrupados: { some: {} } };
    case "ARQUIVADO":
      return { arquivado: true };
    default:
      return {};
  }
}

export async function list({ empresaId, skip, take, status, filtro, separadorId, dataInicial, dataFinal }) {
  const where = {
    empresaId,
    ...(status ? { status } : {}),
    ...whereDoFiltro(filtro),
    ...(separadorId ? { separadorId } : {}),
    ...(dataInicial || dataFinal
      ? { dataEmissao: { ...(dataInicial ? { gte: dataInicial } : {}), ...(dataFinal ? { lte: dataFinal } : {}) } }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.pedidoVenda.findMany({ where, select: SELECT_HEADER, skip, take, orderBy: { dataEmissao: "desc" } }),
    prisma.pedidoVenda.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  return getPedidoOrThrow({ empresaId, id });
}

export async function create({ empresaId, data }) {
  const { itens = [], ...rest } = data;

  // Bloqueio financeiro é checado primeiro e isoladamente: nenhum pedido deve
  // ser criado (nem side-effects de validação) se o cliente estiver bloqueado.
  await ensureCliente({ empresaId, clienteId: rest.clienteId });

  await Promise.all([
    ensureVendedor({ empresaId, vendedorId: rest.vendedorId }),
    ensureTabelaPreco({ empresaId, tabelaPrecoId: rest.tabelaPrecoId }),
    ensureCondicaoPagamento({ empresaId, condicaoPagamentoId: rest.condicaoPagamentoId }),
    ensureRotaEntrega({ empresaId, rotaEntregaId: rest.rotaEntregaId }),
    ensureProdutos({ empresaId, produtoIds: itens.map((item) => item.produtoId) }),
  ]);

  return prisma.pedidoVenda.create({
    data: {
      ...rest,
      empresaId,
      itens: itens.length ? { create: itens } : undefined,
    },
    select: SELECT_DETAIL,
  });
}

export async function updateStatus({ empresaId, id, status }) {
  const pedido = await getPedidoOrThrow({ empresaId, id, select: { id: true, status: true } });

  if (!ALLOWED_TRANSITIONS[pedido.status].includes(status)) {
    throw new AppError(
      400,
      "INVALID_TRANSITION",
      `Não é possível mudar o status de ${pedido.status} para ${status}.`,
    );
  }

  return prisma.pedidoVenda.update({ where: { id }, data: { status }, select: SELECT_DETAIL });
}

// Mesma transição ABERTO -> SEPARACAO do updateStatus genérico, mas
// registrando quem pegou o pedido pra separar — é o que dá sentido ao
// Terminal de Separadores (filtrar/listar por separadorId).
export async function separar({ empresaId, id, separadorId }) {
  const pedido = await getPedidoOrThrow({ empresaId, id, select: { id: true, status: true } });

  if (!ALLOWED_TRANSITIONS[pedido.status].includes("SEPARACAO")) {
    throw new AppError(
      400,
      "INVALID_TRANSITION",
      `Não é possível mudar o status de ${pedido.status} para SEPARACAO.`,
    );
  }

  if (separadorId) {
    const separador = await prisma.colaborador.findFirst({ where: { id: separadorId, empresaId }, select: { id: true } });
    if (!separador) throw new AppError(422, "INVALID_REFERENCE", "Separador informado não existe.");
  }

  return prisma.pedidoVenda.update({
    where: { id },
    data: { status: "SEPARACAO", separadorId },
    select: SELECT_DETAIL,
  });
}

export async function addItem({ empresaId, pedidoId, data }) {
  const pedido = await getPedidoOrThrow({ empresaId, id: pedidoId, select: { id: true, status: true } });
  if (pedido.status !== "ABERTO") {
    throw new AppError(409, "PEDIDO_NAO_EDITAVEL", "Só é possível alterar itens de um pedido em aberto.");
  }

  await ensureProdutos({ empresaId, produtoIds: [data.produtoId] });

  return prisma.itemPedidoVenda.create({
    data: { ...data, pedidoVendaId: pedidoId },
    select: { id: true, produtoId: true, quantidade: true, precoUnitario: true, desconto: true },
  });
}

export async function removeItem({ empresaId, pedidoId, itemId }) {
  const pedido = await getPedidoOrThrow({ empresaId, id: pedidoId, select: { id: true, status: true } });
  if (pedido.status !== "ABERTO") {
    throw new AppError(409, "PEDIDO_NAO_EDITAVEL", "Só é possível alterar itens de um pedido em aberto.");
  }

  const item = await prisma.itemPedidoVenda.findFirst({
    where: { id: itemId, pedidoVendaId: pedidoId },
    select: { id: true },
  });
  if (!item) throw new AppError(404, "NOT_FOUND", "Item não encontrado neste pedido.");

  await prisma.itemPedidoVenda.delete({ where: { id: itemId } });
}

export async function faturar({ empresaId, id, itens }) {
  const pedido = await getPedidoOrThrow({
    empresaId,
    id,
    select: {
      id: true,
      status: true,
      clienteId: true,
      condicaoPagamentoId: true,
      itens: { select: { produtoId: true, quantidade: true, precoUnitario: true, desconto: true } },
    },
  });
  if (pedido.status !== "SEPARACAO") {
    throw new AppError(
      409,
      "PEDIDO_NAO_FATURAVEL",
      "Pedido precisa estar em separação para ser faturado.",
    );
  }

  const produtosDoPedido = new Set(pedido.itens.map((item) => item.produtoId));
  for (const item of itens) {
    if (!produtosDoPedido.has(item.produtoId)) {
      throw new AppError(
        422,
        "PRODUTO_FORA_DO_PEDIDO",
        `Produto ${item.produtoId} não faz parte deste pedido de venda.`,
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const item of itens) {
      const lote = await tx.lote.findFirst({
        where: { id: item.loteId, empresaId, produtoId: item.produtoId },
        select: { id: true, quantidadeAtual: true },
      });
      if (!lote) {
        throw new AppError(422, "INVALID_REFERENCE", `Lote ${item.loteId} não existe para o produto informado.`);
      }
      if (new Prisma.Decimal(lote.quantidadeAtual).lt(item.quantidade)) {
        throw new AppError(
          409,
          "ESTOQUE_INSUFICIENTE",
          `Estoque insuficiente no lote ${item.loteId} para o produto ${item.produtoId}.`,
        );
      }

      await tx.lote.update({
        where: { id: item.loteId },
        data: { quantidadeAtual: { decrement: item.quantidade } },
      });

      await tx.movimentoEstoque.create({
        data: {
          empresaId,
          produtoId: item.produtoId,
          loteId: item.loteId,
          tipo: "SAIDA",
          quantidade: item.quantidade,
          pedidoVendaId: id,
        },
      });
    }

    const valorTotal = pedido.itens.reduce(
      (soma, item) =>
        soma.plus(new Prisma.Decimal(item.quantidade).times(item.precoUnitario).minus(item.desconto ?? 0)),
      new Prisma.Decimal(0),
    );
    await gerarTitulos({
      tx,
      empresaId,
      tipo: "RECEBER",
      participanteId: pedido.clienteId,
      valorTotal,
      condicaoPagamentoId: pedido.condicaoPagamentoId,
      pedidoVendaId: id,
    });

    await tx.pedidoVenda.update({ where: { id }, data: { status: "FATURADO" } });
  });

  return getPedidoOrThrow({ empresaId, id });
}

// Clona cabeçalho + itens como um pedido novo em ABERTO. Reavalia o
// bloqueio financeiro do cliente igual create() — o cliente pode ter sido
// bloqueado entre o pedido original e agora.
export async function duplicar({ empresaId, id }) {
  const pedido = await getPedidoOrThrow({
    empresaId,
    id,
    select: {
      clienteId: true,
      vendedorId: true,
      tabelaPrecoId: true,
      condicaoPagamentoId: true,
      rotaEntregaId: true,
      itens: { select: { produtoId: true, quantidade: true, precoUnitario: true, desconto: true } },
    },
  });

  await ensureCliente({ empresaId, clienteId: pedido.clienteId });

  return prisma.pedidoVenda.create({
    data: {
      empresaId,
      clienteId: pedido.clienteId,
      vendedorId: pedido.vendedorId,
      tabelaPrecoId: pedido.tabelaPrecoId,
      condicaoPagamentoId: pedido.condicaoPagamentoId,
      rotaEntregaId: pedido.rotaEntregaId,
      itens: {
        create: pedido.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          desconto: item.desconto,
        })),
      },
    },
    select: SELECT_DETAIL,
  });
}

// Consolida N pedidos já FATURADOS do mesmo cliente numa única NF, somando
// os itens de todos eles e mantendo o vínculo de origem (NotaFiscalPedidoVenda)
// — não repete o efeito físico do faturamento (baixa de estoque, título),
// que já aconteceu quando cada pedido foi faturado individualmente. É só a
// composição do documento fiscal.
export async function agruparNF({
  empresaId,
  pedidoIds,
  serie,
  numero,
  naturezaOperacaoId,
  tipoOperacao,
  cfopId,
  certificadoDigitalId,
}) {
  // Validações são só leitura e não precisam de transação — a escrita em si
  // (mais abaixo) é um único create() com nested writes, que já é atômico
  // sozinho. Rodar tudo dentro de um $transaction aqui só somava round-trips
  // ao pooler e estourava o timeout da transação sem necessidade.
  const [natureza, cfop, certificado, pedidos, jaEmNota] = await Promise.all([
    prisma.naturezaOperacao.findFirst({ where: { id: naturezaOperacaoId, empresaId }, select: { id: true } }),
    prisma.cfop.findFirst({ where: { id: cfopId }, select: { id: true } }),
    certificadoDigitalId
      ? prisma.certificadoDigital.findFirst({ where: { id: certificadoDigitalId, empresaId }, select: { id: true } })
      : Promise.resolve(true),
    prisma.pedidoVenda.findMany({
      where: { id: { in: pedidoIds }, empresaId },
      select: {
        id: true,
        clienteId: true,
        status: true,
        itens: { select: { produtoId: true, quantidade: true, precoUnitario: true } },
      },
    }),
    prisma.notaFiscalPedidoVenda.findFirst({ where: { pedidoVendaId: { in: pedidoIds } }, select: { id: true } }),
  ]);

  if (!natureza) throw new AppError(422, "INVALID_REFERENCE", "Natureza de operação informada não existe.");
  if (!cfop) throw new AppError(422, "INVALID_REFERENCE", "CFOP informado não existe.");
  if (!certificado) throw new AppError(422, "INVALID_REFERENCE", "Certificado digital informado não existe.");
  if (pedidos.length !== pedidoIds.length) {
    throw new AppError(422, "INVALID_REFERENCE", "Um ou mais pedidos informados não existem.");
  }
  const clientesDistintos = new Set(pedidos.map((p) => p.clienteId));
  if (clientesDistintos.size > 1) {
    throw new AppError(422, "PEDIDOS_INCOMPATIVEIS", "Só é possível agrupar pedidos do mesmo cliente numa NF.");
  }
  if (pedidos.some((p) => p.status !== "FATURADO")) {
    throw new AppError(409, "PEDIDO_NAO_AGRUPAVEL", "Só é possível agrupar numa NF pedidos já faturados.");
  }
  if (jaEmNota) {
    throw new AppError(409, "PEDIDO_JA_AGRUPADO", "Um ou mais pedidos já fazem parte de outra nota fiscal agrupada.");
  }

  const [{ clienteId }] = pedidos;
  const itensNota = pedidos.flatMap((pedido) =>
    pedido.itens.map((item) => ({
      produtoId: item.produtoId,
      cfopId,
      quantidade: item.quantidade,
      valorUnitario: item.precoUnitario,
    })),
  );

  return prisma.notaFiscal.create({
    data: {
      empresaId,
      serie,
      numero,
      naturezaOperacaoId,
      tipoOperacao,
      participanteId: clienteId,
      certificadoDigitalId,
      itens: { create: itensNota },
      pedidosVendaAgrupados: { create: pedidoIds.map((pedidoVendaId) => ({ pedidoVendaId })) },
    },
    select: {
      id: true,
      serie: true,
      numero: true,
      status: true,
      participanteId: true,
      itens: { select: { id: true, produtoId: true, cfopId: true, quantidade: true, valorUnitario: true } },
      pedidosVendaAgrupados: { select: { pedidoVendaId: true } },
    },
  });
}

// Aplica o mesmo valor de desconto em todos os itens do pedido de uma vez
// — atalho de balcão pra não editar item por item quando o desconto é
// igual pra tudo.
export async function aplicarDesconto({ empresaId, id, desconto }) {
  const pedido = await getPedidoOrThrow({ empresaId, id, select: { id: true, status: true } });
  if (pedido.status !== "ABERTO") {
    throw new AppError(409, "PEDIDO_NAO_EDITAVEL", "Só é possível alterar itens de um pedido em aberto.");
  }

  await prisma.itemPedidoVenda.updateMany({ where: { pedidoVendaId: id }, data: { desconto } });
  return getPedidoOrThrow({ empresaId, id });
}

// Move um subconjunto dos itens do pedido pra um pedido novo, mesmo
// cliente/vendedor/tabela/condição/rota — útil quando parte do pedido vai
// atrasar (falta de estoque, por exemplo) e o resto pode seguir separado.
export async function dividir({ empresaId, id, itemIds }) {
  const pedido = await getPedidoOrThrow({
    empresaId,
    id,
    select: {
      status: true,
      clienteId: true,
      vendedorId: true,
      tabelaPrecoId: true,
      condicaoPagamentoId: true,
      rotaEntregaId: true,
      itens: { select: { id: true } },
    },
  });
  if (pedido.status !== "ABERTO") {
    throw new AppError(409, "PEDIDO_NAO_EDITAVEL", "Só é possível dividir um pedido em aberto.");
  }

  const idsDoPedido = new Set(pedido.itens.map((item) => item.id));
  const idsInvalidos = itemIds.filter((itemId) => !idsDoPedido.has(itemId));
  if (idsInvalidos.length) {
    throw new AppError(422, "INVALID_REFERENCE", `Item(ns) fora deste pedido: ${idsInvalidos.join(", ")}.`);
  }
  if (itemIds.length >= idsDoPedido.size) {
    throw new AppError(
      422,
      "DIVISAO_INVALIDA",
      "Selecione menos itens do que o total do pedido — senão não sobra nada pra dividir.",
    );
  }

  // Só o create + updateMany precisam ser atômicos juntos; as duas leituras
  // finais rodam depois de já commitado, fora da transação — mesmo ajuste
  // de round-trips feito em agruparNF() pra não estourar o timeout padrão
  // de 5s do pooler remoto.
  const novoPedido = await prisma.$transaction(async (tx) => {
    const criado = await tx.pedidoVenda.create({
      data: {
        empresaId,
        clienteId: pedido.clienteId,
        vendedorId: pedido.vendedorId,
        tabelaPrecoId: pedido.tabelaPrecoId,
        condicaoPagamentoId: pedido.condicaoPagamentoId,
        rotaEntregaId: pedido.rotaEntregaId,
      },
      select: { id: true },
    });

    await tx.itemPedidoVenda.updateMany({
      where: { id: { in: itemIds } },
      data: { pedidoVendaId: criado.id },
    });

    return criado;
  });

  const [pedidoOriginal, pedidoNovo] = await Promise.all([
    prisma.pedidoVenda.findUnique({ where: { id }, select: SELECT_DETAIL }),
    prisma.pedidoVenda.findUnique({ where: { id: novoPedido.id }, select: SELECT_DETAIL }),
  ]);

  return { pedidoOriginal, pedidoNovo };
}

// Define/ajusta rota e turno de entrega do pedido — separado do create()
// porque a definição de logística normalmente acontece depois, quando o
// pedido já está faturado e vai pro roteiro do dia (Itinerário).
export async function atribuirItinerario({ empresaId, id, rotaEntregaId, turno }) {
  await getPedidoOrThrow({ empresaId, id, select: { id: true } });

  if (rotaEntregaId) {
    const rota = await prisma.rotaEntrega.findFirst({ where: { id: rotaEntregaId, empresaId }, select: { id: true } });
    if (!rota) throw new AppError(422, "INVALID_REFERENCE", "Rota de entrega informada não existe.");
  }

  return prisma.pedidoVenda.update({
    where: { id },
    data: { ...(rotaEntregaId ? { rotaEntregaId } : {}), ...(turno ? { turno } : {}) },
    select: SELECT_DETAIL,
  });
}

// Arquivar é só visibilidade (ver comentário do campo no schema) — funciona
// em qualquer status, inclusive ABERTO, diferente das transições de
// updateStatus que têm regras de fluxo.
export async function arquivar({ empresaId, id, arquivado }) {
  await getPedidoOrThrow({ empresaId, id, select: { id: true } });
  return prisma.pedidoVenda.update({ where: { id }, data: { arquivado }, select: SELECT_DETAIL });
}

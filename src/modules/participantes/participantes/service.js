import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  tipoPessoa: true,
  razaoSocial: true,
  nomeFantasia: true,
  cpfCnpj: true,
  ie: true,
  condicaoPagamentoId: true,
  limiteCredito: true,
  despesasRepassaveis: true,
  permiteEmissaoCheque: true,
  isProdutorRural: true,
  dapProdutorRural: true,
  talaoProdutorRural: true,
  grupoEmpresasId: true,
  ativo: true,
  criadoEm: true,
  atualizadoEm: true,
};

const SELECT_DETAIL = {
  ...SELECT,
  enderecos: {
    select: { id: true, tipo: true, logradouro: true, numero: true, bairro: true, cidade: true, uf: true, cep: true },
  },
  cliente: { select: { participanteId: true, bloqueioFinanceiro: true, vendedorPadraoId: true, rotaEntregaId: true, tabelaPrecoId: true } },
  fornecedor: { select: { participanteId: true } },
};

async function ensureReferences({ empresaId, condicaoPagamentoId, grupoEmpresasId }) {
  const checks = [];
  if (condicaoPagamentoId) {
    checks.push(
      prisma.condicaoPagamento
        .findFirst({ where: { id: condicaoPagamentoId, empresaId }, select: { id: true } })
        .then((r) => {
          if (!r) throw new AppError(422, "INVALID_REFERENCE", "Condição de pagamento informada não existe.");
        }),
    );
  }
  if (grupoEmpresasId) {
    checks.push(
      prisma.grupoEmpresas
        .findFirst({ where: { id: grupoEmpresasId, empresaId }, select: { id: true } })
        .then((r) => {
          if (!r) throw new AppError(422, "INVALID_REFERENCE", "Grupo de empresas informado não existe.");
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
          OR: [
            { razaoSocial: { contains: q, mode: "insensitive" } },
            { nomeFantasia: { contains: q, mode: "insensitive" } },
            { cpfCnpj: { contains: q } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.participante.findMany({ where, select: SELECT, skip, take, orderBy: { razaoSocial: "asc" } }),
    prisma.participante.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const participante = await prisma.participante.findFirst({ where: { id, empresaId }, select: SELECT_DETAIL });
  if (!participante) throw new AppError(404, "NOT_FOUND", "Participante não encontrado.");
  return participante;
}

async function ensureOwnership({ empresaId, id }) {
  const participante = await prisma.participante.findFirst({ where: { id, empresaId }, select: { id: true } });
  if (!participante) throw new AppError(404, "NOT_FOUND", "Participante não encontrado.");
}

export async function create({ empresaId, data }) {
  const { enderecos, ...rest } = data;
  await ensureReferences({
    empresaId,
    condicaoPagamentoId: rest.condicaoPagamentoId,
    grupoEmpresasId: rest.grupoEmpresasId,
  });
  return prisma.participante.create({
    data: { ...rest, empresaId, enderecos: enderecos?.length ? { create: enderecos } : undefined },
    select: SELECT_DETAIL,
  });
}

export async function update({ empresaId, id, data }) {
  await ensureOwnership({ empresaId, id });
  await ensureReferences({
    empresaId,
    condicaoPagamentoId: data.condicaoPagamentoId,
    grupoEmpresasId: data.grupoEmpresasId,
  });
  return prisma.participante.update({ where: { id }, data, select: SELECT_DETAIL });
}

export async function remove({ empresaId, id }) {
  await ensureOwnership({ empresaId, id });
  await prisma.participante.delete({ where: { id } });
}

export async function addEndereco({ empresaId, participanteId, data }) {
  await ensureOwnership({ empresaId, id: participanteId });
  return prisma.endereco.create({ data: { ...data, participanteId } });
}

export async function removeEndereco({ empresaId, participanteId, enderecoId }) {
  await ensureOwnership({ empresaId, id: participanteId });
  const endereco = await prisma.endereco.findFirst({ where: { id: enderecoId, participanteId }, select: { id: true } });
  if (!endereco) throw new AppError(404, "NOT_FOUND", "Endereço não encontrado.");
  await prisma.endereco.delete({ where: { id: enderecoId } });
}

export async function promoteToCliente({ empresaId, participanteId, data }) {
  await ensureOwnership({ empresaId, id: participanteId });

  const existente = await prisma.cliente.findUnique({ where: { participanteId }, select: { participanteId: true } });
  if (existente) throw new AppError(409, "CONFLICT", "Participante já é um cliente.");

  const checks = [];
  if (data.vendedorPadraoId) {
    checks.push(
      prisma.colaborador
        .findFirst({ where: { id: data.vendedorPadraoId, empresaId }, select: { id: true } })
        .then((r) => {
          if (!r) throw new AppError(422, "INVALID_REFERENCE", "Colaborador vendedor informado não existe.");
        }),
    );
  }
  if (data.rotaEntregaId) {
    checks.push(
      prisma.rotaEntrega
        .findFirst({ where: { id: data.rotaEntregaId, empresaId }, select: { id: true } })
        .then((r) => {
          if (!r) throw new AppError(422, "INVALID_REFERENCE", "Rota de entrega informada não existe.");
        }),
    );
  }
  if (data.tabelaPrecoId) {
    checks.push(
      prisma.tabelaPreco
        .findFirst({ where: { id: data.tabelaPrecoId, empresaId }, select: { id: true } })
        .then((r) => {
          if (!r) throw new AppError(422, "INVALID_REFERENCE", "Tabela de preço informada não existe.");
        }),
    );
  }
  await Promise.all(checks);

  return prisma.cliente.create({
    data: { participanteId, ...data },
    select: { participanteId: true, bloqueioFinanceiro: true, vendedorPadraoId: true, rotaEntregaId: true, tabelaPrecoId: true },
  });
}

export async function promoteToFornecedor({ empresaId, participanteId }) {
  await ensureOwnership({ empresaId, id: participanteId });

  const existente = await prisma.fornecedor.findUnique({
    where: { participanteId },
    select: { participanteId: true },
  });
  if (existente) throw new AppError(409, "CONFLICT", "Participante já é um fornecedor.");

  return prisma.fornecedor.create({ data: { participanteId }, select: { participanteId: true } });
}

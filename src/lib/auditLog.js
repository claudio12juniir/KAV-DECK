import { prisma } from "./prisma.js";

// Histórico genérico por registro (coluna "Última edição" + modal de
// histórico nas telas de cadastro, igual ao Space Soft). Nunca deve
// derrubar a operação principal — um cadastro criado/editado/excluído com
// sucesso não pode falhar por causa do log.

const CAMPOS_IGNORADOS = new Set([
  "id",
  "empresaId",
  "empresa_id",
  "criadoEm",
  "atualizadoEm",
  "createdAt",
  "updatedAt",
  "senha",
  "senhaHash",
]);

// Prisma.Decimal e Date não comparam nem serializam bem com === / JSON.stringify
// direto — normaliza pra string/number antes de comparar e de gravar em `dados`
// (coluna Json do Postgres).
function normalizarValor(valor) {
  if (valor === undefined || valor === null) return null;
  if (valor instanceof Date) return valor.toISOString();
  if (typeof valor === "object" && typeof valor.toJSON === "function") return valor.toJSON();
  if (typeof valor === "object" && valor.constructor?.name === "Decimal") return valor.toString();
  return valor;
}

function valoresIguais(a, b) {
  const na = normalizarValor(a);
  const nb = normalizarValor(b);
  if (na === nb) return true;
  if (na !== null && nb !== null && !Number.isNaN(Number(na)) && !Number.isNaN(Number(nb))) {
    return Number(na) === Number(nb);
  }
  return JSON.stringify(na) === JSON.stringify(nb);
}

// Diff raso (campo a campo) entre o registro antes e depois da atualização.
// Só entram no resultado os campos que de fato mudaram — evita poluir o
// histórico com "atualizações" onde o usuário só abriu e salvou sem alterar
// nada.
function diffCampos(antes, depois) {
  const chaves = new Set([...Object.keys(antes ?? {}), ...Object.keys(depois ?? {})]);
  const alteracoes = {};
  for (const chave of chaves) {
    if (CAMPOS_IGNORADOS.has(chave)) continue;
    const de = antes?.[chave];
    const para = depois?.[chave];
    if (!valoresIguais(de, para)) {
      alteracoes[chave] = { de: normalizarValor(de), para: normalizarValor(para) };
    }
  }
  return alteracoes;
}

async function gravar({ empresaId, entidade, entidadeId, acao, usuarioId, dados }) {
  try {
    await prisma.logAlteracao.create({
      data: { empresaId, entidade, entidadeId, acao, usuarioId, dados },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Falha ao registrar log de ${entidade}/${entidadeId}:`, err);
  }
}

export async function auditarCriacao({ empresaId, entidade, entidadeId, usuarioId, registro }) {
  await gravar({
    empresaId,
    entidade,
    entidadeId,
    acao: "CRIACAO",
    usuarioId,
    dados: { depois: registro ?? null },
  });
}

export async function auditarAtualizacao({ empresaId, entidade, entidadeId, usuarioId, antes, depois }) {
  const alteracoes = diffCampos(antes, depois);
  if (Object.keys(alteracoes).length === 0) return;
  await gravar({
    empresaId,
    entidade,
    entidadeId,
    acao: "ATUALIZACAO",
    usuarioId,
    dados: { alteracoes },
  });
}

export async function auditarExclusao({ empresaId, entidade, entidadeId, usuarioId, registro }) {
  await gravar({
    empresaId,
    entidade,
    entidadeId,
    acao: "EXCLUSAO",
    usuarioId,
    dados: registro ? { antes: registro } : null,
  });
}

export async function listarLogs({ empresaId, entidade, entidadeId }) {
  return prisma.logAlteracao.findMany({
    where: { empresaId, entidade, entidadeId },
    select: {
      id: true,
      acao: true,
      dados: true,
      criadoEm: true,
      usuario: { select: { nome: true } },
    },
    orderBy: { criadoEm: "desc" },
  });
}

// Última edição de cada registro de uma lista (usado pra popular a coluna
// "Última edição" da grade sem 1 request por linha). `logs` já vem ordenado
// por criadoEm desc, então a primeira ocorrência de cada entidadeId é a mais
// recente.
export async function listarUltimasPorEntidade({ empresaId, entidade, entidadeIds }) {
  if (!entidadeIds?.length) return {};
  const logs = await prisma.logAlteracao.findMany({
    where: { empresaId, entidade, entidadeId: { in: entidadeIds } },
    select: {
      entidadeId: true,
      acao: true,
      criadoEm: true,
      usuario: { select: { nome: true } },
    },
    orderBy: { criadoEm: "desc" },
  });
  const mapa = {};
  for (const log of logs) {
    if (!mapa[log.entidadeId]) mapa[log.entidadeId] = log;
  }
  return mapa;
}

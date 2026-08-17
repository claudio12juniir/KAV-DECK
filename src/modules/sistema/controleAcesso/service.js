import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";
import { CATALOGO_PERMISSOES } from "../../../middlewares/permissoesCatalogo.js";

const SELECT_USUARIO = { id: true, nome: true, email: true, role: true, ativo: true, ultimoAcessoEm: true };

export function listarCatalogo() {
  return CATALOGO_PERMISSOES;
}

export async function listarUsuarios({ empresaId }) {
  return prisma.usuario.findMany({
    where: { empresaId },
    select: SELECT_USUARIO,
    orderBy: { nome: "asc" },
  });
}

async function getUsuarioOrThrow({ empresaId, usuarioId }) {
  const usuario = await prisma.usuario.findFirst({
    where: { id: usuarioId, empresaId },
    select: SELECT_USUARIO,
  });
  if (!usuario) throw new AppError(404, "NOT_FOUND", "Usuário não encontrado.");
  return usuario;
}

function acaoCatalogada(modulo, acao) {
  return CATALOGO_PERMISSOES.some((entrada) => entrada.modulo === modulo && entrada.acao === acao);
}

// Junta o catálogo (fonte de verdade das ações protegidas) com os overrides
// gravados para o usuário, já resolvendo o efetivo (override, se houver,
// senão o papel padrão) para a tela não precisar recalcular nada.
export async function obterPermissoes({ empresaId, usuarioId }) {
  const usuario = await getUsuarioOrThrow({ empresaId, usuarioId });
  const overrides = await prisma.permissaoUsuario.findMany({
    where: { usuarioId },
    select: { modulo: true, acao: true, permitida: true },
  });
  const overridePorChave = new Map(overrides.map((o) => [`${o.modulo}.${o.acao}`, o.permitida]));

  const acoes = CATALOGO_PERMISSOES.map((entrada) => {
    const chave = `${entrada.modulo}.${entrada.acao}`;
    const permitidaPorPapel = entrada.papeisPadrao.includes(usuario.role);
    const temOverride = overridePorChave.has(chave);
    return {
      modulo: entrada.modulo,
      acao: entrada.acao,
      label: entrada.label,
      descricao: entrada.descricao,
      papeisPadrao: entrada.papeisPadrao,
      permitidaPorPapel,
      override: temOverride ? overridePorChave.get(chave) : null,
      efetiva: temOverride ? overridePorChave.get(chave) : permitidaPorPapel,
    };
  });

  return { usuario, acoes };
}

export async function definirPermissao({ empresaId, usuarioId, modulo, acao, permitida }) {
  await getUsuarioOrThrow({ empresaId, usuarioId });
  if (!acaoCatalogada(modulo, acao)) {
    throw new AppError(422, "ACAO_NAO_CATALOGADA", `Ação de permissão não catalogada: ${modulo}.${acao}.`);
  }
  return prisma.permissaoUsuario.upsert({
    where: { usuarioId_modulo_acao: { usuarioId, modulo, acao } },
    update: { permitida },
    create: { usuarioId, modulo, acao, permitida },
  });
}

export async function removerOverride({ empresaId, usuarioId, modulo, acao }) {
  await getUsuarioOrThrow({ empresaId, usuarioId });
  await prisma.permissaoUsuario.deleteMany({ where: { usuarioId, modulo, acao } });
}

// Redefinir senha de outro usuário exige a Admin API da Supabase (endpoint
// /auth/v1/admin/users/{id}), que só aceita a service_role key — uma
// credencial que este ambiente não tem cadastrada (só a URL do projeto).
// Sem ela, a única forma seria o próprio usuário usar "esqueci minha
// senha" pelo login normal.
export async function redefinirSenha({ empresaId, usuarioId, novaSenha }) {
  await getUsuarioOrThrow({ empresaId, usuarioId });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new AppError(
      501,
      "SUPABASE_SERVICE_ROLE_KEY_AUSENTE",
      "Redefinir senha direto pelo admin exige a service_role key da Supabase (Settings > API), ainda não configurada neste ambiente. Enquanto isso, o usuário pode redefinir a própria senha pelo fluxo de \"esqueci minha senha\" do login.",
    );
  }

  const resposta = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${usuarioId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ password: novaSenha }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    throw new AppError(502, "SUPABASE_ADMIN_API_ERRO", `Supabase recusou a redefinição de senha: ${detalhe}`);
  }

  return { redefinida: true };
}

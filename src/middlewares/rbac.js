import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buscarPapeisPadrao } from "./permissoesCatalogo.js";

// ADMIN sempre passa, mesmo que a lista de papéis exigida na rota não o
// inclua — evita que um requireRole(...) escrito sem "ADMIN" por descuido
// tranque o administrador fora de uma rota nova. É rede de segurança
// estrutural: hoje toda chamada já inclui "ADMIN" por convenção, mas essa
// garantia não deveria depender de ninguém lembrar disso em toda rota nova.
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      throw new AppError(403, "FORBIDDEN", "Você não tem permissão para executar esta ação.");
    }
    if (req.user.role === "ADMIN" || roles.includes(req.user.role)) {
      return next();
    }
    throw new AppError(403, "FORBIDDEN", "Você não tem permissão para executar esta ação.");
  };

// Resolve se `usuario` pode (modulo, acao): override em PermissaoUsuario
// manda, se existir; senão vale o papel padrão do catálogo. ADMIN sempre
// pode, antes de olhar qualquer override — mesma garantia estrutural do
// requireRole (ver comentário ali). Extraído do meio do requirePermissao
// pra também dar pra usar em leitura (esconder um campo da resposta), não
// só pra bloquear a rota inteira.
export async function usuarioPodePermissao(usuario, modulo, acao) {
  if (!usuario) return false;
  if (usuario.role === "ADMIN") return true;

  const override = await prisma.permissaoUsuario.findUnique({
    where: { usuarioId_modulo_acao: { usuarioId: usuario.id, modulo, acao } },
    select: { permitida: true },
  });
  if (override) return override.permitida;

  return buscarPapeisPadrao(modulo, acao).includes(usuario.role);
}

// Permissão fina por ação: se o usuário tiver um override cadastrado em
// PermissaoUsuario para (modulo, acao), ele decide (permite ou bloqueia,
// mesmo contra o papel padrão). Sem override, cai no papel padrão do
// catálogo — mesmo comportamento de requireRole de antes.
export const requirePermissao = (modulo, acao) =>
  asyncHandler(async (req, res, next) => {
    const pode = await usuarioPodePermissao(req.user, modulo, acao);
    if (!pode) {
      throw new AppError(403, "FORBIDDEN", "Você não tem permissão para executar esta ação.");
    }
    next();
  });

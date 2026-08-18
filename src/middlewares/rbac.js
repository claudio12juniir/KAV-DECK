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

// Permissão fina por ação: se o usuário tiver um override cadastrado em
// PermissaoUsuario para (modulo, acao), ele decide (permite ou bloqueia,
// mesmo contra o papel padrão). Sem override, cai no papel padrão do
// catálogo — mesmo comportamento de requireRole de antes.
//
// ADMIN sempre tem bypass total aqui, ANTES de olhar qualquer override — a
// tela de Controle de Acesso permite que um admin defina overrides pra
// qualquer usuário da empresa, inclusive outro admin; sem esse bypass,
// seria possível bloquear (por engano ou não) a conta de um admin numa
// ação catalogada, o que contraria a garantia de que ADMIN nunca perde
// acesso ao próprio sistema.
export const requirePermissao = (modulo, acao) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError(403, "FORBIDDEN", "Você não tem permissão para executar esta ação.");
    }

    if (req.user.role === "ADMIN") {
      return next();
    }

    const override = await prisma.permissaoUsuario.findUnique({
      where: { usuarioId_modulo_acao: { usuarioId: req.user.id, modulo, acao } },
      select: { permitida: true },
    });

    if (override) {
      if (!override.permitida) {
        throw new AppError(403, "FORBIDDEN", "Você não tem permissão para executar esta ação.");
      }
      return next();
    }

    const papeisPadrao = buscarPapeisPadrao(modulo, acao);
    if (!papeisPadrao.includes(req.user.role)) {
      throw new AppError(403, "FORBIDDEN", "Você não tem permissão para executar esta ação.");
    }
    next();
  });

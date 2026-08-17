import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buscarPapeisPadrao } from "./permissoesCatalogo.js";

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, "FORBIDDEN", "Você não tem permissão para executar esta ação.");
    }
    next();
  };

// Permissão fina por ação: se o usuário tiver um override cadastrado em
// PermissaoUsuario para (modulo, acao), ele decide (permite ou bloqueia,
// mesmo contra o papel padrão). Sem override, cai no papel padrão do
// catálogo — mesmo comportamento de requireRole de antes.
export const requirePermissao = (modulo, acao) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError(403, "FORBIDDEN", "Você não tem permissão para executar esta ação.");
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

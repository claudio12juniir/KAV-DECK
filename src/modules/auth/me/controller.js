import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const claimSessao = asyncHandler(async (req, res) => {
  const dispositivo = req.body.dispositivo ?? req.headers["user-agent"]?.slice(0, 200);
  const sessao = await service.claimSessao({
    usuarioId: req.user.id,
    empresaId: req.user.empresaId,
    sessaoId: req.body.sessaoId,
    dispositivo,
  });
  res.status(201).json({ sessaoId: sessao.sessaoId });
});

export const releaseSessao = asyncHandler(async (req, res) => {
  await service.releaseSessao({
    usuarioId: req.user.id,
    sessaoId: req.headers["x-session-id"],
  });
  res.status(204).end();
});

import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { permissaoParamSchema, redefinirSenhaSchema, upsertPermissaoSchema, usuarioIdParamSchema } from "./schema.js";

export const router = Router();

router.use(auth);
router.use(requireRole("ADMIN", "GESTOR"));

router.get("/catalogo", controller.listarCatalogo);
router.get("/usuarios", controller.listarUsuarios);
router.get("/:usuarioId", validate({ params: usuarioIdParamSchema }), controller.obterPermissoes);
router.patch(
  "/:usuarioId",
  validate({ params: usuarioIdParamSchema, body: upsertPermissaoSchema }),
  controller.definirPermissao,
);
router.delete(
  "/:usuarioId/:modulo/:acao",
  validate({ params: permissaoParamSchema }),
  controller.removerOverride,
);
router.post(
  "/:usuarioId/redefinir-senha",
  requireRole("ADMIN"),
  validate({ params: usuarioIdParamSchema, body: redefinirSenhaSchema }),
  controller.redefinirSenha,
);

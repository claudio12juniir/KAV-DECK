import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requirePermissao, requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { agruparSchema, baixaSchema, baixarLoteSchema, listTitulosQuerySchema, parcelarSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: listTitulosQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/baixar-lote",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ body: baixarLoteSchema }),
  controller.baixarLote,
);
router.post(
  "/:id/baixas",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ params: idParamSchema, body: baixaSchema }),
  controller.baixar,
);
router.patch(
  "/:id/cancelar",
  requirePermissao("FINANCEIRO", "CANCELAR_TITULO"),
  validate({ params: idParamSchema }),
  controller.cancelar,
);
router.post(
  "/:id/reverter-baixa",
  requirePermissao("FINANCEIRO", "REVERTER_BAIXA"),
  validate({ params: idParamSchema }),
  controller.reverterBaixa,
);
router.post(
  "/:id/parcelar",
  requirePermissao("FINANCEIRO", "PARCELAR_TITULO"),
  validate({ params: idParamSchema, body: parcelarSchema }),
  controller.parcelar,
);
router.post(
  "/:id/duplicar",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ params: idParamSchema }),
  controller.duplicar,
);
router.post(
  "/agrupar",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ body: agruparSchema }),
  controller.agrupar,
);

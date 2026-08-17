import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requirePermissao } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { ajusteEstoqueLoteSchema, ajusteEstoqueSchema, listMovimentosQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: listMovimentosQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/ajustes",
  requirePermissao("ESTOQUE", "AJUSTE_MANUAL"),
  validate({ body: ajusteEstoqueSchema }),
  controller.ajustar,
);
router.post(
  "/ajustes-lote",
  requirePermissao("ESTOQUE", "AJUSTE_MANUAL"),
  validate({ body: ajusteEstoqueLoteSchema }),
  controller.ajustarLote,
);

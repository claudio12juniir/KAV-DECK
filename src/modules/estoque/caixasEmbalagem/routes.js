import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import {
  createMovimentoComodatoSchema,
  createTipoCaixaEmbalagemSchema,
  updateTipoCaixaEmbalagemSchema,
} from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: paginationQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/",
  requireRole("ADMIN", "ESTOQUE"),
  validate({ body: createTipoCaixaEmbalagemSchema }),
  controller.create,
);
router.patch(
  "/:id",
  requireRole("ADMIN", "ESTOQUE"),
  validate({ params: idParamSchema, body: updateTipoCaixaEmbalagemSchema }),
  controller.update,
);
router.delete("/:id", requireRole("ADMIN", "ESTOQUE"), validate({ params: idParamSchema }), controller.remove);

router.post(
  "/:id/movimentos",
  requireRole("ADMIN", "ESTOQUE"),
  validate({ params: idParamSchema, body: createMovimentoComodatoSchema }),
  controller.registrarMovimento,
);

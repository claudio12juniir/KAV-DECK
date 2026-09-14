import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { listarItensQuerySchema, marcarImpressoSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: listarItensQuerySchema }), controller.listar);
router.get("/totais", validate({ query: listarItensQuerySchema }), controller.totais);
router.patch(
  "/:id/impresso",
  requireRole("COMPRADOR", "VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: marcarImpressoSchema }),
  controller.marcarImpresso,
);

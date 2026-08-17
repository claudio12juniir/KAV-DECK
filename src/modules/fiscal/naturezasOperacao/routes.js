import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { createNaturezaOperacaoSchema, updateNaturezaOperacaoSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: paginationQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/",
  requireRole("FISCAL", "ADMIN"),
  validate({ body: createNaturezaOperacaoSchema }),
  controller.create,
);
router.patch(
  "/:id",
  requireRole("FISCAL", "ADMIN"),
  validate({ params: idParamSchema, body: updateNaturezaOperacaoSchema }),
  controller.update,
);
router.delete("/:id", requireRole("FISCAL", "ADMIN"), validate({ params: idParamSchema }), controller.remove);

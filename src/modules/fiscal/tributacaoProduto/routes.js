import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { createTributacaoSchema, updateTributacaoSchema, listTributacaoQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: listTributacaoQuerySchema }), controller.list);
router.post(
  "/",
  requireRole("ADMIN", "GESTOR", "FISCAL"),
  validate({ body: createTributacaoSchema }),
  controller.create,
);
router.patch(
  "/:id",
  requireRole("ADMIN", "GESTOR", "FISCAL"),
  validate({ params: idParamSchema, body: updateTributacaoSchema }),
  controller.update,
);
router.delete(
  "/:id",
  requireRole("ADMIN", "GESTOR", "FISCAL"),
  validate({ params: idParamSchema }),
  controller.remove,
);

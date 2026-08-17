import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { createCentroCustoSchema, updateCentroCustoSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: paginationQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ body: createCentroCustoSchema }),
  controller.create,
);
router.patch(
  "/:id",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ params: idParamSchema, body: updateCentroCustoSchema }),
  controller.update,
);
router.delete("/:id", requireRole("FINANCEIRO", "ADMIN"), validate({ params: idParamSchema }), controller.remove);

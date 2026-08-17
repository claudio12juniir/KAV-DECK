import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { createChequeTerceiroSchema, listChequesQuerySchema, updateStatusChequeSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: listChequesQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ body: createChequeTerceiroSchema }),
  controller.create,
);
router.patch(
  "/:id/status",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ params: idParamSchema, body: updateStatusChequeSchema }),
  controller.updateStatus,
);

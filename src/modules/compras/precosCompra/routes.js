import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { listPrecosCompraQuerySchema, upsertPrecoCompraSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: listPrecosCompraQuerySchema }), controller.list);
router.patch(
  "/",
  requireRole("COMPRADOR", "ADMIN"),
  validate({ body: upsertPrecoCompraSchema }),
  controller.upsert,
);
router.delete("/:id", requireRole("COMPRADOR", "ADMIN"), validate({ params: idParamSchema }), controller.remove);

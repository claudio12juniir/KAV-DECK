import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { createProdutoSchema, updateProdutoSchema } from "./schema.js";
import { z } from "zod";

export const router = Router();

router.use(auth);

const listQuerySchema = paginationQuerySchema.extend({
  ativo: z.enum(["true", "false"]).optional(),
  q: z.string().min(1).max(120).optional(),
});

router.get("/", validate({ query: listQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post("/", requireRole("ADMIN", "GESTOR"), validate({ body: createProdutoSchema }), controller.create);
router.patch(
  "/:id",
  requireRole("ADMIN", "GESTOR"),
  validate({ params: idParamSchema, body: updateProdutoSchema }),
  controller.update,
);
router.delete("/:id", requireRole("ADMIN", "GESTOR"), validate({ params: idParamSchema }), controller.remove);

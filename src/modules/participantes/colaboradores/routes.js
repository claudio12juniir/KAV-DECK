import { Router } from "express";
import { z } from "zod";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { createColaboradorSchema, updateColaboradorSchema } from "./schema.js";

export const router = Router();

router.use(auth);

const listQuerySchema = paginationQuerySchema.extend({
  tipo: z.enum(["COMPRADOR", "VENDEDOR", "REPRESENTANTE", "SEPARADOR"]).optional(),
});

router.get("/", validate({ query: listQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/",
  requireRole("ADMIN", "GESTOR"),
  validate({ body: createColaboradorSchema }),
  controller.create,
);
router.patch(
  "/:id",
  requireRole("ADMIN", "GESTOR"),
  validate({ params: idParamSchema, body: updateColaboradorSchema }),
  controller.update,
);
router.delete("/:id", requireRole("ADMIN", "GESTOR"), validate({ params: idParamSchema }), controller.remove);

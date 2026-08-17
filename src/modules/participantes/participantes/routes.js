import { Router } from "express";
import { z } from "zod";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import {
  createParticipanteSchema,
  enderecoSchema,
  promoteClienteSchema,
  updateParticipanteSchema,
} from "./schema.js";

export const router = Router();

router.use(auth);

const listQuerySchema = paginationQuerySchema.extend({
  ativo: z.enum(["true", "false"]).optional(),
  q: z.string().min(1).max(120).optional(),
});
const enderecoParamSchema = z.object({ id: z.string().uuid(), enderecoId: z.string().uuid() });

router.get("/", validate({ query: listQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post("/", requireRole("ADMIN", "GESTOR"), validate({ body: createParticipanteSchema }), controller.create);
router.patch(
  "/:id",
  requireRole("ADMIN", "GESTOR"),
  validate({ params: idParamSchema, body: updateParticipanteSchema }),
  controller.update,
);
router.delete("/:id", requireRole("ADMIN", "GESTOR"), validate({ params: idParamSchema }), controller.remove);

router.post(
  "/:id/enderecos",
  requireRole("ADMIN", "GESTOR"),
  validate({ params: idParamSchema, body: enderecoSchema }),
  controller.addEndereco,
);
router.delete(
  "/:id/enderecos/:enderecoId",
  requireRole("ADMIN", "GESTOR"),
  validate({ params: enderecoParamSchema }),
  controller.removeEndereco,
);

router.post(
  "/:id/cliente",
  requireRole("ADMIN", "GESTOR"),
  validate({ params: idParamSchema, body: promoteClienteSchema }),
  controller.promoteToCliente,
);
router.post(
  "/:id/fornecedor",
  requireRole("ADMIN", "GESTOR"),
  validate({ params: idParamSchema }),
  controller.promoteToFornecedor,
);

import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { createGrupoEmpresasSchema, updateGrupoEmpresasSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: paginationQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/",
  requireRole("ADMIN", "GESTOR"),
  validate({ body: createGrupoEmpresasSchema }),
  controller.create,
);
router.patch(
  "/:id",
  requireRole("ADMIN", "GESTOR"),
  validate({ params: idParamSchema, body: updateGrupoEmpresasSchema }),
  controller.update,
);
router.delete("/:id", requireRole("ADMIN", "GESTOR"), validate({ params: idParamSchema }), controller.remove);

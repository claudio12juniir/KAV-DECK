import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { atualizarEmpresaSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", controller.obter);
router.patch(
  "/",
  requireRole("ADMIN", "GESTOR"),
  validate({ body: atualizarEmpresaSchema }),
  controller.atualizar,
);

import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { usuarioIdParamSchema } from "./schema.js";

export const router = Router();

router.use(auth);
router.use(requireRole("ADMIN", "GESTOR"));

router.get("/", controller.listar);
router.delete("/:usuarioId", validate({ params: usuarioIdParamSchema }), controller.revogar);

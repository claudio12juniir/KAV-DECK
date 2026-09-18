import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { atualizarConfiguracaoFinanceiraSchema } from "./schema.js";

export const router = Router();

router.use(auth);
router.use(requireRole("FINANCEIRO", "ADMIN"));

router.get("/", controller.obter);
router.patch("/", validate({ body: atualizarConfiguracaoFinanceiraSchema }), controller.atualizar);

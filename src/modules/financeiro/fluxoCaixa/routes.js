import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { fluxoCaixaQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);
// Mesmo gate do resto do módulo financeiro (títulos, caixa, contas
// bancárias) — projeção de fluxo de caixa é dado sensível da empresa.
router.use(requireRole("FINANCEIRO", "ADMIN"));

router.get("/", validate({ query: fluxoCaixaQuerySchema }), controller.projetar);

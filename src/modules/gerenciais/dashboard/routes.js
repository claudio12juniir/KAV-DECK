import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { faturamentoQuerySchema, titulosAnualQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);
// Dashboards de faturamento e de títulos a pagar/receber são visão
// gerencial (claude.md, seção 5: persona Gestor/Administrador).
router.use(requireRole("ADMIN", "GESTOR"));

router.get("/faturamento", validate({ query: faturamentoQuerySchema }), controller.faturamento);
router.get("/titulos-anual", validate({ query: titulosAnualQuerySchema }), controller.titulosAnual);

import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { relatorioFiscalQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);
// Mesmo gate do resto do módulo fiscal (notasFiscais, certificados,
// naturezas de operação) — relatório agregado e download de XML em lote
// não deveriam ficar mais abertos que a própria consulta de notas.
router.use(requireRole("FISCAL", "ADMIN"));

router.get("/por-cfop", validate({ query: relatorioFiscalQuerySchema }), controller.porCfop);
router.get("/por-cfop-uf", validate({ query: relatorioFiscalQuerySchema }), controller.porCfopUf);
router.get("/por-produto", validate({ query: relatorioFiscalQuerySchema }), controller.porProduto);

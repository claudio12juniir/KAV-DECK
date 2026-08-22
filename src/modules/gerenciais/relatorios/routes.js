import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { relatorioGerencialQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);
// DRE, DFC e vendas por produto/cliente são relatórios gerenciais
// (claude.md, seção 5: persona Gestor/Administrador).
router.use(requireRole("ADMIN", "GESTOR"));

router.get("/vendas-por-cliente", validate({ query: relatorioGerencialQuerySchema }), controller.vendasPorCliente);
router.get("/vendas-por-produto", validate({ query: relatorioGerencialQuerySchema }), controller.vendasPorProduto);
router.get("/dre", validate({ query: relatorioGerencialQuerySchema }), controller.dre);
router.get("/dfc", validate({ query: relatorioGerencialQuerySchema }), controller.dfc);
router.get(
  "/compras-por-fornecedor",
  validate({ query: relatorioGerencialQuerySchema }),
  controller.comprasPorFornecedor,
);
router.get("/fiscal", validate({ query: relatorioGerencialQuerySchema }), controller.resumoFiscal);
router.get("/colaboradores", controller.custosColaboradores);
router.get("/principal", validate({ query: relatorioGerencialQuerySchema }), controller.relatorioPrincipal);

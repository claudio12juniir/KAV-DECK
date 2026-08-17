import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { relatorioGerencialQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/vendas-por-cliente", validate({ query: relatorioGerencialQuerySchema }), controller.vendasPorCliente);
router.get("/vendas-por-produto", validate({ query: relatorioGerencialQuerySchema }), controller.vendasPorProduto);
router.get("/dre", validate({ query: relatorioGerencialQuerySchema }), controller.dre);
router.get("/dfc", validate({ query: relatorioGerencialQuerySchema }), controller.dfc);

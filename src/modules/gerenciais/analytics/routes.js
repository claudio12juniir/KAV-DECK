import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { analyticsQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);
// Curva ABC de produtos/clientes/fornecedores é inteligência de negócio da
// empresa toda — não é dado de operação do dia a dia de um vendedor ou
// separador (claude.md, seção 5: Analytics é persona Gestor/Administrador).
router.use(requireRole("ADMIN", "GESTOR"));

router.get("/curva-abc-produtos", validate({ query: analyticsQuerySchema }), controller.curvaAbcProdutos);
router.get("/curva-abc-clientes", validate({ query: analyticsQuerySchema }), controller.curvaAbcClientes);
router.get("/curva-abc-fornecedores", validate({ query: analyticsQuerySchema }), controller.curvaAbcFornecedores);

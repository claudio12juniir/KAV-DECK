import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { relatorioFiscalQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/por-cfop", validate({ query: relatorioFiscalQuerySchema }), controller.porCfop);
router.get("/por-cfop-uf", validate({ query: relatorioFiscalQuerySchema }), controller.porCfopUf);
router.get("/por-produto", validate({ query: relatorioFiscalQuerySchema }), controller.porProduto);

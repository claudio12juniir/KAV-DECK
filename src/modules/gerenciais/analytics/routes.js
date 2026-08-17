import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { analyticsQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/curva-abc-produtos", validate({ query: analyticsQuerySchema }), controller.curvaAbcProdutos);
router.get("/curva-abc-clientes", validate({ query: analyticsQuerySchema }), controller.curvaAbcClientes);
router.get("/curva-abc-fornecedores", validate({ query: analyticsQuerySchema }), controller.curvaAbcFornecedores);

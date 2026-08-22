import { Router } from "express";
import { autenticarSupabaseSemUsuario } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./controller.js";
import { cadastroEmpresaSchema } from "./schema.js";

export const router = Router();

router.use(autenticarSupabaseSemUsuario);

router.post("/empresa", validate({ body: cadastroEmpresaSchema }), controller.criarEmpresa);
router.post("/pagamento", controller.iniciarPagamento);

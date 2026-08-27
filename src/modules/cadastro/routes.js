import { Router } from "express";
import { autenticarSupabaseSemUsuario } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./controller.js";
import { cadastroEmpresaSchema, iniciarPagamentoSchema } from "./schema.js";

export const router = Router();

// O checkout é iniciado sem criar login, Empresa ou Usuario. A autenticação
// só passa a existir depois que o Mercado Pago confirmar a assinatura.
router.post("/pagamento", validate({ body: iniciarPagamentoSchema }), controller.iniciarPagamento);
router.get("/pagamento/:preapprovalId", controller.consultarPagamento);
router.post(
  "/empresa",
  autenticarSupabaseSemUsuario,
  validate({ body: cadastroEmpresaSchema }),
  controller.criarEmpresa,
);

import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { comprarAcessoSchema, pontoIdParamSchema, trocarCartaoSchema, trocarFormaPagamentoSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", controller.dashboard);
router.post("/acessos", requireRole("ADMIN"), validate({ body: comprarAcessoSchema }), controller.comprarAcesso);
router.delete(
  "/pontos/:pontoId",
  requireRole("ADMIN"),
  validate({ params: pontoIdParamSchema }),
  controller.cancelarPonto,
);
router.post("/cartao", requireRole("ADMIN"), validate({ body: trocarCartaoSchema }), controller.trocarCartao);
router.post(
  "/forma-pagamento",
  requireRole("ADMIN"),
  validate({ body: trocarFormaPagamentoSchema }),
  controller.trocarFormaPagamento,
);

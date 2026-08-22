import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { pontoIdParamSchema, trocarCartaoSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", controller.dashboard);
router.post("/pontos", requireRole("ADMIN"), controller.comprarPonto);
router.delete(
  "/pontos/:pontoId",
  requireRole("ADMIN"),
  validate({ params: pontoIdParamSchema }),
  controller.cancelarPonto,
);
router.post("/cartao", requireRole("ADMIN"), validate({ body: trocarCartaoSchema }), controller.trocarCartao);

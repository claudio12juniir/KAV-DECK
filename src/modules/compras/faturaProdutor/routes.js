import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { faturaProdutorQuerySchema, gerarFaturaProdutorSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: faturaProdutorQuerySchema }), controller.consultar);
router.post(
  "/gerar",
  requireRole("FINANCEIRO", "COMPRADOR", "ADMIN"),
  validate({ body: gerarFaturaProdutorSchema }),
  controller.gerar,
);

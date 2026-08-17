import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { createMovimentoCaixaSchema, listMovimentosCaixaQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: listMovimentosCaixaQuerySchema }), controller.list);
router.post(
  "/",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ body: createMovimentoCaixaSchema }),
  controller.create,
);

import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { upsertConfiguracaoFiscalSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", controller.obter);
router.patch(
  "/",
  requireRole("FISCAL", "ADMIN"),
  validate({ body: upsertConfiguracaoFiscalSchema }),
  controller.salvar,
);

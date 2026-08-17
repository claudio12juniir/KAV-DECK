import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { createDevolucaoSchema, listDevolucoesQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: listDevolucoesQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post("/", requireRole("VENDEDOR", "ADMIN"), validate({ body: createDevolucaoSchema }), controller.create);

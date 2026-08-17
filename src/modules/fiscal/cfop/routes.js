import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";

// CFOP é tabela global padronizada pela SEFAZ (sem empresaId) — somente
// leitura aqui. Escrita não é exposta via API multi-tenant: um ADMIN de um
// tenant não pode ter permissão de alterar uma tabela compartilhada por
// todos os outros tenants. Povoamento é feito por seed/import, fora da API.
export const router = Router();

router.use(auth);

router.get("/", validate({ query: paginationQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);

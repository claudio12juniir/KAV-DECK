import { Router } from "express";
import { z } from "zod";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { listBloqueiosQuerySchema, solicitarBloqueioSchema, updateBloqueioSchema } from "./schema.js";

export const router = Router();

router.use(auth);

const listQuerySchema = paginationQuerySchema.extend({ q: z.string().min(1).max(120).optional() });
const bloqueioParamSchema = z.object({ id: z.string().uuid(), bloqueioId: z.string().uuid() });

router.get("/", validate({ query: listQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.patch(
  "/:id/bloqueio",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ params: idParamSchema, body: updateBloqueioSchema }),
  controller.updateBloqueio,
);
router.get(
  "/:id/bloqueios",
  validate({ params: idParamSchema, query: listBloqueiosQuerySchema }),
  controller.listarBloqueios,
);
router.post(
  "/:id/bloqueios",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ params: idParamSchema, body: solicitarBloqueioSchema }),
  controller.solicitarBloqueio,
);
router.patch(
  "/:id/bloqueios/:bloqueioId/analisar",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ params: bloqueioParamSchema }),
  controller.colocarBloqueioEmAnalise,
);
router.patch(
  "/:id/bloqueios/:bloqueioId/autorizar",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ params: bloqueioParamSchema }),
  controller.autorizarBloqueio,
);
router.patch(
  "/:id/bloqueios/:bloqueioId/negar",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ params: bloqueioParamSchema }),
  controller.negarBloqueio,
);

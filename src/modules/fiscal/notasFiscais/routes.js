import { Router } from "express";
import { z } from "zod";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import {
  createNotaFiscalSchema,
  downloadXmlLoteQuerySchema,
  enviarEmailSchema,
  itemNotaFiscalSchema,
  listNotasFiscaisQuerySchema,
  listarItensNotaQuerySchema,
  manifestacaoSchema,
  updateStatusSchema,
} from "./schema.js";

export const router = Router();

router.use(auth);

const itemParamSchema = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

router.get("/", validate({ query: listNotasFiscaisQuerySchema }), controller.list);
router.get("/xml", validate({ query: downloadXmlLoteQuerySchema }), controller.downloadXmlLote);
router.get("/itens", validate({ query: listarItensNotaQuerySchema }), controller.listarItens);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/",
  requireRole("FISCAL", "ADMIN"),
  validate({ body: createNotaFiscalSchema }),
  controller.create,
);
router.post(
  "/:id/itens",
  requireRole("FISCAL", "ADMIN"),
  validate({ params: idParamSchema, body: itemNotaFiscalSchema }),
  controller.addItem,
);
router.delete(
  "/:id/itens/:itemId",
  requireRole("FISCAL", "ADMIN"),
  validate({ params: itemParamSchema }),
  controller.removeItem,
);
router.patch(
  "/:id/status",
  requireRole("FISCAL", "ADMIN"),
  validate({ params: idParamSchema, body: updateStatusSchema }),
  controller.updateStatus,
);
router.post(
  "/:id/manifestacoes",
  requireRole("FISCAL", "ADMIN"),
  validate({ params: idParamSchema, body: manifestacaoSchema }),
  controller.addManifestacao,
);
router.post(
  "/:id/enviar-email",
  requireRole("FISCAL", "ADMIN"),
  validate({ params: idParamSchema, body: enviarEmailSchema }),
  controller.enviarEmail,
);
router.post(
  "/:id/transmitir",
  requireRole("FISCAL", "ADMIN"),
  validate({ params: idParamSchema }),
  controller.transmitir,
);

import { Router } from "express";
import { z } from "zod";
import { auth } from "../../../middlewares/auth.js";
import { requirePermissao, requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import {
  agruparNfSchema,
  aplicarDescontoSchema,
  atribuirItinerarioSchema,
  createPedidoVendaSchema,
  dividirSchema,
  faturarSchema,
  itemPedidoVendaSchema,
  separarSchema,
  updateStatusSchema,
} from "./schema.js";

export const router = Router();

router.use(auth);

const listQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["ABERTO", "SEPARACAO", "FATURADO", "CANCELADO"]).optional(),
  separadorId: z.string().uuid().optional(),
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
});
const itemParamSchema = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

router.get("/", validate({ query: listQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ body: createPedidoVendaSchema }),
  controller.create,
);
router.patch(
  "/:id/status",
  requirePermissao("VENDAS", "ALTERAR_STATUS_PEDIDO"),
  validate({ params: idParamSchema, body: updateStatusSchema }),
  controller.updateStatus,
);
router.post(
  "/:id/itens",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: itemPedidoVendaSchema }),
  controller.addItem,
);
router.delete(
  "/:id/itens/:itemId",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ params: itemParamSchema }),
  controller.removeItem,
);
router.post(
  "/:id/faturar",
  requireRole("SEPARADOR", "VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: faturarSchema }),
  controller.faturar,
);
router.post(
  "/:id/duplicar",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema }),
  controller.duplicar,
);
router.post(
  "/agrupar-nf",
  requireRole("FISCAL", "ADMIN"),
  validate({ body: agruparNfSchema }),
  controller.agruparNF,
);
router.post(
  "/:id/separar",
  requireRole("SEPARADOR", "VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: separarSchema }),
  controller.separar,
);
router.patch(
  "/:id/desconto",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: aplicarDescontoSchema }),
  controller.aplicarDesconto,
);
router.post(
  "/:id/dividir",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: dividirSchema }),
  controller.dividir,
);
router.patch(
  "/:id/itinerario",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: atribuirItinerarioSchema }),
  controller.atribuirItinerario,
);

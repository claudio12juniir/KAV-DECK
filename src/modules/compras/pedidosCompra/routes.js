import { Router } from "express";
import { z } from "zod";
import { auth } from "../../../middlewares/auth.js";
import { requirePermissao, requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import {
  aplicarFreteSchema,
  createPedidoCompraSchema,
  estornarLoteSchema,
  favoritosQuerySchema,
  importarItensSchema,
  itemPedidoCompraSchema,
  listarItensQuerySchema,
  receberSchema,
  updateStatusSchema,
} from "./schema.js";

export const router = Router();

router.use(auth);

const listQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["ABERTO", "APROVADO", "RECEBIDO_PARCIAL", "RECEBIDO", "CANCELADO"]).optional(),
});
const itemParamSchema = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

router.get("/", validate({ query: listQuerySchema }), controller.list);
router.get("/itens", validate({ query: listarItensQuerySchema }), controller.listarItens);
router.get("/favoritos", validate({ query: favoritosQuerySchema }), controller.favoritos);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/",
  requireRole("COMPRADOR", "ADMIN"),
  validate({ body: createPedidoCompraSchema }),
  controller.create,
);
router.patch(
  "/:id/status",
  requirePermissao("COMPRAS", "ALTERAR_STATUS_PEDIDO"),
  validate({ params: idParamSchema, body: updateStatusSchema }),
  controller.updateStatus,
);
router.post(
  "/:id/itens",
  requireRole("COMPRADOR", "ADMIN"),
  validate({ params: idParamSchema, body: itemPedidoCompraSchema }),
  controller.addItem,
);
router.delete(
  "/:id/itens/:itemId",
  requireRole("COMPRADOR", "ADMIN"),
  validate({ params: itemParamSchema }),
  controller.removeItem,
);
router.post(
  "/:id/recebimento",
  requireRole("ESTOQUE", "ADMIN"),
  validate({ params: idParamSchema, body: receberSchema }),
  controller.receber,
);
router.post(
  "/:id/duplicar",
  requireRole("COMPRADOR", "ADMIN"),
  validate({ params: idParamSchema }),
  controller.duplicar,
);
router.post(
  "/estornar-lote",
  requirePermissao("COMPRAS", "ALTERAR_STATUS_PEDIDO"),
  validate({ body: estornarLoteSchema }),
  controller.estornarLote,
);
router.post(
  "/:id/importar-itens",
  requireRole("COMPRADOR", "ADMIN"),
  validate({ params: idParamSchema, body: importarItensSchema }),
  controller.importarItens,
);
router.patch(
  "/:id/frete",
  requireRole("COMPRADOR", "ADMIN"),
  validate({ params: idParamSchema, body: aplicarFreteSchema }),
  controller.aplicarFrete,
);

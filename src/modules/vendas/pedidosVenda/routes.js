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
  arquivarSchema,
  atribuirItinerarioSchema,
  atualizarClienteSchema,
  atualizarVendedorSchema,
  createPedidoVendaSchema,
  dividirSchema,
  faturarSchema,
  favoritosQuerySchema,
  importarItensSchema,
  itemPedidoVendaSchema,
  separarSchema,
  updateStatusSchema,
} from "./schema.js";

export const router = Router();

router.use(auth);

// "true"/"false" cru da query string — z.coerce.boolean() não serve aqui
// porque Boolean("false") é true; precisa mapear os dois valores explícitos.
const booleanQueryParam = () =>
  z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional();

const listQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["ABERTO", "SEPARACAO", "FATURADO", "CANCELADO"]).optional(),
  // Filtros rápidos multi-seleção da Consulta de Pedidos (seção 6 do
  // MAPEAMENTO_VENDAS_SPACESOFT.md): "ABERTO,FATURADO" etc., substituindo o
  // antigo `filtro` de seleção única para os 3 baldes de status.
  statuses: z.string().optional(),
  // `filtro` agora cobre só as situações derivadas que não são um status —
  // EM_ABERTO/CANCELADO migraram pra `statuses`, ARQUIVADO virou o parâmetro
  // `arquivado` dedicado abaixo.
  filtro: z.enum(["LIQUIDADO", "AGRUPADO"]).optional(),
  clienteTexto: z.string().optional(),
  vendedorId: z.string().uuid().optional(),
  periodo: z.enum(["MANHA", "TARDE", "NOITE", "SOS", "RETIRA"]).optional(),
  rotaEntregaId: z.string().uuid().optional(),
  arquivado: booleanQueryParam(),
  separadorId: z.string().uuid().optional(),
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
});
const itemParamSchema = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

router.get("/", validate({ query: listQuerySchema }), controller.list);
router.get("/favoritos", validate({ query: favoritosQuerySchema }), controller.favoritos);
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
router.patch(
  "/:id/arquivar",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: arquivarSchema }),
  controller.arquivar,
);
router.patch(
  "/:id/vendedor",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: atualizarVendedorSchema }),
  controller.atualizarVendedor,
);
router.patch(
  "/:id/cliente",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: atualizarClienteSchema }),
  controller.atualizarCliente,
);
router.post(
  "/:id/importar-itens",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: importarItensSchema }),
  controller.importarItens,
);

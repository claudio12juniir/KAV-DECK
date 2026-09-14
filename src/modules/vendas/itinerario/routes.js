import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import {
  atualizarItinerarioSchema,
  consultarItinerarioQuerySchema,
  criarItinerarioSchema,
  gerarAutomaticoSchema,
  gerarFaturaItinerarioSchema,
  vincularPedidoSchema,
} from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: consultarItinerarioQuerySchema }), controller.consultar);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ body: criarItinerarioSchema }),
  controller.criar,
);
router.post(
  "/gerar-automatico",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ body: gerarAutomaticoSchema }),
  controller.gerarAutomatico,
);
router.post(
  "/gerar-fatura",
  requireRole("FINANCEIRO", "ADMIN"),
  validate({ body: gerarFaturaItinerarioSchema }),
  controller.gerarFatura,
);
router.patch(
  "/:id/pedidos",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: vincularPedidoSchema }),
  controller.vincularPedido,
);
router.patch(
  "/:id",
  requireRole("VENDEDOR", "ADMIN"),
  validate({ params: idParamSchema, body: atualizarItinerarioSchema }),
  controller.atualizar,
);

import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { listarLotesQuerySchema, listarMovimentosQuerySchema, loteParamSchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/entradas", validate({ query: listarMovimentosQuerySchema }), controller.entradas);
router.get("/saidas", validate({ query: listarMovimentosQuerySchema }), controller.saidas);
router.get("/lotes", validate({ query: listarLotesQuerySchema }), controller.lotes);
router.get("/lotes/:loteId", validate({ params: loteParamSchema }), controller.porLote);

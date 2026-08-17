import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { faturamentoQuerySchema, titulosAnualQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/faturamento", validate({ query: faturamentoQuerySchema }), controller.faturamento);
router.get("/titulos-anual", validate({ query: titulosAnualQuerySchema }), controller.titulosAnual);

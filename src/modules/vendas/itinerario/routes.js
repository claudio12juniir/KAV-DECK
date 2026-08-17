import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { consultarItinerarioQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: consultarItinerarioQuerySchema }), controller.consultar);

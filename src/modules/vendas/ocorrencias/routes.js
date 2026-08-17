import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { createOcorrenciaSchema, listOcorrenciasQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: listOcorrenciasQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post("/", validate({ body: createOcorrenciaSchema }), controller.create);

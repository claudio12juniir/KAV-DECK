import { Router } from "express";
import { z } from "zod";
import { auth } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";

export const router = Router();

router.use(auth);

const listQuerySchema = paginationQuerySchema.extend({ q: z.string().min(1).max(120).optional() });

router.get("/", validate({ query: listQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);

import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { listLogsQuerySchema, listUltimasQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/ultimas", validate({ query: listUltimasQuerySchema }), controller.listUltimas);
router.get("/", validate({ query: listLogsQuerySchema }), controller.list);

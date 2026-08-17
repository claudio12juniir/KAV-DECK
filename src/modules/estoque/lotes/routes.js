import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import { listLotesQuerySchema } from "./schema.js";

export const router = Router();

router.use(auth);

router.get("/", validate({ query: listLotesQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);

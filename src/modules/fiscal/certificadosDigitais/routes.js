import { Router } from "express";
import multer from "multer";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import * as controller from "./controller.js";
import {
  createCertificadoDigitalSchema,
  updateCertificadoDigitalSchema,
  uploadCertificadoDigitalSchema,
} from "./schema.js";

export const router = Router();

// Certificado .pfx fica só em memória — repassado direto pra NFe.io e
// descartado, nunca gravado em disco (ver service.js `upload`).
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(auth);

router.get("/", validate({ query: paginationQuerySchema }), controller.list);
router.get("/:id", validate({ params: idParamSchema }), controller.getById);
router.post(
  "/",
  requireRole("FISCAL", "ADMIN"),
  validate({ body: createCertificadoDigitalSchema }),
  controller.create,
);
router.patch(
  "/:id",
  requireRole("FISCAL", "ADMIN"),
  validate({ params: idParamSchema, body: updateCertificadoDigitalSchema }),
  controller.update,
);
router.delete("/:id", requireRole("FISCAL", "ADMIN"), validate({ params: idParamSchema }), controller.remove);

router.post(
  "/upload",
  requireRole("FISCAL", "ADMIN"),
  upload.single("file"),
  validate({ body: uploadCertificadoDigitalSchema }),
  controller.upload,
);

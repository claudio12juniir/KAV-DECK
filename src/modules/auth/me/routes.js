import { Router } from "express";
import { auth, authSemChecagemDeSessao } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import * as controller from "./controller.js";
import { claimSessaoSchema } from "./schema.js";

export const router = Router();

// GET / usa a checagem normal (com sessão única) — o frontend sempre
// reivindica a sessão (POST /sessao) antes de chamar isso, então por essa
// ordem o próprio "quem sou eu" já fica sujeito à exclusividade.
router.get("/", auth, controller.getMe);
router.post(
  "/sessao",
  authSemChecagemDeSessao,
  validate({ body: claimSessaoSchema }),
  controller.claimSessao,
);
router.delete("/sessao", authSemChecagemDeSessao, controller.releaseSessao);

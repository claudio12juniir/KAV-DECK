import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";

export const router = Router();

router.get("/", auth, (req, res) => {
  res.json(req.user);
});

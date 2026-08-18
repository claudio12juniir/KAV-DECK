import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.js";
import { realtimeInvalidate } from "./middlewares/realtimeInvalidate.js";
import { router } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  // Registra o listener de invalidação antes de entrar no router: ele só
  // lê req.user (preenchido depois, pelo middleware `auth` de cada
  // sub-rota) no momento em que a resposta termina, então a ordem aqui só
  // precisa garantir que o listener exista antes do res.end() acontecer.
  app.use("/api/v1", realtimeInvalidate, router);

  app.use((req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Rota não encontrada." } });
  });

  app.use(errorHandler);

  return app;
}

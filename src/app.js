import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.js";
import { realtimeInvalidate } from "./middlewares/realtimeInvalidate.js";
import { router } from "./routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDistDir = path.join(__dirname, "..", "web", "dist");

export function createApp() {
  const app = express();

  // CSP padrão do helmet bloquearia as chamadas do frontend pro Supabase
  // (auth) e pras fontes do Google — agora que este servidor também serve
  // o HTML/JS da SPA, não só JSON de API.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  // Registra o listener de invalidação antes de entrar no router: ele só
  // lê req.user (preenchido depois, pelo middleware `auth` de cada
  // sub-rota) no momento em que a resposta termina, então a ordem aqui só
  // precisa garantir que o listener exista antes do res.end() acontecer.
  app.use("/api/v1", realtimeInvalidate, router);

  // Serve o frontend web (React) buildado a partir do mesmo backend, para
  // que o app desktop (Electron) carregue a página direto por HTTPS em vez
  // de empacotá-la localmente — atualizar o frontend vira só um deploy,
  // sem gerar instalador novo. `web/dist` só existe se `npm run build`
  // rodou em `web/` antes (ausente em dev local do backend puro).
  if (fs.existsSync(webDistDir)) {
    app.use(express.static(webDistDir));
    app.get(/^(?!\/api\/v1).*/, (req, res) => {
      res.sendFile(path.join(webDistDir, "index.html"));
    });
  }

  app.use((req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Rota não encontrada." } });
  });

  app.use(errorHandler);

  return app;
}

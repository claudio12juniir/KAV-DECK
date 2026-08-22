import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { iniciarCronAssinaturas } from "./jobs/assinaturasCron.js";
import { initRealtime } from "./realtime/index.js";

const port = process.env.PORT || 3000;
const app = createApp();
const httpServer = createServer(app);

initRealtime(httpServer);
iniciarCronAssinaturas();

httpServer.listen(port, () => {
  console.log(`KAV DECK API rodando na porta ${port} (HTTP + Socket.io)`);
});

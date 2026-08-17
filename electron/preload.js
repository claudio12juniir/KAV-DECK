const { contextBridge, ipcRenderer } = require("electron");

// Lido de forma síncrona antes da página carregar, para que o apiClient.js
// do frontend enxergue a URL do servidor já na primeira avaliação do módulo.
const apiUrl = ipcRenderer.sendSync("kav:get-api-url-sync");

contextBridge.exposeInMainWorld("__KAV_DESKTOP_API_URL__", apiUrl);
contextBridge.exposeInMainWorld("kavDesktop", {
  isDesktop: true,
  getApiUrl: () => ipcRenderer.invoke("kav:get-api-url"),
  setApiUrl: (url) => ipcRenderer.invoke("kav:set-api-url", url),
});

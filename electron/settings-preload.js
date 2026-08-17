const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kavSettings", {
  getApiUrl: () => ipcRenderer.invoke("kav:get-api-url"),
  setApiUrl: (url) => ipcRenderer.invoke("kav:set-api-url", url),
});

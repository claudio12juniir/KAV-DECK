const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const isDev = !app.isPackaged;
const userDataDir = app.getPath("userData");
const configPath = path.join(userDataDir, "config.json");

function loadDefaultConfig() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "default-config.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return { apiUrl: "http://localhost:3000/api/v1" };
  }
}

function readConfig() {
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return { ...loadDefaultConfig(), ...JSON.parse(raw) };
  } catch {
    return loadDefaultConfig();
  }
}

function writeConfig(partial) {
  const next = { ...readConfig(), ...partial };
  fs.mkdirSync(userDataDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(next, null, 2), "utf-8");
  return next;
}

let mainWindow = null;
let settingsWindow = null;

function getStartUrl() {
  if (isDev) return process.env.ELECTRON_START_URL || "http://localhost:5173";
  // Em produção o Electron carrega o frontend direto do backend (que agora
  // também serve o build do web/dist), em vez de um arquivo empacotado no
  // instalador — assim atualizar o frontend é só um deploy, sem gerar
  // instalador novo pro cliente baixar.
  return readConfig().apiUrl.replace(/\/api\/v1\/?$/, "");
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#0f1f17",
    title: "KAV DECK",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadURL(getStartUrl());

  mainWindow.webContents.on("did-finish-load", async () => {
    console.log("[kav-desktop] página carregada:", mainWindow.webContents.getURL());
    if (isDev) {
      const injectedApiUrl = await mainWindow.webContents.executeJavaScript("window.__KAV_DESKTOP_API_URL__");
      console.log("[kav-desktop] URL de API injetada no frontend:", injectedApiUrl);
    }
  });
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("[kav-desktop] falha ao carregar:", validatedURL, errorCode, errorDescription);
  });

  // Links externos (ex.: link para XML/PDF gerado com http(s)://) abrem no
  // navegador do sistema, não substituem a janela do app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function openSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 480,
    height: 280,
    resizable: false,
    minimizable: false,
    maximizable: false,
    parent: mainWindow ?? undefined,
    modal: Boolean(mainWindow),
    title: "Configurar servidor",
    webPreferences: {
      preload: path.join(__dirname, "settings-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.loadFile(path.join(__dirname, "settings.html"));
  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

function buildMenu() {
  const template = [
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
          },
        ]
      : []),
    {
      label: "Editar",
      submenu: [{ role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }],
    },
    {
      label: "Visualizar",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Servidor",
      submenu: [{ label: "Configurar servidor...", click: () => openSettingsWindow() }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.on("kav:get-api-url-sync", (event) => {
  event.returnValue = readConfig().apiUrl;
});
ipcMain.handle("kav:get-api-url", () => readConfig().apiUrl);
ipcMain.handle("kav:set-api-url", (_event, url) => {
  const next = writeConfig({ apiUrl: url });
  if (settingsWindow) settingsWindow.close();
  if (mainWindow) mainWindow.loadURL(getStartUrl());
  return next.apiUrl;
});

app.whenReady().then(() => {
  buildMenu();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

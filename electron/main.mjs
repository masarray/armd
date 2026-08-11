import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ID = "com.masarray.inkwell";
const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown", ".mdx"]);
const DEVELOPMENT_URL = process.env.ELECTRON_RENDERER_URL ?? "http://127.0.0.1:8080";

let mainWindow = null;
let pendingFilePaths = [];

app.setName("Inkwell");
if (process.platform === "win32") app.setAppUserModelId(APP_ID);

function normalizeMarkdownPath(candidate) {
  if (typeof candidate !== "string" || candidate.startsWith("--")) return null;
  const unquoted = candidate.replace(/^"|"$/g, "");
  const resolved = path.resolve(unquoted);
  if (!MARKDOWN_EXTENSIONS.has(path.extname(resolved).toLowerCase())) return null;
  return existsSync(resolved) ? resolved : null;
}

function markdownPathsFromArgs(args) {
  return args.map(normalizeMarkdownPath).filter(Boolean);
}

function initialMarkdownPaths() {
  return markdownPathsFromArgs(process.argv.slice(app.isPackaged ? 1 : 2));
}

async function readMarkdownDocument(filePath) {
  app.addRecentDocument(filePath);
  return {
    path: filePath,
    name: path.basename(filePath),
    content: await readFile(filePath, "utf8"),
  };
}

async function sendMarkdownToRenderer(filePath) {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isLoading()) {
    pendingFilePaths.push(filePath);
    return;
  }

  try {
    mainWindow.webContents.send("desktop:open-markdown", await readMarkdownDocument(filePath));
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      type: "error",
      title: "Could not open Markdown file",
      message: `Inkwell could not open ${path.basename(filePath)}.`,
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

async function flushPendingFiles() {
  const files = [...new Set(pendingFilePaths)];
  pendingFilePaths = [];
  for (const filePath of files) await sendMarkdownToRenderer(filePath);
}

function registerIpcHandlers() {
  ipcMain.handle("desktop:open-dialog", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Open Markdown file",
      properties: ["openFile"],
      filters: [
        { name: "Markdown", extensions: ["md", "markdown", "mdx"] },
        { name: "All files", extensions: ["*"] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return await readMarkdownDocument(result.filePaths[0]);
  });

  ipcMain.handle("desktop:save-markdown", async (_event, payload) => {
    const content = typeof payload?.content === "string" ? payload.content : "";
    let filePath = typeof payload?.path === "string" && payload.path ? payload.path : null;

    if (!filePath) {
      const suggestedName =
        typeof payload?.suggestedName === "string" && payload.suggestedName.trim()
          ? payload.suggestedName.trim()
          : "untitled.md";
      const result = await dialog.showSaveDialog(mainWindow, {
        title: "Save Markdown file",
        defaultPath: path.join(app.getPath("documents"), suggestedName),
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });
      if (result.canceled || !result.filePath) return null;
      filePath = result.filePath;
    }

    await writeFile(filePath, content, "utf8");
    app.addRecentDocument(filePath);
    return { path: filePath, name: path.basename(filePath) };
  });

  ipcMain.handle("desktop:print-pdf", async (event, payload) => {
    const suggestedBase =
      typeof payload?.suggestedName === "string" && payload.suggestedName.trim()
        ? payload.suggestedName.trim().replace(/\.(md|markdown|mdx)$/i, "")
        : "document";
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Export PDF",
      defaultPath: path.join(app.getPath("documents"), `${suggestedBase}.pdf`),
      filters: [{ name: "PDF document", extensions: ["pdf"] }],
    });
    if (result.canceled || !result.filePath) return null;

    const pdf = await event.sender.printToPDF({
      pageSize: "A4",
      preferCSSPageSize: true,
      printBackground: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    await writeFile(result.filePath, pdf);
    return { path: result.filePath, name: path.basename(result.filePath) };
  });

  ipcMain.handle("desktop:show-in-folder", async (_event, filePath) => {
    if (typeof filePath === "string" && filePath) shell.showItemInFolder(filePath);
  });
}

async function createWindow() {
  const productionEntry = path.join(process.resourcesPath, "app-dist", "index.html");
  const rendererUrl = app.isPackaged ? pathToFileURL(productionEntry).toString() : DEVELOPMENT_URL;

  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 720,
    minHeight: 520,
    show: false,
    backgroundColor: "#ffffff",
    title: "Inkwell",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowed = app.isPackaged
      ? url === rendererUrl || url.startsWith(`${rendererUrl}#`)
      : new URL(url).origin === new URL(rendererUrl).origin;
    if (allowed) return;

    event.preventDefault();
    if (/^https?:/i.test(url)) void shell.openExternal(url);
  });

  mainWindow.webContents.once("did-finish-load", () => void flushPendingFiles());
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (app.isPackaged) {
    await mainWindow.loadFile(productionEntry);
  } else {
    await mainWindow.loadURL(DEVELOPMENT_URL);
  }
}

pendingFilePaths.push(...initialMarkdownPaths());

const initialData = { filePaths: pendingFilePaths };
const gotSingleInstanceLock = app.requestSingleInstanceLock(initialData);
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine, _workingDirectory, additionalData) => {
    const supplied = Array.isArray(additionalData?.filePaths) ? additionalData.filePaths : [];
    const paths = [...supplied, ...markdownPathsFromArgs(commandLine)];
    if (paths.length === 0) {
      if (mainWindow?.isMinimized()) mainWindow.restore();
      mainWindow?.show();
      mainWindow?.focus();
      return;
    }
    for (const filePath of new Set(paths)) void sendMarkdownToRenderer(filePath);
  });

  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    const normalized = normalizeMarkdownPath(filePath);
    if (normalized) void sendMarkdownToRenderer(normalized);
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    registerIpcHandlers();
    await createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) void createWindow();
    });
  }).catch(async (error) => {
    await dialog.showMessageBox({
      type: "error",
      title: "Inkwell could not start",
      message: "The desktop application could not be started.",
      detail: error instanceof Error ? error.stack ?? error.message : String(error),
    });
    app.quit();
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

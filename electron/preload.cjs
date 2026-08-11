const { contextBridge, ipcRenderer } = require("electron");

const openListeners = new Set();
const pendingDocuments = [];

ipcRenderer.on("desktop:open-markdown", (_event, document) => {
  if (openListeners.size === 0) {
    pendingDocuments.push(document);
    return;
  }
  for (const listener of openListeners) listener(document);
});

contextBridge.exposeInMainWorld("inkwellDesktop", {
  isDesktop: true,
  openMarkdown: () => ipcRenderer.invoke("desktop:open-dialog"),
  saveMarkdown: (payload) => ipcRenderer.invoke("desktop:save-markdown", payload),
  printToPdf: (payload) => ipcRenderer.invoke("desktop:print-pdf", payload),
  showInFolder: (filePath) => ipcRenderer.invoke("desktop:show-in-folder", filePath),
  onOpenMarkdown: (listener) => {
    if (typeof listener !== "function") return () => {};
    openListeners.add(listener);
    while (pendingDocuments.length > 0) listener(pendingDocuments.shift());
    return () => openListeners.delete(listener);
  },
});

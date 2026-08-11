// Local file I/O for .md documents.
// Electron uses a narrow IPC bridge; browsers use File System Access API with a download fallback.

export type FileHandle = {
  name: string;
  path?: string;
  handle?: FileSystemFileHandle;
};

const hasDesktopBridge = () =>
  typeof window !== "undefined" && window.inkwellDesktop?.isDesktop === true;

const hasFsAccess = () =>
  typeof window !== "undefined" && "showOpenFilePicker" in window;

export async function openMarkdownFile(): Promise<{ handle: FileHandle; content: string } | null> {
  if (hasDesktopBridge()) {
    const result = await window.inkwellDesktop!.openMarkdown();
    if (!result) return null;
    return {
      handle: { name: result.name, path: result.path },
      content: result.content,
    };
  }

  if (hasFsAccess()) {
    try {
      // @ts-expect-error - types missing in some TS libs
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Markdown",
            accept: { "text/markdown": [".md", ".markdown", ".mdx"] },
          },
        ],
        multiple: false,
      });
      const file = await handle.getFile();
      const content = await file.text();
      return { handle: { name: file.name, handle }, content };
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return null;
      throw err;
    }
  }

  return await new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.mdx,text/markdown";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const content = await file.text();
      resolve({ handle: { name: file.name }, content });
    };
    input.click();
  });
}

export async function saveMarkdownFile(
  handle: FileHandle | null,
  content: string,
): Promise<FileHandle | null> {
  if (hasDesktopBridge()) {
    const result = await window.inkwellDesktop!.saveMarkdown({
      path: handle?.path ?? null,
      suggestedName: handle?.name ?? "untitled.md",
      content,
    });
    if (!result) return null;
    return { name: result.name, path: result.path };
  }

  if (handle?.handle && hasFsAccess()) {
    try {
      const writable = await handle.handle.createWritable();
      await writable.write(content);
      await writable.close();
      return handle;
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return null;
      throw err;
    }
  }

  if (hasFsAccess()) {
    try {
      // @ts-expect-error - types missing in some TS libs
      const newHandle: FileSystemFileHandle = await window.showSaveFilePicker({
        suggestedName: handle?.name ?? "untitled.md",
        types: [
          {
            description: "Markdown",
            accept: { "text/markdown": [".md"] },
          },
        ],
      });
      const writable = await newHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return { name: newHandle.name, handle: newHandle };
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return null;
      throw err;
    }
  }

  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = handle?.name ?? "untitled.md";
  a.click();
  URL.revokeObjectURL(url);
  return handle;
}

export function countWords(text: string): number {
  const stripped = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_~\-]/g, " ");
  const words = stripped.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 220));
}

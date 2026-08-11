import { useCallback, useEffect, useState } from "react";
import { WysiwygEditor } from "./components/editor/WysiwygEditor";
import { RawEditor } from "./components/editor/RawEditor";
import { Titlebar } from "./components/editor/Titlebar";
import { Footer } from "./components/editor/Footer";
import {
  openMarkdownFile,
  saveMarkdownFile,
  countWords,
  readingMinutes,
  type FileHandle,
} from "./lib/file-io";

const WELCOME_MD = `# Welcome to Inkwell

A quiet place to write markdown. Type the way you would in any editor — **bold**, _italic_, [links](https://example.com), and lists all just work.

## Two ways to write

1. **Preview mode** — write directly in the rendered document and use the formatting toolbar above it.
2. **Raw mode** — plain \`.md\` for when you want to see the marks themselves.

Toggle between them from the top-right, or press \`Ctrl / Cmd + /\`.

> A cursor, a page, and nothing else in the way.

- [x] Open a \`.md\` file
- [ ] Write something worth keeping
- [ ] Save it back to disk

Happy writing.
`;

const STORAGE_KEY = "inkwell:draft";
const STORAGE_NAME_KEY = "inkwell:draft-name";
const WORKSPACE_KEY = "inkwell:workspace-v1";
const ACTIVE_TAB_KEY = "inkwell:active-tab";
const THEME_KEY = "inkwell:theme";
const INITIAL_TAB_ID = "initial-document";

type RenderTheme = "writer" | "github";

type WorkspaceDocument = {
  id: string;
  fileName: string;
  markdown: string;
  handle: FileHandle | null;
  dirty: boolean;
};

type StoredWorkspaceDocument = Pick<
  WorkspaceDocument,
  "id" | "fileName" | "markdown" | "dirty"
> & {
  path?: string;
};

function createTabId() {
  return globalThis.crypto?.randomUUID?.() ?? `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createWorkspaceDocument(
  markdown = "",
  handle: FileHandle | null = null,
  dirty = false,
  id = createTabId(),
): WorkspaceDocument {
  return {
    id,
    fileName: handle?.name ?? "untitled.md",
    markdown,
    handle,
    dirty,
  };
}

function createBlankDocument(id = createTabId()) {
  return createWorkspaceDocument("", { name: "untitled.md" }, false, id);
}

function nextUntitledName(tabs: WorkspaceDocument[]) {
  const names = new Set(tabs.map((tab) => tab.fileName));
  if (!names.has("untitled.md")) return "untitled.md";

  let index = 2;
  while (names.has(`untitled-${index}.md`)) index += 1;
  return `untitled-${index}.md`;
}

function restoreWorkspace(value: string | null): WorkspaceDocument[] | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;

    const restored = parsed.flatMap((item): WorkspaceDocument[] => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Partial<StoredWorkspaceDocument>;
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.fileName !== "string" ||
        typeof candidate.markdown !== "string"
      ) {
        return [];
      }

      return [
        {
          id: candidate.id,
          fileName: candidate.fileName,
          markdown: candidate.markdown,
          handle: {
            name: candidate.fileName,
            path: typeof candidate.path === "string" ? candidate.path : undefined,
          },
          dirty: candidate.dirty === true,
        },
      ];
    });

    return restored.length > 0 ? restored : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [tabs, setTabs] = useState<WorkspaceDocument[]>([
    createWorkspaceDocument(WELCOME_MD, { name: "untitled.md" }, false, INITIAL_TAB_ID),
  ]);
  const [activeTabId, setActiveTabId] = useState(INITIAL_TAB_ID);
  const [mode, setMode] = useState<"wysiwyg" | "raw">("wysiwyg");
  const [theme, setTheme] = useState<RenderTheme>("github");
  const [focusMode, setFocusMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [printRequested, setPrintRequested] = useState(false);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const hasDirtyTabs = tabs.some((tab) => tab.dirty);

  const addOpenedDocument = useCallback((handle: FileHandle, content: string) => {
    const openedTab = createWorkspaceDocument(content, handle, false);
    setTabs((current) => {
      const onlyTab = current[0];
      const replaceEmptyPlaceholder =
        current.length === 1 &&
        !onlyTab.handle?.handle &&
        !onlyTab.handle?.path &&
        onlyTab.markdown.length === 0 &&
        !onlyTab.dirty;
      return replaceEmptyPlaceholder ? [openedTab] : [...current, openedTab];
    });
    setActiveTabId(openedTab.id);
  }, []);

  useEffect(() => {
    try {
      const restoredTabs = restoreWorkspace(localStorage.getItem(WORKSPACE_KEY));
      const savedActiveTabId = localStorage.getItem(ACTIVE_TAB_KEY);
      const savedTheme = localStorage.getItem(THEME_KEY);

      if (restoredTabs) {
        setTabs(restoredTabs);
        setActiveTabId(
          restoredTabs.some((tab) => tab.id === savedActiveTabId)
            ? (savedActiveTabId as string)
            : restoredTabs[0].id,
        );
      } else {
        const saved = localStorage.getItem(STORAGE_KEY);
        const savedName = localStorage.getItem(STORAGE_NAME_KEY);
        if (saved && saved.length > 0) {
          const migrated = createWorkspaceDocument(
            saved,
            { name: savedName ?? "untitled.md" },
            false,
          );
          setTabs([migrated]);
          setActiveTabId(migrated.id);
        }
      }

      if (savedTheme === "writer" || savedTheme === "github") {
        setTheme(savedTheme);
      }
    } catch {
      // Keep the built-in welcome document when storage is unavailable.
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    const desktop = window.inkwellDesktop;
    if (!desktop) return;

    return desktop.onOpenMarkdown((document) => {
      addOpenedDocument({ name: document.name, path: document.path }, document.content);
    });
  }, [addOpenedDocument]);

  useEffect(() => {
    document.documentElement.dataset.renderTheme = theme;
    return () => {
      delete document.documentElement.dataset.renderTheme;
    };
  }, [theme]);

  useEffect(() => {
    if (!hydrated || !activeTab) return;

    try {
      const storedTabs: StoredWorkspaceDocument[] = tabs.map(
        ({ id, fileName, markdown, dirty, handle }) => ({
          id,
          fileName,
          markdown,
          dirty,
          path: handle?.path,
        }),
      );
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(storedTabs));
      localStorage.setItem(ACTIVE_TAB_KEY, activeTab.id);
      localStorage.setItem(THEME_KEY, theme);

      localStorage.setItem(STORAGE_KEY, activeTab.markdown);
      localStorage.setItem(STORAGE_NAME_KEY, activeTab.fileName);
    } catch {
      // Editing must continue even when browser storage is blocked.
    }
  }, [tabs, activeTab, theme, hydrated]);

  useEffect(() => {
    if (!hasDirtyTabs) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasDirtyTabs]);

  const handleContentChange = useCallback(
    (markdown: string) => {
      setTabs((current) =>
        current.map((tab) =>
          tab.id === activeTabId ? { ...tab, markdown, dirty: true } : tab,
        ),
      );
    },
    [activeTabId],
  );

  const handleOpen = useCallback(async () => {
    try {
      const result = await openMarkdownFile();
      if (!result) return;
      addOpenedDocument(result.handle, result.content);
    } catch (error) {
      console.error(error);
      alert("Could not open that file.");
    }
  }, [addOpenedDocument]);

  const handleSave = useCallback(async () => {
    if (!activeTab) return;

    const tabId = activeTab.id;
    try {
      const nextHandle = await saveMarkdownFile(activeTab.handle, activeTab.markdown);
      if (!nextHandle) return;

      setTabs((current) =>
        current.map((tab) =>
          tab.id === tabId
            ? {
                ...tab,
                handle: nextHandle,
                fileName: nextHandle.name,
                dirty: false,
              }
            : tab,
        ),
      );
    } catch (error) {
      console.error(error);
      alert("Could not save the file.");
    }
  }, [activeTab]);

  const handleNew = useCallback(() => {
    const fileName = nextUntitledName(tabs);
    const next = createWorkspaceDocument("", { name: fileName }, false);
    setTabs((current) => [...current, next]);
    setActiveTabId(next.id);
  }, [tabs]);

  const handleSelectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const handleCloseTab = useCallback(
    (tabId: string) => {
      const closingIndex = tabs.findIndex((tab) => tab.id === tabId);
      if (closingIndex < 0) return;

      const closingTab = tabs[closingIndex];
      if (
        closingTab.dirty &&
        !window.confirm(`Close ${closingTab.fileName} without saving its changes?`)
      ) {
        return;
      }

      if (tabs.length === 1) {
        const blank = createBlankDocument();
        setTabs([blank]);
        setActiveTabId(blank.id);
        return;
      }

      const remaining = tabs.filter((tab) => tab.id !== tabId);
      setTabs(remaining);

      if (activeTabId === tabId) {
        const nextIndex = Math.min(closingIndex, remaining.length - 1);
        setActiveTabId(remaining[nextIndex].id);
      }
    },
    [tabs, activeTabId],
  );

  const toggleMode = useCallback(() => {
    setMode((current) => (current === "wysiwyg" ? "raw" : "wysiwyg"));
  }, []);

  const handlePrintPdf = useCallback(() => {
    if (!activeTab) return;
    if (mode !== "wysiwyg") setMode("wysiwyg");
    setPrintRequested(true);
  }, [activeTab, mode]);

  useEffect(() => {
    if (!printRequested || mode !== "wysiwyg" || !hydrated || !activeTab) return;

    let cancelled = false;
    const run = async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (cancelled) return;

      document.documentElement.classList.add("inkwell-printing");
      try {
        if (window.inkwellDesktop) {
          await window.inkwellDesktop.printToPdf({ suggestedName: activeTab.fileName });
        } else {
          window.print();
        }
      } catch (error) {
        console.error(error);
        alert("Could not create the PDF.");
      } finally {
        document.documentElement.classList.remove("inkwell-printing");
        if (!cancelled) setPrintRequested(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
      document.documentElement.classList.remove("inkwell-printing");
    };
  }, [printRequested, mode, hydrated, activeTab]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      } else if (event.key.toLowerCase() === "o") {
        event.preventDefault();
        void handleOpen();
      } else if (event.key.toLowerCase() === "n" && !event.shiftKey) {
        event.preventDefault();
        handleNew();
      } else if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        handlePrintPdf();
      } else if (event.key === "/") {
        event.preventDefault();
        toggleMode();
      } else if (event.key.toLowerCase() === "f" && event.shiftKey) {
        event.preventDefault();
        setFocusMode((current) => !current);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, handleOpen, handleNew, handlePrintPdf, toggleMode]);

  const markdown = activeTab?.markdown ?? "";
  const words = countWords(markdown);
  const minutes = readingMinutes(words);
  const githubTheme = theme === "github";

  return (
    <div className={`app-shell min-h-screen app-shell-${theme}`}>
      {!focusMode && activeTab && (
        <Titlebar
          tabs={tabs}
          activeTabId={activeTab.id}
          mode={mode}
          theme={theme}
          focusMode={focusMode}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onOpen={handleOpen}
          onSave={handleSave}
          onNew={handleNew}
          onPrintPdf={handlePrintPdf}
          onToggleMode={toggleMode}
          onThemeChange={setTheme}
          onToggleFocus={() => setFocusMode((current) => !current)}
        />
      )}

      {focusMode && (
        <button
          onClick={() => setFocusMode(false)}
          className="focus-exit fixed right-4 top-4 z-30 btn-quiet"
          title="Exit focus mode"
        >
          esc focus
        </button>
      )}

      <main
        className={`editor-main mx-auto w-full px-6 ${
          githubTheme ? "max-w-[1012px]" : "max-w-[720px]"
        } ${focusMode ? "pt-16" : githubTheme ? "pt-4" : "pt-8"} pb-28`}
      >
        {hydrated && activeTab && mode === "wysiwyg" && (
          <WysiwygEditor
            key={`wysiwyg-${activeTab.id}`}
            markdown={activeTab.markdown}
            onChange={handleContentChange}
            theme={theme}
            showToolbar={!focusMode}
          />
        )}
        {hydrated && activeTab && mode === "raw" && (
          <RawEditor
            key={`raw-${activeTab.id}`}
            markdown={activeTab.markdown}
            onChange={handleContentChange}
          />
        )}
      </main>

      {!focusMode && <Footer words={words} minutes={minutes} mode={mode} theme={theme} />}
    </div>
  );
}

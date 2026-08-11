import {
  Code2,
  Feather,
  FilePlus,
  Focus,
  FolderOpen,
  Github,
  Pencil,
  Printer,
  Save,
} from "lucide-react";
import { DocumentTabs, type DocumentTab } from "./DocumentTabs";

type RenderTheme = "writer" | "github";

type Props = {
  tabs: DocumentTab[];
  activeTabId: string;
  mode: "wysiwyg" | "raw";
  theme: RenderTheme;
  focusMode: boolean;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onOpen: () => void;
  onSave: () => void;
  onNew: () => void;
  onPrintPdf: () => void;
  onToggleMode: () => void;
  onThemeChange: (theme: RenderTheme) => void;
  onToggleFocus: () => void;
};

export function Titlebar({
  tabs,
  activeTabId,
  mode,
  theme,
  focusMode,
  onSelectTab,
  onCloseTab,
  onOpen,
  onSave,
  onNew,
  onPrintPdf,
  onToggleMode,
  onThemeChange,
  onToggleFocus,
}: Props) {
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  return (
    <header className={`app-titlebar app-titlebar-${theme}`}>
      <div className="titlebar-inner titlebar-workspace-row">
        <DocumentTabs
          tabs={tabs}
          activeTabId={activeTabId}
          theme={theme}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
        />

        <div className="titlebar-actions" aria-label="Workspace actions">
          <button
            className="btn-quiet"
            onClick={onNew}
            title="New tab (Ctrl+N)"
            aria-label="New markdown tab"
          >
            <FilePlus />
          </button>
          <button
            className="btn-quiet"
            onClick={onOpen}
            title="Open markdown file (Ctrl+O)"
            aria-label="Open markdown file"
          >
            <FolderOpen />
          </button>
          <button
            className={`btn-quiet ${activeTab?.dirty ? "is-emphasized" : ""}`}
            onClick={onSave}
            title="Save active file (Ctrl+S)"
            aria-label="Save active markdown file"
          >
            <Save />
          </button>
          <button
            className="btn-quiet"
            onClick={onPrintPdf}
            title="Print or export PDF (Ctrl+P)"
            aria-label="Print or export active document as PDF"
          >
            <Printer />
          </button>

          <span className="titlebar-separator" aria-hidden="true" />

          <div className="theme-toggle theme-toggle-icons" aria-label="Rendering theme">
            <button
              type="button"
              aria-pressed={theme === "writer"}
              aria-label="Use Writer theme"
              className={`theme-option ${theme === "writer" ? "is-active" : ""}`}
              onClick={() => onThemeChange("writer")}
              title="Writer theme"
            >
              <Feather />
            </button>
            <button
              type="button"
              aria-pressed={theme === "github"}
              aria-label="Use GitHub theme"
              className={`theme-option ${theme === "github" ? "is-active" : ""}`}
              onClick={() => onThemeChange("github")}
              title="GitHub theme"
            >
              <Github />
            </button>
          </div>

          <span className="titlebar-separator titlebar-separator-compact" aria-hidden="true" />

          <button
            className="btn-quiet mode-button"
            onClick={onToggleMode}
            title={mode === "wysiwyg" ? "Raw markdown (Ctrl+/)" : "Rendered preview (Ctrl+/)"}
            aria-label={mode === "wysiwyg" ? "Switch to raw markdown" : "Switch to preview"}
          >
            {mode === "wysiwyg" ? <Code2 /> : <Pencil />}
          </button>
          <button
            className={`btn-quiet ${focusMode ? "is-emphasized" : ""}`}
            onClick={onToggleFocus}
            title="Focus mode (Ctrl+Shift+F)"
            aria-label="Toggle focus mode"
          >
            <Focus />
          </button>
        </div>
      </div>
    </header>
  );
}

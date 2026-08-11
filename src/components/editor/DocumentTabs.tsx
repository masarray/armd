import { FileText, X } from "lucide-react";

export type DocumentTab = {
  id: string;
  fileName: string;
  dirty?: boolean;
};

type Props = {
  tabs: DocumentTab[];
  activeTabId: string;
  theme: "writer" | "github";
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
};

export function DocumentTabs({
  tabs,
  activeTabId,
  theme,
  onSelectTab,
  onCloseTab,
}: Props) {
  return (
    <div className={`document-tabs document-tabs-${theme}`} aria-label="Open markdown documents">
      <div className="document-tabs-scroll" role="tablist" aria-orientation="horizontal">
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;

          return (
            <div
              key={tab.id}
              className={`document-tab ${active ? "is-active" : ""}`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                className="document-tab-main"
                onClick={() => onSelectTab(tab.id)}
                title={tab.fileName}
              >
                <FileText aria-hidden="true" />
                <span className="document-tab-name">{tab.fileName}</span>
                {tab.dirty && (
                  <span className="document-tab-dirty" aria-label="Unsaved changes" />
                )}
              </button>

              <button
                type="button"
                className="document-tab-close"
                aria-label={`Close ${tab.fileName}`}
                title={`Close ${tab.fileName}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseTab(tab.id);
                }}
              >
                <X aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

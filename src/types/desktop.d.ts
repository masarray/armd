export {};

type DesktopMarkdownDocument = {
  path: string;
  name: string;
  content: string;
};

type DesktopSavedFile = {
  path: string;
  name: string;
};

declare global {
  interface Window {
    inkwellDesktop?: {
      isDesktop: true;
      openMarkdown: () => Promise<DesktopMarkdownDocument | null>;
      saveMarkdown: (payload: {
        path?: string | null;
        suggestedName: string;
        content: string;
      }) => Promise<DesktopSavedFile | null>;
      printToPdf: (payload: { suggestedName: string }) => Promise<DesktopSavedFile | null>;
      showInFolder: (filePath: string) => Promise<void>;
      onOpenMarkdown: (listener: (document: DesktopMarkdownDocument) => void) => () => void;
    };
  }
}

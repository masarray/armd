import { getHTMLFromFragment, mergeAttributes, Node } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { Fragment } from "@tiptap/pm/model";

const VALID_ALIGNMENTS = new Set(["left", "center", "right"]);

function normalizeAlignment(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return VALID_ALIGNMENTS.has(normalized) ? normalized : null;
}

function parseAlignment(element: HTMLElement): string | null {
  return normalizeAlignment(element.getAttribute("align") ?? element.style.textAlign);
}

function normalizeDimension(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return String(value);
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (/^\d+(?:\.\d+)?%?$/.test(normalized)) return normalized;
  return null;
}

function renderNodeAsHTML(node: any): string {
  return getHTMLFromFragment(Fragment.from(node), node.type.schema);
}

/**
 * Paragraph node that preserves GitHub-compatible HTML alignment blocks.
 * Normal paragraphs continue to serialize as regular Markdown.
 */
export const GitHubReadmeParagraph = Node.create({
  name: "paragraph",
  priority: 1000,
  group: "block",
  content: "inline*",

  addAttributes() {
    return {
      align: {
        default: null,
        parseHTML: (element: HTMLElement) => parseAlignment(element),
        renderHTML: (attributes: { align?: string | null }) => {
          const align = normalizeAlignment(attributes.align);
          return align ? { align } : {};
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "p" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["p", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setParagraph:
        () =>
        ({ commands }: any) =>
          commands.setNode(this.name),
    } as any;
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-0": () => (this.editor.commands as any).setParagraph(),
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          if (normalizeAlignment(node.attrs.align)) {
            state.write(renderNodeAsHTML(node));
            state.closeBlock(node);
            return;
          }

          state.renderInline(node);
          state.closeBlock(node);
        },
        parse: {},
      },
    };
  },
});

/**
 * GitHub treats Markdown images as inline content. Width/height/alignment from
 * raw README HTML are retained and serialized back as HTML only when needed.
 */
export const GitHubReadmeImage = Image.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          normalizeDimension(element.getAttribute("width") ?? element.style.width),
        renderHTML: (attributes: { width?: string | null }) => {
          const width = normalizeDimension(attributes.width);
          return width ? { width } : {};
        },
      },
      height: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          normalizeDimension(element.getAttribute("height") ?? element.style.height),
        renderHTML: (attributes: { height?: string | null }) => {
          const height = normalizeDimension(attributes.height);
          return height ? { height } : {};
        },
      },
      align: {
        default: null,
        parseHTML: (element: HTMLElement) => parseAlignment(element),
        renderHTML: (attributes: { align?: string | null }) => {
          const align = normalizeAlignment(attributes.align);
          return align ? { align } : {};
        },
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const hasHTMLOnlyAttributes = Boolean(
            normalizeDimension(node.attrs.width) ||
              normalizeDimension(node.attrs.height) ||
              normalizeAlignment(node.attrs.align),
          );

          if (hasHTMLOnlyAttributes) {
            state.write(renderNodeAsHTML(node));
            return;
          }

          const alt = state.esc(node.attrs.alt || "");
          const src = String(node.attrs.src || "").replace(/[()]/g, "\\$&");
          const title = node.attrs.title
            ? ` "${String(node.attrs.title).replace(/"/g, '\\"')}"`
            : "";
          state.write(`![${alt}](${src}${title})`);
        },
        parse: {},
      },
    };
  },
}).configure({
  inline: true,
  allowBase64: false,
});

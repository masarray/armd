import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const ALERT_PATTERN = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;

const ALERT_LABELS = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
} as const;

type AlertType = keyof typeof ALERT_LABELS;

function githubSlug(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

function createHeadingAnchor(slug: string, label: string) {
  const anchor = document.createElement("a");
  anchor.id = `user-content-${slug}`;
  anchor.className = "anchor github-heading-anchor";
  anchor.href = `#${slug}`;
  anchor.setAttribute("aria-label", `Permalink: ${label}`);
  anchor.setAttribute("contenteditable", "false");

  const svgNamespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(svgNamespace, "svg");
  icon.setAttribute("data-component", "Octicon");
  icon.setAttribute("class", "octicon octicon-link");
  icon.setAttribute("viewBox", "0 0 16 16");
  icon.setAttribute("version", "1.1");
  icon.setAttribute("width", "16");
  icon.setAttribute("height", "16");
  icon.setAttribute("aria-hidden", "true");

  const path = document.createElementNS(svgNamespace, "path");
  path.setAttribute(
    "d",
    "m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z",
  );
  icon.append(path);
  anchor.append(icon);

  anchor.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    window.history.replaceState(null, "", `#${slug}`);
    document.getElementById(slug)?.scrollIntoView({ block: "start" });
  });

  return anchor;
}

function createAlertTitle(type: AlertType) {
  const title = document.createElement("div");
  title.className = "markdown-alert-title github-alert-decoration-title";
  title.setAttribute("contenteditable", "false");
  title.textContent = ALERT_LABELS[type];
  return title;
}

export const GitHubMarkdownDecorations = Extension.create({
  name: "githubMarkdownDecorations",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("githubMarkdownDecorations"),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const usedSlugs = new Map<string, number>();

            state.doc.descendants((node, pos) => {
              if (node.type.name === "heading") {
                const baseSlug = githubSlug(node.textContent) || "section";
                const duplicateIndex = usedSlugs.get(baseSlug) ?? 0;
                usedSlugs.set(baseSlug, duplicateIndex + 1);
                const slug = duplicateIndex === 0 ? baseSlug : `${baseSlug}-${duplicateIndex}`;

                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    id: slug,
                    class: "github-heading-with-anchor",
                  }),
                  Decoration.widget(
                    pos + 1,
                    () => createHeadingAnchor(slug, node.textContent),
                    { side: -1, key: `heading-anchor-${slug}-${pos}` },
                  ),
                );
                return;
              }

              if (node.type.name !== "blockquote") return;

              const firstParagraph = node.firstChild;
              if (!firstParagraph || firstParagraph.type.name !== "paragraph") return;

              const match = firstParagraph.textContent.match(ALERT_PATTERN);
              if (!match) return;

              const type = match[1].toLocaleLowerCase() as AlertType;
              const paragraphPos = pos + 1;
              const textStart = paragraphPos + 1;
              const markerEnd = textStart + match[0].length;

              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: `markdown-alert markdown-alert-${type} github-alert github-alert-${type}`,
                }),
                Decoration.node(paragraphPos, paragraphPos + firstParagraph.nodeSize, {
                  class: "github-alert-marker-paragraph",
                }),
                Decoration.inline(textStart, markerEnd, {
                  class: "github-alert-marker-hidden",
                  "aria-hidden": "true",
                }),
                // Insert at the blockquote content boundary, before the paragraph.
                // This mirrors GitHub's title-first alert structure while the source
                // Markdown remains the original single blockquote paragraph.
                Decoration.widget(paragraphPos, () => createAlertTitle(type), {
                  side: -1,
                  key: `github-alert-title-${type}-${pos}`,
                }),
              );
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
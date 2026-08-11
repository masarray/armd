import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table/table";
import { TableRow } from "@tiptap/extension-table/row";
import { TableHeader } from "@tiptap/extension-table/header";
import { TableCell } from "@tiptap/extension-table/cell";
import { Markdown } from "tiptap-markdown";
import { common, createLowlight } from "lowlight";
import { useEffect, useRef } from "react";
import { BubbleToolbar } from "./BubbleToolbar";
import { CodeBlockWithCopy } from "./CodeBlockWithCopy";
import { FormattingToolbar } from "./FormattingToolbar";
import { GitHubMarkdownDecorations } from "./GitHubMarkdownDecorations";
import { GitHubReadmeImage, GitHubReadmeParagraph } from "./GitHubReadmeNodes";

const lowlight = createLowlight(common);

type Props = {
  markdown: string;
  onChange: (markdown: string) => void;
  theme: "writer" | "github";
  showToolbar?: boolean;
};

export function WysiwygEditor({ markdown, onChange, theme, showToolbar = true }: Props) {
  const suppressRef = useRef(false);
  const proseClass = theme === "github" ? "gh-prose markdown-body" : "ink-prose";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
        paragraph: false,
      }),
      GitHubReadmeParagraph,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      GitHubReadmeImage,
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockWithCopy.configure({ lowlight }),
      GitHubMarkdownDecorations,
      Placeholder.configure({
        placeholder: "Start writing…",
      }),
      Markdown.configure({
        // GitHub README files commonly use a small HTML subset for centered
        // screenshots, badges, and navigation links. ProseMirror only accepts
        // elements represented by the editor schema, so unsupported tags are
        // not injected into the editable document.
        html: true,
        tightLists: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: markdown,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `${proseClass} focus:outline-none`,
      },
    },
    onUpdate: ({ editor }) => {
      suppressRef.current = true;
      // @ts-expect-error - Markdown storage type
      const md = editor.storage.markdown.getMarkdown() as string;
      onChange(md);
      queueMicrotask(() => {
        suppressRef.current = false;
      });
    },
  });

  // Update the ProseMirror class without recreating the editor or losing selection.
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: `${theme === "github" ? "gh-prose markdown-body" : "ink-prose"} focus:outline-none`,
        },
      },
    });
  }, [editor, theme]);

  // Sync external markdown (e.g. from raw-mode edits or file open).
  useEffect(() => {
    if (!editor) return;
    if (suppressRef.current) return;
    // @ts-expect-error - Markdown storage type
    const current = editor.storage.markdown.getMarkdown() as string;
    if (current === markdown) return;
    editor.commands.setContent(markdown, { emitUpdate: false });
  }, [editor, markdown]);

  if (!editor) return null;

  return (
    <div className={`wysiwyg-workspace wysiwyg-workspace-${theme}`}>
      {showToolbar && <FormattingToolbar editor={editor} theme={theme} />}
      <BubbleToolbar editor={editor} theme={theme} />
      <EditorContent editor={editor} />
    </div>
  );
}

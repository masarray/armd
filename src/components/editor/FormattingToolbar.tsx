import type { Editor } from "@tiptap/react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Code,
  Code2,
  Columns3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Rows3,
  Strikethrough,
  Table2,
  Trash2,
  Undo2,
} from "lucide-react";

type RenderTheme = "writer" | "github";
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type AlertType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

type Props = {
  editor: Editor;
  theme: RenderTheme;
};

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
};

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
  className = "",
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`format-button ${active ? "is-active" : ""} ${className}`}
      disabled={disabled}
      aria-label={label}
      title={label}
      onMouseDown={(event) => {
        event.preventDefault();
        if (!disabled) onClick();
      }}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span className="format-separator" aria-hidden="true" />;
}

function currentBlock(editor: Editor) {
  for (let level = 1; level <= 6; level += 1) {
    if (editor.isActive("heading", { level })) return `h${level}`;
  }
  return "paragraph";
}

function insertAlert(editor: Editor, type: AlertType) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: `[!${type}]` }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Write the alert message here." }],
        },
      ],
    })
    .run();
}

export function FormattingToolbar({ editor, theme }: Props) {
  const [, refresh] = useState(0);
  const frameRef = useRef<number | null>(null);

  // TipTap can emit selectionUpdate and transaction for the same action. Batch
  // both signals into one React render so long README files remain responsive.
  useEffect(() => {
    const rerender = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        refresh((value) => value + 1);
      });
    };

    editor.on("selectionUpdate", rerender);
    editor.on("transaction", rerender);
    return () => {
      editor.off("selectionUpdate", rerender);
      editor.off("transaction", rerender);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [editor]);

  const setBlock = (value: string) => {
    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run();
      return;
    }

    const level = Number(value.slice(1)) as HeadingLevel;
    editor.chain().focus().setHeading({ level }).run();
  };

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const insertImage = () => {
    const src = window.prompt("Image URL or relative path", "./images/example.png");
    if (!src?.trim()) return;
    const alt = window.prompt("Image description (alt text)", "") ?? "";
    editor.chain().focus().setImage({ src: src.trim(), alt: alt.trim() }).run();
  };

  const inTable = editor.isActive("table");

  return (
    <div
      className={`format-toolbar format-toolbar-compact format-toolbar-${theme}`}
      role="toolbar"
      aria-label="Markdown formatting"
    >
      <div className="format-toolbar-inner">
        <select
          className="format-select format-block-select"
          value={currentBlock(editor)}
          aria-label="Text style"
          title="Paragraph and heading style"
          onChange={(event) => setBlock(event.target.value)}
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
        </select>

        <Separator />

        <ToolbarButton
          label="Bold (Ctrl+B)"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label="Italic (Ctrl+I)"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolbarButton>
        <ToolbarButton
          label="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code />
        </ToolbarButton>
        <ToolbarButton label="Insert or edit link" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon />
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton
          label="Task list"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListChecks />
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          label="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 />
        </ToolbarButton>
        <ToolbarButton label="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus />
        </ToolbarButton>

        <select
          className="format-select format-alert-select"
          defaultValue=""
          aria-label="Insert GitHub alert"
          title="Insert Note, Tip, Important, Warning, or Caution"
          onChange={(event) => {
            const type = event.target.value as AlertType;
            if (type) insertAlert(editor, type);
            event.currentTarget.selectedIndex = 0;
          }}
        >
          <option value="" disabled>
            Alert
          </option>
          <option value="NOTE">Note</option>
          <option value="TIP">Tip</option>
          <option value="IMPORTANT">Important</option>
          <option value="WARNING">Warning</option>
          <option value="CAUTION">Caution</option>
        </select>

        <Separator />

        <ToolbarButton label="Insert picture by URL or relative path" onClick={insertImage}>
          <ImagePlus />
        </ToolbarButton>

        <ToolbarButton
          label="Insert 3 by 3 table"
          active={inTable}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <Table2 />
        </ToolbarButton>

        {inTable && (
          <>
            <ToolbarButton label="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()}>
              <Rows3 />
            </ToolbarButton>
            <ToolbarButton label="Add column right" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <Columns3 />
            </ToolbarButton>
            <ToolbarButton label="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
              <Trash2 />
            </ToolbarButton>
          </>
        )}

        <Separator />

        <ToolbarButton
          label="Undo"
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 />
        </ToolbarButton>
      </div>
    </div>
  );
}

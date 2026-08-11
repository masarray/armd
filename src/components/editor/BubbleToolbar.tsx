import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Italic, Link as LinkIcon, Code, Strikethrough } from "lucide-react";

type Props = {
  editor: Editor;
  theme: "writer" | "github";
};

export function BubbleToolbar({ editor, theme }: Props) {
  const buttonClass = (active: boolean) => `bubble-button ${active ? "is-active" : ""}`;

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top" }}
      shouldShow={({ editor, from, to }) =>
        from !== to && editor.isEditable && !editor.isActive("codeBlock")
      }
    >
      <div className={`bubble-toolbar bubble-toolbar-${theme}`}>
        <button
          type="button"
          className={buttonClass(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
          title="Bold"
        >
          <Bold />
        </button>
        <button
          type="button"
          className={buttonClass(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
          title="Italic"
        >
          <Italic />
        </button>
        <button
          type="button"
          className={buttonClass(editor.isActive("strike"))}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Strikethrough"
          title="Strikethrough"
        >
          <Strikethrough />
        </button>
        <button
          type="button"
          className={buttonClass(editor.isActive("code"))}
          onClick={() => editor.chain().focus().toggleCode().run()}
          aria-label="Inline code"
          title="Inline code"
        >
          <Code />
        </button>
        <span className="bubble-separator" aria-hidden="true" />
        <button
          type="button"
          className={buttonClass(editor.isActive("link"))}
          onClick={() => {
            const previous = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("Link URL", previous ?? "https://");
            if (url === null) return;
            if (url.trim() === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              return;
            }
            editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
          }}
          aria-label="Link"
          title="Insert or edit link"
        >
          <LinkIcon />
        </button>
      </div>
    </BubbleMenu>
  );
}

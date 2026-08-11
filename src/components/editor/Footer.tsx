type Props = {
  words: number;
  minutes: number;
  mode: "wysiwyg" | "raw";
  theme: "writer" | "github";
};

export function Footer({ words, minutes, mode, theme }: Props) {
  return (
    <footer className={`editor-footer editor-footer-${theme}`} aria-label="Document status">
      <div className="editor-footer-inner">
        <span className="editor-footer-mode">{mode === "wysiwyg" ? "Preview" : "Raw"}</span>
        <span className="editor-footer-stats">
          {words.toLocaleString()} {words === 1 ? "word" : "words"} · {minutes} min
        </span>
      </div>
    </footer>
  );
}

import { useEffect, useRef } from "react";

type Props = {
  markdown: string;
  onChange: (md: string) => void;
};

export function RawEditor({ markdown, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.focus();
  }, []);

  return (
    <textarea
      ref={ref}
      className="raw-md-editor"
      value={markdown}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      placeholder="# Raw markdown…"
    />
  );
}

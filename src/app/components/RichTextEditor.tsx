"use client";

import { useEffect, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "Write your post..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const runCommand = (command: string, commandValue?: string) => {
    if (!editorRef.current) {
      return;
    }
    editorRef.current.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button type="button" className="secondary-button" onClick={() => runCommand("bold")}>
          Bold
        </button>
        <button type="button" className="secondary-button" onClick={() => runCommand("italic")}>
          Italic
        </button>
        <button type="button" className="secondary-button" onClick={() => runCommand("formatBlock", "<h2>")}>
          Heading
        </button>
        <button type="button" className="secondary-button" onClick={() => runCommand("insertUnorderedList")}>
          Bullets
        </button>
        <button type="button" className="secondary-button" onClick={() => runCommand("insertOrderedList")}>
          Numbered
        </button>
        <button type="button" className="secondary-button" onClick={() => runCommand("formatBlock", "<blockquote>")}>
          Quote
        </button>
      </div>
      <div
        ref={editorRef}
        className="rte-editor"
        data-placeholder={placeholder}
        contentEditable
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        suppressContentEditableWarning
      />
    </div>
  );
}

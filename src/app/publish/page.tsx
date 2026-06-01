"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const genres = ["Poetry", "Ghazal", "Shayari", "Lyrics", "Short Story", "Dohe", "Nazm"];
const languages = ["Hindi", "Punjabi", "Urdu", "English", "Hinglish"];

export default function PublishPage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Poetry");
  const [language, setLanguage] = useState("Hindi");
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState(29);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [bodyText, setBodyText] = useState("");

  const wordCount = useMemo(
    () => bodyText.trim().split(/\s+/).filter(Boolean).length,
    [bodyText],
  );

  const execCommand = (command: string, value?: string) => {
    if (!editorRef.current) {
      return;
    }
    editorRef.current.focus();
    document.execCommand(command as any, false, value || null);
  };

  const handleSaveDraft = () => {
    setErrorMessage("");
    setStatusMessage("Draft saved!");
    setSaving(true);
    setTimeout(() => setSaving(false), 1200);
  };

  const handlePublish = () => {
    if (!title.trim()) {
      setErrorMessage("Please add a title before publishing.");
      setStatusMessage("");
      return;
    }

    setErrorMessage("");
    setStatusMessage("Published successfully! Redirecting home...");
    setPublishing(true);
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[#d9c9b1] bg-[#faf7f2] p-8 text-[#1a1209] shadow-xl">
        <div className="space-y-3">
          <p className="hero-tag" style={{ color: "#8a5a0a" }}>
            Publish your best writing
          </p>
          <h1 className="serif-display text-4xl font-semibold">Create your next premium piece</h1>
          <p className="max-w-3xl text-sm leading-7 text-[#6b5e4a]">
            Use the editor to craft your title, shape the body, and choose whether this piece should be premium. Save as draft or publish when you are ready.
          </p>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#e7dccd] bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rte-toolbar rounded-[18px] border border-[#e7dccd] bg-[#faf7f2] p-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => execCommand("bold")} className="secondary-button">
                  Bold
                </button>
                <button type="button" onClick={() => execCommand("italic")} className="secondary-button">
                  Italic
                </button>
                <button type="button" onClick={() => execCommand("underline")} className="secondary-button">
                  Underline
                </button>
                <button type="button" onClick={() => execCommand("formatBlock", "blockquote")} className="secondary-button">
                  Quote
                </button>
                <button type="button" onClick={() => execCommand("insertUnorderedList")} className="secondary-button">
                  List
                </button>
              </div>
            </div>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
              className="input"
              style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: 22, padding: "18px 20px" }}
            />

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              data-placeholder="Begin writing your story, poem, or lyrics here..."
              onInput={() => setBodyText(editorRef.current?.innerText ?? "")}
              className="textarea min-h-[240px] leading-[1.8] overflow-y-auto rounded-[24px] border border-[#e7dccd] bg-[#faf7f2] p-5 text-[#1a1209]"
            />
          </div>

          <aside className="space-y-5 rounded-[24px] border border-[#e7dccd] bg-[#fff7e8] p-5">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[#1a1209]">Genre</label>
              <select value={genre} onChange={(event) => setGenre(event.target.value)} className="input">
                {genres.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[#1a1209]">Language</label>
              <select value={language} onChange={(event) => setLanguage(event.target.value)} className="input">
                {languages.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[#1a1209]">Premium post</label>
              <button
                type="button"
                onClick={() => setIsPremium((current) => !current)}
                className={`secondary-button ${isPremium ? "bg-[#8a5a0a] text-white" : "bg-[#faf7f2] text-[#1a1209]"}`}
              >
                {isPremium ? "Premium enabled" : "Make Premium"}
              </button>
            </div>
            {isPremium ? (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#1a1209]">Price</label>
                <div className="flex items-center gap-2 rounded-[18px] border border-[#e7dccd] bg-white p-3">
                  <span className="text-sm text-[#6b5e4a]">₹</span>
                  <input
                    type="number"
                    min={10}
                    value={price}
                    onChange={(event) => setPrice(Number(event.target.value))}
                    className="input"
                    style={{ padding: "10px 12px", minWidth: 0 }}
                  />
                </div>
              </div>
            ) : null}
            <div className="rounded-[18px] bg-[#fff0d8] p-4 text-sm text-[#6b5e4a]">
              <p className="font-semibold text-[#1a1209]">Live word count</p>
              <p>{wordCount} words</p>
            </div>
          </aside>
        </div>

        {errorMessage ? (
          <p className="form-error">{errorMessage}</p>
        ) : statusMessage ? (
          <p className="form-success">{statusMessage}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={handleSaveDraft} className="secondary-button" disabled={saving || publishing}>
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button type="button" onClick={handlePublish} className="primary-button" disabled={publishing}>
            {publishing ? "Publishing..." : "Publish →"}
          </button>
        </div>
      </section>
    </div>
  );
}

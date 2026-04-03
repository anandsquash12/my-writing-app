"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { push, ref, set } from "firebase/database";
import { database } from "../../firebase/config";
import { findBannedWords } from "../../lib/moderation";
import type { QuoteTextLayer, QuoteVisibility } from "../../lib/quotes";
import { uploadImage } from "@/lib/uploadImage";
import { useAuth } from "../../context/AuthContext";

const CANVAS_SIZE = 800;
const DEFAULT_TEXT = "Write your quote";
const DEFAULT_FONT = "Playfair Display";

const FONT_OPTIONS = ["Playfair Display", "Cormorant Garamond", "Inter", "Noto Serif", "Roboto"] as const;
const FONT_SIZE_PRESETS = [
  { label: "Small", value: 24 },
  { label: "Medium", value: 40 },
  { label: "Large", value: 60 },
  { label: "Huge", value: 80 },
] as const;
const GRADIENT_PRESETS = [
  { id: "sunset", label: "Sunset", colors: ["#3f2b1d", "#a3432c", "#e6b480"] },
  { id: "sage", label: "Sage", colors: ["#0f2027", "#2c5364", "#9fb798"] },
  { id: "dawn", label: "Dawn", colors: ["#2d1b2e", "#5a3e5a", "#c7866d"] },
  { id: "mist", label: "Mist", colors: ["#1f2a44", "#495f8c", "#bcc6da"] },
] as const;

type FabricCanvas = any;
type FabricTextbox = any;

function toCharSpacing(fontSize: number, letterSpacing: number) {
  if (!fontSize) {
    return 0;
  }
  return (letterSpacing / fontSize) * 1000;
}

function toLetterSpacing(fontSize: number, charSpacing: number) {
  return Number((((charSpacing || 0) / 1000) * fontSize).toFixed(1));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function QuoteStudioEditor() {
  const { user, profile } = useAuth();
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const fabricModuleRef = useRef<any | null>(null);
  const backgroundImageRef = useRef<any | null>(null);
  const idCounterRef = useRef(0);

  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [retryVisibility, setRetryVisibility] = useState<QuoteVisibility | null>(null);
  const [publishAnonymous, setPublishAnonymous] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState<"color" | "gradient" | "image">("color");
  const [backgroundColor, setBackgroundColor] = useState("#efe7dd");
  const [backgroundImageData, setBackgroundImageData] = useState("");
  const [selectedGradientId, setSelectedGradientId] = useState<(typeof GRADIENT_PRESETS)[number]["id"]>("sunset");
  const [layers, setLayers] = useState<QuoteTextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState("");

  const selectedGradient = useMemo(
    () => GRADIENT_PRESETS.find((preset) => preset.id === selectedGradientId) ?? GRADIENT_PRESETS[0],
    [selectedGradientId],
  );

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId) ?? null,
    [layers, selectedLayerId],
  );

  const syncLayersFromCanvas = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    const objects = canvas.getObjects().filter((obj: any) => obj.type === "textbox");
    const next = objects.map((obj: any) => {
      const fontSize = typeof obj.fontSize === "number" ? obj.fontSize : 48;
      return {
        id: obj.shabadLayerId as string,
        text: typeof obj.text === "string" ? obj.text : "",
        x: typeof obj.left === "number" ? obj.left : CANVAS_SIZE / 2,
        y: typeof obj.top === "number" ? obj.top : CANVAS_SIZE / 2,
        fontFamily: typeof obj.fontFamily === "string" ? obj.fontFamily : DEFAULT_FONT,
        fontSize,
        color: typeof obj.fill === "string" ? obj.fill : "#ffffff",
        align: obj.textAlign === "left" || obj.textAlign === "right" ? obj.textAlign : "center",
        bold: obj.fontWeight === "bold" || obj.fontWeight === 700,
        shadow: Boolean(obj.shadow),
        letterSpacing: toLetterSpacing(fontSize, typeof obj.charSpacing === "number" ? obj.charSpacing : 0),
        lineHeight: typeof obj.lineHeight === "number" ? obj.lineHeight : 1.2,
        width: typeof obj.width === "number" ? obj.width : 640,
      } satisfies QuoteTextLayer;
    });
    setLayers(next);
  }, []);

  const selectObjectById = useCallback((layerId: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }
    const obj = canvas.getObjects().find((item: any) => item.shabadLayerId === layerId);
    if (!obj) {
      return;
    }
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    setSelectedLayerId(layerId);
  }, []);

  const applyBackground = useCallback(async () => {
    const canvas = fabricCanvasRef.current;
    const fabricModule = fabricModuleRef.current;
    if (!canvas || !fabricModule) {
      return;
    }

    canvas.backgroundColor = "#efe7dd";

    if (backgroundMode === "color") {
      canvas.backgroundColor = backgroundColor;
    } else if (backgroundMode === "gradient") {
      const gradient = new fabricModule.Gradient({
        type: "linear",
        coords: { x1: 0, y1: 0, x2: CANVAS_SIZE, y2: CANVAS_SIZE },
        colorStops: [
          { offset: 0, color: selectedGradient.colors[0] },
          { offset: 0.5, color: selectedGradient.colors[1] },
          { offset: 1, color: selectedGradient.colors[2] },
        ],
      });
      canvas.backgroundColor = gradient;
    }

    if (backgroundMode === "image" && backgroundImageData) {
      const image = await fabricModule.FabricImage.fromURL(backgroundImageData, {
        crossOrigin: "anonymous",
      });
      const scale = Math.max(CANVAS_SIZE / image.width, CANVAS_SIZE / image.height);
      image.set({
        originX: "center",
        originY: "center",
        left: CANVAS_SIZE / 2,
        top: CANVAS_SIZE / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });
      backgroundImageRef.current = image;
      canvas.backgroundImage = image;
    } else {
      backgroundImageRef.current = null;
      canvas.backgroundImage = undefined;
    }

    canvas.requestRenderAll();
  }, [backgroundColor, backgroundImageData, backgroundMode, selectedGradient.colors]);

  useEffect(() => {
    let disposed = false;

    async function initCanvas() {
      if (!canvasElementRef.current || fabricCanvasRef.current) {
        return;
      }

      const fabricModule = await import("fabric");
      if (disposed || !canvasElementRef.current) {
        return;
      }

      fabricModuleRef.current = fabricModule;
      const canvas = new fabricModule.Canvas(canvasElementRef.current, {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        preserveObjectStacking: true,
        selection: true,
      });
      fabricCanvasRef.current = canvas;

      const syncSelection = () => {
        const active = canvas.getActiveObject() as FabricTextbox | undefined;
        const layerId = active?.shabadLayerId;
        setSelectedLayerId(typeof layerId === "string" ? layerId : "");
      };

      const constrain = (obj: any) => {
        const bounds = obj.getBoundingRect();
        if (bounds.left < 0) {
          obj.left -= bounds.left;
        }
        if (bounds.top < 0) {
          obj.top -= bounds.top;
        }
        if (bounds.left + bounds.width > CANVAS_SIZE) {
          obj.left -= bounds.left + bounds.width - CANVAS_SIZE;
        }
        if (bounds.top + bounds.height > CANVAS_SIZE) {
          obj.top -= bounds.top + bounds.height - CANVAS_SIZE;
        }
      };

      canvas.on("selection:created", syncSelection);
      canvas.on("selection:updated", syncSelection);
      canvas.on("selection:cleared", () => setSelectedLayerId(""));
      canvas.on("object:moving", (event: any) => {
        if (event.target) {
          constrain(event.target);
        }
      });
      canvas.on("object:modified", syncLayersFromCanvas);
      canvas.on("text:changed", syncLayersFromCanvas);
      canvas.on("object:added", syncLayersFromCanvas);
      canvas.on("object:removed", syncLayersFromCanvas);

      await applyBackground();
      canvas.requestRenderAll();
    }

    void initCanvas();

    return () => {
      disposed = true;
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [applyBackground, syncLayersFromCanvas]);

  useEffect(() => {
    if (!fabricCanvasRef.current) {
      return;
    }
    void applyBackground();
  }, [applyBackground]);

  const addTextLayer = () => {
    const canvas = fabricCanvasRef.current;
    const fabricModule = fabricModuleRef.current;
    if (!canvas || !fabricModule) {
      return;
    }
    idCounterRef.current += 1;
    const layerId = `layer-${Date.now()}-${idCounterRef.current}`;
    const textbox = new fabricModule.Textbox(DEFAULT_TEXT, {
      left: CANVAS_SIZE / 2,
      top: CANVAS_SIZE / 2,
      originX: "center",
      originY: "center",
      width: 640,
      fontFamily: DEFAULT_FONT,
      fontSize: 48,
      fill: "#ffffff",
      textAlign: "center",
      fontWeight: "bold",
      lineHeight: 1.2,
      editable: true,
      charSpacing: 0,
      shadow: "0px 3px 8px rgba(0,0,0,0.45)",
      transparentCorners: false,
      cornerColor: "#a3432c",
      borderColor: "#a3432c",
      padding: 8,
    });
    textbox.shabadLayerId = layerId;
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.requestRenderAll();
    syncLayersFromCanvas();
    setSelectedLayerId(layerId);
  };

  const updateSelectedLayer = (patch: Partial<QuoteTextLayer>) => {
    const canvas = fabricCanvasRef.current;
    const selected = canvas?.getActiveObject() as FabricTextbox | undefined;
    if (!canvas || !selected || selected.type !== "textbox") {
      return;
    }

    const nextFontSize = patch.fontSize ?? selected.fontSize ?? 48;
    const nextLetterSpacing =
      patch.letterSpacing ?? toLetterSpacing(nextFontSize, typeof selected.charSpacing === "number" ? selected.charSpacing : 0);

    if (typeof patch.text === "string") {
      selected.set("text", patch.text);
    }
    if (typeof patch.fontFamily === "string") {
      selected.set("fontFamily", patch.fontFamily);
    }
    if (typeof patch.fontSize === "number") {
      selected.set("fontSize", patch.fontSize);
    }
    if (typeof patch.color === "string") {
      selected.set("fill", patch.color);
    }
    if (patch.align) {
      selected.set("textAlign", patch.align);
    }
    if (typeof patch.bold === "boolean") {
      selected.set("fontWeight", patch.bold ? "bold" : "normal");
    }
    if (typeof patch.shadow === "boolean") {
      selected.set("shadow", patch.shadow ? "0px 3px 8px rgba(0,0,0,0.45)" : null);
    }
    if (typeof patch.letterSpacing === "number" || typeof patch.fontSize === "number") {
      selected.set("charSpacing", toCharSpacing(nextFontSize, nextLetterSpacing));
    }
    if (typeof patch.lineHeight === "number") {
      selected.set("lineHeight", patch.lineHeight);
    }

    selected.setCoords();
    canvas.requestRenderAll();
    syncLayersFromCanvas();
  };

  const deleteSelectedLayer = () => {
    const canvas = fabricCanvasRef.current;
    const selected = canvas?.getActiveObject();
    if (!canvas || !selected) {
      return;
    }
    canvas.remove(selected);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setSelectedLayerId("");
    syncLayersFromCanvas();
  };

  const duplicateSelectedLayer = () => {
    const canvas = fabricCanvasRef.current;
    const selected = canvas?.getActiveObject() as FabricTextbox | undefined;
    const fabricModule = fabricModuleRef.current;
    if (!canvas || !selected || !fabricModule || selected.type !== "textbox") {
      return;
    }
    idCounterRef.current += 1;
    const layerId = `layer-${Date.now()}-${idCounterRef.current}`;
    const clone = new fabricModule.Textbox(selected.text ?? DEFAULT_TEXT, {
      left: clamp((selected.left ?? CANVAS_SIZE / 2) + 24, 40, CANVAS_SIZE - 40),
      top: clamp((selected.top ?? CANVAS_SIZE / 2) + 24, 40, CANVAS_SIZE - 40),
      originX: "center",
      originY: "center",
      width: selected.width ?? 640,
      fontFamily: selected.fontFamily ?? DEFAULT_FONT,
      fontSize: selected.fontSize ?? 48,
      fill: selected.fill ?? "#ffffff",
      textAlign: selected.textAlign ?? "center",
      fontWeight: selected.fontWeight ?? "bold",
      lineHeight: selected.lineHeight ?? 1.2,
      editable: true,
      charSpacing: selected.charSpacing ?? 0,
      shadow: selected.shadow ?? null,
      transparentCorners: false,
      cornerColor: "#a3432c",
      borderColor: "#a3432c",
      padding: 8,
    });
    clone.shabadLayerId = layerId;
    canvas.add(clone);
    canvas.setActiveObject(clone);
    canvas.requestRenderAll();
    setSelectedLayerId(layerId);
    syncLayersFromCanvas();
  };

  const bringForward = () => {
    const canvas = fabricCanvasRef.current;
    const selected = canvas?.getActiveObject();
    if (!canvas || !selected) {
      return;
    }
    if (typeof canvas.bringObjectForward === "function") {
      canvas.bringObjectForward(selected);
    } else if (typeof selected.bringForward === "function") {
      selected.bringForward();
    }
    canvas.requestRenderAll();
    syncLayersFromCanvas();
  };

  const sendBackward = () => {
    const canvas = fabricCanvasRef.current;
    const selected = canvas?.getActiveObject();
    if (!canvas || !selected) {
      return;
    }
    if (typeof canvas.sendObjectBackwards === "function") {
      canvas.sendObjectBackwards(selected);
    } else if (typeof selected.sendBackwards === "function") {
      selected.sendBackwards();
    }
    canvas.requestRenderAll();
    syncLayersFromCanvas();
  };

  const onBackgroundUpload = (file?: File) => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBackgroundMode("image");
        setBackgroundImageData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const getCanvasDataUrl = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      throw new Error("Canvas is not ready.");
    }
    return canvas.lowerCanvasEl.toDataURL("image/png");
  };

  const exportQuoteBlob = async () => {
    const dataUrl = getCanvasDataUrl();
    const response = await fetch(dataUrl);
    return await response.blob();
  };

  const saveQuote = async (visibility: QuoteVisibility) => {
    if (!user?.uid) {
      alert("Please login first.");
      return;
    }
    if (layers.length === 0) {
      alert("Add at least one text layer.");
      return;
    }

    const allText = layers.map((layer) => layer.text).join(" ");
    const bannedWords = findBannedWords(allText);
    if (bannedWords.length > 0) {
      alert(`Blocked due to banned words: ${Array.from(new Set(bannedWords)).join(", ")}`);
      return;
    }

    setBusy(true);
    setRetryVisibility(null);
    setStatusMessage(visibility === "public" ? "Publishing..." : "Saving draft...");
    try {
      const quoteRef = push(ref(database, "quotes"));
      const quoteId = quoteRef.key;
      if (!quoteId) {
        throw new Error("Could not create quote id.");
      }

      const imageBlob = await exportQuoteBlob();
      const imageFile = new File([imageBlob], `${quoteId}.png`, { type: "image/png" });
      const imageURL = await uploadImage(imageFile);

      const now = Date.now();

      await set(ref(database, `quotes/${quoteId}`), {
        imageURL,
        textContent: layers,
        authorId: user.uid,
        authorName: profile.displayName || user.displayName || user.email || "Creator",
        createdAt: now,
        updatedAt: now,
        likeCount: 0,
        visibility,
        isAnonymous: publishAnonymous,
      });

      setStatusMessage(visibility === "public" ? "Published successfully." : "Draft saved.");
      setRetryVisibility(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save. Try again.";
      setStatusMessage(message);
      setRetryVisibility(visibility);
    } finally {
      setBusy(false);
    }
  };

  const downloadPng = () => {
    try {
      const dataUrl = getCanvasDataUrl();
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `shabadlok-quote-${Date.now()}.png`;
      anchor.click();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Could not export image.");
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_220px]">
      <aside className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Text Controls</p>
          <button
            onClick={addTextLayer}
            type="button"
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
          >
            Add Text
          </button>
        </div>

        {selectedLayer ? (
          <div className="space-y-3 border-t border-neutral-200 pt-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">Text</label>
            <textarea
              value={selectedLayer.text}
              onChange={(event) => updateSelectedLayer({ text: event.target.value })}
              className="h-24 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
            />

            <label className="block text-sm font-medium text-neutral-700">Font Family</label>
            <select
              value={selectedLayer.fontFamily}
              onChange={(event) => updateSelectedLayer({ fontFamily: event.target.value })}
              className="w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-700">Font Size: {Math.round(selectedLayer.fontSize)}px</label>
              <input
                type="range"
                min={16}
                max={120}
                step={2}
                value={selectedLayer.fontSize}
                onChange={(event) => updateSelectedLayer({ fontSize: Number(event.target.value) })}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-4 gap-1">
              {FONT_SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => updateSelectedLayer({ fontSize: preset.value })}
                  className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-neutral-700">Text Color</label>
            <input
              type="color"
              value={selectedLayer.color}
              onChange={(event) => updateSelectedLayer({ color: event.target.value })}
              className="h-10 w-full rounded-md border border-neutral-300"
            />

            <div className="grid grid-cols-3 gap-1">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => updateSelectedLayer({ align })}
                  className={`rounded-md px-2 py-1 text-xs ${
                    selectedLayer.align === align ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-700"
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateSelectedLayer({ bold: !selectedLayer.bold })}
                className={`rounded-md px-2 py-1 text-xs ${
                  selectedLayer.bold ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-700"
                }`}
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => updateSelectedLayer({ shadow: !selectedLayer.shadow })}
                className={`rounded-md px-2 py-1 text-xs ${
                  selectedLayer.shadow ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-700"
                }`}
              >
                Shadow
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-700">
                Letter Spacing: {selectedLayer.letterSpacing.toFixed(1)}px
              </label>
              <input
                type="range"
                min={-2}
                max={20}
                step={0.5}
                value={selectedLayer.letterSpacing}
                onChange={(event) => updateSelectedLayer({ letterSpacing: Number(event.target.value) })}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-700">Line Height: {selectedLayer.lineHeight.toFixed(2)}</label>
              <input
                type="range"
                min={0.8}
                max={2.4}
                step={0.05}
                value={selectedLayer.lineHeight}
                onChange={(event) => updateSelectedLayer({ lineHeight: Number(event.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">Select a text layer to edit style.</p>
        )}

        <div className="space-y-2 border-t border-neutral-200 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Background</p>
          <div className="grid grid-cols-3 gap-1">
            {(["color", "gradient", "image"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setBackgroundMode(mode)}
                className={`rounded-md px-2 py-1 text-xs ${
                  backgroundMode === mode ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-700"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {backgroundMode === "color" ? (
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => setBackgroundColor(event.target.value)}
              className="h-10 w-full rounded-md border border-neutral-300"
            />
          ) : null}

          {backgroundMode === "gradient" ? (
            <div className="grid grid-cols-2 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedGradientId(preset.id)}
                  className={`rounded-md border px-2 py-2 text-xs ${
                    selectedGradientId === preset.id ? "border-neutral-900 text-neutral-900" : "border-neutral-300 text-neutral-700"
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]}, ${preset.colors[2]})`,
                    color: "#fff",
                    textShadow: "0 1px 2px rgba(0,0,0,.4)",
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          ) : null}

          {backgroundMode === "image" ? (
            <input
              type="file"
              accept="image/*"
              onChange={(event) => onBackgroundUpload(event.target.files?.[0])}
              className="block w-full text-sm"
            />
          ) : null}
        </div>

        <div className="space-y-2 border-t border-neutral-200 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Layers</p>
          {layers.length === 0 ? (
            <p className="text-xs text-neutral-500">No text layers yet.</p>
          ) : (
            <div className="max-h-44 space-y-1 overflow-auto">
              {layers
                .slice()
                .reverse()
                .map((layer, index) => (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => selectObjectById(layer.id)}
                    className={`block w-full rounded-md border px-2 py-2 text-left text-xs ${
                      layer.id === selectedLayerId ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700"
                    }`}
                  >
                    Layer {layers.length - index}: {layer.text.slice(0, 26) || "Untitled"}
                  </button>
                ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={duplicateSelectedLayer} className="rounded-md border border-neutral-300 px-2 py-1 text-xs">
              Duplicate
            </button>
            <button type="button" onClick={deleteSelectedLayer} className="rounded-md border border-neutral-300 px-2 py-1 text-xs">
              Delete
            </button>
            <button type="button" onClick={bringForward} className="rounded-md border border-neutral-300 px-2 py-1 text-xs">
              Bring Forward
            </button>
            <button type="button" onClick={sendBackward} className="rounded-md border border-neutral-300 px-2 py-1 text-xs">
              Send Backward
            </button>
          </div>
        </div>
      </aside>

      <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
        <div className="mx-auto flex w-full max-w-[820px] justify-center overflow-auto rounded-xl border border-neutral-300 bg-white p-2">
          <div className="w-full max-w-[800px]">
            <canvas ref={canvasElementRef} className="aspect-square h-auto w-full" />
          </div>
        </div>
      </section>

      <aside className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Actions</p>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={publishAnonymous}
            onChange={(event) => setPublishAnonymous(event.target.checked)}
            className="h-4 w-4"
          />
          Publish anonymously
        </label>
        <button
          type="button"
          onClick={() => saveQuote("private")}
          disabled={busy}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 disabled:opacity-60"
        >
          Save as Draft
        </button>
        <button
          type="button"
          onClick={downloadPng}
          disabled={busy}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 disabled:opacity-60"
        >
          Download PNG
        </button>
        <button
          type="button"
          onClick={() => saveQuote("public")}
          disabled={busy}
          className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          Publish
        </button>
        {busy ? <p className="text-xs text-neutral-600">Publishing...</p> : null}
        {retryVisibility && !busy ? (
          <button
            type="button"
            onClick={() => saveQuote(retryVisibility)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
          >
            Retry upload
          </button>
        ) : null}
        {statusMessage ? <p className="text-xs text-neutral-600">{statusMessage}</p> : null}
      </aside>
    </div>
  );
}

export type QuoteVisibility = "public" | "private";

export interface QuoteTextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  bold: boolean;
  shadow: boolean;
  letterSpacing: number;
  lineHeight: number;
  width: number;
}

export interface QuoteRecord {
  id: string;
  imageURL: string;
  textContent: QuoteTextLayer[];
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  createdAt: number;
  updatedAt: number;
  likeCount: number;
  visibility: QuoteVisibility;
}

export function normalizeQuote(id: string, value: unknown): QuoteRecord {
  const source = (value || {}) as Record<string, unknown>;
  const layers = Array.isArray(source.textContent) ? source.textContent : [];

  return {
    id,
    imageURL: typeof source.imageURL === "string" && source.imageURL.trim() ? source.imageURL : "",
    textContent: layers
      .map((layer) => {
        const l = (layer || {}) as Record<string, unknown>;
        return {
          id: typeof l.id === "string" ? l.id : Math.random().toString(36).slice(2),
          text: typeof l.text === "string" ? l.text : "",
          x: typeof l.x === "number" ? l.x : 40,
          y: typeof l.y === "number" ? l.y : 40,
          fontFamily: typeof l.fontFamily === "string" ? l.fontFamily : "Georgia, serif",
          fontSize: typeof l.fontSize === "number" ? l.fontSize : 34,
          color: typeof l.color === "string" ? l.color : "#ffffff",
          align: l.align === "left" || l.align === "right" ? l.align : "center",
          bold: l.bold === true,
          shadow: l.shadow === true,
          letterSpacing: typeof l.letterSpacing === "number" ? l.letterSpacing : 0,
          lineHeight: typeof l.lineHeight === "number" ? l.lineHeight : 1.2,
          width: typeof l.width === "number" ? l.width : 320,
        } satisfies QuoteTextLayer;
      })
      .filter((layer) => layer.text.trim().length > 0),
    authorId: typeof source.authorId === "string" ? source.authorId : "",
    authorName: typeof source.authorName === "string" ? source.authorName : "",
    isAnonymous: source.isAnonymous === true,
    createdAt: typeof source.createdAt === "number" ? source.createdAt : 0,
    updatedAt: typeof source.updatedAt === "number" ? source.updatedAt : 0,
    likeCount: typeof source.likeCount === "number" ? Math.max(0, source.likeCount) : 0,
    visibility: source.visibility === "private" ? "private" : "public",
  };
}

export function normalizeQuotesMap(mapValue: unknown): QuoteRecord[] {
  if (!mapValue || typeof mapValue !== "object") {
    return [];
  }
  return Object.entries(mapValue as Record<string, unknown>).map(([id, value]) => normalizeQuote(id, value));
}

// Splits `text` into segments, marking any segment that matches a phrase in
// `highlight` (string | string[]) so the template can wrap it in an ember span.
// Mirrors the renderHighlighted() helper from the DS React components.
export interface Segment {
  text: string;
  hit: boolean;
}

export function splitHighlight(
  text: string | null | undefined,
  highlight: string | readonly string[] | null | undefined
): Segment[] {
  if (!text) return [];
  const phrases = (Array.isArray(highlight) ? highlight : [highlight]).filter(Boolean) as string[];
  if (!phrases.length) return [{ text: String(text), hit: false }];
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const lower = phrases.map((p) => p.toLowerCase());
  return String(text)
    .split(re)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, hit: lower.includes(part.toLowerCase()) }));
}

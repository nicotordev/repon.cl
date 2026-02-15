function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isWebFile(value: unknown): value is File {
  if (!isRecord(value)) return false;
  return (
    typeof value["size"] === "number" &&
    typeof value["type"] === "string" &&
    typeof value["name"] === "string" &&
    typeof value["arrayBuffer"] === "function"
  );
}

export function firstFile(value: unknown): File | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (isWebFile(item)) return item;
    }
    return null;
  }
  return isWebFile(value) ? value : null;
}

export function firstString(value: unknown): string | null {
  if (Array.isArray(value)) {
    const s = value.find((v) => typeof v === "string");
    return typeof s === "string" ? s : null;
  }
  return typeof value === "string" ? value : null;
}

export function safeTrim(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function isMimeAllowed(
  mimeRaw: string,
  allowed: Set<string>,
): boolean {
  const mime = mimeRaw.trim().toLowerCase();
  if (mime.length === 0) return true;
  if (mime.startsWith("audio/")) return true;
  return allowed.has(mime);
}

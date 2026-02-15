"use client";

export function TranscriptPreview({ text }: { text: string }) {
  if (!text.trim()) {
    return (
      <p className="text-muted-foreground min-h-[2rem] text-sm italic">
        Transcripción en vivo…
      </p>
    );
  }
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-sm">{text}</p>
    </div>
  );
}

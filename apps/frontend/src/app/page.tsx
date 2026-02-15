import { VoiceButton } from "@/src/components/voice/VoiceButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">repon.cl</h1>
      <p className="text-muted-foreground">
        Mantén pulsado para hablar, suelta para enviar.
      </p>
      <VoiceButton />
    </main>
  );
}

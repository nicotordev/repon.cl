import Image from "next/image";
import { appName } from "@/src/lib/env";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid h-screen grid-cols-1 lg:grid-cols-2">
      {/* Columna del Formulario */}
      <section className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 bg-background">
        <div className="w-full max-w-md space-y-8">{children}</div>
      </section>

      {/* Columna de Imagen (Decorativa) */}
      <section className="relative hidden lg:block bg-muted">
        <Image
          src="/pexels-sulav-jung-hamal-742656-18925021.webp"
          alt="Atmospheric background for authentication"
          fill
          priority
          className="object-cover"
          sizes="50vw"
          quality={85}
        />
        {/* Overlay opcional para suavizar la imagen si el texto encima fuera necesario */}
        <div className="absolute inset-0 bg-black/30 z-10 flex items-center justify-center">
        </div>
      </section>
    </main>
  );
}

import Image from "next/image";
import { appName } from "@/src/lib/env";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo.webp" alt="App Logo" width={40} height={40} priority />
      <span className="text-2xl font-bold text-white">{appName}</span>
    </div>
  );
}

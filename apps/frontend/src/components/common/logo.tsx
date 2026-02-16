import { appName } from "@/lib/env";
import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-2 select-none py-2">
      <Image
        src="/logo.webp"
        alt={`${appName} Logo`}
        width={40}
        height={40}
        priority
        className="rounded-lg shadow-sm bg-card border border-border"
      />
      <span className="text-lg font-extrabold tracking-tight text-primary drop-shadow-sm leading-none">
        {appName}
      </span>
    </div>
  );
}

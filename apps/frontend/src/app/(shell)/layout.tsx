import { Shell } from "@/src/components/shell/Shell";

export default function ShellLayout({
  children,
}: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}

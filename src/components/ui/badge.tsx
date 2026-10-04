import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  red: "bg-red-500/15 text-red-700 dark:text-red-300",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
};

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: keyof typeof tones; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide", tones[tone], className)}>{children}</span>;
}

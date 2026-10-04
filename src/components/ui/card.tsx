import { cn } from "@/lib/utils";

export function Card({ className, children, id }: { className?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className={cn("rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900", className)}>
      {children}
    </section>
  );
}

export function CardHeader({ title, action, eyebrow }: { title: string; action?: React.ReactNode; eyebrow?: string }) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pt-4">
      <div>
        {eyebrow ? <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{eyebrow}</p> : null}
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</h2>
      </div>
      {action}
    </header>
  );
}

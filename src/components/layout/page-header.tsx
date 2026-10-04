export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header>
      <h1 className="sr-only">{title}</h1>
      <p className="text-sm text-zinc-500">{description}</p>
    </header>
  );
}

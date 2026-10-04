"use client";

import { Button } from "@/components/ui/button";
import { catalogScenarios } from "@/lib/engine/views";
import { useEnergyStore } from "@/lib/engine/store";
import { useRouter } from "next/navigation";

export function PresenterConsole() {
  const open = useEnergyStore((state) => state.demoOpen);
  const reset = useEnergyStore((state) => state.reset);
  const applyScenarioById = useEnergyStore((state) => state.applyScenarioById);
  const storyIndex = useEnergyStore((state) => state.storyIndex);
  const story = useEnergyStore((state) => state.campus.demoStory);
  const log = useEnergyStore((state) => state.scenarioLog);
  const goToStoryStep = useEnergyStore((state) => state.goToStoryStep);
  const setDemoOpen = useEnergyStore((state) => state.setDemoOpen);
  const router = useRouter();
  if (!open) return null;
  const step = story[storyIndex];
  return (
    <aside className="fixed bottom-4 right-4 z-40 w-[min(360px,calc(100%-2rem))] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100 shadow-2xl" aria-label="Presenter console">
      <div className="presenter-stripe h-2" />
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">Presenter</p>
        <button type="button" className="text-xs text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" onClick={() => setDemoOpen(false)}>Hide</button>
      </div>
      <div className="space-y-3 px-3 pb-3">
        <p className="text-xs text-zinc-400">Separate from the product. Scenarios patch in-memory state and leave the JSON files untouched.</p>
        <div className="flex flex-wrap gap-1.5">
          {catalogScenarios().map((scenario) => (
            <button key={scenario.id} type="button" title={scenario.description} className="rounded-md border border-zinc-700 px-2 py-1 text-left text-[11px] hover:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" onClick={() => applyScenarioById(scenario.id)}>
              {scenario.name}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-zinc-800 p-2">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Story {storyIndex + 1} / {story.length}</p>
          <p className="mt-1 text-sm">{step?.title ?? "Ready"}</p>
          <p className="text-xs text-zinc-400">{step?.detail ?? "Advance to walk the demonstration."}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => router.push(goToStoryStep(Math.min(story.length - 1, storyIndex + 1)))}>Next</Button>
            <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-100" onClick={() => router.push(goToStoryStep(0))}>Start</Button>
          </div>
        </div>
        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-100" onClick={() => reset()}>Reset demo</Button>
        <ul className="max-h-20 space-y-1 overflow-auto text-[11px] text-zinc-500">
          {log.slice().reverse().map((entry) => <li key={`${entry.id}-${entry.at}`}>{entry.name}</li>)}
        </ul>
      </div>
    </aside>
  );
}

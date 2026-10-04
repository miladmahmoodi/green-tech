"use client";

import { ConfirmDialog, controlClass, Field, FormActions, RecordTable, uniqueId } from "@/components/configuration/form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useEnergy } from "@/components/energy/use-energy";
import { useEnergyStore } from "@/lib/engine/store";
import type { CatalogType, Schedule, Tariff } from "@/types/energy";
import { useState } from "react";
import { toast } from "sonner";

export function TypesPanel() {
  const { snapshot } = useEnergy();
  const upsertDeviceType = useEnergyStore((state) => state.upsertDeviceType);
  const removeDeviceType = useEnergyStore((state) => state.removeDeviceType);
  const [draft, setDraft] = useState<CatalogType | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CatalogType | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            setCreating(true);
            setDraft({ id: "", label: "" });
          }}
        >
          Add type
        </Button>
      </div>
      <RecordTable
        columns={["Type", ""]}
        rows={snapshot.deviceTypes.map((item) => [
          item.label,
          <span key={item.id} className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => { setCreating(false); setDraft(item); }}>
              Edit
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={() => setPendingDelete(item)}>
              Delete
            </Button>
          </span>,
        ])}
      />
      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)} title={creating ? "Add type" : "Edit type"} description="Device types available when registering equipment.">
        {draft ? (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.label.trim()) {
                toast.error("Type name is required");
                return;
              }
              const id = creating ? uniqueId(draft.label, snapshot.deviceTypes.map((item) => item.id)) : draft.id;
              upsertDeviceType({ id, label: draft.label.trim() });
              toast.success(creating ? "Type added" : "Type updated");
              setDraft(null);
            }}
          >
            <Field label="Name">
              <input aria-label="Type name" className={controlClass} value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
            </Field>
            <FormActions onCancel={() => setDraft(null)} saveLabel={creating ? "Add type" : "Save"} />
          </form>
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.label ?? "type"}?`}
        body="Devices that still use this type must be changed first."
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          const error = removeDeviceType(pendingDelete.id);
          if (error) toast.error(error);
          else toast.success("Type deleted");
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

export function TariffsPanel() {
  const { snapshot } = useEnergy();
  const upsertTariff = useEnergyStore((state) => state.upsertTariff);
  const removeTariff = useEnergyStore((state) => state.removeTariff);
  const activateTariff = useEnergyStore((state) => state.activateTariff);
  const [draft, setDraft] = useState<Tariff | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Tariff | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            setCreating(true);
            setDraft({
              id: `tariff-${Date.now()}`,
              name: "",
              offPeakUsdPerKwh: snapshot.prices.offPeakUsdPerKwh,
              peakUsdPerKwh: snapshot.prices.peakUsdPerKwh,
              peakWindow: snapshot.prices.peakWindow,
              currentUsdPerKwh: snapshot.prices.currentUsdPerKwh,
              active: false,
            });
          }}
        >
          Add tariff
        </Button>
      </div>
      <RecordTable
        columns={["Tariff", "Current", "Off-peak", "Peak", "Window", ""]}
        rows={snapshot.tariffs.map((item) => [
          `${item.name}${item.active ? " · active" : ""}`,
          `$${item.currentUsdPerKwh.toFixed(2)}`,
          `$${item.offPeakUsdPerKwh.toFixed(2)}`,
          `$${item.peakUsdPerKwh.toFixed(2)}`,
          item.peakWindow,
          <span key={item.id} className="flex justify-end gap-2">
            {item.active ? null : (
              <Button type="button" size="sm" variant="secondary" onClick={() => { activateTariff(item.id); toast.success("Tariff is now active"); }}>
                Use
              </Button>
            )}
            <Button type="button" size="sm" variant="outline" onClick={() => { setCreating(false); setDraft(item); }}>
              Edit
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={() => setPendingDelete(item)}>
              Delete
            </Button>
          </span>,
        ])}
      />
      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)} title={creating ? "Add tariff" : "Edit tariff"} description="Peak and off-peak prices. The active tariff drives live cost.">
        {draft ? (
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.name.trim()) {
                toast.error("Tariff name is required");
                return;
              }
              upsertTariff({ ...draft, name: draft.name.trim() });
              toast.success(creating ? "Tariff added" : "Tariff updated");
              setDraft(null);
            }}
          >
            <Field label="Name"><input aria-label="Tariff name" className={controlClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
            <Field label="Peak window"><input aria-label="Peak window" className={controlClass} value={draft.peakWindow} onChange={(event) => setDraft({ ...draft, peakWindow: event.target.value })} /></Field>
            <Field label="Current $/kWh"><input aria-label="Current price" className={controlClass} type="number" step="0.01" value={draft.currentUsdPerKwh} onChange={(event) => setDraft({ ...draft, currentUsdPerKwh: Number(event.target.value) })} /></Field>
            <Field label="Off-peak $/kWh"><input aria-label="Off-peak price" className={controlClass} type="number" step="0.01" value={draft.offPeakUsdPerKwh} onChange={(event) => setDraft({ ...draft, offPeakUsdPerKwh: Number(event.target.value) })} /></Field>
            <Field label="Peak $/kWh"><input aria-label="Peak price" className={controlClass} type="number" step="0.01" value={draft.peakUsdPerKwh} onChange={(event) => setDraft({ ...draft, peakUsdPerKwh: Number(event.target.value) })} /></Field>
            <div className="sm:col-span-2">
              <FormActions onCancel={() => setDraft(null)} saveLabel={creating ? "Add tariff" : "Save"} />
            </div>
          </form>
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name ?? "tariff"}?`}
        body="If this tariff is active, the next one becomes the live price."
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          const error = removeTariff(pendingDelete.id);
          if (error) toast.error(error);
          else toast.success("Tariff deleted");
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

export function SchedulesPanel() {
  const { snapshot } = useEnergy();
  const upsertSchedule = useEnergyStore((state) => state.upsertSchedule);
  const removeSchedule = useEnergyStore((state) => state.removeSchedule);
  const [draft, setDraft] = useState<Schedule | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Schedule | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            setCreating(true);
            setDraft({ id: "", name: "", scope: "", windows: [], notes: "" });
          }}
        >
          Add schedule
        </Button>
      </div>
      <RecordTable
        columns={["Schedule", "Scope", "Windows", ""]}
        rows={snapshot.schedules.map((item) => [
          item.name,
          item.scope,
          item.windows.join(", "),
          <span key={item.id} className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => { setCreating(false); setDraft(item); }}>
              Edit
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={() => setPendingDelete(item)}>
              Delete
            </Button>
          </span>,
        ])}
      />
      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)} title={creating ? "Add schedule" : "Edit schedule"} description="Scope and time windows. Put each window on its own line.">
        {draft ? (
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.name.trim()) {
                toast.error("Schedule name is required");
                return;
              }
              const windows = draft.windows.map((window) => window.trim()).filter(Boolean);
              if (windows.length === 0) {
                toast.error("Add at least one time window");
                return;
              }
              const id = creating ? uniqueId(draft.name, snapshot.schedules.map((item) => item.id)) : draft.id;
              upsertSchedule({ ...draft, id, name: draft.name.trim(), scope: draft.scope.trim(), windows, notes: draft.notes.trim() });
              toast.success(creating ? "Schedule added" : "Schedule updated");
              setDraft(null);
            }}
          >
            <Field label="Name"><input aria-label="Schedule name" className={controlClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
            <Field label="Scope"><input aria-label="Schedule scope" className={controlClass} value={draft.scope} onChange={(event) => setDraft({ ...draft, scope: event.target.value })} /></Field>
            <Field label="Windows">
              <textarea aria-label="Time windows" className="min-h-24 w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-2 text-sm dark:border-zinc-700" value={draft.windows.join("\n")} onChange={(event) => setDraft({ ...draft, windows: event.target.value.split("\n") })} />
            </Field>
            <Field label="Notes">
              <textarea aria-label="Schedule notes" className="min-h-20 w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-2 text-sm dark:border-zinc-700" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
            </Field>
            <FormActions onCancel={() => setDraft(null)} saveLabel={creating ? "Add schedule" : "Save"} />
          </form>
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name ?? "schedule"}?`}
        body="This removes the schedule from the runtime model."
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeSchedule(pendingDelete.id);
          toast.success("Schedule deleted");
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

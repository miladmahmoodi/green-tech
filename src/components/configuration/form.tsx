import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export const controlClass = "h-9 w-full rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs text-zinc-500">
      {label}
      <span className="mt-1 block text-zinc-900 dark:text-zinc-100">{children}</span>
    </label>
  );
}

export function FormActions({
  onCancel,
  saveLabel = "Save",
  onDelete,
}: {
  onCancel: () => void;
  saveLabel?: string;
  onDelete?: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      {onDelete ? (
        <Button type="button" variant="danger" onClick={onDelete}>
          Delete
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{saveLabel}</Button>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={body}>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

export function RecordTable({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="px-3 py-3 text-zinc-500" colSpan={columns.length}>
                Nothing here yet.
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-zinc-100 dark:border-zinc-800">
                {row.map((cell, index) => (
                  <td key={columns[index] ?? index} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function slugId(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `item-${Date.now()}`;
}

export function uniqueId(value: string, taken: string[]): string {
  const base = slugId(value);
  if (!taken.includes(base)) return base;
  return `${base}-${Date.now()}`;
}

"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

/**
 * The current user's note on an accommodation. Collapsed to a text link until
 * opened; on a successful save it collapses again and the textarea is reset.
 */
export function NoteEditor({
  action,
  initialNote,
}: {
  action: (formData: FormData) => Promise<void>;
  initialNote: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await action(formData);
      setOpen(false); // collapse + drop the textarea once saved
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center text-xs font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
      >
        {initialNote ? "Edit your note" : "Add a note"}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <textarea
        name="note"
        rows={2}
        defaultValue={initialNote}
        autoFocus
        placeholder="Add your note about this place…"
        className="flex-1 resize-y rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-brand-blue"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400 disabled:opacity-70"
        >
          {pending && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
          {pending ? "Saving…" : initialNote ? "Update note" : "Add note"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:text-slate-700 disabled:opacity-70"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, MessageSquare } from "lucide-react";
import { AvatarStack } from "@/components/avatar-stack";

type Note = {
  id: string;
  authorName: string | null;
  authorImage: string | null;
  note: string;
};

const POPOVER_WIDTH = 288; // w-72

/**
 * Travellers' notes shown behind a compact "N notes" pill so every card keeps
 * the same height. Clicking opens a floating popover (rendered in a portal so
 * it isn't clipped by the card's overflow) that scales + fades in, and the list
 * inside scrolls when there are many notes.
 */
export function NotesPanel({ notes }: { notes: Note[] }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  function openPopover() {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const left = Math.min(
        Math.max(8, r.left),
        window.innerWidth - POPOVER_WIDTH - 8,
      );
      setCoords({ top: r.bottom + 8, left });
    }
    setOpen(true);
  }

  function closePopover() {
    setVisible(false); // play the exit transition, then unmount
    window.setTimeout(() => setOpen(false), 150);
  }

  // Once mounted, flip `visible` on the next frame so the CSS transition runs.
  // Close on outside scroll, resize, or Escape so the popover never detaches.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setVisible(true));
    const onDismiss = () => closePopover();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePopover();
    };
    window.addEventListener("scroll", onDismiss, true);
    window.addEventListener("resize", onDismiss);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onDismiss, true);
      window.removeEventListener("resize", onDismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (notes.length === 0) return null;

  // One avatar per commenter, even if they left several notes.
  const commenters = Array.from(
    new Map(
      notes.map((n) => [
        n.authorName ?? n.id,
        { name: n.authorName, image: n.authorImage },
      ]),
    ).values(),
  );

  return (
    <div className="mt-3">
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? closePopover() : openPopover())}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
      >
        <MessageSquare aria-hidden className="h-4 w-4 text-slate-400" />
        <AvatarStack people={commenters} size={20} />
        <span className="font-medium">
          {notes.length} note{notes.length === 1 ? "" : "s"}
        </span>
        <span
          aria-hidden
          className={`inline-flex transition-transform duration-150 ${
            visible ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </span>
      </button>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              aria-hidden
              onClick={closePopover}
            />
            <div
              role="dialog"
              aria-label="Notes"
              style={{ top: coords.top, left: coords.left, width: POPOVER_WIDTH }}
              className={`fixed z-50 origin-top rounded-xl border border-slate-200 bg-white p-2 shadow-xl transition duration-150 ease-out ${
                visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {notes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-slate-900">
                      {n.authorName ?? "Someone"}
                    </span>
                    <span className="text-slate-400"> — </span>
                    <span className="text-slate-600">{n.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

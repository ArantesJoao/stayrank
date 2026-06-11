"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

/**
 * Submit button that reflects the enclosing <form>'s server-action status:
 * while the action runs it disables itself and shows a spinner (and optional
 * `pendingText`). Must be rendered inside a <form action={serverAction}>.
 */
export function SubmitButton({
  children,
  pendingText,
  className = "",
  disabled,
  ...props
}: React.ComponentProps<"button"> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-1.5 ${className} disabled:cursor-not-allowed disabled:opacity-70`}
      {...props}
    >
      {pending && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
      {pending ? (pendingText ?? children) : children}
    </button>
  );
}

"use client";

/**
 * Form wrapper for destructive server actions: asks for confirmation before
 * the action runs. Pass the bound server action and a message describing
 * what's about to be deleted.
 */
export function ConfirmForm({
  action,
  message,
  className,
  children,
}: {
  action: () => Promise<void>;
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={className}
    >
      {children}
    </form>
  );
}

import Link from "next/link";

/**
 * Full-card navigation rendered as a "stretched link": an absolutely-positioned
 * overlay that is a SIBLING of the card's content rather than wrapping it.
 *
 * Wrapping a whole card in <Link> produces invalid <a>-inside-<a> nesting the
 * moment the card also contains a link (e.g. CoverImage's photo-credit link) —
 * which the browser silently restructures, causing hydration errors. As a
 * sibling overlay it never contains those links.
 *
 * Usage: place inside a `position: relative` card whose content does NOT create
 * its own stacking context. The overlay sits at z-10; any interactive child
 * that must stay clickable on top of it (credit link, menu button, a secondary
 * action) needs `relative z-20` (or `z-20` if already positioned).
 */
export function CardLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`absolute inset-0 z-10 rounded-[inherit] ${className}`}
    />
  );
}

import type { ReactNode } from "react";
import clsx from "clsx";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "center" | "start";
  className?: string;
}

export function EmptyState({ icon, title, description, action, align = "center", className }: EmptyStateProps) {
  const isCenter = align === "center";
  return (
    <div
      className={clsx(
        "flex flex-col gap-2 px-6 py-10",
        isCenter ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {icon && <div className="mb-1 text-text-faint opacity-70">{icon}</div>}
      <p className="font-display text-sm text-text">{title}</p>
      {description && <p className="max-w-[30ch] text-xs leading-relaxed text-text-faint">{description}</p>}
      {action}
    </div>
  );
}

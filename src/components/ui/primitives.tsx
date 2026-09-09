import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "fire-gradient text-white shadow-lift hover:brightness-105 active:scale-[0.985] disabled:opacity-60",
  secondary:
    "bg-white text-charcoal-900 border border-cream-300 shadow-soft hover:bg-cream-50 active:scale-[0.985] disabled:opacity-60",
  ghost:
    "bg-transparent text-charcoal-700 hover:bg-cream-200/70 active:scale-[0.985] disabled:opacity-50",
  danger:
    "bg-white text-cayenne-700 border border-cayenne-200 hover:bg-cayenne-50 active:scale-[0.985]",
};

const SIZES = {
  sm: "h-10 px-4 text-sm rounded-xl",
  md: "h-12 px-5 text-[15px] rounded-2xl",
  lg: "h-14 px-6 text-base rounded-2xl",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: keyof typeof SIZES;
  full?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 font-bold tracking-tight transition-all",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        full && "w-full",
        className,
      )}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  full,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: keyof typeof SIZES;
  full?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center gap-2 font-bold tracking-tight transition-all",
        VARIANTS[variant],
        SIZES[size],
        full && "w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return <Tag className={cx("card p-5", className)}>{children}</Tag>;
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col gap-0.5 p-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-2xl font-extrabold tabular-nums text-charcoal-900">
          {value}
        </span>
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500">
        {label}
      </span>
      {hint ? <span className="text-xs text-charcoal-500">{hint}</span> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  mascot,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  mascot?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      {mascot}
      <h3 className="text-lg font-extrabold text-charcoal-900">{title}</h3>
      <p className="max-w-xs text-sm leading-relaxed text-charcoal-500">{body}</p>
      {action}
    </div>
  );
}

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm font-semibold text-cayenne-700">
      {message}
    </p>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden="true" />;
}

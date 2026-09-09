import Link from "next/link";

export function SubHeader({
  title,
  back = "/more",
  action,
}: {
  title: string;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 px-5 pb-4 pt-5">
      <Link
        href={back}
        aria-label="Back"
        className="tap grid place-items-center rounded-full text-charcoal-700"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="m14.5 5-7 7 7 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <h1 className="flex-1 truncate text-xl font-extrabold text-charcoal-900">{title}</h1>
      {action}
    </header>
  );
}

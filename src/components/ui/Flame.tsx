export function Flame({
  size = 24,
  className,
  muted = false,
}: {
  size?: number;
  className?: string;
  muted?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={muted ? "flame-muted" : "flame-hot"} x1="12" y1="2" x2="12" y2="22">
          <stop offset="0%" stopColor={muted ? "#C9C2B6" : "#FFC24B"} />
          <stop offset="55%" stopColor={muted ? "#AEA69A" : "#F15A24"} />
          <stop offset="100%" stopColor={muted ? "#948C80" : "#D92D20"} />
        </linearGradient>
      </defs>
      <path
        d="M12.6 1.4c.3 3 .1 4.6-1.6 6.6-1.5 1.8-2.1 2.6-2.4 3.7-.4-.7-.7-1.6-.7-2.6C5.6 11 4.5 13.3 4.5 15.6 4.5 19.7 7.9 23 12 23s7.5-3.3 7.5-7.4c0-5.6-4.2-8.2-6.9-14.2Z"
        fill={`url(#${muted ? "flame-muted" : "flame-hot"})`}
      />
      <path
        d="M12 23c-2.2 0-4-1.8-4-4 0-2.2 1.6-3.2 2.7-5.3.9 1.2 1.4 1.8 2.4 2.7 1.6 1.4 2.9 2.2 2.9 4.1-.4 1.4-2 2.5-4 2.5Z"
        fill="#FFF7E8"
        opacity={muted ? 0.25 : 0.55}
      />
    </svg>
  );
}

type MascotProps = {
  /** `wave` for greetings, `cheer` for milestones, `rest` for empty states. */
  pose?: "wave" | "cheer" | "rest";
  size?: number;
  className?: string;
};

/**
 * The brand mascot — a friendly cayenne pepper. Inline SVG so it inherits page
 * animation, scales cleanly and never costs a network request.
 */
export function Mascot({ pose = "wave", size = 96, className }: MascotProps) {
  const cheering = pose === "cheer";
  const resting = pose === "rest";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      role="img"
      aria-label="Cayenne Do It mascot"
    >
      <defs>
        <linearGradient id="cdi-body" x1="34" y1="26" x2="92" y2="112">
          <stop offset="0%" stopColor="#F2513C" />
          <stop offset="52%" stopColor="#D92D20" />
          <stop offset="100%" stopColor="#A3170F" />
        </linearGradient>
        <linearGradient id="cdi-stem" x1="52" y1="6" x2="72" y2="30">
          <stop offset="0%" stopColor="#48A277" />
          <stop offset="100%" stopColor="#12372A" />
        </linearGradient>
      </defs>

      {/* arms sit behind the body */}
      {cheering ? (
        <g stroke="#C9271B" strokeWidth="9" strokeLinecap="round">
          <path d="M35 62 19 42" />
          <path d="M85 62l16-20" />
        </g>
      ) : (
        <g stroke="#C9271B" strokeWidth="9" strokeLinecap="round">
          <path d="M35 72 20 70" />
          <path d="M85 68l14-8" />
        </g>
      )}

      {/* body: wide shoulders tapering to a soft tip */}
      <path
        d="M60 22c17 0 30 13 31 30 1 21-6 38-16 50-5 6-10 9-15 9s-10-3-15-9C35 90 28 73 29 52c1-17 14-30 31-30Z"
        fill="url(#cdi-body)"
      />

      {/* highlight */}
      <path
        d="M44 44c3-8 9-13 14-12 3 1 2 5-1 8-4 4-7 9-9 15-2 5-6 4-6-1 0-3 1-6 2-10Z"
        fill="#fff"
        opacity="0.3"
      />

      {/* stem + leaf */}
      <path
        d="M60 24c-2-8 1-15 7-19 2-1 4 1 3 3-3 5-4 10-3 14"
        stroke="url(#cdi-stem)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M50 26c5-6 15-7 22-2-7 5-17 6-22 2Z" fill="#2F6B53" />

      {/* hands */}
      {cheering ? (
        <>
          <circle cx="17" cy="39" r="8" fill="#F2513C" />
          <circle cx="103" cy="39" r="8" fill="#F2513C" />
        </>
      ) : (
        <>
          <circle cx="17" cy="70" r="8" fill="#F2513C" />
          {/* thumbs up */}
          <g>
            <circle cx="101" cy="59" r="9" fill="#F2513C" />
            <rect x="97" y="43" width="8" height="13" rx="4" fill="#F2513C" />
          </g>
        </>
      )}

      {/* sunglasses */}
      <g transform={resting ? "translate(0 4)" : undefined}>
        <rect x="37" y="52" width="20" height="14" rx="6.5" fill="#1B1B1B" />
        <rect x="63" y="52" width="20" height="14" rx="6.5" fill="#1B1B1B" />
        <path d="M57 57.5h6" stroke="#1B1B1B" strokeWidth="4" strokeLinecap="round" />
        <path d="M40.5 56h6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.5" />
        <path d="M66.5 56h6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.5" />
      </g>

      {/* mouth */}
      {resting ? (
        <path d="M53 78h14" stroke="#6B0F09" strokeWidth="4" strokeLinecap="round" />
      ) : cheering ? (
        <path d="M48 74q12 20 24 0a34 34 0 0 1-24 0Z" fill="#6B0F09" />
      ) : (
        <path d="M50 75q10 14 20 0a28 28 0 0 1-20 0Z" fill="#6B0F09" />
      )}
    </svg>
  );
}

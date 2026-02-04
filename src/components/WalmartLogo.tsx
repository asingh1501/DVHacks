// Walmart Spark logo — 6 rounded pill-shaped petals with center gap
export function WalmartSpark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-label="Walmart"
    >
      {/* 6 pill/capsule petals radiating from center, 60° apart */}
      <g transform="translate(12,12)">
        <rect x="-2.2" y="-11" width="4.4" height="8.5" rx="2.2" />
        <rect x="-2.2" y="-11" width="4.4" height="8.5" rx="2.2" transform="rotate(60)" />
        <rect x="-2.2" y="-11" width="4.4" height="8.5" rx="2.2" transform="rotate(120)" />
        <rect x="-2.2" y="-11" width="4.4" height="8.5" rx="2.2" transform="rotate(180)" />
        <rect x="-2.2" y="-11" width="4.4" height="8.5" rx="2.2" transform="rotate(240)" />
        <rect x="-2.2" y="-11" width="4.4" height="8.5" rx="2.2" transform="rotate(300)" />
      </g>
    </svg>
  );
}

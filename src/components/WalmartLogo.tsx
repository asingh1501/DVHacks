// Walmart Spark logo — refined 6-petal spark with tapered petals
export function WalmartSpark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      className={className}
      aria-label="Walmart"
    >
      {/* 6 tapered petals radiating from center, 60° apart */}
      <g transform="translate(24,24)">
        {/* Top petal */}
        <path d="M0,-20 C3,-18 3.8,-8 0,-4 C-3.8,-8 -3,-18 0,-20Z" />
        {/* 60° */}
        <path d="M0,-20 C3,-18 3.8,-8 0,-4 C-3.8,-8 -3,-18 0,-20Z" transform="rotate(60)" />
        {/* 120° */}
        <path d="M0,-20 C3,-18 3.8,-8 0,-4 C-3.8,-8 -3,-18 0,-20Z" transform="rotate(120)" />
        {/* 180° */}
        <path d="M0,-20 C3,-18 3.8,-8 0,-4 C-3.8,-8 -3,-18 0,-20Z" transform="rotate(180)" />
        {/* 240° */}
        <path d="M0,-20 C3,-18 3.8,-8 0,-4 C-3.8,-8 -3,-18 0,-20Z" transform="rotate(240)" />
        {/* 300° */}
        <path d="M0,-20 C3,-18 3.8,-8 0,-4 C-3.8,-8 -3,-18 0,-20Z" transform="rotate(300)" />
        {/* Center dot */}
        <circle cx="0" cy="0" r="3" />
      </g>
    </svg>
  );
}

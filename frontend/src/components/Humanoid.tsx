import type { ReactElement } from "react";

interface HumanoidProps {
  activity: string;
  size?: number;
  color?: string;
  glow?: boolean;
}

/**
 * Cybernetic humanoid vector glyph representing the subject posture
 * inferred from Wi-Fi CSI amplitude modulation.
 */
export default function Humanoid({ activity, size = 28, color = "currentColor", glow = false }: HumanoidProps) {
  const strokeColor = color;
  const common = { 
    stroke: strokeColor, 
    strokeWidth: 2.2, 
    fill: "none", 
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const poses: Record<string, ReactElement> = {
    stand: (
      <g {...common}>
        {/* Head with inner node */}
        <circle cx="12" cy="4" r="2.4" fill={strokeColor} fillOpacity={0.25} />
        <circle cx="12" cy="4" r="1.1" fill={strokeColor} stroke="none" />
        {/* Spine */}
        <line x1="12" y1="6.4" x2="12" y2="14.5" />
        {/* Arms */}
        <path d="M 6.8 12.5 L 12 8.5 L 17.2 12.5" />
        {/* Legs */}
        <path d="M 8.2 21.5 L 12 14.5 L 15.8 21.5" />
        {/* Joint indicators */}
        <circle cx="12" cy="8.5" r="0.8" fill={strokeColor} stroke="none" />
      </g>
    ),
    sit: (
      <g {...common}>
        <circle cx="12" cy="4.2" r="2.4" fill={strokeColor} fillOpacity={0.25} />
        <circle cx="12" cy="4.2" r="1.1" fill={strokeColor} stroke="none" />
        <line x1="12" y1="6.6" x2="12" y2="13" />
        <path d="M 7 11.5 L 12 8.8 L 16.5 11" />
        {/* Thighs horizontal, calves vertical */}
        <path d="M 12 13 L 17.5 14.5 L 17.5 21.5" />
        <path d="M 12 13 L 9.5 15.5 L 9.5 21.5" />
        <circle cx="12" cy="13" r="0.8" fill={strokeColor} stroke="none" />
      </g>
    ),
    walk: (
      <g {...common}>
        <circle cx="13" cy="4" r="2.4" fill={strokeColor} fillOpacity={0.25} />
        <circle cx="13" cy="4" r="1.1" fill={strokeColor} stroke="none" />
        <line x1="13" y1="6.4" x2="12" y2="14" />
        {/* Swinging arms */}
        <path d="M 7.2 9 L 12.5 8.2 L 17.5 12" />
        {/* Striding legs */}
        <path d="M 6.5 21.5 L 10 16.5 L 12 14 L 15.5 17.5 L 18 21.5" />
        <circle cx="12.5" cy="8.2" r="0.8" fill={strokeColor} stroke="none" />
      </g>
    ),
    fall: (
      <g {...common} transform="rotate(76 12 12)">
        <circle cx="12" cy="4.2" r="2.4" fill={strokeColor} fillOpacity={0.4} />
        <circle cx="12" cy="4.2" r="1.1" fill={strokeColor} stroke="none" />
        <line x1="12" y1="6.6" x2="12" y2="14" />
        <path d="M 6 8.5 L 12 8.5 L 18 11.5" />
        <path d="M 6.5 20.5 L 12 14 L 17.5 19.5" />
        {/* Impact shock lines */}
        <line x1="2" y1="18" x2="4" y2="19" strokeOpacity={0.6} />
        <line x1="3" y1="21" x2="5" y2="21" strokeOpacity={0.6} />
      </g>
    ),
    empty: (
      <g {...common} opacity={0.35} strokeDasharray="2.5 2.5">
        <circle cx="12" cy="4" r="2.4" />
        <line x1="12" y1="6.4" x2="12" y2="14.5" />
        <line x1="7" y1="11.5" x2="17" y2="11.5" />
        <line x1="12" y1="14.5" x2="8" y2="21.5" />
        <line x1="12" y1="14.5" x2="16" y2="21.5" />
      </g>
    ),
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      style={glow ? { filter: `drop-shadow(0 0 8px ${strokeColor})` } : undefined}
      className="transition-transform duration-300"
    >
      {poses[activity] ?? poses.stand}
    </svg>
  );
}

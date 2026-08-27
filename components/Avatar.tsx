import type { AvatarConfig } from "@/lib/schemas/avatar";

const SKIN = "#f2c6a0";

export function Avatar({
  cfg,
  size = 96,
}: {
  cfg?: AvatarConfig | null;
  size?: number;
}) {
  const {
    bg = "#efe9ff",
    skin = SKIN,
    hair = "short",
    hairColor = "#6b7280",
    beard = false,
    mustache = false,
    glasses = false,
    accessory = "none",
  } = cfg || {};

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="50" r="49" fill={bg} />
      <rect x="43" y="66" width="14" height="12" rx="6" fill={skin} />
      <path d="M24 100 Q50 74 76 100 Z" fill="#ffffff" opacity="0.85" />
      <circle cx="27" cy="52" r="5" fill={skin} />
      <circle cx="73" cy="52" r="5" fill={skin} />
      <ellipse cx="50" cy="50" rx="24" ry="26" fill={skin} />
      {beard && (
        <path
          d="M28 52 Q30 82 50 84 Q70 82 72 52 Q66 68 50 68 Q34 68 28 52 Z"
          fill={hairColor}
        />
      )}
      <circle cx="41" cy="49" r="3.1" fill="#2f2a3d" />
      <circle cx="59" cy="49" r="3.1" fill="#2f2a3d" />
      <circle cx="42" cy="48" r="1" fill="#fff" />
      <circle cx="60" cy="48" r="1" fill="#fff" />
      <path
        d="M36 43 Q41 41 46 43"
        stroke={hairColor}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M54 43 Q59 41 64 43"
        stroke={hairColor}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M50 51 Q52 56 49 57"
        stroke="#c98d68"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {!mustache ? (
        <path
          d="M43 61 Q50 66 57 61"
          stroke="#a65b47"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M44 62 Q50 65 56 62"
          stroke="#a65b47"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {mustache && (
        <path d="M42 58 Q50 55 58 58 Q50 61 42 58 Z" fill={hairColor} />
      )}
      {hair === "short" && (
        <path
          d="M26 46 Q26 22 50 22 Q74 22 74 46 Q70 34 50 33 Q30 34 26 46 Z"
          fill={hairColor}
        />
      )}
      {hair === "sides" && (
        <>
          <path d="M26 54 Q24 36 33 30 Q30 40 30 52 Z" fill={hairColor} />
          <path d="M74 54 Q76 36 67 30 Q70 40 70 52 Z" fill={hairColor} />
          <path
            d="M30 30 Q50 24 70 30 Q50 27 30 30 Z"
            fill={hairColor}
            opacity="0.5"
          />
        </>
      )}
      {hair === "bald" && (
        <>
          <path d="M28 56 Q26 44 31 40 Q30 48 31 56 Z" fill={hairColor} />
          <path d="M72 56 Q74 44 69 40 Q70 48 69 56 Z" fill={hairColor} />
          <ellipse cx="45" cy="30" rx="8" ry="4" fill="#fff" opacity="0.18" />
        </>
      )}
      {hair === "long" && (
        <path
          d="M24 66 Q22 30 50 24 Q78 30 76 66 Q72 40 50 36 Q28 40 24 66 Z"
          fill={hairColor}
        />
      )}
      {hair === "curly" && (
        <path
          d="M28 40 a7 7 0 1 1 12 -4 a7 7 0 1 1 20 0 a7 7 0 1 1 12 4 Q70 30 50 28 Q30 30 28 40 Z"
          fill={hairColor}
        />
      )}
      {glasses && (
        <g stroke="#37324a" strokeWidth="1.8" fill="none">
          <circle cx="41" cy="49" r="7" fill="#ffffff" fillOpacity="0.25" />
          <circle cx="59" cy="49" r="7" fill="#ffffff" fillOpacity="0.25" />
          <path d="M48 49 H52" />
          <path d="M34 48 L30 47" />
          <path d="M66 48 L70 47" />
        </g>
      )}
      {accessory === "cigar" && (
        <g>
          <rect
            x="57"
            y="61"
            width="16"
            height="3.4"
            rx="1.7"
            fill="#8a5a2b"
            transform="rotate(8 57 61)"
          />
          <circle cx="74" cy="64" r="2.1" fill="#ff7a3d" />
        </g>
      )}
      {accessory === "bowtie" && (
        <path d="M44 74 L50 77 L44 80 Z M56 74 L50 77 L56 80 Z" fill="#e0466b" />
      )}
    </svg>
  );
}

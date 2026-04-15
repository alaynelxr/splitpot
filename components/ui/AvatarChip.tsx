"use client";

interface AvatarChipProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
  active?: boolean;
  onClick?: () => void;
  showName?: boolean;
}

const sizes = {
  sm: { dot: "w-6 h-6 text-[9px]", label: "text-[10px]" },
  md: { dot: "w-8 h-8 text-xs",    label: "text-xs" },
  lg: { dot: "w-10 h-10 text-sm",  label: "text-xs" },
};

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export function AvatarChip({
  name,
  color,
  size = "md",
  active = true,
  onClick,
  showName = false,
}: AvatarChipProps) {
  const sz = sizes[size];
  const interactiveClass = onClick
    ? "cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-120"
    : "";

  return (
    <div
      className={["flex flex-col items-center gap-1", interactiveClass].join(" ")}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-pressed={onClick ? active : undefined}
      aria-label={name}
    >
      <div
        className={[
          sz.dot,
          "flex items-center justify-center font-heading font-bold select-none transition-opacity duration-150",
        ].join(" ")}
        style={{
          backgroundColor: active ? color : "transparent",
          color: active ? "#1A1A2E" : color,
          border: `2px solid ${color}`,
          opacity: active ? 1 : 0.4,
        }}
      >
        {initials(name)}
      </div>
      {showName && (
        <span
          className={[sz.label, "font-heading text-center max-w-[60px] truncate"].join(" ")}
          style={{ color: active ? color : "#9D9DB5" }}
        >
          {name}
        </span>
      )}
    </div>
  );
}

/** Compact cluster of up to 4 avatars shown on an item tile */
export function AvatarCluster({
  participants,
  assignedIds,
  allCount,
}: {
  participants: Array<{ id: string; name: string; color: string }>;
  assignedIds: string[]; // empty = all
  allCount: number;
}) {
  const isAll = assignedIds.length === 0 || assignedIds.length === allCount;

  if (isAll) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-heading text-bg bg-green">
        ALL
      </span>
    );
  }

  const relevant = participants.filter((p) => assignedIds.includes(p.id));
  const shown = relevant.slice(0, 4);
  const overflow = relevant.length - shown.length;

  return (
    <span className="inline-flex items-center gap-1">
      {shown.map((p) => (
        <AvatarChip key={p.id} name={p.name} color={p.color} size="sm" />
      ))}
      {overflow > 0 && (
        <span className="text-[10px] font-heading text-muted">+{overflow}</span>
      )}
    </span>
  );
}

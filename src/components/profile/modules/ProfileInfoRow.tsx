"use client";

export function ProfileInfoRow({ icon, label, value, valueNode }: { icon: string; label: string; value?: number | string; valueNode?: React.ReactNode; }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t first:border-t-0 bg-[color:var(--bg-600)] border-[color:var(--bg-800)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt={`Icône ${label}`} className="size-5" />
      <div className="text-sm font-medium text-muted-foreground">
        {label}
        {typeof value !== "undefined" && (
          <span className="ml-1 font-normal text-foreground">{String(value)}</span>
        )}
        {valueNode && <span className="ml-2">{valueNode}</span>}
      </div>
    </div>
  );
}

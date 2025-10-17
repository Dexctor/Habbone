"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type DivProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "bg-[color:var(--card)] text-[color:var(--foreground)]",
        "border border-[color:var(--border)] rounded-[var(--radius)]",
        "shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "px-4 py-3 border-b border-[color:var(--border)]",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: DivProps) {
  return (
    <div className={cn("text-base font-semibold", className)} {...props} />
  );
}

export function CardBody({ className, ...props }: DivProps) {
  return <div className={cn("p-4", className)} {...props} />;
}


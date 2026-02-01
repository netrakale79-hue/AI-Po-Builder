import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
}

export function Card({ children, className, gradient = false }: CardProps) {
  return (
    <div className={clsx(
      "relative overflow-hidden rounded-2xl border border-border/50 bg-white p-6 shadow-xl shadow-black/5 transition-all duration-300",
      gradient && "bg-gradient-to-br from-white to-slate-50",
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("mb-4 flex flex-col gap-1", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={clsx("font-display text-xl font-bold text-foreground", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx("text-sm text-muted-foreground", className)}>{children}</p>;
}

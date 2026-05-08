import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary hover:bg-primary-dark text-white shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.97] disabled:bg-primary/50 disabled:translate-y-0 disabled:shadow-sm",
  secondary:
    "bg-secondary hover:bg-secondary-dark text-white shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.97] disabled:bg-secondary/50 disabled:translate-y-0 disabled:shadow-sm",
  danger:
    "bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.97] disabled:bg-rose-400 disabled:translate-y-0",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.97] disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-5 py-2.5 text-base rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  className = "",
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`font-semibold transition-all duration-150 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2 justify-center">
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

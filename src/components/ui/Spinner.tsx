type Props = { size?: "sm" | "md" | "lg"; className?: string };

const sizeMap = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };

export default function Spinner({ size = "md", className = "" }: Props) {
  return (
    <div
      className={`border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin ${sizeMap[size]} ${className}`}
    />
  );
}

export default function PhotoPlaceholder({ iconSize = 32 }: { iconSize?: number }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      <svg
        width={iconSize}
        height={iconSize}
        fill="none"
        viewBox="0 0 24 24"
        stroke="#94a3b8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}

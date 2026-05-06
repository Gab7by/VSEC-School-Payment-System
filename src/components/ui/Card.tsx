type Props = {
  label: string;
  value: string;
  sub?: string;
  color?: "blue" | "green" | "orange" | "red" | "gray";
};

const colorMap = {
  blue: { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-600", text: "text-blue-700" },
  green: { bg: "bg-green-50", icon: "bg-green-100 text-green-600", text: "text-green-700" },
  orange: { bg: "bg-orange-50", icon: "bg-orange-100 text-orange-600", text: "text-orange-700" },
  red: { bg: "bg-red-50", icon: "bg-red-100 text-red-600", text: "text-red-700" },
  gray: { bg: "bg-gray-50", icon: "bg-gray-100 text-gray-600", text: "text-gray-700" },
};

export default function StatCard({ label, value, sub, color = "blue" }: Props) {
  const c = colorMap[color];
  return (
    <div className={`rounded-xl p-5 ${c.bg} border border-transparent`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

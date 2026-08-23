import { STATUS_CFG } from "./statusConfig";

export default function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, cls: "bg-slate-700 text-slate-300" };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

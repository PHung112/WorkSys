import { useState } from "react";

export default function UserSearchRow({ user, onAdd, isInvited = false }) {
  const [role, setRole] = useState("MEMBER");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    await onAdd(user.id, role);
    setAdding(false);
  };

  return (
    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 mx-1.5 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 bg-purple-600/35 rounded-full flex items-center justify-center text-xs font-bold text-purple-300 shrink-0">
          {user.username?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{user.username}</div>
          <div className="text-white/35 text-xs truncate">{user.email}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={isInvited}
          className="bg-slate-700 border border-white/15 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500 disabled:opacity-50"
        >
          <option value="MEMBER">MEMBER</option>
          <option value="MANAGER">MANAGER</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={adding || isInvited}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            isInvited
              ? "bg-green-600/30 text-green-300 border border-green-600/30 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          }`}
        >
          {isInvited ? "✓ Đã mời" : adding ? "..." : "+ Mời"}
        </button>
      </div>
    </div>
  );
}

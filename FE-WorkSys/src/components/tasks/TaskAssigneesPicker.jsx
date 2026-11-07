import { labelCls } from "../common/formStyles";

/**
 * Component chọn người được phân công nhiệm vụ
 */
export default function TaskAssigneesPicker({
  members,
  filteredMembers,
  assignedToIds,
  setAssignedToIds,
  searchMemberQuery,
  setSearchMemberQuery,
  loadingMembers,
  onToggleSelectAll,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={labelCls + " !mb-0"}>Giao cho ai *</label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant">
            Đã chọn: <strong className="text-primary">{assignedToIds.length}</strong> / {members.length}
          </span>
          {filteredMembers.length > 0 && (
            <button
              type="button"
              onClick={onToggleSelectAll}
              className="text-xs text-primary hover:underline cursor-pointer font-medium"
            >
              {assignedToIds.length === filteredMembers.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          )}
        </div>
      </div>

      {/* Ô tìm kiếm thành viên */}
      <div className="relative mb-2.5">
        <input
          type="text"
          value={searchMemberQuery}
          onChange={(e) => setSearchMemberQuery(e.target.value)}
          placeholder="Tìm kiếm thành viên theo tên hoặc email..."
          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl pl-9 pr-8 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition"
        />
        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
          search
        </span>
        {searchMemberQuery && (
          <button
            type="button"
            onClick={() => setSearchMemberQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-[16px] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* Danh sách thành viên */}
      <div className="max-h-52 overflow-y-auto space-y-1.5 border border-outline-variant/20 rounded-xl p-2.5 bg-surface-container-lowest divide-y divide-outline-variant/10 custom-scrollbar">
        {loadingMembers ? (
          <p className="text-xs text-on-surface-variant text-center py-4">
            Đang tải danh sách thành viên...
          </p>
        ) : filteredMembers.length === 0 ? (
          <p className="text-xs text-on-surface-variant italic py-4 text-center">
            Không tìm thấy thành viên phù hợp
          </p>
        ) : (
          filteredMembers.map((m) => {
            const isChecked = assignedToIds.includes(m.userId);
            return (
              <label
                key={m.userId}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer group transition ${
                  isChecked
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-surface-container-high/50 border border-transparent"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                    isChecked
                      ? "bg-primary border-primary text-on-primary"
                      : "border-outline-variant/50 group-hover:border-primary/50"
                  }`}
                >
                  {isChecked && (
                    <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                  )}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setAssignedToIds((prev) => [...prev, m.userId]);
                    } else {
                      setAssignedToIds((prev) => prev.filter((id) => id !== m.userId));
                    }
                  }}
                />
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.username} className="w-full h-full object-cover" />
                  ) : (
                    m.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-on-surface text-xs font-semibold truncate">
                      {m.username}
                    </span>
                    {m.role && (
                      <span className="px-1.5 py-0.5 bg-surface-container-high text-[10px] text-on-surface-variant rounded border border-outline-variant/10">
                        {m.role}
                      </span>
                    )}
                  </div>
                  {m.email && (
                    <span className="text-[11px] text-on-surface-variant truncate">{m.email}</span>
                  )}
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

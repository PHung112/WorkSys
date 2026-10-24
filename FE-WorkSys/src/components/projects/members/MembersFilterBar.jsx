const ROLE_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "ADMIN", label: "Admin" },
  { key: "MANAGER", label: "Manager" },
  { key: "MEMBER", label: "Member" },
];

/**
 * Thanh tìm kiếm & Bộ lọc vai trò thành viên
 */
export default function MembersFilterBar({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
      {/* Ô tìm kiếm */}
      <div className="relative w-full sm:w-80">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm thành viên theo tên, email..."
          className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-on-surface-variant/50"
        />
      </div>

      {/* Bộ lọc Role */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        {ROLE_TABS.map((tab) => {
          const isActive = roleFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-primary text-on-primary shadow-sm shadow-primary/20"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/10"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

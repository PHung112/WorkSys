/**
 * Bộ lọc kho lưu trữ: tìm kiếm theo tên, lọc theo tháng, lọc theo người làm
 */
export default function ArchiveFilterBar({
  searchQuery,
  setSearchQuery,
  monthFilter,
  setMonthFilter,
  assigneeFilter,
  setAssigneeFilter,
  availableMonths,
  availableAssignees,
}) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
      {/* Ô tìm kiếm */}
      <div className="relative w-full md:w-80">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm theo tên task..."
          className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-on-surface-variant/50"
        />
      </div>

      {/* Dropdown Filters */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:flex-none md:w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[16px]">
            event
          </span>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-9 pr-8 py-2.5 text-xs text-on-surface appearance-none outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer"
          >
            <option value="ALL">Tất cả thời gian</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                Tháng {month}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[16px] pointer-events-none">
            arrow_drop_down
          </span>
        </div>

        <div className="relative flex-1 md:flex-none md:w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[16px]">
            person
          </span>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-9 pr-8 py-2.5 text-xs text-on-surface appearance-none outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer"
          >
            <option value="ALL">Tất cả người làm</option>
            {availableAssignees.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[16px] pointer-events-none">
            arrow_drop_down
          </span>
        </div>
      </div>
    </div>
  );
}

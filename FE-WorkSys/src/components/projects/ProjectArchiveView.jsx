import { useState, useMemo } from "react";

/**
 * Component hiển thị kho lưu trữ (Archive) của dự án trực tiếp bên trong ProjectDetail
 */
export default function ProjectArchiveView({
  archivedTasks = [],
  selectedProject,
  onBackToKanban,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");

  // Lấy danh sách các tháng duy nhất có task lưu trữ
  const availableMonths = useMemo(() => {
    const months = new Set();
    archivedTasks.forEach((task) => {
      if (task.archivedAt) {
        const date = new Date(task.archivedAt);
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = date.getFullYear();
        months.add(`${m}/${y}`);
      }
    });
    return Array.from(months).sort().reverse();
  }, [archivedTasks]);

  // Lấy danh sách thành viên thực hiện
  const availableAssignees = useMemo(() => {
    const map = new Map();
    archivedTasks.forEach((task) => {
      if (task.assignees) {
        task.assignees.forEach((u) => {
          if (!map.has(u.id)) {
            map.set(u.id, u);
          }
        });
      }
    });
    return Array.from(map.values());
  }, [archivedTasks]);

  // Lọc task
  const filteredTasks = useMemo(() => {
    return archivedTasks.filter((task) => {
      const matchQuery =
        !searchQuery.trim() ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchMonth = true;
      if (monthFilter !== "ALL" && task.archivedAt) {
        const date = new Date(task.archivedAt);
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = date.getFullYear();
        matchMonth = `${m}/${y}` === monthFilter;
      } else if (monthFilter !== "ALL") {
        matchMonth = false;
      }

      let matchAssignee = true;
      if (assigneeFilter !== "ALL") {
        matchAssignee = task.assignees?.some((u) => String(u.id) === assigneeFilter);
      }

      return matchQuery && matchMonth && matchAssignee;
    });
  }, [archivedTasks, searchQuery, monthFilter, assigneeFilter]);

  return (
    <div className="flex-1 flex flex-col w-full h-full px-container-margin overflow-y-auto custom-scrollbar pb-10">
      {/* Header thanh điều hướng & Thao tác */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToKanban}
            className="h-9 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg flex items-center gap-1.5 text-xs font-medium border border-outline-variant/20 transition-colors cursor-pointer"
            title="Quay lại Bảng công việc Kanban"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Bảng công việc</span>
          </button>
          <div className="h-4 w-px bg-outline-variant/20 hidden sm:block"></div>
          <div>
            <h2 className="font-display text-xl font-bold text-on-background flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-[24px] text-primary">inventory_2</span>
              <span>Kho lưu trữ nhiệm vụ</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                {archivedTasks.length}
              </span>
            </h2>
            <p className="text-on-surface-variant text-xs mt-0.5">
              Các nhiệm vụ đã hoàn thành và được tự động lưu trữ sau 7 ngày
            </p>
          </div>
        </div>

        <div className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/10 flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-[16px] text-amber-500">info</span>
          Tự động bảo quản lịch sử công việc
        </div>
      </div>

      {/* Thanh tìm kiếm & Bộ lọc */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 my-4 shrink-0">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên task..."
            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-9 pr-4 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-all placeholder:text-on-surface-variant/50"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-44">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-xs text-on-surface appearance-none outline-none focus:border-primary/50 transition-all cursor-pointer pr-8"
            >
              <option value="ALL">Tất cả thời gian</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[16px] pointer-events-none">
              arrow_drop_down
            </span>
          </div>

          <div className="relative flex-1 md:flex-none md:w-44">
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-xs text-on-surface appearance-none outline-none focus:border-primary/50 transition-all cursor-pointer pr-8"
            >
              <option value="ALL">Tất cả người làm</option>
              {availableAssignees.map((u) => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[16px] pointer-events-none">
              arrow_drop_down
            </span>
          </div>
        </div>
      </div>

      {/* Bảng danh sách task đã archive */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-outline-variant/15 bg-surface-container/50">
                <th className="py-3 px-4 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                  Nhiệm vụ
                </th>
                <th className="py-3 px-4 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                  Người thực hiện
                </th>
                <th className="py-3 px-4 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider w-40">
                  Trạng thái
                </th>
                <th className="py-3 px-4 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider text-right w-44">
                  Ngày lưu trữ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-on-surface-variant text-xs italic">
                    Không có nhiệm vụ nào trong kho lưu trữ
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-surface-container-high/40 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-semibold text-sm line-through opacity-75">
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="text-on-surface-variant text-xs truncate max-w-md mt-0.5 opacity-60">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {task.assignees && task.assignees.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs text-primary ring-1 ring-outline-variant/20 overflow-hidden">
                            {task.assignees[0].avatarUrl ? (
                              <img src={task.assignees[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              task.assignees[0].username?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="text-xs text-on-surface font-medium truncate max-w-[150px]">
                            {task.assignees.map((u) => u.username).join(", ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant italic">Không có</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        HOÀN THÀNH
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-on-surface-variant">
                      {task.archivedAt ? (
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-on-surface">
                            {new Date(task.archivedAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[11px] text-on-surface-variant/70">
                            {new Date(task.archivedAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

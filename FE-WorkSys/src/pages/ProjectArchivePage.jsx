import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import projectApi from "../api/projectApi";

// Trang toàn màn hình độc lập (/projects/:projectId/archive) hiển thị các task đã lưu trữ
export default function ProjectArchivePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");

  // Load project details and archived tasks
  const loadData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        projectApi.getMyProjects(),
        projectApi.getArchivedTasks(projectId),
      ]);
      const currentProj = pRes.data.find((p) => String(p.id) === String(projectId));
      setProject(currentProj || null);
      setArchivedTasks(aRes.data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract unique months from archived tasks for the dropdown filter (e.g. "10/2026")
  const availableMonths = useMemo(() => {
    const months = new Set();
    archivedTasks.forEach(task => {
      if (task.archivedAt) {
        const date = new Date(task.archivedAt);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        months.add(`${mm}/${yyyy}`);
      }
    });
    // Sort descending (newest month first)
    return Array.from(months).sort().reverse();
  }, [archivedTasks]);

  // Extract unique assignees from archived tasks for the dropdown filter
  const availableAssignees = useMemo(() => {
    const assigneesMap = new Map();
    archivedTasks.forEach(task => {
      task.assignees?.forEach(u => {
        if (!assigneesMap.has(u.id)) {
          assigneesMap.set(u.id, u.username);
        }
      });
    });
    return Array.from(assigneesMap.entries()).map(([id, username]) => ({ id, username }));
  }, [archivedTasks]);

  // Filter tasks based on search, month, and assignee
  const filteredTasks = useMemo(() => {
    return archivedTasks.filter((task) => {
      // Search filter
      const matchQuery =
        !searchQuery.trim() ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase());

      // Month filter
      let matchMonth = true;
      if (monthFilter !== "ALL" && task.archivedAt) {
        const date = new Date(task.archivedAt);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        matchMonth = `${mm}/${yyyy}` === monthFilter;
      } else if (monthFilter !== "ALL") {
        matchMonth = false;
      }

      // Assignee filter
      let matchAssignee = true;
      if (assigneeFilter !== "ALL") {
        matchAssignee = task.assignees?.some(u => String(u.id) === assigneeFilter);
      }

      return matchQuery && matchMonth && matchAssignee;
    });
  }, [archivedTasks, searchQuery, monthFilter, assigneeFilter]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background font-body-sm text-on-background flex flex-col">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full"></div>
            <p className="text-on-surface-variant font-body-sm">Đang tải kho lưu trữ...</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/projects?goto=${projectId}`)}
              className="h-10 px-3.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl flex items-center gap-2 text-xs font-semibold border border-outline-variant/20 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Quay lại danh sách dự án"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Dự án</span>
            </button>
            <div className="h-6 w-px bg-outline-variant/20 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant text-xs font-medium">Dự án:</span>
                <span className="text-primary font-bold text-sm tracking-wide">{project?.name || "Chi tiết dự án"}</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-on-background flex items-center gap-2.5 mt-0.5">
                <span className="material-symbols-outlined text-[28px] text-primary">inventory_2</span>
                <span>Kho lưu trữ</span>
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                  {archivedTasks.length} task
                </span>
              </h1>
            </div>
          </div>
          <div className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/10 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-500">info</span>
            Task hoàn thành sẽ được tự động lưu trữ sau 7 ngày
          </div>
        </div>

        {/* Thanh bộ lọc */}
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[16px]">event</span>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-9 pr-8 py-2.5 text-xs text-on-surface appearance-none outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer"
              >
                <option value="ALL">Tất cả thời gian</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>Tháng {month}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[16px] pointer-events-none">arrow_drop_down</span>
            </div>

            <div className="relative flex-1 md:flex-none md:w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[16px]">person</span>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-9 pr-8 py-2.5 text-xs text-on-surface appearance-none outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer"
              >
                <option value="ALL">Tất cả người làm</option>
                {availableAssignees.map(u => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[16px] pointer-events-none">arrow_drop_down</span>
            </div>
          </div>
        </div>

        {/* Bảng danh sách task */}
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1 custom-scrollbar flex flex-col">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-outline-variant/15 bg-surface-container/50">
                  <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                    Tên Task
                  </th>
                  <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                    Người thực hiện
                  </th>
                  <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider w-48">
                    Trạng thái
                  </th>
                  <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider text-right w-48">
                    Ngày lưu trữ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-surface-container-high/40 transition-colors group"
                  >
                    {/* Cột 1: Tên Task */}
                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-semibold text-sm line-through opacity-80">{task.title}</span>
                        {task.description && (
                          <span className="text-on-surface-variant text-xs truncate max-w-md mt-1 opacity-70">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cột 2: Assignees */}
                    <td className="py-4 px-5">
                      {task.assignees && task.assignees.length > 0 ? (
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {task.assignees.slice(0, 3).map((u, i) => (
                            <div
                              key={u.id}
                              title={u.username}
                              className={`inline-block w-7 h-7 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center border-2 border-background z-${30 - i * 10} overflow-hidden shrink-0`}
                            >
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                              ) : (
                                u.username?.charAt(0).toUpperCase()
                              )}
                            </div>
                          ))}
                          {task.assignees.length > 3 && (
                            <div className="inline-block w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold flex items-center justify-center border-2 border-background z-0 shrink-0">
                              +{task.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant text-xs italic">Không có người nhận</span>
                      )}
                    </td>

                    {/* Cột 3: Trạng thái */}
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 text-[11px] font-bold rounded-full uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px]">done_all</span>
                        {task.status || "DONE"}
                      </span>
                    </td>

                    {/* Cột 4: Ngày lưu trữ */}
                    <td className="py-4 px-5 text-right text-xs text-on-surface-variant whitespace-nowrap">
                      {task.archivedAt ? (
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-on-surface">
                            {new Date(task.archivedAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] opacity-70">
                            {new Date(task.archivedAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTasks.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-on-surface-variant opacity-60 min-h-[300px]">
                <span className="material-symbols-outlined text-[44px] mb-2">inventory_2</span>
                <p className="text-sm font-medium text-on-surface">Kho lưu trữ trống</p>
                <p className="text-xs mt-1 text-center">Không có task nào khớp với điều kiện tìm kiếm.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import taskApi from "../../api/taskApi";

export default function MyTasksDetail({ currentUser, onNavigateToProject }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const res = await taskApi.getTasksByUser(currentUser.id);
        setTasks(res.data || []);
      } catch (err) {
        setError("Không thể tải danh sách nhiệm vụ");
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser?.id) {
      fetchTasks();
    }
  }, [currentUser?.id]);

  // Group and sort tasks
  const groupedTasks = useMemo(() => {
    // 1. Filter: exclude DONE, LATE and archived
    let filtered = tasks.filter((t) => t.status !== "DONE" && !t.late && !t.archived);

    // 2. Sort all filtered tasks by deadline
    filtered.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      const dateA = new Date(a.deadline);
      const dateB = new Date(b.deadline);
      return dateA - dateB;
    });

    // 3. Group by project
    const groups = {};
    filtered.forEach((t) => {
      const projId = t.projectId;
      if (!groups[projId]) {
        groups[projId] = {
          projectId: projId,
          projectName: t.projectName || "Dự án không tên",
          tasks: [],
        };
      }
      groups[projId].tasks.push(t);
    });

    return Object.values(groups);
  }, [tasks]);

  const getStatusColor = (status) => {
    switch (status) {
      case "TODO":
        return "bg-surface-container-high text-on-surface";
      case "IN_PROGRESS":
        return "bg-primary/20 text-primary";
      case "SUBMITTED":
        return "bg-emerald-500/20 text-emerald-500";
      default:
        return "bg-surface-container text-on-surface-variant";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "TODO":
        return "Cần làm";
      case "IN_PROGRESS":
        return "Đang làm";
      case "SUBMITTED":
        return "Đã nộp";
      default:
        return status;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-outline-variant/10 bg-surface-container-low/50 backdrop-blur-xl z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">task</span>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-on-surface tracking-tight">
              Nhiệm vụ hôm nay
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Danh sách các công việc bạn cần hoàn thành
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {isLoading ? (
          <div className="flex justify-center py-10 opacity-50">
            <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
          </div>
        ) : error ? (
          <div className="text-center text-error py-10">{error}</div>
        ) : groupedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <span className="material-symbols-outlined text-[64px] mb-4 text-emerald-500">task_alt</span>
            <p className="text-lg font-display font-semibold">Tuyệt vời!</p>
            <p className="text-sm text-on-surface-variant">Bạn đã hoàn thành mọi nhiệm vụ.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            {groupedTasks.map((group) => (
              <div key={group.projectId} className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">folder</span>
                  <h2 className="text-lg font-bold text-on-surface">{group.projectName}</h2>
                  <span className="px-2 py-0.5 bg-surface-container rounded-full text-xs font-semibold text-on-surface-variant ml-2">
                    {group.tasks.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.tasks.map((task) => {
                    let isOverdue = false;
                    if (task.deadline && task.status !== "SUBMITTED") {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const deadline = new Date(task.deadline);
                      deadline.setHours(0, 0, 0, 0);
                      isOverdue = deadline < today;
                    }
                    return (
                      <div
                        key={task.id}
                        onClick={() => onNavigateToProject && onNavigateToProject(group.projectId)}
                        className={`cursor-pointer p-4 rounded-2xl border ${isOverdue ? 'border-error/30 bg-error/5 hover:border-error/50' : 'border-outline-variant/15 bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-low'} shadow-sm transition-all flex flex-col gap-3 group`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(task.status)}`}>
                            {getStatusLabel(task.status)}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-error bg-error/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">warning</span>
                              Quá hạn
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-on-surface text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {task.title}
                        </h3>

                        <div className="mt-auto pt-3 border-t border-outline-variant/10 flex items-center justify-between text-xs text-on-surface-variant">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            <span className={isOverdue ? 'text-error font-medium' : ''}>
                              {task.deadline || "Không thời hạn"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

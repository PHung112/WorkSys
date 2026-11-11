import { DragDropContext } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";
import { STATUS_CFG } from "../../common/statusConfig";

const KANBAN_COLUMNS = ["TODO", "IN_PROGRESS", "SUBMITTED", "DONE"];

/**
 * Bảng Kanban tổng thể: Thanh tiến trình thống kê + 4 cột kéo thả
 */
export default function KanbanBoard({
  tasksByStatus,
  stats,
  currentUser,
  myRole,
  onDragEnd,
  onOpenDrawer,
  onViewAnalytics,
  formatDeadline,
  sortAssignees,
}) {
  return (
    <>
      {/* Analytics Bar — Click để mở trang báo cáo chi tiết (Thiết kế tinh gọn tiết kiệm chiều cao) */}
      <div
        onClick={onViewAnalytics}
        className="px-container-margin mb-2.5 shrink-0 cursor-pointer group"
        title="Nhấp để xem báo cáo phân tích chi tiết dự án"
      >
        <div className="bg-surface-container-low group-hover:bg-surface-container rounded-xl px-4 py-2 flex flex-col sm:flex-row gap-3 items-center justify-between border border-outline-variant/10 group-hover:border-primary/40 transition-all shadow-sm">
          {/* Cụm số liệu nhanh */}
          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-on-surface-variant font-medium text-[11px] uppercase tracking-wider">Nhiệm vụ:</span>
              <span className="font-bold text-sm text-on-background">{stats.total}</span>
            </div>
            <span className="text-outline-variant/30">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-on-surface-variant font-medium text-[11px] uppercase tracking-wider">Hoàn thành:</span>
              <span className="font-bold text-sm text-primary">{stats.completed}</span>
            </div>
            <span className="text-outline-variant/30">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-on-surface-variant font-medium text-[11px] uppercase tracking-wider">Quá hạn:</span>
              <span className="font-bold text-sm text-error">{stats.overdue}</span>
            </div>
          </div>

          {/* Cụm thanh tiến trình mỏng tinh tế */}
          <div className="w-full sm:w-64 flex items-center gap-2.5">
            <span className="text-[11px] text-on-surface-variant font-medium shrink-0 flex items-center gap-1">
              <span>Tiến trình</span>
              <span className="material-symbols-outlined text-[13px] text-on-surface-variant group-hover:text-primary transition-colors">
                trending_up
              </span>
            </span>
            <div className="h-1.5 flex-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${stats.progress}%` }}
              ></div>
            </div>
            <span className="text-xs text-primary font-bold shrink-0">
              {stats.progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Board Drag & Drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 px-4 overflow-x-auto flex justify-center gap-4 snap-x snap-mandatory custom-scrollbar min-h-0">
          {KANBAN_COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              cfg={STATUS_CFG[status]}
              tasks={tasksByStatus[status] || []}
              currentUser={currentUser}
              myRole={myRole}
              onOpenDrawer={onOpenDrawer}
              formatDeadline={formatDeadline}
              sortAssignees={sortAssignees}
            />
          ))}
        </div>
      </DragDropContext>
    </>
  );
}

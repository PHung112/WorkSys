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
      {/* Analytics Bar — Click để mở trang báo cáo chi tiết */}
      <div
        onClick={onViewAnalytics}
        className="px-container-margin mb-stack-lg shrink-0 cursor-pointer group"
        title="Nhấp để xem báo cáo phân tích chi tiết dự án"
      >
        <div className="bg-surface-container-low group-hover:bg-surface-container rounded-2xl p-stack-md flex flex-col md:flex-row gap-stack-lg items-center justify-between border border-outline-variant/10 group-hover:border-primary/40 transition shadow-sm">
          <div className="flex items-center gap-stack-lg w-full md:w-auto shrink-0">
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider mb-1">
                Tổng nhiệm vụ
              </span>
              <span className="font-display text-3xl font-bold text-on-background">
                {stats.total}
              </span>
            </div>
            <div className="w-px h-8 bg-surface-container-highest hidden md:block"></div>
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider mb-1">
                Hoàn thành
              </span>
              <span className="font-display text-3xl font-bold text-primary">
                {stats.completed}
              </span>
            </div>
            <div className="w-px h-8 bg-surface-container-highest hidden md:block"></div>
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider mb-1">
                Quá hạn
              </span>
              <span className="font-display text-3xl font-bold text-error">
                {stats.overdue}
              </span>
            </div>
          </div>
          <div className="w-full md:max-w-md flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-1.5">
                <span className="font-label-md text-label-md text-on-surface">Tiến trình dự án</span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">
                  trending_up
                </span>
              </div>
              <span className="font-label-md text-label-md text-primary font-bold">
                {stats.progress}%
              </span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${stats.progress}%` }}
              ></div>
            </div>
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

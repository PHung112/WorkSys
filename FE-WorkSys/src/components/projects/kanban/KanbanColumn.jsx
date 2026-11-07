import { Droppable } from "@hello-pangea/dnd";
import KanbanCard from "./KanbanCard";

/**
 * Cột Kanban (KanbanColumn) chứa danh sách các thẻ nhiệm vụ tương ứng với 1 trạng thái
 */
export default function KanbanColumn({
  status,
  cfg,
  tasks,
  currentUser,
  myRole,
  onOpenDrawer,
  formatDeadline,
  sortAssignees,
}) {
  const getStatusColor = (st) => {
    switch (st) {
      case "TODO":
        return "bg-outline-variant";
      case "IN_PROGRESS":
        return "bg-primary animate-pulse";
      case "SUBMITTED":
        return "bg-tertiary";
      case "DONE":
        return "bg-green-500";
      default:
        return "bg-outline-variant";
    }
  };

  return (
    <div className="w-[280px] flex-shrink-0 flex flex-col snap-start h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-stack-sm px-1 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
          <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-semibold">
            {cfg.label}
          </h3>
          <span className="px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant font-label-xs text-label-xs border border-outline-variant/10">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto flex flex-col gap-stack-sm pb-stack-md pr-2 custom-scrollbar transition-colors rounded-xl ${
              snapshot.isDraggingOver ? "bg-primary/5 border border-primary/20" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <KanbanCard
                key={task.id}
                task={task}
                index={index}
                currentUser={currentUser}
                myRole={myRole}
                onOpenDrawer={onOpenDrawer}
                formatDeadline={formatDeadline}
                sortAssignees={sortAssignees}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center h-[145px] border-2 border-dashed border-surface-container-high rounded-xl opacity-50 shrink-0">
                <span className="material-symbols-outlined text-[24px] text-on-surface-variant mb-2">
                  assignment
                </span>
                <span className="text-label-xs text-on-surface-variant uppercase tracking-wider">
                  Trống
                </span>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

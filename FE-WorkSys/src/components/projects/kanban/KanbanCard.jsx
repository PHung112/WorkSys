import { Draggable } from "@hello-pangea/dnd";

/**
 * Thẻ nhiệm vụ (KanbanCard) kéo thả trong cột Kanban
 */
export default function KanbanCard({
  task,
  index,
  currentUser,
  myRole,
  onOpenDrawer,
  formatDeadline,
  sortAssignees,
}) {
  const isAssignedToMe = task.assignees?.some((u) => u.id === currentUser?.id);
  const isOverdue =
    task.deadline &&
    task.deadline < new Date().toISOString().split("T")[0] &&
    task.status !== "SUBMITTED" &&
    task.status !== "DONE";

  const getStatusBorderColor = (status) => {
    switch (status) {
      case "TODO":
        return "bg-outline-variant";
      case "IN_PROGRESS":
        return "bg-primary";
      case "SUBMITTED":
        return "bg-tertiary";
      case "DONE":
        return "bg-green-500";
      default:
        return "bg-outline-variant";
    }
  };

  const sortedAssignees = sortAssignees(task.assignees);
  const displayAssignees = sortedAssignees.slice(0, 2);
  const remainingCount = sortedAssignees.length - 2;

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(dragProvided, dragSnapshot) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          {...(myRole !== "MEMBER" ? dragProvided.dragHandleProps : {})}
          onClick={() => onOpenDrawer(task)}
          className={`rounded-xl p-stack-md flex h-[145px] flex-col gap-stack-sm cursor-pointer transition-all group relative overflow-hidden border shrink-0 ${
            isAssignedToMe
              ? "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/50 shadow-md shadow-yellow-500/10"
              : "bg-surface-container hover:bg-surface-container-high border-outline-variant/10 shadow-sm"
          } ${
            dragSnapshot.isDragging
              ? "shadow-xl shadow-background/50 scale-[1.02] rotate-1 z-50 ring-1 ring-primary/40"
              : ""
          }`}
        >
          {/* Status Indicator Stripe */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors opacity-100 ${getStatusBorderColor(
              task.status
            )}`}
          ></div>

          {/* Header ID & Priority */}
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-label-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 tracking-wider uppercase">
              TASK #{task.id}
            </span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-surface-container-highest"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-surface-container-highest"></span>
            </div>
          </div>

          <h4 className="font-body-sm text-sm font-semibold text-on-background line-clamp-2 mt-1">
            {task.title}
          </h4>

          {/* Footer Card */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-surface-container-highest/50">
            <div className="flex items-center gap-2 text-on-surface-variant font-label-xs text-label-xs">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined !text-[16px]">calendar_today</span>
                <span className={isOverdue ? "text-error" : ""}>
                  {formatDeadline(task.deadline)}
                </span>
              </div>

              {task.late && (task.status === "SUBMITTED" || task.status === "DONE") && (
                <span className="px-1.5 py-0.5 bg-error/10 text-error rounded font-label-xs text-[10px] leading-none">
                  Nộp muộn
                </span>
              )}
              {isOverdue && (
                <span className="px-1.5 py-0.5 bg-error/10 text-error rounded font-label-xs text-[10px] leading-none border border-error/20">
                  Quá hạn
                </span>
              )}
              {task.attachmentUrl && (
                <span className="flex items-center text-primary" title="Có file tài liệu đính kèm">
                  <span className="material-symbols-outlined !text-[15px]">attach_file</span>
                </span>
              )}
            </div>

            {/* Assignees Avatars */}
            {task.assignees && task.assignees.length > 0 ? (
              <div
                className="flex -space-x-1.5"
                title={`Người thực hiện: ${sortedAssignees
                  .map((u) => (u.id === currentUser?.id ? "You" : u.username))
                  .join(", ")}`}
              >
                {displayAssignees.map((u, i) => {
                  const isMe = u.id === currentUser?.id;
                  return (
                    <div
                      key={u.id}
                      title={isMe ? "You" : u.username}
                      className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] overflow-hidden z-${
                        30 - i * 10
                      } ${
                        isMe
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/80 ring-1 ring-background"
                          : "bg-primary/20 text-primary ring-2 ring-background"
                      }`}
                    >
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        u.username.charAt(0).toUpperCase()
                      )}
                    </div>
                  );
                })}
                {remainingCount > 0 && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant font-bold text-[10px] ring-2 ring-background z-0 hover:bg-surface-container-highest/80 transition-colors cursor-pointer">
                    +{remainingCount}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center font-label-xs text-label-xs text-on-surface-variant border border-dashed border-outline-variant/30"
                title="Chưa phân công"
              >
                <span className="material-symbols-outlined text-[12px]">person_add</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

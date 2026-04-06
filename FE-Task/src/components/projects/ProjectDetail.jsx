import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { STATUS_CFG } from "../common/statusConfig";

const KANBAN_COLUMNS = ["TODO", "IN_PROGRESS", "SUBMITTED", "DONE"];

export default function ProjectDetail({
  selectedProject,
  members,
  tasks,
  activeTab,
  setActiveTab,
  currentUser,
  myRole,
  isLoading = false, // Nhận prop loading khi chuyển project
  onOpenEditProject,
  onOpenDeleteProject,
  onOpenLeave,
  onOpenTransfer,
  onOpenInviteMember,
  onOpenConfirmKick,
  onOpenEditRole,
  onOpenCreateTask,
  onOpenEditTask,
  onOpenConfirmDeleteTask,
  onAcceptTask,
  onOpenSubmitTask,
  onOpenDownloadConfirm,
}) {
  const [kanbanTasks, setKanbanTasks] = useState(tasks);

  useEffect(() => {
    setKanbanTasks(tasks);
  }, [tasks]);

  const tasksByStatus = useMemo(
    () => ({
      TODO: kanbanTasks.filter(
        (t) => t.status === "TODO" || t.status === "ASSIGNED",
      ),
      IN_PROGRESS: kanbanTasks.filter((t) => t.status === "IN_PROGRESS"),
      SUBMITTED: kanbanTasks.filter((t) => t.status === "SUBMITTED"),
      DONE: kanbanTasks.filter((t) => t.status === "DONE"),
    }),
    [kanbanTasks],
  );

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceTasks = [...tasksByStatus[source.droppableId]];
    const destinationTasks =
      source.droppableId === destination.droppableId
        ? sourceTasks
        : [...tasksByStatus[destination.droppableId]];

    const draggedIndex = sourceTasks.findIndex(
      (task) => String(task.id) === draggableId,
    );
    if (draggedIndex < 0) return;

    const [draggedTask] = sourceTasks.splice(draggedIndex, 1);
    const updatedTask = { ...draggedTask, status: destination.droppableId };
    destinationTasks.splice(destination.index, 0, updatedTask);

    const nextColumns = {
      ...tasksByStatus,
      [source.droppableId]: sourceTasks,
      [destination.droppableId]: destinationTasks,
    };

    const orderedTasks = KANBAN_COLUMNS.flatMap(
      (status) => nextColumns[status],
    );

    setKanbanTasks(orderedTasks);

    // TODO: call API to update task status on server
    // Example: await updateTaskStatus(updatedTask.id, destination.droppableId)
    console.log("Kanban drag status update", {
      taskId: updatedTask.id,
      fromStatus: source.droppableId,
      toStatus: destination.droppableId,
    });
  };

  return (
    <div className="p-7 w-full h-full relative">
      {/* Loading overlay khi đang tải dữ liệu project */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-2xl z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-10 h-10 border-3 border-purple-600 border-t-white rounded-full"></div>
            <p className="text-white/70 text-sm">Đang tải dữ liệu...</p>
          </div>
        </div>
      )}

      {/* Project header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
          <p className="text-white/45 text-sm mt-1 max-w-xl">
            {selectedProject.description || "Không có mô tả"}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 ml-4">
          {(myRole === "ADMIN" || myRole === "MANAGER") && (
            <button
              onClick={onOpenEditProject}
              className="px-4 py-2 border border-white/15 hover:bg-white/5 rounded-xl text-sm transition"
            >
              ✏️ Sửa
            </button>
          )}
          {myRole === "ADMIN" && (
            <button
              onClick={onOpenDeleteProject}
              className="px-4 py-2 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 rounded-xl text-sm transition"
            >
              🗑️ Xóa
            </button>
          )}
          {myRole === "ADMIN" && (
            <button
              onClick={onOpenTransfer}
              className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/25 hover:bg-yellow-500/20 text-yellow-400 rounded-xl text-sm transition"
            >
              🚪 Thoát
            </button>
          )}
          {(myRole === "MANAGER" || myRole === "MEMBER") && (
            <button
              onClick={onOpenLeave}
              className="px-4 py-2 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 rounded-xl text-sm transition"
            >
              🚪 Thoát
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 rounded-xl p-1 w-fit mb-6">
        {[
          { key: "members", label: "👥 Thành viên", count: members.length },
          { key: "tasks", label: "✅ Tasks", count: tasks.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              activeTab === t.key
                ? "bg-purple-600 text-white"
                : "text-white/50 hover:text-white"
            }`}
          >
            {t.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === t.key ? "bg-purple-500" : "bg-white/10"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Members Tab ── */}
      {activeTab === "members" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white/70 text-sm uppercase tracking-wide">
              Danh sách thành viên
            </h2>
            {(myRole === "ADMIN" || myRole === "MANAGER") && (
              <button
                onClick={onOpenInviteMember}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-medium transition"
              >
                + Mời thành viên
              </button>
            )}
          </div>
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between bg-white/4 border border-white/8 rounded-xl px-5 py-4 hover:bg-white/6 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-600/35 rounded-full flex items-center justify-center text-sm font-bold text-purple-300">
                    {m.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {m.username}
                      {m.userId === currentUser.id && (
                        <span className="ml-2 text-xs text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-full">
                          Bạn
                        </span>
                      )}
                    </div>
                    <div className="text-white/35 text-xs">{m.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      m.role === "ADMIN"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : m.role === "MANAGER"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {m.role}
                  </span>
                  {myRole === "ADMIN" && m.userId !== currentUser.id && (
                    <>
                      <button
                        onClick={() => onOpenEditRole(m.userId, m.role)}
                        title="Đổi vai trò"
                        className="px-2 py-1 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition text-sm"
                      >
                        ⚙️
                      </button>
                      <button
                        onClick={() => onOpenConfirmKick(m.userId, m.username)}
                        title="Kick khỏi project"
                        className="px-2 py-1 text-red-400/50 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition text-sm"
                      >
                        ✕
                      </button>
                    </>
                  )}
                  {myRole === "MANAGER" &&
                    m.userId !== currentUser.id &&
                    m.role === "MEMBER" && (
                      <>
                        <button
                          onClick={() => onOpenEditRole(m.userId, m.role)}
                          title="Nâng lên Manager"
                          className="px-2 py-1 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition text-sm"
                        >
                          ⚙️
                        </button>
                        <button
                          onClick={() =>
                            onOpenConfirmKick(m.userId, m.username)
                          }
                          title="Kick khỏi project"
                          className="px-2 py-1 text-red-400/50 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition text-sm"
                        >
                          ✕
                        </button>
                      </>
                    )}
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <div className="text-center text-white/25 text-sm py-12">
                Chưa có thành viên nào
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tasks Tab ── */}
      {activeTab === "tasks" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white/70 text-sm uppercase tracking-wide">
              Danh sách công việc
            </h2>
            {(myRole === "ADMIN" || myRole === "MANAGER") && (
              <button
                onClick={onOpenCreateTask}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-medium transition"
              >
                + Tạo task
              </button>
            )}
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {KANBAN_COLUMNS.map((status) => {
                const cfg = STATUS_CFG[status];
                const columnTasks = tasksByStatus[status];

                return (
                  <div
                    key={status}
                    className="bg-white/2 border border-white/8 rounded-2xl p-3"
                  >
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${cfg.cls}`}
                    >
                      {cfg.label} · {columnTasks.length}
                    </div>

                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-2 min-h-45 rounded-xl p-1 transition ${
                            snapshot.isDraggingOver
                              ? "bg-purple-500/10"
                              : "bg-transparent"
                          }`}
                        >
                          {columnTasks.map((t, index) => (
                            <Draggable
                              key={t.id}
                              draggableId={String(t.id)}
                              index={index}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className={`bg-white/4 border border-white/8 rounded-xl px-5 py-4 hover:bg-white/6 transition ${
                                    dragSnapshot.isDragging
                                      ? "ring-1 ring-purple-400/40"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm mb-1">
                                        {t.title}
                                      </div>
                                      {t.description && (
                                        <p className="text-white/45 text-xs leading-relaxed mb-2">
                                          {t.description}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/30">
                                        {t.assignedToUsername && (
                                          <span>👤 {t.assignedToUsername}</span>
                                        )}
                                        {t.deadline && (
                                          <span>📅 {t.deadline}</span>
                                        )}
                                        {/* Late badge */}
                                        {t.late &&
                                          (t.status === "SUBMITTED" ||
                                            t.status === "DONE") && (
                                            <span className="text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full">
                                              Nộp muộn
                                            </span>
                                          )}
                                        {/* Overdue / unfinished badge */}
                                        {t.deadline &&
                                          t.deadline <
                                            new Date()
                                              .toISOString()
                                              .split("T")[0] &&
                                          t.status !== "SUBMITTED" &&
                                          t.status !== "DONE" && (
                                            <span className="text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full">
                                              Chưa hoàn thành
                                            </span>
                                          )}
                                        {t.submissionLink && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onOpenDownloadConfirm(
                                                t.submissionLink,
                                                t.title,
                                              );
                                            }}
                                            className="text-purple-400/70 hover:text-purple-300 transition underline underline-offset-2"
                                          >
                                            Bài nộp
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 ml-4 shrink-0">
                                      {t.status === "TODO" &&
                                        t.assignedToId === currentUser.id && (
                                          <button
                                            onClick={() => onAcceptTask(t.id)}
                                            className="px-3 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition font-medium"
                                          >
                                            Nhận
                                          </button>
                                        )}
                                      {t.status === "IN_PROGRESS" &&
                                        t.assignedToId === currentUser.id && (
                                          <button
                                            onClick={() =>
                                              onOpenSubmitTask(t.id)
                                            }
                                            className="px-3 py-1 text-xs bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition font-medium"
                                          >
                                            Nộp
                                          </button>
                                        )}
                                      {!t.assignedToId &&
                                        (myRole === "ADMIN" ||
                                          myRole === "MANAGER") && (
                                          <button
                                            onClick={() => onOpenEditTask(t)}
                                            className="px-2 py-1 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition text-sm"
                                          >
                                            ✏️
                                          </button>
                                        )}
                                      {myRole === "ADMIN" && (
                                        <button
                                          onClick={() =>
                                            onOpenConfirmDeleteTask(
                                              t.id,
                                              t.title,
                                            )
                                          }
                                          className="px-2 py-1 text-red-400/40 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition text-sm"
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {columnTasks.length === 0 && (
                            <div className="text-center text-white/25 text-xs py-8 border border-dashed border-white/10 rounded-xl">
                              Không có task
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>

          {kanbanTasks.length === 0 && (
            <div className="text-center text-white/25 text-sm py-12">
              Chưa có task nào trong project này
            </div>
          )}
        </div>
      )}
    </div>
  );
}

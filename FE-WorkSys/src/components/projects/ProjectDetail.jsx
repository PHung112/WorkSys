import { useEffect, useMemo, useRef, useState } from "react";
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
  isLoading = false,
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
  onUnsubmitTask,
}) {
  const [kanbanTasks, setKanbanTasks] = useState(tasks);
  const [selectedDrawerTask, setSelectedDrawerTask] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setKanbanTasks(tasks);
  }, [tasks]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const tasksByStatus = useMemo(
    () => ({
      TODO: kanbanTasks.filter((t) => t.status === "TODO" || t.status === "ASSIGNED"),
      IN_PROGRESS: kanbanTasks.filter((t) => t.status === "IN_PROGRESS"),
      SUBMITTED: kanbanTasks.filter((t) => t.status === "SUBMITTED"),
      DONE: kanbanTasks.filter((t) => t.status === "DONE"),
    }),
    [kanbanTasks]
  );

  const taskNumberMap = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => a.id - b.id);
    const map = {};
    sorted.forEach((t, i) => {
      map[t.id] = i + 1;
    });
    return map;
  }, [tasks]);

  const stats = useMemo(() => {
    const total = kanbanTasks.length;
    const completed = tasksByStatus.DONE.length;
    const overdue = kanbanTasks.filter(
      (t) =>
        t.deadline &&
        t.deadline < new Date().toISOString().split("T")[0] &&
        t.status !== "DONE" &&
        t.status !== "SUBMITTED"
    ).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, overdue, progress };
  }, [kanbanTasks, tasksByStatus]);

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Chỉ ADMIN/MANAGER mới được kéo thả
    if (myRole === "MEMBER") return;

    const sourceTasks = [...tasksByStatus[source.droppableId]];
    const destinationTasks = source.droppableId === destination.droppableId ? sourceTasks : [...tasksByStatus[destination.droppableId]];

    const draggedIndex = sourceTasks.findIndex((task) => String(task.id) === draggableId);
    if (draggedIndex < 0) return;

    const [draggedTask] = sourceTasks.splice(draggedIndex, 1);
    const updatedTask = { ...draggedTask, status: destination.droppableId };
    destinationTasks.splice(destination.index, 0, updatedTask);

    const nextColumns = {
      ...tasksByStatus,
      [source.droppableId]: sourceTasks,
      [destination.droppableId]: destinationTasks,
    };

    const orderedTasks = KANBAN_COLUMNS.flatMap((status) => nextColumns[status]);
    setKanbanTasks(orderedTasks);
    console.log("Kanban drag status update", { taskId: updatedTask.id, fromStatus: source.droppableId, toStatus: destination.droppableId });
  };

  const openDrawer = (task) => {
    setSelectedDrawerTask(task);
    setIsDrawerOpen(true);
  };
  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedDrawerTask(null), 300);
  };

  // Maps backend status to stitch color tailwind class for column dot
  const getStatusColor = (status) => {
    if (status === "TODO") return "bg-outline-variant";
    if (status === "IN_PROGRESS") return "bg-primary animate-pulse";
    if (status === "SUBMITTED") return "bg-tertiary";
    if (status === "DONE") return "bg-green-500";
    return "bg-outline-variant";
  };

  return (
    <div className="flex flex-col w-full h-full pb-stack-lg relative overflow-hidden bg-background">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full"></div>
            <p className="text-on-surface-variant font-body-sm">Đang tải dữ liệu...</p>
          </div>
        </div>
      )}

      {/* Project Header */}
      <div className="px-container-margin py-stack-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md shrink-0">
        <div className="flex items-start gap-stack-md max-w-2xl">
          <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container shrink-0 mt-1 shadow-inner">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-stack-sm mb-1">
              <h1 className="font-display text-3xl font-bold text-on-background m-0 tracking-tight">{selectedProject?.name}</h1>
              <span className="px-2 py-1 bg-surface-container-high rounded-full font-label-xs text-label-xs text-on-surface-variant ml-2 tracking-widest uppercase border border-outline-variant/10">Active</span>
            </div>
            <p className="font-body-lg text-body-lg text-on-surface-variant m-0 max-w-xl">
              {selectedProject?.description || "Không có mô tả cho dự án này."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-stack-sm shrink-0">
          <div className="flex -space-x-2 mr-4">
            {members.slice(0, 3).map((m, i) => (
              <div key={m.userId} className={`w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs text-on-surface ring-2 ring-background z-${30 - i * 10}`}>
                {m.username.charAt(0).toUpperCase()}
              </div>
            ))}
            {members.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-surface-container-high ring-2 ring-background flex items-center justify-center font-label-xs text-label-xs text-on-surface-variant z-0 border border-outline-variant/20">
                +{members.length - 3}
              </div>
            )}
          </div>

          {(myRole === "ADMIN" || myRole === "MANAGER") && (
            <button onClick={onOpenInviteMember} className="h-10 px-4 bg-surface-container text-on-surface font-label-md text-label-md rounded-lg flex items-center gap-2 hover:bg-surface-container-high transition-colors border border-outline-variant/20">
              <span className="material-symbols-outlined text-[18px]">share</span> Share
            </button>
          )}

          {(myRole === "ADMIN" || myRole === "MANAGER") && (
            <button onClick={onOpenCreateTask} className="h-10 px-4 bg-primary text-on-primary font-label-md text-label-md rounded-lg flex items-center gap-2 hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-[18px]">add</span> New Task
            </button>
          )}

          {/* Menu Dropdown for more actions (Edit/Delete/Leave) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="h-10 w-10 bg-surface-container text-on-surface rounded-lg flex items-center justify-center hover:bg-surface-container-high transition-colors border border-outline-variant/20 ml-2"
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
            <div className={`absolute right-0 mt-2 w-52 bg-surface-container-high rounded-xl shadow-xl border border-outline-variant/20 transition-all z-50 overflow-hidden flex flex-col ${isMenuOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-1"}`}>
              {(myRole === "ADMIN" || myRole === "MANAGER") && (
                <button onClick={() => { onOpenInviteMember(); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>
                  Mời thành viên
                </button>
              )}
              {(myRole === "ADMIN" || myRole === "MANAGER") && (
                <button onClick={() => { onOpenEditProject(); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit</span>
                  Sửa dự án
                </button>
              )}
              {myRole === "ADMIN" && (
                <>
                  <button onClick={() => { onOpenTransfer(); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-yellow-400 hover:bg-yellow-400/10 transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                    Chuyển quyền Admin
                  </button>
                  <button onClick={() => { onOpenDeleteProject(); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors border-t border-outline-variant/10 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Xóa dự án
                  </button>
                </>
              )}
              {(myRole === "MANAGER" || myRole === "MEMBER") && (
                <button onClick={() => { onOpenLeave(); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors border-t border-outline-variant/10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">exit_to_app</span>
                  Thoát dự án
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Bar */}
      <div className="px-container-margin mb-stack-lg shrink-0">
        <div className="bg-surface-container-low rounded-2xl p-stack-md flex flex-col md:flex-row gap-stack-lg items-center justify-between border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-stack-lg w-full md:w-auto shrink-0">
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider mb-1">Total Tasks</span>
              <span className="font-display text-3xl font-bold text-on-background">{stats.total}</span>
            </div>
            <div className="w-px h-8 bg-surface-container-highest hidden md:block"></div>
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider mb-1">Completed</span>
              <span className="font-display text-3xl font-bold text-primary">{stats.completed}</span>
            </div>
            <div className="w-px h-8 bg-surface-container-highest hidden md:block"></div>
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider mb-1">Overdue</span>
              <span className="font-display text-3xl font-bold text-error">{stats.overdue}</span>
            </div>
          </div>
          <div className="w-full md:max-w-md flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="font-label-md text-label-md text-on-surface">Project Progress</span>
              <span className="font-label-md text-label-md text-primary font-bold">{stats.progress}%</span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${stats.progress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 px-container-margin mx-6 overflow-x-auto flex gap-stack-md snap-x snap-mandatory custom-scrollbar min-h-0">
          {KANBAN_COLUMNS.map((status) => {
            const columnTasks = tasksByStatus[status];
            const cfg = STATUS_CFG[status];
            return (
              <div key={status} className="flex-1 min-w-[240px] max-w-[320px] shrink-0 flex flex-col snap-start h-full">
                <div className="flex items-center justify-between mb-stack-sm px-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
                    <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-semibold">{cfg.label}</h3>
                    <span className="px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant font-label-xs text-label-xs border border-outline-variant/10">{columnTasks.length}</span>
                  </div>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto flex flex-col gap-stack-sm pb-stack-md pr-2 custom-scrollbar transition-colors rounded-xl ${snapshot.isDraggingOver ? "bg-primary/5 border border-primary/20" : ""}`}
                    >
                      {columnTasks.map((t, index) => (
                        <Draggable key={t.id} draggableId={String(t.id)} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              /* Chỉ ADMIN/MANAGER mới nhận dragHandleProps — MEMBER không được kéo */
                              {...(myRole !== "MEMBER" ? dragProvided.dragHandleProps : {})}
                              onClick={() => openDrawer(t)}
                              className={`rounded-xl p-stack-md flex flex-col gap-stack-sm cursor-pointer transition-all group relative overflow-hidden border shrink-0 ${t.assignees?.some(u => u.id === currentUser?.id)
                                ? "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/50 shadow-md shadow-yellow-500/10"
                                : "bg-surface-container hover:bg-surface-container-high border-outline-variant/10 shadow-sm"
                                } ${dragSnapshot.isDragging ? "shadow-xl shadow-background/50 scale-[1.02] rotate-1 z-50 ring-1 ring-primary/40" : ""}`}
                            >
                              <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors opacity-100 ${t.status === 'TODO' ? 'bg-outline-variant' :
                                t.status === 'IN_PROGRESS' ? 'bg-primary' :
                                  t.status === 'SUBMITTED' ? 'bg-tertiary' :
                                    t.status === 'DONE' ? 'bg-green-500' : 'bg-outline-variant'
                                }`}></div>
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">TSK-{taskNumberMap[t.id]}</span>
                                <div className="flex gap-1">
                                  {/* Fake priority dots based on ID logic or just static for now */}
                                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-surface-container-highest"></span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-surface-container-highest"></span>
                                </div>
                              </div>
                              <h4 className="font-body-sm text-sm font-semibold text-on-background line-clamp-2 mt-1">{t.title}</h4>

                              <div className="flex flex-wrap gap-1 mt-1">
                                {t.late && (t.status === "SUBMITTED" || t.status === "DONE") && (
                                  <span className="px-2 py-0.5 bg-error/10 text-error rounded font-label-xs text-label-xs">N?p mu?n</span>
                                )}
                                {t.deadline && t.deadline < new Date().toISOString().split("T")[0] && t.status !== "SUBMITTED" && t.status !== "DONE" && (
                                  <span className="px-2 py-0.5 bg-error/10 text-error rounded font-label-xs text-label-xs border border-error/20">Qu� h?n</span>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-container-highest/50">
                                <div className="flex items-center gap-1.5 text-on-surface-variant font-label-xs text-label-xs">
                                  <span className="material-symbols-outlined !text-[16px]">calendar_today</span>
                                  {t.deadline ? t.deadline : "No date"}
                                </div>
                                {t.assignees && t.assignees.length > 0 ? (
                                  <div className="flex -space-x-1.5" title={`Người thực hiện: ${t.assignees.map(u => u.username).join(", ")}`}>
                                    {t.assignees.slice(0, 3).map((u, i) => (
                                      <div key={u.id} className={`flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-[10px] ring-2 ring-background z-${30 - i * 10}`}>
                                        {u.username.charAt(0).toUpperCase()}
                                      </div>
                                    ))}
                                    {t.assignees.length > 3 && (
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant font-bold text-[10px] ring-2 ring-background z-0">
                                        +{t.assignees.length - 3}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center font-label-xs text-label-xs text-on-surface-variant border border-dashed border-outline-variant/30" title="Unassigned">
                                    <span className="material-symbols-outlined text-[12px]">person_add</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center h-[145px] border-2 border-dashed border-surface-container-high rounded-xl opacity-50 shrink-0">
                          <span className="material-symbols-outlined text-[24px] text-on-surface-variant mb-2">assignment</span>
                          <span className="text-label-xs text-on-surface-variant uppercase tracking-wider">Empty</span>
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

      {/* AI Assistant Floating Action */}
      <div className="fixed bottom-stack-lg right-stack-lg z-30">
        <div className="relative group">
          <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <button className="relative w-14 h-14 bg-surface-container text-on-surface rounded-full shadow-xl flex items-center justify-center hover:bg-surface-container-high hover:scale-105 transition-all duration-300 z-10 border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary">magic_button</span>
          </button>
          <div className="absolute bottom-full right-0 mb-4 w-64 bg-surface-container-high rounded-xl shadow-2xl p-2 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 origin-bottom-right border border-outline-variant/20 flex flex-col gap-1">
            <div className="px-3 py-2 border-b border-surface-container-highest mb-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Tr? l� ?o (Coming soon)</span>
            </div>
            <button className="text-left px-3 py-2 text-body-sm font-body-sm text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed">
              <span className="material-symbols-outlined text-[16px] text-tertiary">summarize</span>
              T�m t?t d? �n
            </button>
            <button className="text-left px-3 py-2 text-body-sm font-body-sm text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed">
              <span className="material-symbols-outlined text-[16px] text-primary">warning</span>
              T�m task �n t?c
            </button>
          </div>
        </div>
      </div>

      {/* Task Detail Drawer */}
      <div className={`fixed inset-y-0 right-0 w-[480px] bg-surface-container shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-l border-outline-variant/20 flex flex-col ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        {selectedDrawerTask && (
          <>
            <div className="flex items-center justify-between p-stack-md border-b border-surface-container-highest shrink-0">
              <div className="flex items-center gap-stack-sm">
                <span className="font-label-md text-label-md text-on-surface-variant">TSK-{taskNumberMap[selectedDrawerTask.id]}</span>
                <span className="px-2 py-0.5 bg-outline-variant/20 rounded font-label-xs text-label-xs text-on-surface uppercase tracking-wider border border-outline-variant/10">{STATUS_CFG[selectedDrawerTask.status].label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={closeDrawer} className="p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-stack-lg flex flex-col gap-stack-lg custom-scrollbar">
              <div>
                <h2 className="font-display text-2xl font-bold text-on-background mb-stack-md tracking-tight">{selectedDrawerTask.title}</h2>
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-body-sm font-body-sm bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-label-xs font-label-xs text-on-surface-variant uppercase tracking-wider">Nguời thực hiện</span>
                    <div className="flex items-center gap-2">
                      {selectedDrawerTask.assignees && selectedDrawerTask.assignees.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedDrawerTask.assignees.map(u => (
                            <div key={u.id} className="flex items-center gap-2 bg-surface-container-high px-2 py-1 rounded-full border border-outline-variant/20">
                              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold ring-1 ring-primary/40">{u.username.charAt(0).toUpperCase()}</div>
                              <span className="text-on-surface font-medium text-xs">{u.username}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant italic">Chưa giao</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-label-xs font-label-xs text-on-surface-variant uppercase tracking-wider">Hạn chót</span>
                    <div className="flex items-center gap-2 text-on-surface font-medium">
                      <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                      {selectedDrawerTask.deadline || "Không có"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="font-headline-md text-headline-md text-on-background text-[16px] font-semibold border-b border-surface-container-highest pb-2">Mô tả chi tiết</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {selectedDrawerTask.description || "Chua c� m� t? chi ti?t cho task n�y."}
                </p>

                {selectedDrawerTask.submissionLink && (
                  <div className="mt-4 p-4 bg-tertiary/10 border border-tertiary/20 rounded-xl">
                    <span className="font-label-xs text-label-xs text-tertiary uppercase tracking-wider mb-2 block">Bài nộp</span>
                    <button onClick={() => onOpenDownloadConfirm(selectedDrawerTask.submissionLink, selectedDrawerTask.title)} className="flex items-center gap-2 text-on-surface hover:text-tertiary transition-colors font-medium text-sm">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      Tải về tài liệu / link
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-8 flex flex-col gap-4">
                <div className="flex gap-2">
                  {selectedDrawerTask.status === "TODO" && selectedDrawerTask.assignees?.some(u => u.id === currentUser?.id) && !selectedDrawerTask.acceptedUserIds?.includes(currentUser?.id) && (
                    <button onClick={() => { onAcceptTask(selectedDrawerTask.id); closeDrawer(); }} className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl font-label-md font-semibold hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors shadow-md">Nhận Task</button>
                  )}
                  {selectedDrawerTask.status === "IN_PROGRESS" && selectedDrawerTask.assignees?.some(u => u.id === currentUser?.id) && (
                    <button onClick={() => { onOpenSubmitTask(selectedDrawerTask.id); closeDrawer(); }} className="flex-1 py-2.5 bg-secondary text-on-secondary rounded-xl font-label-md font-semibold hover:bg-secondary-fixed transition-colors shadow-md">Nộp</button>
                  )}
                  {selectedDrawerTask.status === "SUBMITTED" && selectedDrawerTask.assignees?.some(u => u.id === currentUser?.id) && (
                    <button onClick={() => { onUnsubmitTask(selectedDrawerTask.id); closeDrawer(); }} className="flex-1 py-2.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded-xl font-label-md font-semibold hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">undo</span>
                      Hủy nộp
                    </button>
                  )}
                  {(!selectedDrawerTask.assignees || selectedDrawerTask.assignees.length === 0) && (myRole === "ADMIN" || myRole === "MANAGER") && (
                    <button onClick={() => { onOpenEditTask(selectedDrawerTask); closeDrawer(); }} className="flex-1 py-2.5 bg-surface-container-high text-on-surface border border-outline-variant/20 rounded-xl font-label-md font-semibold hover:bg-surface-container-highest transition-colors">Sửa Task</button>
                  )}
                  {myRole === "ADMIN" && (
                    <button onClick={() => { onOpenConfirmDeleteTask(selectedDrawerTask.id, selectedDrawerTask.title); closeDrawer(); }} className="px-4 py-2.5 bg-error/10 text-error rounded-xl font-label-md font-semibold hover:bg-error/20 transition-colors border border-error/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Drawer Backdrop */}
      <div
        className={`fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={closeDrawer}
      ></div>
    </div>
  );
}

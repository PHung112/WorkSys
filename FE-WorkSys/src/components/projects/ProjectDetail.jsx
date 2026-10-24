import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import taskApi from "../../api/taskApi";
import TaskDetailDrawer from "./TaskDetailDrawer";
import ProjectAnalyticsView from "./ProjectAnalyticsView";
import ProjectMembersView from "./ProjectMembersView";
import ProjectArchiveView from "./ProjectArchiveView";
import GitHubIntegrationView from "./GitHubIntegrationView";
import AiChatView from "./AiChatView";
import AiTaskDecompositionView from "./AiTaskDecompositionView";
import MemberProfileModal from "./modals/MemberProfileModal";
import ProjectDetailHeader from "./kanban/ProjectDetailHeader";
import KanbanBoard from "./kanban/KanbanBoard";

const KANBAN_COLUMNS = ["TODO", "IN_PROGRESS", "SUBMITTED", "DONE"];

/**
 * Component hiển thị chi tiết dự án (ProjectDetail):
 * - Tái cấu trúc thành kiến trúc mô-đun:
 *   - ProjectDetailHeader: Điều hướng & Tab bar
 *   - KanbanBoard: Kéo thả nhiệm vụ & Thống kê tiến độ
 *   - Subviews: Thành viên, Phân tích, Lưu trữ, GitHub, Trợ lý AI
 *   - Drawers & Modals
 */
export default function ProjectDetail({
  selectedProject,
  members,
  tasks,
  archivedTasks,
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
  const [activeView, setActiveView] = useState("kanban");
  const [kanbanTasks, setKanbanTasks] = useState(tasks);
  const [selectedDrawerTask, setSelectedDrawerTask] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [assigneesModalTask, setAssigneesModalTask] = useState(null);
  const [profileMember, setProfileMember] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setKanbanTasks(tasks);
  }, [tasks]);

  // Sắp xếp assignees: đưa current user lên đầu
  const sortAssignees = useCallback(
    (assignees) => {
      if (!assignees || !currentUser) return assignees || [];
      const hasCurrentUser = assignees.some((u) => u.id === currentUser.id);
      if (hasCurrentUser) {
        return [
          assignees.find((u) => u.id === currentUser.id),
          ...assignees.filter((u) => u.id !== currentUser.id),
        ];
      }
      return assignees;
    },
    [currentUser]
  );

  // Đóng project menu khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Format deadline string
  const formatDeadline = useCallback((d) => {
    if (!d) return "No date";
    if (d.includes("T")) {
      const [datePart, timePart] = d.split("T");
      const [year, month, day] = datePart.split("-");
      return `${timePart.slice(0, 5)} - ${day}/${month}/${year}`;
    }
    if (d.includes("-")) {
      const [year, month, day] = d.split("-");
      return `${day}/${month}/${year}`;
    }
    return d;
  }, []);

  // Gom task theo cột trạng thái
  const tasksByStatus = useMemo(
    () => ({
      TODO: kanbanTasks.filter((t) => t.status === "TODO" || t.status === "ASSIGNED"),
      IN_PROGRESS: kanbanTasks.filter((t) => t.status === "IN_PROGRESS"),
      SUBMITTED: kanbanTasks.filter((t) => t.status === "SUBMITTED"),
      DONE: kanbanTasks.filter((t) => t.status === "DONE"),
    }),
    [kanbanTasks]
  );

  // Thống kê tiến độ
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

  // Xử lý kéo thả task trên Kanban
  const handleDragEnd = useCallback(
    (result) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;
      if (myRole === "MEMBER") return;

      const sourceTasks = [...tasksByStatus[source.droppableId]];
      const destinationTasks =
        source.droppableId === destination.droppableId
          ? sourceTasks
          : [...tasksByStatus[destination.droppableId]];

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

      taskApi.updateTaskStatus(updatedTask.id, destination.droppableId).catch((err) => {
        console.error("Cập nhật trạng thái task thất bại:", err);
        setKanbanTasks(tasks);
      });
    },
    [tasksByStatus, myRole, tasks]
  );

  const openDrawer = (task) => {
    setSelectedDrawerTask(task);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedDrawerTask(null), 300);
  };

  const handleAiTasksCreated = (newTasks) => {
    if (Array.isArray(newTasks) && newTasks.length > 0) {
      setKanbanTasks((prev) => [...prev, ...newTasks]);
    }
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

      {/* Project Header Banner & Subviews Tabs */}
      <ProjectDetailHeader
        selectedProject={selectedProject}
        members={members}
        archivedTasks={archivedTasks}
        currentUser={currentUser}
        myRole={myRole}
        activeView={activeView}
        setActiveView={setActiveView}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        menuRef={menuRef}
        onOpenCreateTask={onOpenCreateTask}
        onOpenEditProject={onOpenEditProject}
        onOpenDeleteProject={onOpenDeleteProject}
        onOpenLeave={onOpenLeave}
        onOpenTransfer={onOpenTransfer}
      />

      {/* Subviews nội bộ */}
      {activeView === "members" && (
        <ProjectMembersView
          members={members}
          tasks={tasks}
          currentUser={currentUser}
          myRole={myRole}
          onOpenInviteMember={onOpenInviteMember}
          onOpenEditRole={onOpenEditRole}
          onOpenConfirmKick={onOpenConfirmKick}
          onOpenProfile={(member) => setProfileMember(member)}
          onBackToTasks={() => setActiveView("kanban")}
        />
      )}

      {activeView === "analytics" && (
        <ProjectAnalyticsView
          projectId={selectedProject?.id}
          selectedProject={selectedProject}
          onBackToKanban={() => setActiveView("kanban")}
        />
      )}

      {activeView === "archive" && (
        <ProjectArchiveView
          archivedTasks={archivedTasks}
          selectedProject={selectedProject}
          onBackToKanban={() => setActiveView("kanban")}
        />
      )}

      {activeView === "github" && (
        <GitHubIntegrationView
          selectedProject={selectedProject}
          onBackToKanban={() => setActiveView("kanban")}
          onProjectUpdated={() => {}}
        />
      )}

      {activeView === "ai-chat" && (
        <AiChatView
          projectId={selectedProject?.id}
          selectedProject={selectedProject}
          onBackToKanban={() => setActiveView("kanban")}
        />
      )}

      {activeView === "ai-decompose" && (
        <AiTaskDecompositionView
          projectId={selectedProject?.id}
          projectMembers={members}
          onTasksCreated={handleAiTasksCreated}
          onBackToKanban={() => setActiveView("kanban")}
        />
      )}

      {activeView === "kanban" && (
        <KanbanBoard
          tasksByStatus={tasksByStatus}
          stats={stats}
          currentUser={currentUser}
          myRole={myRole}
          onDragEnd={handleDragEnd}
          onOpenDrawer={openDrawer}
          onViewAnalytics={() => setActiveView("analytics")}
          formatDeadline={formatDeadline}
          sortAssignees={sortAssignees}
        />
      )}

      {/* AI Assistant Floating Button */}
      {(myRole === "ADMIN" || myRole === "MANAGER") && activeView !== "ai-chat" && (
        <div className="fixed bottom-stack-lg right-stack-lg z-30">
          <div className="relative">
            <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <button
              onClick={() => setActiveView("ai-chat")}
              title="Mở Trợ lý AI dự án"
              className="relative w-14 h-14 bg-surface-container text-on-surface rounded-full shadow-xl flex items-center justify-center hover:bg-surface-container-high hover:scale-105 transition-all duration-300 z-10 border border-outline-variant/30 cursor-pointer"
            >
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                magic_button
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        isOpen={isDrawerOpen}
        task={selectedDrawerTask}
        onClose={closeDrawer}
        myRole={myRole}
        currentUser={currentUser}
        projectName={selectedProject?.name}
        members={members}
        tasks={tasks}
        onAcceptTask={onAcceptTask}
        onOpenSubmitTask={onOpenSubmitTask}
        onUnsubmitTask={onUnsubmitTask}
        onOpenEditTask={onOpenEditTask}
        onOpenConfirmDeleteTask={onOpenConfirmDeleteTask}
        onOpenDownloadConfirm={onOpenDownloadConfirm}
      />

      {/* Modal danh sách người thực hiện task */}
      {assigneesModalTask && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-high shadow-2xl rounded-2xl w-full max-w-sm flex flex-col border border-outline-variant/20 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-highest shrink-0">
              <h3 className="font-display text-base font-bold text-on-surface m-0">
                Người thực hiện task
              </h3>
              <button
                onClick={() => setAssigneesModalTask(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex flex-col gap-2 max-h-72 custom-scrollbar">
              {assigneesModalTask.assignees.map((u) => {
                const isMe = u.id === currentUser?.id;
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-2 hover:bg-surface-container rounded-xl transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold overflow-hidden shrink-0 ${
                        isMe ? "border-2 border-yellow-400" : ""
                      }`}
                    >
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        u.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-on-surface font-medium text-sm flex items-center gap-1.5">
                        {u.username}
                        {isMe && (
                          <span className="px-1.5 py-0.2 bg-primary/10 text-primary text-[10px] font-bold rounded">
                            Bạn
                          </span>
                        )}
                      </span>
                      <span className="text-on-surface-variant text-xs truncate">
                        {u.email || "Thành viên"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Profile modal khi click xem hồ sơ thành viên */}
      {profileMember && (
        <MemberProfileModal
          isOpen={true}
          member={profileMember}
          tasks={tasks}
          currentUser={currentUser}
          onClose={() => setProfileMember(null)}
        />
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import taskApi from "../../api/taskApi";
import { STATUS_CFG } from "../common/statusConfig";
import TaskDetailDrawer from "./TaskDetailDrawer";
import ProjectAnalyticsView from "./ProjectAnalyticsView";
import ProjectMembersView from "./ProjectMembersView";
import ProjectArchiveView from "./ProjectArchiveView";
import GitHubIntegrationView from "./GitHubIntegrationView";
import AiChatView from "./AiChatView";
import AiTaskDecompositionView from "./AiTaskDecompositionView";
import MemberProfileModal from "./modals/MemberProfileModal";

const KANBAN_COLUMNS = ["TODO", "IN_PROGRESS", "SUBMITTED", "DONE"];

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
  const navigate = useNavigate();
  // Quản lý chế độ xem dạng trang nội bộ (sub-view) không reload, không mở trang mới:
  // "kanban" | "members" | "analytics" | "archive" | "github" | "ai-chat" | "ai-decompose"
  const [activeView, setActiveView] = useState("kanban");
  const [kanbanTasks, setKanbanTasks] = useState(tasks);
  const [selectedDrawerTask, setSelectedDrawerTask] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [assigneesModalTask, setAssigneesModalTask] = useState(null);
  const [profileMember, setProfileMember] = useState(null); // Popup xem hồ sơ thành viên
  const menuRef = useRef(null);

  // Sắp xếp danh sách assignees của task: đưa user hiện tại lên đầu tiên
  const sortAssignees = (assignees) => {
    if (!assignees || !currentUser) return assignees || [];
    const hasCurrentUser = assignees.some(u => u.id === currentUser.id);
    if (hasCurrentUser) {
      return [assignees.find(u => u.id === currentUser.id), ...assignees.filter(u => u.id !== currentUser.id)];
    }
    return assignees;
  };

  // Sắp xếp danh sách thành viên của dự án: đưa user hiện tại lên đầu tiên
  const sortProjectMembers = (memberList) => {
    if (!memberList || !currentUser) return memberList || [];
    const isSelf = (m) => (m.userId || m.id) === currentUser.id;
    const current = memberList.find(isSelf);
    const others = memberList.filter((m) => !isSelf(m));
    return current ? [current, ...others] : memberList;
  };

  useEffect(() => {
    setKanbanTasks(tasks);
  }, [tasks]);

  // Callback khi AI tạo hàng loạt task thành công: tự động cập nhật ngay vào bảng Kanban
  const handleAiTasksCreated = (newTasks) => {
    if (Array.isArray(newTasks) && newTasks.length > 0) {
      setKanbanTasks((prev) => [...prev, ...newTasks]);
    }
  };

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

  // Hàm tiện ích định dạng hiển thị deadline (hỗ trợ cả ngày và giờ: HH:mm - DD/MM/YYYY)
  const formatDeadline = (d) => {
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
  };

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

    // Gọi API cập nhật trạng thái task trên backend để lưu vào database
    taskApi.updateTaskStatus(updatedTask.id, destination.droppableId).catch((err) => {
      console.error("Cập nhật trạng thái task thất bại:", err);
      // Rollback về trạng thái cũ nếu API lỗi
      setKanbanTasks(tasks);
    });
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
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <h1 className="font-display text-3xl font-bold text-on-background m-0 tracking-tight">{selectedProject?.name}</h1>
              <span className="px-2 py-1 bg-surface-container-high rounded-full font-label-xs text-label-xs text-on-surface-variant tracking-widest uppercase border border-outline-variant/10">Đang hoạt động</span>
              {selectedProject?.githubRepo && (
                <a
                  href={`https://github.com/${selectedProject.githubRepo.replace(/^https?:\/\/github\.com\//, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-container hover:bg-surface-container-high rounded-full text-xs font-mono text-primary border border-primary/20 hover:border-primary/50 transition-colors"
                  title="Mở repository trên GitHub"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>{selectedProject.githubRepo}</span>
                </a>
              )}
            </div>
            <p className="font-body-lg text-body-lg text-on-surface-variant m-0 max-w-xl">
              {selectedProject?.description || "Không có mô tả cho dự án này."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-stack-sm shrink-0">
          {/* Nhóm avatar thành viên — click để chuyển sang tab Thành viên nội bộ */}
          <div
            className="flex -space-x-2 mr-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setActiveView("members")}
            title="Xem và quản lý thành viên dự án"
          >
            {members.slice(0, 3).map((m, i) => {
              const isSelf = (m.userId || m.id) === currentUser?.id;
              return (
                <div
                  key={m.userId || m.id}
                  title={`${m.username} (${m.role})`}
                  className={`w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs text-on-surface ring-2 ring-background overflow-hidden z-${30 - i * 10} ${isSelf ? "border border-yellow-400/90 shadow-sm" : ""}`}
                >
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.username} className="w-full h-full object-cover" />
                  ) : (
                    m.username.charAt(0).toUpperCase()
                  )}
                </div>
              );
            })}
            {members.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-surface-container-high ring-2 ring-background flex items-center justify-center font-label-xs text-label-xs text-on-surface-variant z-0 border border-outline-variant/20">
                +{members.length - 3}
              </div>
            )}
          </div>

          {(myRole === "ADMIN" || myRole === "MANAGER") && (
            <button
              onClick={() => setActiveView("ai-decompose")}
              className="h-10 px-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white font-label-md text-label-md rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 hover:shadow-purple-600/50 cursor-pointer"
              title="AI tự động phân rã tính năng lớn thành các sub-tasks chi tiết"
            >
              <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span className="font-semibold text-xs tracking-wide">AI Chia Task</span>
            </button>
          )}

          {(myRole === "ADMIN" || myRole === "MANAGER") && (
            <button onClick={onOpenCreateTask} className="h-10 px-4 bg-primary text-on-primary font-label-md text-label-md rounded-lg flex items-center gap-2 hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors shadow-md shadow-primary/20 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">add</span> Nhiệm vụ mới
            </button>
          )}

          {/* Menu Dropdown for more actions (Edit/Delete/Leave) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="h-10 w-10 bg-surface-container text-on-surface rounded-lg flex items-center justify-center hover:bg-surface-container-high transition-colors border border-outline-variant/20 ml-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
            <div className={`absolute right-0 mt-2 w-56 bg-surface-container-high rounded-xl shadow-xl border border-outline-variant/20 transition-all z-50 overflow-hidden flex flex-col ${isMenuOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-1"}`}>
              <button onClick={() => { setActiveView("ai-chat"); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-purple-300 hover:bg-purple-500/10 transition-colors flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-[16px] text-purple-400">smart_toy</span>
                Trợ lý AI dự án
              </button>
              {(myRole === "ADMIN" || myRole === "MANAGER") && (
                <button onClick={() => { setActiveView("ai-decompose"); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-purple-300 hover:bg-purple-500/10 transition-colors flex items-center gap-2 cursor-pointer border-t border-outline-variant/10">
                  <span className="material-symbols-outlined text-[16px] text-purple-400">auto_awesome</span>
                  AI Phân rã nhiệm vụ
                </button>
              )}
              <button onClick={() => { setActiveView("analytics"); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2 cursor-pointer border-t border-outline-variant/10">
                <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
                Báo cáo & Thống kê
              </button>
              <button onClick={() => { setActiveView("members"); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2 cursor-pointer border-t border-outline-variant/10">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">group</span>
                Quản lý thành viên
              </button>
              <button onClick={() => { setActiveView("archive"); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2 cursor-pointer border-t border-outline-variant/10">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">inventory_2</span>
                Kho lưu trữ
              </button>
              {(myRole === "ADMIN" || myRole === "MANAGER") && (
                <button
                  onClick={() => { setActiveView("github"); setIsMenuOpen(false); }}
                  className="text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors flex items-center gap-2 cursor-pointer border-t border-outline-variant/10"
                >
                  <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                  Tích hợp GitHub Webhook
                </button>
              )}
              {(myRole === "ADMIN" || myRole === "MANAGER") && (
                <button onClick={() => { onOpenInviteMember(); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2 border-t border-outline-variant/10 cursor-pointer">
                  <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>
                  Mời thành viên
                </button>
              )}
              {(myRole === "ADMIN" || myRole === "MANAGER") && (
                <button onClick={() => { onOpenEditProject(); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2 cursor-pointer border-t border-outline-variant/10">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit</span>
                  Sửa dự án
                </button>
              )}
              {myRole === "ADMIN" && (
                <>
                  <button onClick={() => { onOpenTransfer(); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-yellow-400 hover:bg-yellow-400/10 transition-colors flex items-center gap-2 cursor-pointer border-t border-outline-variant/10">
                    <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                    Chuyển quyền Admin
                  </button>
                  <button onClick={() => { onOpenDeleteProject(); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors border-t border-outline-variant/10 flex items-center gap-2 cursor-pointer">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Xóa dự án
                  </button>
                </>
              )}
              {(myRole === "MANAGER" || myRole === "MEMBER") && (
                <button onClick={() => { onOpenLeave(); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors border-t border-outline-variant/10 flex items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">exit_to_app</span>
                  Thoát dự án
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Switcher chế độ xem nội bộ (Sub-Views Tab Bar) */}
      <div className="px-container-margin mb-3 shrink-0 overflow-x-auto custom-scrollbar pb-1">
        <div className="inline-flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/15 shadow-sm">
          <button
            onClick={() => setActiveView("kanban")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeView === "kanban"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">view_kanban</span>
            <span>Bảng công việc</span>
          </button>
          <button
            onClick={() => setActiveView("members")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeView === "members"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">group</span>
            <span>Thành viên ({members.length})</span>
          </button>
          <button
            onClick={() => setActiveView("analytics")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeView === "analytics"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">analytics</span>
            <span>Báo cáo & Thống kê</span>
          </button>
          <button
            onClick={() => setActiveView("archive")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeView === "archive"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">inventory_2</span>
            <span>Kho lưu trữ ({archivedTasks.length})</span>
          </button>
          <button
            onClick={() => setActiveView("ai-chat")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeView === "ai-chat"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-600/30"
                : "text-purple-300 hover:text-white hover:bg-purple-600/20"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">smart_toy</span>
            <span>Trợ lý AI</span>
          </button>
          {(myRole === "ADMIN" || myRole === "MANAGER") && (
            <button
              onClick={() => setActiveView("ai-decompose")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeView === "ai-decompose"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-600/30"
                  : "text-purple-300 hover:text-white hover:bg-purple-600/20"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">auto_awesome</span>
              <span>AI Chia Task</span>
            </button>
          )}
          {(myRole === "ADMIN" || myRole === "MANAGER") && (
            <button
              onClick={() => setActiveView("github")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeView === "github"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">sync_alt</span>
              <span>GitHub Webhook</span>
            </button>
          )}
        </div>
      </div>

      {/* Render Sub-Views nội bộ theo activeView */}
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
        <>
          {/* Analytics Bar — Click để mở trang báo cáo chi tiết */}
          <div
            onClick={() => setActiveView("analytics")}
            className="px-container-margin mb-stack-lg shrink-0 cursor-pointer group"
            title="Nhấp để xem báo cáo phân tích chi tiết dự án"
          >
            <div className="bg-surface-container-low group-hover:bg-surface-container rounded-2xl p-stack-md flex flex-col md:flex-row gap-stack-lg items-center justify-between border border-outline-variant/10 group-hover:border-primary/40 transition shadow-sm">
              <div className="flex items-center gap-stack-lg w-full md:w-auto shrink-0">
                <div className="flex flex-col">
                  <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider mb-1">Tổng nhiệm vụ</span>
                  <span className="font-display text-3xl font-bold text-on-background">{stats.total}</span>
                </div>
                <div className="w-px h-8 bg-surface-container-highest hidden md:block"></div>
                <div className="flex flex-col">
                  <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider mb-1">Hoàn thành</span>
                  <span className="font-display text-3xl font-bold text-primary">{stats.completed}</span>
                </div>
                <div className="w-px h-8 bg-surface-container-highest hidden md:block"></div>
                <div className="flex flex-col">
                  <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider mb-1">Quá hạn</span>
                  <span className="font-display text-3xl font-bold text-error">{stats.overdue}</span>
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
            <div className="flex-1 px-4 overflow-x-auto flex justify-center gap-4 snap-x snap-mandatory custom-scrollbar min-h-0">
              {KANBAN_COLUMNS.map((status) => {
            const columnTasks = tasksByStatus[status];
            const cfg = STATUS_CFG[status];
            return (
              <div key={status} className="w-[280px] flex-shrink-0 flex flex-col snap-start h-full">
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
                              className={`rounded-xl p-stack-md flex h-[145px] flex-col gap-stack-sm cursor-pointer transition-all group relative overflow-hidden border shrink-0 ${t.assignees?.some(u => u.id === currentUser?.id)
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

                              <div className="flex items-center justify-between mt-auto pt-3 border-t border-surface-container-highest/50">
                                <div className="flex items-center gap-2 text-on-surface-variant font-label-xs text-label-xs">
                                  <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-[16px]">calendar_today</span>
                                    <span className={t.deadline && t.deadline < new Date().toISOString().split("T")[0] && t.status !== "SUBMITTED" && t.status !== "DONE" ? "text-error" : ""}>
                                      {formatDeadline(t.deadline)}
                                    </span>
                                  </div>
                                  {/* Badge quá hạn — inline cạnh ngày, không làm cao card */}
                                  {t.late && (t.status === "SUBMITTED" || t.status === "DONE") && (
                                    <span className="px-1.5 py-0.5 bg-error/10 text-error rounded font-label-xs text-[10px] leading-none">Nộp muộn</span>
                                  )}
                                  {t.deadline && t.deadline < new Date().toISOString().split("T")[0] && t.status !== "SUBMITTED" && t.status !== "DONE" && (
                                    <span className="px-1.5 py-0.5 bg-error/10 text-error rounded font-label-xs text-[10px] leading-none border border-error/20">Quá hạn</span>
                                  )}
                                  {t.attachmentUrl && (
                                    <span className="flex items-center text-primary" title="Có file tài liệu đính kèm">
                                      <span className="material-symbols-outlined !text-[15px]">attach_file</span>
                                    </span>
                                  )}
                                </div>
                                {t.assignees && t.assignees.length > 0 ? (() => {
                                  const sortedAssignees = sortAssignees(t.assignees);
                                  const displayAssignees = sortedAssignees.slice(0, 2);
                                  const remainingCount = sortedAssignees.length - 2;
                                  return (
                                    <div className="flex -space-x-1.5" title={`Người thực hiện: ${sortedAssignees.map(u => u.id === currentUser?.id ? "You" : u.username).join(", ")}`}>
                                      {displayAssignees.map((u, i) => {
                                        const isMe = u.id === currentUser?.id;
                                        return (
                                          <div
                                            key={u.id}
                                            title={isMe ? "You" : u.username}
                                            className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] overflow-hidden z-${30 - i * 10} ${isMe
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
                                  );
                                })() : (
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
                          <span className="text-label-xs text-on-surface-variant uppercase tracking-wider">Trống</span>
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
      </>
      )}

      {/* AI Assistant Floating Button — chỉ Admin/Manager mới thấy (ẩn khi đang ở tab ai-chat) */}
      {(myRole === "ADMIN" || myRole === "MANAGER") && activeView !== "ai-chat" && (
        <div className="fixed bottom-stack-lg right-stack-lg z-30">
          <div className="relative">
            <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <button
              onClick={() => setActiveView("ai-chat")}
              title="Mở Trợ lý AI dự án"
              className="relative w-14 h-14 bg-surface-container text-on-surface rounded-full shadow-xl flex items-center justify-center hover:bg-surface-container-high hover:scale-105 transition-all duration-300 z-10 border border-outline-variant/30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>magic_button</span>
            </button>
          </div>
        </div>
      )}

      {/* Task Detail Drawer component mới */}
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

      {/* Modal danh sách người thực hiện của task (popup nhỏ khi click xem thêm assignees trong task drawer) */}
      {assigneesModalTask && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-high shadow-2xl rounded-2xl w-full max-w-sm flex flex-col border border-outline-variant/20 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-highest shrink-0">
              <h3 className="font-display text-base font-bold text-on-surface m-0">Người thực hiện task</h3>
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
                  <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-surface-container rounded-xl transition-colors">
                    <div className={`w-9 h-9 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold overflow-hidden shrink-0 ${isMe ? "border-2 border-yellow-400" : ""}`}>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        u.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-on-surface font-medium text-sm flex items-center gap-1.5">
                        {u.username}
                        {isMe && <span className="px-1.5 py-0.2 bg-primary/10 text-primary text-[10px] font-bold rounded">Bạn</span>}
                      </span>
                      <span className="text-on-surface-variant text-xs truncate">{u.email || "Thành viên"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Profile modal khi click xem hồ sơ thành viên trong tab Members */}
      {profileMember && (
        <MemberProfileModal
          member={profileMember}
          onClose={() => setProfileMember(null)}
        />
      )}
    </div>
  );
}

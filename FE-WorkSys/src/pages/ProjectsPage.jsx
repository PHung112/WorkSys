import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import projectApi from "../api/projectApi";
import taskApi from "../api/taskApi";
import userApi from "../api/userApi";
import http from "../api/axiosConfig";

import ProjectSidebar from "../components/projects/ProjectSidebar";
import ProjectDetail from "../components/projects/ProjectDetail";
import CreateProjectModal from "../components/projects/modals/CreateProjectModal";
import EditProjectModal from "../components/projects/modals/EditProjectModal";
import ConfirmDeleteProjectModal from "../components/projects/modals/ConfirmDeleteProjectModal";
import InviteMemberModal from "../components/projects/modals/InviteMemberModal";
import EditRoleModal from "../components/projects/modals/EditRoleModal";
import CreateTaskModal from "../components/projects/modals/CreateTaskModal";
import EditTaskModal from "../components/projects/modals/EditTaskModal";
import ConfirmLeaveModal from "../components/projects/modals/ConfirmLeaveModal";
import SubmitTaskModal from "../components/projects/modals/SubmitTaskModal";
import TransferAdminModal from "../components/projects/modals/TransferAdminModal";
import ConfirmModal from "../components/common/ConfirmModal";
import { subscribeRealtime } from "../realtime/wsClient";

// Trang quản lý dự án: xử lý danh sách project, members, tasks, modal và realtime sync.
export default function ProjectsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);

  // Data
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("members");

  // Modal
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState({});

  // Forms
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [roleForm, setRoleForm] = useState({ role: "MEMBER" });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    deadline: "",
    assignedToIds: [],
  });
  const [submitForm, setSubmitForm] = useState({
    link: "",
    file: null,
    taskId: null,
  });
  const [formError, setFormError] = useState("");

  // Member search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef(null);

  const [transferTarget, setTransferTarget] = useState("");
  const [invitedUserIds, setInvitedUserIds] = useState([]);
  const realtimeRefreshRef = useRef(null);

  // Loading
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Auth guard
  useEffect(() => {
    const saved = sessionStorage.getItem("currentUser");
    if (!saved) {
      navigate("/auth");
      return;
    }
    setCurrentUser(JSON.parse(saved));
  }, [navigate]);

  // Debounced user search (by email)
  useEffect(() => {
    if (modal !== "inviteMember") return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    clearTimeout(searchTimerRef.current);
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await userApi.searchUsersByEmail(searchQuery.trim());
        setSearchResults(
          res.data.filter((u) => !members.find((m) => m.userId === u.id)),
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery, modal, members]);

  // Tải toàn bộ project mà user hiện tại đang tham gia.
  const loadProjects = useCallback(async () => {
    try {
      const res = await projectApi.getMyProjects();
      setProjects(res.data);
      return res.data;
    } catch {
      return [];
    }
  }, []);

  // [2] CẬP NHẬT HÀM SELECT PROJECT: BẬT TẮT LOADING
  const selectProject = useCallback(async (project) => {
    setSelectedProject(project); // Đổi tên project trên header ngay lập tức
    setActiveTab("members");
    setIsLoadingDetails(true); // Bật vòng xoay loading che cái màn hình cũ đi

    try {
      const [mRes, tRes] = await Promise.all([
        projectApi.getProjectMembers(project.id),
        taskApi.getTasksByProject(project.id),
      ]);
      setMembers(mRes.data);
      setTasks(tRes.data);
    } catch {
      // ignore initial detail load failure
    } finally {
      setIsLoadingDetails(false); // Tắt loading, show data mới
    }
  }, []);

  // Refresh phần chi tiết project hiện tại (Dùng cho realtime, KHÔNG bật loading full màn hình để tránh giật UI)
  const refreshDetails = useCallback(async (projectId) => {
    if (!projectId) return;
    try {
      const [mRes, tRes] = await Promise.all([
        projectApi.getProjectMembers(projectId),
        taskApi.getTasksByProject(projectId),
      ]);
      setMembers(mRes.data);
      setTasks(tRes.data);
    } catch {
      // ignore details refresh failure
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Auto-select project from ?goto=id URL param (from notification click)
  useEffect(() => {
    const gotoId = searchParams.get("goto");
    if (!gotoId || projects.length === 0) return;
    const target = projects.find((p) => String(p.id) === gotoId);
    if (target) {
      selectProject(target);
      setActiveTab("tasks");
      setSearchParams({}, { replace: true }); // clean up URL
    }
  }, [searchParams, projects, selectProject, setSearchParams]);

  // Listen for invite accepted (from NotificationBell) → reload projects
  useEffect(() => {
    const handler = () => loadProjects();
    window.addEventListener("inviteAccepted", handler);
    return () => window.removeEventListener("inviteAccepted", handler);
  }, [loadProjects]);

  // Realtime: updates that affect this user's project list
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = subscribeRealtime(
      `/topic/users/${currentUser.id}/projects`,
      async (event) => {
        const refreshedProjects = await loadProjects();
        if (!selectedProject) return;

        const stillMember = refreshedProjects.some(
          (p) => p.id === selectedProject.id,
        );
        if (!stillMember) {
          setSelectedProject(null);
          setMembers([]);
          setTasks([]);
          setModal(null);
          return;
        }

        const changedProjectId = Number(event?.projectId);
        if (!changedProjectId || changedProjectId === selectedProject.id) {
          await refreshDetails(selectedProject.id);
        }
      },
    );

    return () => unsubscribe();
  }, [currentUser?.id, loadProjects, refreshDetails, selectedProject]);

  // Realtime: updates inside currently selected project
  useEffect(() => {
    if (!selectedProject?.id) return;

    const unsubscribe = subscribeRealtime(
      `/topic/projects/${selectedProject.id}`,
      () => {
        clearTimeout(realtimeRefreshRef.current);
        realtimeRefreshRef.current = setTimeout(async () => {
          await refreshDetails(selectedProject.id);
          await loadProjects();
        }, 180);
      },
    );

    return () => {
      clearTimeout(realtimeRefreshRef.current);
      unsubscribe();
    };
  }, [selectedProject?.id, refreshDetails, loadProjects]);

  // Mở modal theo tên và reset trạng thái lỗi
  const openModal = (name, data = {}) => {
    setFormError("");
    setModalData(data);
    setModal(name);
    if (name !== "inviteMember") {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // ── Project handlers ────────────────────────────────────────────────────────
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await projectApi.createProject({
        name: projectForm.name,
        description: projectForm.description,
      });
      await loadProjects();
      setModal(null);
      setProjectForm({ name: "", description: "" });
    } catch {
      setFormError("Tạo dự án thất bại.");
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      const res = await projectApi.updateProject(
        selectedProject.id,
        projectForm,
      );
      setSelectedProject(res.data);
      await loadProjects();
      setModal(null);
    } catch {
      setFormError("Cập nhật thất bại.");
    }
  };

  const handleDeleteProject = async () => {
    try {
      await projectApi.deleteProject(selectedProject.id);
      setSelectedProject(null);
      setMembers([]);
      setTasks([]);
      await loadProjects();
      setModal(null);
    } catch {
      // ignore project deletion error
    }
  };

  // ── Member handlers ─────────────────────────────────────────────────────────
  const handleInviteMember = async (userId, role) => {
    setFormError("");
    try {
      await projectApi.inviteMember(selectedProject.id, {
        userId: Number(userId),
        role,
      });
      setInvitedUserIds((prev) => [...prev, userId]);
      setFormError("");
    } catch (err) {
      setFormError(err?.response?.data?.error || "Mời thành viên thất bại.");
    }
  };

  const handleRemoveMember = async (userId) => {
    const isSelf = userId === currentUser.id;
    try {
      await projectApi.removeMember(selectedProject.id, userId);
      if (isSelf) {
        setSelectedProject(null);
        setMembers([]);
        setTasks([]);
        await loadProjects();
        setModal(null);
      } else {
        await refreshDetails(selectedProject.id);
      }
    } catch {
      // ignore member remove errors
    }
  };

  const handleAdminLeave = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!transferTarget) return;
    try {
      await projectApi.updateMemberRole(
        selectedProject.id,
        Number(transferTarget),
        { role: "ADMIN" },
      );
      await projectApi.removeMember(selectedProject.id, currentUser.id);
      setSelectedProject(null);
      setMembers([]);
      setTasks([]);
      await loadProjects();
      setModal(null);
    } catch {
      setFormError("Chuyển nhượng thất bại.");
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await projectApi.updateMemberRole(
        selectedProject.id,
        modalData.userId,
        roleForm,
      );
      await refreshDetails(selectedProject.id);
      setModal(null);
    } catch {
      setFormError("Cập nhật vai trò thất bại.");
    }
  };

  // ── Task handlers ───────────────────────────────────────────────────────────
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await taskApi.createTask({
        projectId: selectedProject.id,
        assignedToIds: taskForm.assignedToIds,
        title: taskForm.title,
        description: taskForm.description,
        deadline: taskForm.deadline || null,
      });
      await refreshDetails(selectedProject.id);
      setModal(null);
      setTaskForm({
        title: "",
        description: "",
        deadline: "",
        assignedToIds: [],
      });
    } catch (err) {
      const msg = err?.response?.data?.message;
      setFormError(msg ? `Lỗi: ${msg}` : "Tạo task thất bại.");
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await taskApi.updateTask(modalData.taskId, {
        title: taskForm.title,
        description: taskForm.description,
        deadline: taskForm.deadline || null,
      });
      await refreshDetails(selectedProject.id);
      setModal(null);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setFormError(msg ? `Lỗi: ${msg}` : "Cập nhật task thất bại.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskApi.deleteTask(taskId);
      await refreshDetails(selectedProject.id);
    } catch {
      // ignore
    }
  };

  const handleAcceptTask = async (taskId) => {
    try {
      await taskApi.acceptTask(taskId, currentUser.id);
      await refreshDetails(selectedProject.id);
    } catch {
      // ignore
    }
  };

  const handleDoSubmitTask = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!submitForm.link && !submitForm.file) {
      setFormError("Vui lòng nộp file hoặc link liên kết.");
      return;
    }
    try {
      await taskApi.submitTask(submitForm.taskId, currentUser.id, {
        submissionLink: submitForm.link || undefined,
        file: submitForm.file || undefined,
      });
      await refreshDetails(selectedProject.id);
      setModal(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data;
      setFormError(msg ? `Lỗi: ${msg}` : "Nộp task thất bại.");
    }
  };

  // Xử lý khi user bấm nút "Hủy nộp" trong drawer:
  // Gọi API xóa bài nộp → task quay về IN_PROGRESS → refresh lại danh sách task của project.
  // Nếu thất bại (không phải assignee, hoặc task không ở SUBMITTED), alert lỗi cho user.
  const handleUnsubmitTask = async (taskId) => {
    try {
      await taskApi.unsubmitTask(taskId, currentUser.id);
      await refreshDetails(selectedProject.id);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data;
      alert(msg ? `Lỗi: ${msg}` : "Hủy nộp thất bại.");
    }
  };

  const handleConfirmDownload = async () => {
    const { submissionLink } = modalData;
    setModal(null);
    if (!submissionLink) return;
    if (submissionLink.startsWith("/api/files/")) {
      try {
        const res = await http.get(submissionLink, { responseType: "blob" });
        const disposition = res.headers?.["content-disposition"] || "";
        let downloadName = submissionLink.split("/").pop();

        const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8Match?.[1]) {
          try {
            downloadName = decodeURIComponent(utf8Match[1]);
          } catch {
            // fallback
          }
        } else {
          const normalMatch = disposition.match(/filename="?([^";]+)"?/i);
          if (normalMatch?.[1]) downloadName = normalMatch[1];
        }

        const url = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        alert("Tải file thất bại.");
      }
    } else {
      window.open(submissionLink, "_blank", "noopener,noreferrer");
    }
  };


  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("currentUser");
    navigate("/auth");
  };

  const myRole = members.find((m) => m.userId === currentUser?.id)?.role;

  if (!currentUser) return null;

  return (
    <div className="bg-background font-body-sm text-on-background flex-1 w-full flex">
      {/* Sidebar */}
      <ProjectSidebar
        projects={projects}
        selectedProject={selectedProject}
        onSelect={selectProject}
        onCreateClick={() => {
          setProjectForm({ name: "", description: "" });
          openModal("createProject");
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="flex-1 pl-72 flex flex-col min-w-0 relative h-[calc(100vh-4rem)]">
        {/* Main Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {!selectedProject ? (
            <div className="flex flex-col items-center justify-center h-full opacity-60 select-none pb-20">
              <span className="material-symbols-outlined text-[80px] text-surface-container-highest mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
              <p className="text-xl font-display font-semibold text-on-surface mb-2 tracking-tight">Chọn một dự án</p>
              <button onClick={() => { setProjectForm({ name: "", description: "" }); openModal("createProject"); }} className="text-sm font-label-md text-primary hover:text-primary-fixed hover:bg-primary/10 px-4 py-2 rounded-lg transition-all">
                hoặc tạo dự án mới
              </button>
            </div>
          ) : (
            <ProjectDetail
              selectedProject={selectedProject}
              members={members}
              tasks={tasks}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentUser={currentUser}
              myRole={myRole}
              isLoading={isLoadingDetails}
              onOpenEditProject={() => {
                setProjectForm({
                  name: selectedProject.name,
                  description: selectedProject.description || "",
                });
                openModal("editProject");
              }}
              onOpenDeleteProject={() => openModal("confirmDeleteProject")}
              onOpenLeave={() => openModal("confirmLeave")}
              onOpenTransfer={() => {
                setTransferTarget("");
                openModal("transferAdmin");
              }}
              onOpenInviteMember={() => openModal("inviteMember")}
              onOpenConfirmKick={(userId, username) => openModal("confirmKickMember", { userId, username })}
              onOpenEditRole={(userId, role) => {
                setRoleForm({ role });
                openModal("editRole", { userId });
              }}
              onOpenCreateTask={() => {
                setTaskForm({ title: "", description: "", deadline: "", assignedToIds: [] });
                openModal("createTask");
              }}
              onOpenEditTask={(task) => {
                setTaskForm({
                  title: task.title,
                  description: task.description || "",
                  deadline: task.deadline || "",
                  assignedToIds: [],
                });
                openModal("editTask", { taskId: task.id });
              }}
              onOpenConfirmDeleteTask={(taskId, title) => openModal("confirmDeleteTask", { taskId, title })}
              onAcceptTask={handleAcceptTask}
              onOpenSubmitTask={(taskId) => {
                setSubmitForm({ link: "", file: null, taskId });
                setFormError("");
                setModal("submitTask");
              }}
              onOpenDownloadConfirm={(link, title) => openModal("confirmDownload", { submissionLink: link, title })}
              onUnsubmitTask={handleUnsubmitTask}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      {modal === "createProject" && (
        <CreateProjectModal projectForm={projectForm} setProjectForm={setProjectForm} onSubmit={handleCreateProject} onClose={() => setModal(null)} formError={formError} />
      )}
      {modal === "editProject" && (
        <EditProjectModal projectForm={projectForm} setProjectForm={setProjectForm} onSubmit={handleEditProject} onClose={() => setModal(null)} formError={formError} />
      )}
      {modal === "confirmDeleteProject" && (
        <ConfirmDeleteProjectModal projectName={selectedProject?.name} onConfirm={handleDeleteProject} onClose={() => setModal(null)} />
      )}
      {modal === "inviteMember" && (
        <InviteMemberModal searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchResults={searchResults} searchLoading={searchLoading} onAdd={handleInviteMember} onClose={() => { setModal(null); setSearchQuery(""); setSearchResults([]); }} formError={formError} invitedUserIds={invitedUserIds} />
      )}
      {modal === "editRole" && (
        <EditRoleModal roleForm={roleForm} setRoleForm={setRoleForm} onSubmit={handleUpdateRole} onClose={() => setModal(null)} formError={formError} />
      )}
      {modal === "createTask" && (
        <CreateTaskModal taskForm={taskForm} setTaskForm={setTaskForm} members={members} onSubmit={handleCreateTask} onClose={() => setModal(null)} formError={formError} />
      )}
      {modal === "editTask" && (
        <EditTaskModal taskForm={taskForm} setTaskForm={setTaskForm} onSubmit={handleEditTask} onClose={() => setModal(null)} formError={formError} />
      )}
      {modal === "confirmLeave" && (
        <ConfirmLeaveModal projectName={selectedProject?.name} onConfirm={() => handleRemoveMember(currentUser.id)} onClose={() => setModal(null)} />
      )}
      {modal === "submitTask" && (
        <SubmitTaskModal submitForm={submitForm} setSubmitForm={setSubmitForm} onSubmit={handleDoSubmitTask} onClose={() => setModal(null)} formError={formError} />
      )}
      {modal === "transferAdmin" && (
        <TransferAdminModal members={members} currentUserId={currentUser.id} transferTarget={transferTarget} setTransferTarget={setTransferTarget} onSubmit={handleAdminLeave} onClose={() => setModal(null)} formError={formError} />
      )}
      {modal === "confirmKickMember" && (
        <ConfirmModal title="Kick thành viên" message={`Bạn có chắc chắn muốn xóa ${modalData.username ?? "thành viên này"} khỏi project?`} confirmLabel="Kick" onConfirm={() => { setModal(null); handleRemoveMember(modalData.userId); }} onClose={() => setModal(null)} />
      )}
      {modal === "confirmDeleteTask" && (
        <ConfirmModal title="Xóa task" message={`Bạn có chắc chắn muốn xóa task "${modalData.title ?? ""}"? Hành động này không thể hoàn tác.`} confirmLabel="Xóa" onConfirm={() => { setModal(null); handleDeleteTask(modalData.taskId); }} onClose={() => setModal(null)} />
      )}
      {modal === "confirmDownload" && (
        <ConfirmModal title="Tải về bài nộp" message={`Bạn có muốn tải về bài nộp của task "${modalData.title ?? ""}"?`} confirmLabel="Tải về" danger={false} onConfirm={handleConfirmDownload} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
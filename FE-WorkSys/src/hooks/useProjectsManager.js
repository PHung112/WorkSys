import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import projectApi from "../api/projectApi";
import taskApi from "../api/taskApi";
import userApi from "../api/userApi";
import http from "../api/axiosConfig";
import { subscribeRealtime } from "../realtime/wsClient";
import { uploadFileToCloudinary } from "../config/cloudinaryConfig";
import {
  getCachedProjects,
  setCachedProjects,
  getCachedSelectedProjectId,
  setCachedSelectedProjectId,
  getCachedSelectedProject,
  setCachedSelectedProject,
  getCachedProjectDetails,
  setCachedProjectDetails,
  clearProjectsCache,
} from "../utils/projectsCache";

// Hàm tiện ích lấy chuỗi ngày hiện tại (YYYY-MM-DD) theo giờ địa phương của máy người dùng
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Custom Hook quản lý toàn bộ nghiệp vụ (state & operations) của ProjectsPage:
 * - Tải danh sách dự án, chi tiết thành viên, tasks, archived tasks
 * - Đồng bộ thời gian thực qua WebSocket
 * - Quản lý form và modal
 * - Thực hiện các thao tác API CRUD cho dự án, thành viên, và nhiệm vụ
 */
export function useProjectsManager(navigate, searchParams, setSearchParams) {
  const [currentUser, setCurrentUser] = useState(null);

  // Data - Khởi tạo từ cache ngay lập tức để render tức thì (không nháy màn hình trống)
  const [projects, setProjects] = useState(() => getCachedProjects());

  const [selectedProject, setSelectedProject] = useState(() => {
    const gotoId = searchParams.get("goto");
    const cachedProjects = getCachedProjects();
    const targetId = gotoId || getCachedSelectedProjectId();
    if (targetId && cachedProjects.length > 0) {
      const found = cachedProjects.find((p) => String(p.id) === String(targetId));
      if (found) return found;
    }
    return getCachedSelectedProject();
  });

  const [members, setMembers] = useState(() => {
    const targetId = searchParams.get("goto") || getCachedSelectedProjectId();
    const cached = getCachedProjectDetails(targetId);
    return cached?.members || [];
  });

  const [tasks, setTasks] = useState(() => {
    const targetId = searchParams.get("goto") || getCachedSelectedProjectId();
    const cached = getCachedProjectDetails(targetId);
    return cached?.tasks || [];
  });

  const [archivedTasks, setArchivedTasks] = useState(() => {
    const targetId = searchParams.get("goto") || getCachedSelectedProjectId();
    const cached = getCachedProjectDetails(targetId);
    return cached?.archivedTasks || [];
  });

  const [isInitialLoadingProjects, setIsInitialLoadingProjects] = useState(
    () => getCachedProjects().length === 0
  );

  // Khôi phục tab đang mở từ cache (nếu có)
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem("projectsPage_activeTab") || "members"
  );

  const [showMyTasks, setShowMyTasks] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Modal
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState({});

  // Forms
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [roleForm, setRoleForm] = useState({ role: "MEMBER" });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    deadline: getTodayString(),
    assignedToIds: [],
    file: null,
  });
  const [submitForm, setSubmitForm] = useState({
    link: "",
    file: null,
    taskId: null,
  });
  const [formError, setFormError] = useState("");

  // Khôi phục trạng thái sidebar từ cache (mặc định là mở)
  const [sidebarOpen, setSidebarOpen] = useState(
    () => sessionStorage.getItem("projectsPage_sidebarOpen") !== "false"
  );

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
          res.data.filter((u) => !members.find((m) => m.userId === u.id))
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery, modal, members]);

  // Tải toàn bộ project mà user hiện tại đang tham gia
  const loadProjects = useCallback(async () => {
    try {
      const res = await projectApi.getMyProjects();
      const data = res.data || [];
      setProjects(data);
      setCachedProjects(data);

      // Khôi phục hoặc đồng bộ project đang chọn
      setSelectedProject((prevSelected) => {
        const currentId = prevSelected?.id || getCachedSelectedProjectId();
        if (currentId) {
          const found = data.find((p) => String(p.id) === String(currentId));
          if (found) {
            setCachedSelectedProject(found);
            return found;
          }
        }
        return prevSelected;
      });

      return data;
    } catch {
      return [];
    } finally {
      setIsInitialLoadingProjects(false);
    }
  }, []);

  // Chọn project
  const selectProject = useCallback(async (project, tab = "members", forceLoading = false) => {
    if (!project) return;
    setShowMyTasks(false);
    setIsCreatingProject(false);
    setSelectedProject(project);
    setCachedSelectedProject(project);
    setActiveTab(tab);

    const cached = getCachedProjectDetails(project.id);
    const hasCachedDetails = cached && (cached.members?.length > 0 || cached.tasks?.length > 0);

    if (hasCachedDetails) {
      setMembers(cached.members || []);
      setTasks(cached.tasks || []);
      setArchivedTasks(cached.archivedTasks || []);
      setIsLoadingDetails(false);
    } else if (forceLoading) {
      setIsLoadingDetails(true);
    }

    try {
      const [mRes, tRes, aRes] = await Promise.all([
        projectApi.getProjectMembers(project.id),
        taskApi.getTasksByProject(project.id),
        projectApi.getArchivedTasks(project.id),
      ]);
      setMembers(mRes.data || []);
      setTasks(tRes.data || []);
      setArchivedTasks(aRes.data || []);
      setCachedProjectDetails(project.id, {
        members: mRes.data || [],
        tasks: tRes.data || [],
        archivedTasks: aRes.data || [],
      });
    } catch {
      // ignore
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Refresh phần chi tiết project hiện tại (cho realtime & background sync)
  const refreshDetails = useCallback(async (projectId) => {
    if (!projectId) return;
    try {
      const [mRes, tRes, aRes] = await Promise.all([
        projectApi.getProjectMembers(projectId),
        taskApi.getTasksByProject(projectId),
        projectApi.getArchivedTasks(projectId),
      ]);
      setMembers(mRes.data || []);
      setTasks(tRes.data || []);
      setArchivedTasks(aRes.data || []);
      setCachedProjectDetails(projectId, {
        members: mRes.data || [],
        tasks: tRes.data || [],
        archivedTasks: aRes.data || [],
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    sessionStorage.setItem("projectsPage_sidebarOpen", String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    sessionStorage.setItem("projectsPage_activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!selectedProject?.id) return;
    if (members.length === 0 && tasks.length === 0) {
      setIsLoadingDetails(true);
      refreshDetails(selectedProject.id).finally(() => setIsLoadingDetails(false));
    }
  }, [selectedProject?.id, members.length, tasks.length, refreshDetails]);

  // Auto-select project from ?goto=id URL param
  useEffect(() => {
    const gotoId = searchParams.get("goto");
    if (!gotoId) return;

    const allProjects = projects.length > 0 ? projects : getCachedProjects();
    const target = allProjects.find((p) => String(p.id) === String(gotoId));

    if (target) {
      if (selectedProject?.id === target.id && (tasks.length > 0 || members.length > 0)) {
        refreshDetails(target.id);
      } else {
        selectProject(target, "tasks", false);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, projects, selectedProject?.id, tasks.length, members.length, selectProject, refreshDetails, setSearchParams]);

  // Listen for invite accepted
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
          (p) => p.id === selectedProject.id
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
      }
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
        }, 350);
      }
    );

    return () => {
      clearTimeout(realtimeRefreshRef.current);
      unsubscribe();
    };
  }, [selectedProject?.id, refreshDetails, loadProjects]);

  // Mở modal
  const openModal = (name, data = {}) => {
    setFormError("");
    setModalData(data);
    setModal(name);
    if (name !== "inviteMember") {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const closeModal = () => {
    setModal(null);
    setFormError("");
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
      setIsCreatingProject(false);
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
        projectForm
      );
      setSelectedProject(res.data);
      await loadProjects();
      closeModal();
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
      closeModal();
    } catch {
      // ignore
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
        closeModal();
      } else {
        await refreshDetails(selectedProject.id);
      }
    } catch {
      // ignore
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
        { role: "ADMIN" }
      );
      await projectApi.removeMember(selectedProject.id, currentUser.id);
      setSelectedProject(null);
      setMembers([]);
      setTasks([]);
      await loadProjects();
      closeModal();
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
        roleForm
      );
      await refreshDetails(selectedProject.id);
      closeModal();
    } catch {
      setFormError("Cập nhật vai trò thất bại.");
    }
  };

  // ── Task handlers ───────────────────────────────────────────────────────────
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      let attachmentUrl = null;
      if (taskForm.file) {
        attachmentUrl = await uploadFileToCloudinary(taskForm.file);
      }

      await taskApi.createTask({
        projectId: selectedProject.id,
        assignedToIds: taskForm.assignedToIds,
        title: taskForm.title,
        description: taskForm.description,
        deadline: taskForm.deadline || null,
        attachmentUrl: attachmentUrl || undefined,
      });

      await refreshDetails(selectedProject.id);
      closeModal();
      setTaskForm({
        title: "",
        description: "",
        deadline: getTodayString(),
        assignedToIds: [],
        file: null,
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message;
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
      closeModal();
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
      let finalSubmissionLink = submitForm.link || "";
      if (submitForm.file) {
        finalSubmissionLink = await uploadFileToCloudinary(submitForm.file);
      }

      await taskApi.submitTask(submitForm.taskId, currentUser.id, {
        submissionLink: finalSubmissionLink,
      });
      await refreshDetails(selectedProject.id);
      closeModal();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message;
      setFormError(msg ? `Lỗi: ${msg}` : "Nộp task thất bại.");
    }
  };

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
    closeModal();
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
    clearProjectsCache();
    sessionStorage.clear();
    navigate("/auth");
  };

  const myRole = useMemo(() => {
    return members.find((m) => m.userId === currentUser?.id)?.role;
  }, [members, currentUser]);

  return {
    currentUser,
    projects,
    selectedProject,
    setSelectedProject,
    members,
    tasks,
    archivedTasks,
    isInitialLoadingProjects,
    isLoadingDetails,
    activeTab,
    setActiveTab,
    showMyTasks,
    setShowMyTasks,
    isCreatingProject,
    setIsCreatingProject,
    sidebarOpen,
    setSidebarOpen,
    myRole,
    // Modals & forms
    modal,
    modalData,
    openModal,
    closeModal,
    projectForm,
    setProjectForm,
    roleForm,
    setRoleForm,
    taskForm,
    setTaskForm,
    submitForm,
    setSubmitForm,
    formError,
    transferTarget,
    setTransferTarget,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    invitedUserIds,
    // Operations
    loadProjects,
    selectProject,
    handleCreateProject,
    handleEditProject,
    handleDeleteProject,
    handleInviteMember,
    handleRemoveMember,
    handleAdminLeave,
    handleUpdateRole,
    handleCreateTask,
    handleEditTask,
    handleDeleteTask,
    handleAcceptTask,
    handleDoSubmitTask,
    handleUnsubmitTask,
    handleConfirmDownload,
    handleLogout,
  };
}

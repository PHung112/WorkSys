import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import projectApi from "../api/projectApi";
import taskApi from "../api/taskApi";
import userApi from "../api/userApi";
import {
  getCachedProjects,
  setCachedProjects,
  getCachedProjectDetails,
  setCachedProjectDetails,
  getCachedSelectedProject,
} from "../utils/projectsCache";

/**
 * Custom Hook quản lý toàn bộ business logic và dữ liệu thành viên dự án:
 * - Tải dữ liệu, đồng bộ bộ nhớ tạm (Cache)
 * - Tìm kiếm, lọc và phân quyền
 * - Quản lý trạng thái các modal (Mời, Đổi quyền, Kick, Xem hồ sơ)
 * - Gọi API thao tác dữ liệu
 */
export function useProjectMembers(projectId, navigate) {
  const [currentUser, setCurrentUser] = useState(null);

  const [project, setProject] = useState(() => {
    if (!projectId) return null;
    const found = getCachedProjects().find((p) => String(p.id) === String(projectId));
    if (found) return found;
    const selected = getCachedSelectedProject();
    if (selected && String(selected.id) === String(projectId)) return selected;
    return null;
  });

  const [members, setMembers] = useState(() => {
    if (!projectId) return [];
    return getCachedProjectDetails(projectId)?.members || [];
  });

  const [tasks, setTasks] = useState(() => {
    if (!projectId) return [];
    return getCachedProjectDetails(projectId)?.tasks || [];
  });

  const [isLoading, setIsLoading] = useState(() => {
    if (!projectId) return true;
    const cached = getCachedProjectDetails(projectId);
    return !(cached?.members?.length > 0);
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modals state
  const [modal, setModal] = useState(null); // 'invite' | 'editRole' | 'confirmKick'
  const [modalData, setModalData] = useState({});
  const [roleForm, setRoleForm] = useState({ role: "MEMBER" });
  const [profileMember, setProfileMember] = useState(null);
  const [formError, setFormError] = useState("");

  // Invite search state
  const [searchMemberQuery, setSearchMemberQuery] = useState("");
  const [searchMemberResults, setSearchMemberResults] = useState([]);
  const [searchMemberLoading, setSearchMemberLoading] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState([]);
  const searchTimerRef = useRef(null);

  // Auth guard & init currentUser
  useEffect(() => {
    const saved = sessionStorage.getItem("currentUser");
    if (!saved) {
      if (navigate) navigate("/auth");
      return;
    }
    setCurrentUser(JSON.parse(saved));
  }, [navigate]);

  // Load project details, members, tasks
  const loadData = useCallback(async () => {
    if (!projectId) return;
    if (members.length === 0) setIsLoading(true);
    try {
      const [pRes, mRes, tRes] = await Promise.all([
        projectApi.getMyProjects(),
        projectApi.getProjectMembers(projectId),
        taskApi.getTasksByProject(projectId),
      ]);
      const currentProj = pRes.data.find((p) => String(p.id) === String(projectId));
      setProject(currentProj || null);
      setMembers(mRes.data);
      setTasks(tRes.data);
      setCachedProjects(pRes.data);
      setCachedProjectDetails(projectId, {
        members: mRes.data,
        tasks: tRes.data,
      });
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [projectId, members.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search user by email with debounce for invite modal
  useEffect(() => {
    if (modal !== "invite") return;
    if (!searchMemberQuery.trim()) {
      setSearchMemberResults([]);
      return;
    }
    clearTimeout(searchTimerRef.current);
    setSearchMemberLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await userApi.searchUsersByEmail(searchMemberQuery.trim());
        setSearchMemberResults(
          res.data.filter((u) => !members.find((m) => m.userId === u.id))
        );
      } catch {
        setSearchMemberResults([]);
      } finally {
        setSearchMemberLoading(false);
      }
    }, 500);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchMemberQuery, modal, members]);

  // Sắp xếp danh sách: Đưa user hiện tại lên đầu tiên
  const sortedMembers = useMemo(() => {
    if (!members || !currentUser) return members || [];
    const isSelf = (m) => (m.userId || m.id) === currentUser.id;
    const current = members.find(isSelf);
    const others = members.filter((m) => !isSelf(m));
    return current ? [current, ...others] : members;
  }, [members, currentUser]);

  // Lọc theo tìm kiếm & vai trò
  const filteredMembers = useMemo(() => {
    return sortedMembers.filter((m) => {
      const matchQuery =
        !searchQuery.trim() ||
        m.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === "ALL" || m.role === roleFilter;
      return matchQuery && matchRole;
    });
  }, [sortedMembers, searchQuery, roleFilter]);

  // Vai trò của user hiện tại trong dự án
  const myRole = useMemo(() => {
    return members.find((m) => (m.userId || m.id) === currentUser?.id)?.role;
  }, [members, currentUser]);

  // Đếm số task của một member
  const getMemberTaskCount = useCallback(
    (userId) => {
      return tasks.filter((t) =>
        t.assignees?.some((u) => (u.id || u.userId) === userId)
      ).length;
    },
    [tasks]
  );

  // Modal actions
  const openInviteModal = useCallback(() => {
    setFormError("");
    setSearchMemberQuery("");
    setSearchMemberResults([]);
    setModal("invite");
  }, []);

  const openEditRoleModal = useCallback((userId, role) => {
    setRoleForm({ role: role || "MEMBER" });
    setModalData({ userId });
    setFormError("");
    setModal("editRole");
  }, []);

  const openPromoteModal = useCallback((userId) => {
    setRoleForm({ role: "MANAGER" });
    setModalData({ userId });
    setFormError("");
    setModal("editRole");
  }, []);

  const openKickModal = useCallback((userId, username) => {
    setModalData({ userId, username });
    setModal("confirmKick");
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setFormError("");
    setSearchMemberQuery("");
    setSearchMemberResults([]);
  }, []);

  // API Mutating Actions
  const handleInviteMember = async (userId, role) => {
    setFormError("");
    try {
      await projectApi.inviteMember(projectId, {
        userId: Number(userId),
        role,
      });
      setInvitedUserIds((prev) => [...prev, userId]);
      setFormError("");
    } catch (err) {
      setFormError(err?.response?.data?.error || "Mời thành viên thất bại.");
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await projectApi.updateMemberRole(projectId, modalData.userId, roleForm);
      await loadData();
      setModal(null);
    } catch {
      setFormError("Cập nhật vai trò thất bại.");
    }
  };

  const handleRemoveMember = async (userId) => {
    const isSelf = userId === currentUser?.id;
    try {
      await projectApi.removeMember(projectId, userId);
      if (isSelf) {
        if (navigate) navigate("/projects");
      } else {
        await loadData();
      }
    } catch {
      // ignore
    }
  };

  return {
    currentUser,
    project,
    members,
    tasks,
    isLoading,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    filteredMembers,
    myRole,
    getMemberTaskCount,
    // Modals
    modal,
    modalData,
    roleForm,
    setRoleForm,
    profileMember,
    setProfileMember,
    formError,
    searchMemberQuery,
    setSearchMemberQuery,
    searchMemberResults,
    searchMemberLoading,
    invitedUserIds,
    openInviteModal,
    openEditRoleModal,
    openPromoteModal,
    openKickModal,
    closeModal,
    // Operations
    handleInviteMember,
    handleUpdateRole,
    handleRemoveMember,
    loadData,
  };
}

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import projectApi from "../api/projectApi";
import taskApi from "../api/taskApi";
import { uploadFileToCloudinary } from "../config/cloudinaryConfig";
import {
  getCachedProjects,
  setCachedProjects,
  getCachedSelectedProjectId,
  getCachedSelectedProject,
  getCachedProjectDetails,
  setCachedProjectDetails,
} from "../utils/projectsCache";

// Hàm tiện ích lấy chuỗi ngày hôm nay định dạng YYYY-MM-DD theo giờ địa phương
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Custom Hook quản lý toàn bộ logic cho trang Tạo nhiệm vụ (CreateTaskPage)
 */
export function useCreateTask(urlProjectId, navigate) {
  const [projects, setProjects] = useState(() => getCachedProjects());
  const [selectedProjectId, setSelectedProjectId] = useState(
    urlProjectId || getCachedSelectedProjectId() || ""
  );

  const [currentProject, setCurrentProject] = useState(() => {
    const targetId = urlProjectId || getCachedSelectedProjectId();
    if (targetId) {
      const found = getCachedProjects().find((p) => String(p.id) === String(targetId));
      if (found) return found;
      const selected = getCachedSelectedProject();
      if (selected && String(selected.id) === String(targetId)) return selected;
    }
    return null;
  });

  const [members, setMembers] = useState(() => {
    const targetId = urlProjectId || getCachedSelectedProjectId();
    if (targetId) {
      const cached = getCachedProjectDetails(targetId);
      if (cached?.members?.length > 0) return cached.members;
    }
    return [];
  });
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(getTodayString());
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [assignedToIds, setAssignedToIds] = useState([]);
  const [file, setFile] = useState(null);

  // Filter thành viên
  const [searchMemberQuery, setSearchMemberQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Kiểm tra dữ liệu chưa lưu
  const hasUnsavedChanges = useMemo(
    () =>
      title.trim() !== "" ||
      description.trim() !== "" ||
      file !== null ||
      assignedToIds.length > 0,
    [title, description, file, assignedToIds.length]
  );

  // Auth check
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/auth");
    }
  }, [navigate]);

  // Cảnh báo khi người dùng reload (F5) hoặc đóng tab
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && !submitting) {
        e.preventDefault();
        e.returnValue = "";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, submitting]);

  // Load danh sách dự án nếu chưa có
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectApi.getMyProjects();
        setProjects(res.data);
        setCachedProjects(res.data);
        if (!selectedProjectId && res.data.length > 0) {
          setSelectedProjectId(String(res.data[0].id));
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách dự án:", err);
      }
    };
    fetchProjects();
  }, [selectedProjectId]);

  // Load thông tin dự án hiện tại & danh sách thành viên
  useEffect(() => {
    if (!selectedProjectId) return;

    const fetchProjectAndMembers = async () => {
      if (members.length === 0) setLoadingMembers(true);
      try {
        const [projectRes, membersRes] = await Promise.all([
          projectApi.getProjectById(selectedProjectId).catch(() => null),
          projectApi.getProjectMembers(selectedProjectId),
        ]);
        if (projectRes?.data) {
          setCurrentProject(projectRes.data);
        }
        const memberList = membersRes.data || [];
        setMembers(memberList);
        setCachedProjectDetails(selectedProjectId, { members: memberList });
      } catch (err) {
        console.error("Lỗi khi tải thành viên dự án:", err);
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchProjectAndMembers();
  }, [selectedProjectId]);

  // Lọc thành viên theo từ khóa tìm kiếm
  const filteredMembers = useMemo(() => {
    const q = searchMemberQuery.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.username?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [members, searchMemberQuery]);

  // Toggle chọn tất cả thành viên
  const handleToggleSelectAll = useCallback(() => {
    if (assignedToIds.length === filteredMembers.length && filteredMembers.length > 0) {
      setAssignedToIds([]);
    } else {
      setAssignedToIds(filteredMembers.map((m) => m.userId));
    }
  }, [assignedToIds.length, filteredMembers]);

  // Xử lý quay lại an toàn
  const handleNavigateBack = useCallback(() => {
    if (hasUnsavedChanges && !submitting) {
      const confirmLeave = window.confirm(
        "Nội dung bạn đã điền trong ô sẽ bị xóa. Bạn có chắc chắn muốn quay lại không?"
      );
      if (!confirmLeave) return;
    }
    navigate(selectedProjectId ? `/projects?goto=${selectedProjectId}` : "/projects");
  }, [hasUnsavedChanges, submitting, selectedProjectId, navigate]);

  // Submit tạo task mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedProjectId) {
      setErrorMessage("Vui lòng chọn một dự án để tạo task.");
      return;
    }

    if (assignedToIds.length === 0) {
      setErrorMessage("Vui lòng phân công cho ít nhất 1 thành viên.");
      return;
    }

    setSubmitting(true);
    try {
      const fullDeadline = deadline ? `${deadline}T${deadlineTime || "23:59"}:00` : null;

      let attachmentUrl = null;
      if (file) {
        attachmentUrl = await uploadFileToCloudinary(file);
      }

      await taskApi.createTask({
        projectId: Number(selectedProjectId),
        assignedToIds,
        title,
        description,
        deadline: fullDeadline,
        attachmentUrl: attachmentUrl || undefined,
      });

      navigate(`/projects?goto=${selectedProjectId}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setErrorMessage(msg ? `Lỗi: ${msg}` : "Tạo nhiệm vụ thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    currentProject,
    members,
    loadingMembers,
    filteredMembers,
    // Form fields
    title,
    setTitle,
    description,
    setDescription,
    deadline,
    setDeadline,
    deadlineTime,
    setDeadlineTime,
    assignedToIds,
    setAssignedToIds,
    file,
    setFile,
    searchMemberQuery,
    setSearchMemberQuery,
    submitting,
    errorMessage,
    getTodayString,
    // Actions
    handleToggleSelectAll,
    handleNavigateBack,
    handleSubmit,
  };
}

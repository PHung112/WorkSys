import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import projectApi from "../api/projectApi";
import taskApi from "../api/taskApi";
import userApi from "../api/userApi";
import EditRoleModal from "../components/projects/modals/EditRoleModal";
import InviteMemberModal from "../components/projects/modals/InviteMemberModal";
import MemberProfileModal from "../components/projects/modals/MemberProfileModal";
import ConfirmModal from "../components/common/ConfirmModal";

// Trang toàn màn hình độc lập (/projects/:projectId/members) quản lý danh sách thành viên dự án
export default function ProjectMembersPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [activeMenuMemberId, setActiveMenuMemberId] = useState(null);
  const menuRef = useRef(null);

  // Modals state
  const [modal, setModal] = useState(null); // 'invite' | 'editRole' | 'confirmKick'
  const [modalData, setModalData] = useState({});
  const [roleForm, setRoleForm] = useState({ role: "MEMBER" });
  const [profileMember, setProfileMember] = useState(null);
  const [formError, setFormError] = useState("");

  // Invite modal state
  const [searchMemberQuery, setSearchMemberQuery] = useState("");
  const [searchMemberResults, setSearchMemberResults] = useState([]);
  const [searchMemberLoading, setSearchMemberLoading] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState([]);
  const searchTimerRef = useRef(null);

  // Auth guard & init currentUser
  useEffect(() => {
    const saved = sessionStorage.getItem("currentUser");
    if (!saved) {
      navigate("/auth");
      return;
    }
    setCurrentUser(JSON.parse(saved));
  }, [navigate]);

  // Load project details, members, tasks
  const loadData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
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
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuMemberId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Search user by email for invite modal
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

  const myRole = useMemo(() => {
    return members.find((m) => m.userId === currentUser?.id)?.role;
  }, [members, currentUser]);

  const getMemberTaskCount = (userId) => {
    return tasks.filter((t) => t.assignees?.some((u) => u.id === userId)).length;
  };

  // Actions
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
        navigate("/projects");
      } else {
        await loadData();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background font-body-sm text-on-background flex flex-col">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full"></div>
            <p className="text-on-surface-variant font-body-sm">Đang tải dữ liệu thành viên...</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/projects")}
              className="h-10 px-3.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl flex items-center gap-2 text-xs font-semibold border border-outline-variant/20 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Quay lại danh sách dự án"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Dự án</span>
            </button>
            <div className="h-6 w-px bg-outline-variant/20 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant text-xs font-medium">Dự án:</span>
                <span className="text-primary font-bold text-sm tracking-wide">{project?.name || "Chi tiết dự án"}</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-on-background flex items-center gap-2.5 mt-0.5">
                <span>Danh sách thành viên</span>
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                  {members.length}
                </span>
              </h1>
            </div>
          </div>

          {/* Action: Mời thành viên */}
          {(myRole === "ADMIN" || myRole === "MANAGER") && (
            <button
              onClick={() => {
                setFormError("");
                setSearchMemberQuery("");
                setSearchMemberResults([]);
                setModal("invite");
              }}
              className="h-10 px-4 bg-primary text-on-primary font-label-md text-label-md rounded-xl flex items-center gap-2 hover:bg-primary-fixed hover:text-on-primary-fixed transition-all shadow-md shadow-primary/20 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Mời thành viên</span>
            </button>
          )}
        </div>

        {/* Thanh tìm kiếm & Lọc vai trò */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thành viên theo tên, email..."
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Bộ lọc Role */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: "ALL", label: "Tất cả" },
              { key: "ADMIN", label: "Admin" },
              { key: "MANAGER", label: "Manager" },
              { key: "MEMBER", label: "Member" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRoleFilter(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  roleFilter === tab.key
                    ? "bg-primary text-on-primary shadow-sm shadow-primary/20"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bảng danh sách thành viên */}
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-outline-variant/15 bg-surface-container/50">
                  <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                    Thành viên
                  </th>
                  <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                    Nhiệm vụ được giao
                  </th>
                  <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider text-right">
                    Tùy chọn
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredMembers.map((member) => {
                  const memberUserId = member.userId || member.id;
                  const isSelf = memberUserId === currentUser?.id;
                  const taskCount = getMemberTaskCount(memberUserId);
                  const isMenuOpen = activeMenuMemberId === memberUserId;

                  return (
                    <tr
                      key={memberUserId}
                      className="hover:bg-surface-container-high/40 transition-colors group"
                    >
                      {/* Cột 1: Thông tin Avatar + Tên */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-11 h-11 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold overflow-hidden shrink-0 shadow-sm ring-1 ring-outline-variant/20 ${
                              isSelf ? "border-2 border-yellow-400 shadow-yellow-400/20" : ""
                            }`}
                          >
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
                            ) : (
                              member.username?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-on-surface font-semibold text-sm truncate">{member.username}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-on-surface-variant text-xs truncate mt-0.5">{member.email || "Chưa có email"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Vai trò Badge */}
                      <td className="py-4 px-5">
                        {member.role === "ADMIN" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[14px]">shield_person</span>
                            ADMIN
                          </span>
                        )}
                        {member.role === "MANAGER" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[14px]">manage_accounts</span>
                            MANAGER
                          </span>
                        )}
                        {member.role === "MEMBER" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 text-xs font-medium rounded-full uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[14px]">person</span>
                            MEMBER
                          </span>
                        )}
                      </td>

                      {/* Cột 3: Nhiệm vụ */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-xl text-xs font-medium text-on-surface border border-outline-variant/10">
                          <span className="material-symbols-outlined text-[16px] text-primary">task_alt</span>
                          {taskCount} nhiệm vụ
                        </span>
                      </td>

                      {/* Cột 4: Nút Option 3 chấm dọc */}
                      <td className="py-4 px-5 text-right relative">
                        <div className="inline-block relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuMemberId(isMenuOpen ? null : memberUserId);
                            }}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              isMenuOpen
                                ? "bg-surface-container-highest text-primary shadow-sm"
                                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                            }`}
                            title="Tùy chọn thao tác"
                          >
                            <span className="material-symbols-outlined text-[22px]">more_vert</span>
                          </button>

                          {/* Dropdown Menu nổi */}
                          {isMenuOpen && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 mt-1.5 w-52 bg-surface-container-high rounded-2xl shadow-2xl border border-outline-variant/20 py-2 z-30 flex flex-col animate-in fade-in zoom-in-95 duration-150"
                            >
                              {/* Option 1: Xem hồ sơ */}
                              <button
                                onClick={() => {
                                  setActiveMenuMemberId(null);
                                  setProfileMember(member);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-on-surface hover:bg-surface-container-highest flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[17px] text-primary">account_circle</span>
                                <span>Xem hồ sơ</span>
                              </button>

                              {/* Option 2: Phân quyền (Dành cho Admin) */}
                              {myRole === "ADMIN" && !isSelf && (
                                <button
                                  onClick={() => {
                                    setActiveMenuMemberId(null);
                                    setRoleForm({ role: member.role || "MEMBER" });
                                    setModalData({ userId: memberUserId });
                                    setModal("editRole");
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs text-on-surface hover:bg-surface-container-highest flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[17px] text-amber-400">tune</span>
                                  <span>Phân quyền</span>
                                </button>
                              )}

                              {/* Option 3: Nâng cấp lên Manager (Manager đối với Member) */}
                              {myRole === "MANAGER" && member.role === "MEMBER" && !isSelf && (
                                <button
                                  onClick={() => {
                                    setActiveMenuMemberId(null);
                                    setRoleForm({ role: "MANAGER" });
                                    setModalData({ userId: memberUserId });
                                    setModal("editRole");
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs text-on-surface hover:bg-surface-container-highest flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[17px] text-blue-400">arrow_upward</span>
                                  <span>Nâng Manager</span>
                                </button>
                              )}

                              {/* Option 4: Xóa khỏi dự án (Dành cho Admin) */}
                              {myRole === "ADMIN" && !isSelf && (
                                <button
                                  onClick={() => {
                                    setActiveMenuMemberId(null);
                                    setModalData({ userId: memberUserId, username: member.username });
                                    setModal("confirmKick");
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs text-error hover:bg-error/10 flex items-center gap-2.5 transition-colors border-t border-outline-variant/10 mt-1 pt-2 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[17px]">person_remove</span>
                                  <span>Xóa khỏi dự án</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-14 text-center text-on-surface-variant">
                      <div className="flex flex-col items-center justify-center gap-2 opacity-60">
                        <span className="material-symbols-outlined text-[44px]">search_off</span>
                        <p className="text-sm font-medium">Không tìm thấy thành viên nào phù hợp</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === "invite" && (
        <InviteMemberModal
          searchQuery={searchMemberQuery}
          setSearchQuery={setSearchMemberQuery}
          searchResults={searchMemberResults}
          searchLoading={searchMemberLoading}
          onAdd={handleInviteMember}
          onClose={() => {
            setModal(null);
            setSearchMemberQuery("");
            setSearchMemberResults([]);
          }}
          formError={formError}
          invitedUserIds={invitedUserIds}
        />
      )}

      {modal === "editRole" && (
        <EditRoleModal
          roleForm={roleForm}
          setRoleForm={setRoleForm}
          onSubmit={handleUpdateRole}
          onClose={() => setModal(null)}
          formError={formError}
        />
      )}

      {modal === "confirmKick" && (
        <ConfirmModal
          title="Kick thành viên"
          message={`Bạn có chắc chắn muốn xóa "${modalData.username || "thành viên này"}" khỏi project?`}
          confirmLabel="Xóa khỏi dự án"
          onConfirm={() => {
            setModal(null);
            handleRemoveMember(modalData.userId);
          }}
          onClose={() => setModal(null)}
        />
      )}

      <MemberProfileModal
        isOpen={!!profileMember}
        onClose={() => setProfileMember(null)}
        member={profileMember}
        tasks={tasks}
        currentUser={currentUser}
      />
    </div>
  );
}

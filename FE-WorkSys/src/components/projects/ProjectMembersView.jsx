import { useState, useMemo, useRef, useEffect } from "react";

// Component Trang hiển thị và quản lý danh sách thành viên dự án
// Hỗ trợ tìm kiếm, lọc theo vai trò, và menu 3 chấm dọc (more_vert) cho từng thành viên:
// - Xem hồ sơ
// - Phân quyền (ADMIN / MANAGER)
// - Xóa khỏi dự án (ADMIN)
export default function ProjectMembersView({
  members = [],
  tasks = [],
  currentUser,
  myRole,
  onOpenInviteMember,
  onOpenEditRole,
  onOpenConfirmKick,
  onOpenProfile,
  onBackToTasks,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [activeMenuMemberId, setActiveMenuMemberId] = useState(null);
  const menuRef = useRef(null);

  // Đóng menu 3 chấm khi click ra ngoài
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuMemberId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Sắp xếp danh sách: Đưa user hiện tại lên đầu tiên
  const sortedMembers = useMemo(() => {
    if (!members || !currentUser) return members || [];
    const isSelf = (m) => (m.userId || m.id) === currentUser.id;
    const current = members.find(isSelf);
    const others = members.filter((m) => !isSelf(m));
    return current ? [current, ...others] : members;
  }, [members, currentUser]);

  // Lọc theo từ khóa tìm kiếm và vai trò
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

  // Đếm số task được giao cho một member trong dự án
  const getMemberTaskCount = (userId) => {
    return tasks.filter((t) => t.assignees?.some((u) => u.id === userId)).length;
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full px-container-margin overflow-y-auto custom-scrollbar pb-10">
      {/* Header thanh điều hướng & Thao tác */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToTasks}
            className="h-9 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg flex items-center gap-1.5 text-xs font-medium border border-outline-variant/20 transition-colors cursor-pointer"
            title="Quay lại Bảng công việc Kanban"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Bảng công việc</span>
          </button>
          <div className="h-4 w-px bg-outline-variant/20 hidden sm:block"></div>
          <div>
            <h2 className="font-display text-xl font-bold text-on-background flex items-center gap-2 m-0">
              <span>Thành viên dự án</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                {members.length}
              </span>
            </h2>
            <p className="text-on-surface-variant text-xs mt-0.5">
              Quản lý vai trò, quyền hạn và công việc của các thành viên trong dự án
            </p>
          </div>
        </div>

        {/* Nút Mời thành viên mới (chỉ Admin/Manager) */}
        {(myRole === "ADMIN" || myRole === "MANAGER") && (
          <button
            onClick={onOpenInviteMember}
            className="h-9 px-4 bg-primary text-on-primary font-label-md text-label-md rounded-lg flex items-center gap-2 hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors shadow-sm shadow-primary/20 shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Mời thành viên</span>
          </button>
        )}
      </div>

      {/* Thanh tìm kiếm & Bộ lọc */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-4 shrink-0">
        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-9 pr-4 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-all placeholder:text-on-surface-variant/50"
          />
        </div>

        {/* Bộ lọc vai trò */}
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === tab.key
                  ? "bg-primary text-on-primary shadow-sm"
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
                <th className="py-3 px-4 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                  Thành viên
                </th>
                <th className="py-3 px-4 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="py-3 px-4 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                  Nhiệm vụ được giao
                </th>
                <th className="py-3 px-4 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider text-right">
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
                    {/* Cột 1: Thông tin thành viên */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold overflow-hidden shrink-0 shadow-sm ring-1 ring-outline-variant/20 ${
                            isSelf ? "border-2 border-yellow-400" : ""
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
                          <span className="text-on-surface-variant text-xs truncate">{member.email || "Chưa có email"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Vai trò */}
                    <td className="py-3.5 px-4">
                      {member.role === "ADMIN" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[14px]">shield_person</span>
                          ADMIN
                        </span>
                      )}
                      {member.role === "MANAGER" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[14px]">manage_accounts</span>
                          MANAGER
                        </span>
                      )}
                      {member.role === "MEMBER" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 text-xs font-medium rounded-full uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          MEMBER
                        </span>
                      )}
                    </td>

                    {/* Cột 3: Số task được giao */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-lg text-xs font-medium text-on-surface border border-outline-variant/10">
                        <span className="material-symbols-outlined text-[15px] text-primary">task_alt</span>
                        {taskCount} nhiệm vụ
                      </span>
                    </td>

                    {/* Cột 4: Nút Option 3 chấm dọc (more_vert) */}
                    <td className="py-3.5 px-4 text-right relative">
                      <div className="inline-block relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuMemberId(isMenuOpen ? null : memberUserId);
                          }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                            isMenuOpen
                              ? "bg-surface-container-highest text-primary"
                              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                          }`}
                          title="Tùy chọn thao tác"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>

                        {/* Dropdown Menu nổi */}
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 mt-1 w-48 bg-surface-container-high rounded-xl shadow-2xl border border-outline-variant/20 py-1.5 z-30 flex flex-col animate-in fade-in zoom-in-95 duration-150"
                          >
                            {/* Option 1: Xem hồ sơ */}
                            <button
                              onClick={() => {
                                setActiveMenuMemberId(null);
                                onOpenProfile(member);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-highest flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px] text-primary">account_circle</span>
                              <span>Xem hồ sơ</span>
                            </button>

                            {/* Option 2: Phân quyền (Dành cho Admin) */}
                            {myRole === "ADMIN" && !isSelf && (
                              <button
                                onClick={() => {
                                  setActiveMenuMemberId(null);
                                  onOpenEditRole(memberUserId, member.role || "MEMBER");
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-highest flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-amber-400">tune</span>
                                <span>Phân quyền</span>
                              </button>
                            )}

                            {/* Option 3: Nâng cấp lên Manager (Dành cho Manager đối với Member) */}
                            {myRole === "MANAGER" && member.role === "MEMBER" && !isSelf && (
                              <button
                                onClick={() => {
                                  setActiveMenuMemberId(null);
                                  onOpenEditRole(memberUserId, "MANAGER");
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-highest flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-blue-400">arrow_upward</span>
                                <span>Nâng Manager</span>
                              </button>
                            )}

                            {/* Option 4: Xóa khỏi dự án (Dành cho Admin) */}
                            {myRole === "ADMIN" && !isSelf && (
                              <button
                                onClick={() => {
                                  setActiveMenuMemberId(null);
                                  onOpenConfirmKick(memberUserId, member.username);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs text-error hover:bg-error/10 flex items-center gap-2.5 transition-colors border-t border-outline-variant/10 mt-1 pt-1.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">person_remove</span>
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
                  <td colSpan={4} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2 opacity-60">
                      <span className="material-symbols-outlined text-[40px]">search_off</span>
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
  );
}

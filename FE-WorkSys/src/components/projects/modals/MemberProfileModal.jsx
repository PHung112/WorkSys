import { useMemo } from "react";

// Modal hiển thị thông tin hồ sơ chi tiết của thành viên trong dự án
// kèm theo thống kê nhiệm vụ được giao trong dự án này.
export default function MemberProfileModal({ isOpen, onClose, member, tasks = [], currentUser }) {
  if (!isOpen || !member) return null;

  const memberUserId = member.userId || member.id;
  const isSelf = memberUserId === currentUser?.id;

  // Tính toán thống kê công việc của thành viên trong dự án hiện tại
  const stats = useMemo(() => {
    const memberTasks = tasks.filter((t) =>
      t.assignees?.some((u) => u.id === memberUserId)
    );
    const todo = memberTasks.filter((t) => t.status === "TODO").length;
    const inProgress = memberTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const submitted = memberTasks.filter((t) => t.status === "SUBMITTED").length;
    const done = memberTasks.filter((t) => t.status === "DONE").length;

    return {
      total: memberTasks.length,
      todo,
      inProgress,
      submitted,
      done,
      recentTasks: memberTasks.slice(0, 5),
    };
  }, [tasks, memberUserId]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-high shadow-2xl rounded-2xl w-full max-w-md flex flex-col border border-outline-variant/20 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-highest shrink-0">
          <h3 className="font-display text-base font-bold text-on-surface flex items-center gap-2 m-0">
            <span className="material-symbols-outlined text-[20px] text-primary">account_circle</span>
            Hồ sơ thành viên
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Nội dung hồ sơ */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
          {/* Avatar & Thông tin cơ bản */}
          <div className="flex items-center gap-4 p-4 bg-surface-container rounded-xl border border-outline-variant/10">
            <div
              className={`w-16 h-16 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center text-2xl font-bold overflow-hidden shrink-0 shadow-inner ring-1 ring-outline-variant/20 ${
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-on-surface font-bold text-lg truncate">{member.username}</span>
                {isSelf && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                    Bạn
                  </span>
                )}
              </div>
              <span className="text-on-surface-variant text-xs truncate mt-0.5">{member.email || "Chưa có email"}</span>

              {/* Vai trò */}
              <div className="mt-2">
                {member.role === "ADMIN" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold rounded-full uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[13px]">shield_person</span>
                    ADMIN (Quản trị viên)
                  </span>
                )}
                {member.role === "MANAGER" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold rounded-full uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[13px]">manage_accounts</span>
                    MANAGER (Quản lý)
                  </span>
                )}
                {member.role === "MEMBER" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 text-[11px] font-medium rounded-full uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[13px]">person</span>
                    MEMBER (Thành viên)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Thống kê nhiệm vụ */}
          <div>
            <h4 className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider mb-2">
              Nhiệm vụ trong dự án ({stats.total})
            </h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/10 text-center">
                <span className="text-xs text-on-surface-variant block mb-1">Cần làm</span>
                <span className="font-bold text-base text-on-surface">{stats.todo}</span>
              </div>
              <div className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/10 text-center">
                <span className="text-xs text-primary block mb-1">Đang làm</span>
                <span className="font-bold text-base text-primary">{stats.inProgress}</span>
              </div>
              <div className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/10 text-center">
                <span className="text-xs text-tertiary block mb-1">Đã nộp</span>
                <span className="font-bold text-base text-tertiary">{stats.submitted}</span>
              </div>
              <div className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/10 text-center">
                <span className="text-xs text-green-400 block mb-1">Hoàn tất</span>
                <span className="font-bold text-base text-green-400">{stats.done}</span>
              </div>
            </div>
          </div>

          {/* Danh sách nhiệm vụ gần đây */}
          {stats.recentTasks.length > 0 && (
            <div>
              <h4 className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider mb-2">
                Các nhiệm vụ gần đây
              </h4>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                {stats.recentTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/10 flex items-center justify-between text-xs"
                  >
                    <span className="text-on-surface font-medium truncate max-w-[240px]">{t.title}</span>
                    <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-semibold text-on-surface-variant uppercase">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-container-highest flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

import { useRef } from "react";

/**
 * Header dự án: Logo, tên, github link, mô tả, danh sách avatar thành viên,
 * các nút hành động (Tạo nhiệm vụ, GitHub, Menu tùy chọn dự án)
 * và Thanh tab chuyển đổi các Sub-views (Kanban, Members, Analytics, Archive, AI...)
 */
export default function ProjectDetailHeader({
  selectedProject,
  members,
  archivedTasks,
  currentUser,
  myRole,
  activeView,
  setActiveView,
  isMenuOpen,
  setIsMenuOpen,
  menuRef,
  onOpenCreateTask,
  onOpenEditProject,
  onOpenDeleteProject,
  onOpenLeave,
  onOpenTransfer,
}) {
  return (
    <>
      {/* Top Banner Header */}
      <div className="px-container-margin py-stack-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md shrink-0">
        <div className="flex items-start gap-stack-md max-w-2xl">
          <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container shrink-0 mt-1 shadow-inner">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              rocket_launch
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <h1 className="font-display text-3xl font-bold text-on-background m-0 tracking-tight">
                {selectedProject?.name}
              </h1>
              <span className="px-2 py-1 bg-surface-container-high rounded-full font-label-xs text-label-xs text-on-surface-variant tracking-widest uppercase border border-outline-variant/10">
                Đang hoạt động
              </span>
              {selectedProject?.githubRepo && (
                <a
                  href={`https://github.com/${selectedProject.githubRepo.replace(
                    /^https?:\/\/github\.com\//,
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-container hover:bg-surface-container-high rounded-full text-xs font-mono text-primary border border-primary/20 hover:border-primary/50 transition-colors"
                  title="Mở repository trên GitHub"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
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
          {/* Nhóm avatar thành viên */}
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
                  className={`w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs text-on-surface ring-2 ring-background overflow-hidden z-${
                    30 - i * 10
                  } ${isSelf ? "border border-yellow-400/90 shadow-sm" : ""}`}
                >
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.username} className="w-full h-full object-cover" />
                  ) : (
                    m.username?.charAt(0).toUpperCase()
                  )}
                </div>
              );
            })}
            {members.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-xs text-on-surface-variant ring-2 ring-background z-0">
                +{members.length - 3}
              </div>
            )}
          </div>

          {/* Nút Tạo nhiệm vụ */}
          {(myRole === "ADMIN" || myRole === "MANAGER") && (
            <button
              onClick={onOpenCreateTask}
              className="btn-primary flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Tạo nhiệm vụ</span>
            </button>
          )}

          {/* Menu tùy chọn dự án */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-xl transition cursor-pointer"
              title="Tùy chọn dự án"
            >
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-xl py-1 z-30 flex flex-col animate-in fade-in zoom-in-95 duration-150">
                {myRole === "ADMIN" && (
                  <>
                    <button
                      onClick={() => {
                        onOpenEditProject();
                        setIsMenuOpen(false);
                      }}
                      className="text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Sửa dự án
                    </button>
                    <button
                      onClick={() => {
                        onOpenTransfer();
                        setIsMenuOpen(false);
                      }}
                      className="text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                      Chuyển quyền Admin
                    </button>
                    <button
                      onClick={() => {
                        onOpenDeleteProject();
                        setIsMenuOpen(false);
                      }}
                      className="text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors border-t border-outline-variant/10 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Xóa dự án
                    </button>
                  </>
                )}
                {(myRole === "MANAGER" || myRole === "MEMBER") && (
                  <button
                    onClick={() => {
                      onOpenLeave();
                      setIsMenuOpen(false);
                    }}
                    className="text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors border-t border-outline-variant/10 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">exit_to_app</span>
                    Thoát dự án
                  </button>
                )}
              </div>
            )}
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
    </>
  );
}

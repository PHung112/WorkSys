import { useState } from "react";

// Sidebar dự án — hiển thị danh sách project, nút tạo mới.
// Nhận prop `isOpen` và `onToggle` để ẩn/hiện sidebar với animation trượt.
export default function ProjectSidebar({ projects, selectedProject, onSelect, showMyTasks, onShowMyTasks, onCreateClick, currentUser, onLogout, isOpen, onToggle }) {
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  return (
    <>
      {/* Sidebar chính — trượt sang trái khi ẩn */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-surface-container-low border-r border-outline-variant/10 z-40 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Nút ẨN/HIỆN sidebar - gắn bên ngoài lề phải */}
        <button
          onClick={onToggle}
          title={isOpen ? "Ẩn sidebar" : "Hiện sidebar"}
          className="absolute -right-5 top-1/2 -translate-y-1/2 z-50 bg-surface-container-low hover:bg-surface-container-highest text-on-surface-variant hover:text-primary border border-l-0 border-outline-variant/20 rounded-r-xl w-5 h-16 flex items-center justify-center shadow-sm transition-all cursor-pointer group"
        >
          <span className="material-symbols-outlined !text-[16px]">
            {isOpen ? "chevron_left" : "chevron_right"}
          </span>
        </button>

        <div className="px-2 mt-4 flex flex-col gap-1 flex-1 overflow-hidden">
          <button
            onClick={() => setIsProjectListOpen(!isProjectListOpen)}
            className={`flex-none flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-all ${isProjectListOpen
              ? "bg-primary/10 text-primary font-semibold"
              : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface font-medium"
              }`}
          >
            <div className="flex items-center">
              <span className="material-symbols-outlined mr-3 text-[20px]">
                folder_open
              </span>
              <span className="font-label-md text-label-md">Danh sách dự án</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border border-outline-variant/10 ${isProjectListOpen ? "bg-primary/20 text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
                {projects.length}
              </span>
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isProjectListOpen ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </div>
          </button>

          {/* Danh sách project (Droplist) chèn VÀO GIỮA 2 menu */}
          <div className={`flex flex-col transition-all duration-300 ease-in-out ${isProjectListOpen ? "shrink opacity-100 min-h-0" : "max-h-0 opacity-0 flex-none overflow-hidden"}`}>
            <nav className="flex flex-col gap-base px-2 overflow-y-auto custom-scrollbar">
              {projects.map((p) => {
                const isActive = selectedProject?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelect(p);
                    }}
                    className={`flex flex-col items-start px-4 py-2 rounded-lg transition-all ${isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface border-l-2 border-transparent"
                      }`}
                  >
                    <div className="flex items-center w-full">
                      <span className="font-label-md text-label-md truncate">{p.name}</span>
                    </div>
                    {isActive && p.description && (
                      <span className="text-label-xs font-label-xs opacity-70 truncate w-full mt-1 text-left">
                        {p.description}
                      </span>
                    )}
                  </button>
                );
              })}
              {projects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <span className="material-symbols-outlined text-[24px] text-on-surface-variant mb-2">inbox</span>
                  <p className="text-center text-on-surface-variant text-label-xs">Chưa có dự án nào</p>
                </div>
              )}
            </nav>
          </div>

          <button
            onClick={() => {
              onShowMyTasks();
              setIsProjectListOpen(false); // Đóng danh sách dự án nếu đang mở
            }}
            className={`flex-none flex items-center w-full px-4 py-2.5 rounded-lg transition-all ${showMyTasks
              ? "bg-primary/10 text-primary font-semibold"
              : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface font-medium"
              }`}
          >
            <span className="material-symbols-outlined mr-3 text-[20px]">
              task_alt
            </span>
            <span className="font-label-md text-label-md">Nhiệm vụ của tôi</span>
          </button>
        </div>

        {/* Footer: nút tạo project mới */}
        <div className="p-2 flex flex-col gap-base border-t border-outline-variant/10 mt-auto">
          <button
            onClick={onCreateClick}
            className="flex items-center px-4 py-2 rounded-lg text-primary hover:bg-primary/10 transition-all font-label-md text-label-md mb-2"
          >
            <span className="material-symbols-outlined mr-3">add_circle</span>
            Tạo dự án mới
          </button>
        </div>
      </aside>

    </>
  );
}

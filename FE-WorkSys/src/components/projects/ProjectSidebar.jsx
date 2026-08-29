// Sidebar dự án — hiển thị danh sách project, nút tạo mới.
// Nhận prop `isOpen` và `onToggle` để ẩn/hiện sidebar với animation trượt.
export default function ProjectSidebar({ projects, selectedProject, onSelect, onCreateClick, currentUser, onLogout, isOpen, onToggle }) {
  return (
    <>
      {/* Sidebar chính — trượt sang trái khi ẩn */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-surface-container-low border-r border-outline-variant/10 z-40 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header: tiêu đề + nút đóng sidebar */}
        <div className="px-4 my-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Danh sách dự án
            </span>
            <span className="px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant font-label-xs text-label-xs border border-outline-variant/10">
              {projects.length}
            </span>
          </div>

          {/* Nút đóng sidebar (dấu <) */}
          <button
            onClick={onToggle}
            title="Ẩn sidebar"
            className="p-1.5 flex rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
        </div>

        {/* Danh sách project, có scroll nếu quá dài */}
        <nav className="flex-1 flex flex-col gap-base px-2 overflow-y-auto custom-scrollbar pb-4">
          {projects.map((p) => {
            const isActive = selectedProject?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={`flex flex-col items-start px-4 py-2 rounded-lg transition-all ${isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface border-l-2 border-transparent"
                  }`}
              >
                <div className="flex items-center w-full">
                  <span className="material-symbols-outlined mr-3 text-[20px]">
                    {isActive ? "folder_open" : "folder"}
                  </span>
                  <span className="font-label-md text-label-md truncate">{p.name}</span>
                </div>
                {isActive && p.description && (
                  <span className="text-label-xs font-label-xs opacity-70 truncate w-full pl-8 mt-1 text-left">
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

        {/* Footer: nút tạo project mới */}
        <div className="p-2 flex flex-col gap-base border-t border-outline-variant/10">
          <button
            onClick={onCreateClick}
            className="flex items-center px-4 py-2 rounded-lg text-primary hover:bg-primary/10 transition-all font-label-md text-label-md mb-2"
          >
            <span className="material-symbols-outlined mr-3">add_circle</span>
            Tạo dự án mới
          </button>
        </div>
      </aside>

      {/* Nút mở sidebar (dấu >) — chỉ hiện khi sidebar đang đóng, nằm ngang hàng header dự án */}
      {!isOpen && (
        <button
          onClick={onToggle}
          title="Hiện sidebar"
          className="fixed left-0 top-80 z-50 bg-surface-container-low hover:bg-surface-container-highest text-on-surface-variant hover:text-primary border border-outline-variant/20 rounded-r-xl px-0.5 py-4 shadow-sm transition-all cursor-pointer group"
        >
          <span className="material-symbols-outlined !text-[16px]">
            chevron_right
          </span>
        </button>
      )}
    </>
  );
}

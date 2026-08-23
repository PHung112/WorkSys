// Sidebar dự án — hiển thị danh sách project, nút tạo mới, và thông tin user ở cuối.
// Được định vị fixed bắt đầu từ top-16 (ngay dưới navbar h-16) để không đè lên navbar.
export default function ProjectSidebar({ projects, selectedProject, onSelect, onCreateClick, currentUser, onLogout }) {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-surface-container-low border-r border-outline-variant/10 z-40 flex flex-col">
      {/* Tiêu đề danh sách + đếm số project */}
      <div className="px-stack-md  my-stack-md flex items-center justify-between">
        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Danh sách dự án</span>
        <span className="px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant font-label-xs text-label-xs border border-outline-variant/10">
          {projects.length}
        </span>
      </div>

      {/* Danh sách project, có scroll nếu quá dài */}
      <nav className="flex-1 flex flex-col gap-base px-stack-sm overflow-y-auto custom-scrollbar pb-4">
        {projects.map((p) => {
          const isActive = selectedProject?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`flex flex-col items-start px-stack-md py-stack-sm rounded-lg transition-all ${isActive
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
      <div className="p-stack-sm flex flex-col gap-base border-t border-outline-variant/10">
        <button
          onClick={onCreateClick}
          className="flex items-center px-stack-md py-stack-sm rounded-lg text-primary hover:bg-primary/10 transition-all font-label-md text-label-md mb-2"
        >
          <span className="material-symbols-outlined mr-3">add_circle</span>
          Tạo dự án mới
        </button>
      </div>
    </aside>
  );
}

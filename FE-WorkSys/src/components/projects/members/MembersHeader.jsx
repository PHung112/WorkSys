/**
 * Header thanh điều hướng & Thao tác của trang Quản lý thành viên
 */
export default function MembersHeader({
  project,
  membersCount,
  canInvite,
  onBack,
  onOpenInvite,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
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
            <span className="text-primary font-bold text-sm tracking-wide">
              {project?.name || "Chi tiết dự án"}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-on-background flex items-center gap-2.5 mt-0.5">
            <span>Danh sách thành viên</span>
            <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
              {membersCount}
            </span>
          </h1>
        </div>
      </div>

      {/* Action: Mời thành viên */}
      {canInvite && (
        <button
          onClick={onOpenInvite}
          className="h-10 px-4 bg-primary text-on-primary font-label-md text-label-md rounded-xl flex items-center gap-2 hover:bg-primary-fixed hover:text-on-primary-fixed transition-all shadow-md shadow-primary/20 shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Mời thành viên</span>
        </button>
      )}
    </div>
  );
}

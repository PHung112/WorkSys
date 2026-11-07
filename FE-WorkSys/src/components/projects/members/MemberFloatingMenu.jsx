/**
 * Floating Action Dropdown Menu nổi cho thành viên
 * Tự động tính toán vị trí hiển thị (Dropdown / Dropup) và chiều cao (maxHeight)
 */
export default function MemberFloatingMenu({
  menuRef,
  activeMember,
  menuCoords,
  myRole,
  currentUser,
  onViewProfile,
  onEditRole,
  onPromoteManager,
  onKickMember,
  onClose,
}) {
  if (!activeMember || !menuCoords) return null;

  const targetId = activeMember.userId || activeMember.id;
  const isSelf = targetId === currentUser?.id;
  const targetRole = activeMember.role || "MEMBER";
  const targetName = activeMember.username;

  return (
    <div
      ref={menuRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: menuCoords.top !== undefined ? `${menuCoords.top}px` : undefined,
        bottom: menuCoords.bottom !== undefined ? `${menuCoords.bottom}px` : undefined,
        right: `${menuCoords.right}px`,
        maxHeight: `${menuCoords.maxHeight}px`,
      }}
      className={`w-48 bg-surface-container-high rounded-xl shadow-2xl border border-outline-variant/20 py-1.5 z-[90] flex flex-col overflow-y-auto custom-scrollbar ${
        menuCoords.isUp
          ? "animate-in fade-in slide-in-from-bottom-2 duration-150 origin-bottom-right"
          : "animate-in fade-in slide-in-from-top-2 duration-150 origin-top-right"
      }`}
    >
      {/* Option 1: Xem hồ sơ */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
          onViewProfile(activeMember);
        }}
        className="w-full text-left px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-highest flex items-center gap-2.5 transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px] text-primary">account_circle</span>
        <span>Xem hồ sơ</span>
      </button>

      {/* Option 2: Phân quyền (Dành cho Admin) */}
      {myRole === "ADMIN" && !isSelf && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
            onEditRole(targetId, targetRole);
          }}
          className="w-full text-left px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-highest flex items-center gap-2.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-amber-400">tune</span>
          <span>Phân quyền</span>
        </button>
      )}

      {/* Option 3: Nâng cấp lên Manager (Manager đối với Member) */}
      {myRole === "MANAGER" && targetRole === "MEMBER" && !isSelf && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
            onPromoteManager(targetId);
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
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
            onKickMember(targetId, targetName);
          }}
          className="w-full text-left px-3.5 py-2 text-xs text-error hover:bg-error/10 flex items-center gap-2.5 transition-colors border-t border-outline-variant/10 mt-1 pt-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">person_remove</span>
          <span>Xóa khỏi dự án</span>
        </button>
      )}
    </div>
  );
}

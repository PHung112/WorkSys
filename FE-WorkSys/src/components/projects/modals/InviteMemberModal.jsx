import Modal from "../../common/Modal";
import UserSearchRow from "../../common/UserSearchRow";
import { inputCls, labelCls } from "../../common/formStyles";

export default function InviteMemberModal({
  searchQuery, setSearchQuery, searchResults, searchLoading,
  onAdd, onClose, formError, invitedUserIds = [],
}) {
  return (
    <Modal
      title="Mời thành viên"
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Tìm kiếm theo email</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập email người dùng..."
              className={`${inputCls} pl-10`}
              autoFocus
              type="email"
            />
            {searchLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs animate-pulse">
                Đang tìm...
              </span>
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1.5 opacity-60">Chỉ hiển thị người dùng chưa ở trong dự án</p>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high border border-outline-variant/10 hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm ring-1 ring-primary/30 shrink-0">
                    {u.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-on-surface text-sm">{u.username}</span>
                    <span className="text-xs text-on-surface-variant opacity-70">{u.email}</span>
                  </div>
                </div>
                {invitedUserIds.includes(u.id) ? (
                  <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-green-400 bg-green-400/10 border border-green-400/20 font-medium">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Đã mời
                  </span>
                ) : (
                  <button
                    onClick={() => onAdd(u.id, "MEMBER")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-[14px]">person_add</span>
                    Mời
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {searchQuery.trim() && !searchLoading && searchResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant opacity-40 mb-2">person_search</span>
            <p className="text-on-surface-variant text-sm opacity-60">Không tìm thấy người dùng nào với email này</p>
          </div>
        )}
        {!searchQuery.trim() && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant opacity-30 mb-2">mail_search</span>
            <p className="text-on-surface-variant text-xs opacity-50">Gõ email để tìm thành viên</p>
          </div>
        )}
        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
            <span className="material-symbols-outlined text-[16px] text-error">error</span>
            <p className="text-error text-xs">{formError}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

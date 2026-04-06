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
          <label className={labelCls}>Tìm kiếm theo tên</label>
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên người dùng..."
              className={inputCls}
              autoFocus
            />
            {searchLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs animate-pulse">
                Đang tìm...
              </span>
            )}
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((u) => (
              <UserSearchRow 
                key={u.id} 
                user={u} 
                onAdd={onAdd}
                isInvited={invitedUserIds.includes(u.id)}
              />
            ))}
          </div>
        )}
        {searchQuery.trim() && !searchLoading && searchResults.length === 0 && (
          <p className="text-white/30 text-sm text-center py-3">Không tìm thấy người dùng nào</p>
        )}
        {!searchQuery.trim() && (
          <p className="text-white/20 text-xs text-center py-2">Gõ tên để tìm kiếm thành viên</p>
        )}
        {formError && <p className="text-red-400 text-xs">{formError}</p>}
      </div>
    </Modal>
  );
}

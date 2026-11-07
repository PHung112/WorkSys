/**
 * Bảng hiển thị danh sách thành viên dự án
 */
export default function MembersTable({
  members,
  currentUser,
  getMemberTaskCount,
  activeMenuMemberId,
  onToggleMenu,
}) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-[340px]">
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-outline-variant/15 bg-surface-container/50">
              <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                Thành viên
              </th>
              <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                Vai trò
              </th>
              <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                Nhiệm vụ được giao
              </th>
              <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider text-right">
                Tùy chọn
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {members.map((member) => {
              const memberUserId = member.userId || member.id;
              const isSelf = memberUserId === currentUser?.id;
              const taskCount = getMemberTaskCount(memberUserId);
              const isMenuOpen = activeMenuMemberId === memberUserId;

              return (
                <tr
                  key={memberUserId}
                  className="hover:bg-surface-container-high/40 transition-colors group"
                >
                  {/* Cột 1: Thông tin Avatar + Tên */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold overflow-hidden shrink-0 shadow-sm ring-1 ring-outline-variant/20 ${
                          isSelf ? "border-2 border-yellow-400 shadow-yellow-400/20" : ""
                        }`}
                      >
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          member.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface font-semibold text-sm truncate">
                            {member.username}
                          </span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                              Bạn
                            </span>
                          )}
                        </div>
                        <span className="text-on-surface-variant text-xs truncate mt-0.5">
                          {member.email || "Chưa có email"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Vai trò Badge */}
                  <td className="py-4 px-5">
                    {member.role === "ADMIN" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px]">shield_person</span>
                        ADMIN
                      </span>
                    )}
                    {member.role === "MANAGER" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px]">manage_accounts</span>
                        MANAGER
                      </span>
                    )}
                    {member.role === "MEMBER" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 text-xs font-medium rounded-full uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        MEMBER
                      </span>
                    )}
                  </td>

                  {/* Cột 3: Nhiệm vụ */}
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-xl text-xs font-medium text-on-surface border border-outline-variant/10">
                      <span className="material-symbols-outlined text-[16px] text-primary">task_alt</span>
                      {taskCount} nhiệm vụ
                    </span>
                  </td>

                  {/* Cột 4: Nút Option 3 chấm dọc */}
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={(e) => onToggleMenu(e, member)}
                      className={`w-9 h-9 rounded-xl inline-flex items-center justify-center transition-all cursor-pointer ${
                        isMenuOpen
                          ? "bg-surface-container-highest text-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                      }`}
                      title="Tùy chọn thao tác"
                    >
                      <span className="material-symbols-outlined text-[22px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              );
            })}

            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="py-14 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-60">
                    <span className="material-symbols-outlined text-[44px]">search_off</span>
                    <p className="text-sm font-medium">Không tìm thấy thành viên nào phù hợp</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

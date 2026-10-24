/**
 * Bảng hiển thị danh sách các task đã lưu trữ
 */
export default function ArchiveTasksTable({ filteredTasks }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-[340px]">
      <div className="overflow-x-auto flex-1 custom-scrollbar flex flex-col">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-outline-variant/15 bg-surface-container/50">
              <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                Tên Task
              </th>
              <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
                Người thực hiện
              </th>
              <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider w-48">
                Trạng thái
              </th>
              <th className="py-3.5 px-5 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider text-right w-48">
                Ngày lưu trữ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {filteredTasks.map((task) => (
              <tr
                key={task.id}
                className="hover:bg-surface-container-high/40 transition-colors group"
              >
                {/* Cột 1: Tên Task */}
                <td className="py-4 px-5">
                  <div className="flex flex-col">
                    <span className="text-on-surface font-semibold text-sm line-through opacity-80">
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-on-surface-variant text-xs truncate max-w-md mt-1 opacity-70">
                        {task.description}
                      </span>
                    )}
                  </div>
                </td>

                {/* Cột 2: Assignees */}
                <td className="py-4 px-5">
                  {task.assignees && task.assignees.length > 0 ? (
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {task.assignees.slice(0, 3).map((u, i) => (
                        <div
                          key={u.id}
                          title={u.username}
                          className={`inline-block w-7 h-7 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center border-2 border-background z-${
                            30 - i * 10
                          } overflow-hidden shrink-0`}
                        >
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            u.username?.charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                      {task.assignees.length > 3 && (
                        <div className="inline-block w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold flex items-center justify-center border-2 border-background z-0 shrink-0">
                          +{task.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-on-surface-variant text-xs italic">
                      Không có người nhận
                    </span>
                  )}
                </td>

                {/* Cột 3: Trạng thái */}
                <td className="py-4 px-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 text-[11px] font-bold rounded-full uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[14px]">done_all</span>
                    {task.status || "DONE"}
                  </span>
                </td>

                {/* Cột 4: Ngày lưu trữ */}
                <td className="py-4 px-5 text-right text-xs text-on-surface-variant whitespace-nowrap">
                  {task.archivedAt ? (
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-on-surface">
                        {new Date(task.archivedAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-[10px] opacity-70">
                        {new Date(task.archivedAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-on-surface-variant opacity-60 min-h-[300px]">
            <span className="material-symbols-outlined text-[44px] mb-2">inventory_2</span>
            <p className="text-sm font-medium text-on-surface">Kho lưu trữ trống</p>
            <p className="text-xs mt-1 text-center">Không có task nào khớp với điều kiện tìm kiếm.</p>
          </div>
        )}
      </div>
    </div>
  );
}

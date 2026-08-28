import React, { useState, useEffect } from 'react';
import adminApi from '../../api/adminApi';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTasks = () => {
    adminApi.getTasks({ page, size: 10 })
      .then(res => {
        setTasks(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchTasks();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-on-surface">Tổng quan Công việc</h2>
      </div>

      <div className="bg-surface border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-on-surface-variant">
            <thead className="bg-surface-container-lowest text-on-surface font-semibold border-b border-outline-variant/20">
              <tr>
                <th className="px-6 py-4">Công việc</th>
                <th className="px-6 py-4">Dự án</th>
                <th className="px-6 py-4">Người thực hiện</th>
                <th className="px-6 py-4">Hạn chót</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-on-surface truncate w-48" title={task.title}>{task.title}</p>
                  </td>
                  <td className="px-6 py-4 truncate w-40" title={task.projectName}>{task.projectName}</td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {task.assignees.slice(0, 3).map(user => (
                        <div key={user.id} className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary border border-surface" title={user.username}>
                          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : user.username[0].toUpperCase()}
                        </div>
                      ))}
                      {task.assignees.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-medium border border-surface">
                          +{task.assignees.length - 3}
                        </div>
                      )}
                      {task.assignees.length === 0 && <span className="text-xs text-on-surface-variant">Chưa giao</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">{task.deadline || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={task.status} />
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant">Không có công việc nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

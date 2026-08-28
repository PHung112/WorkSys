import React, { useState, useEffect } from 'react';
import adminApi from '../../api/adminApi';
import Pagination from '../../components/common/Pagination';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'lock'|'delete', project }

  const fetchProjects = () => {
    const params = { page, size: 10 };
    if (search) params.keyword = search;
    adminApi.getProjects(params)
      .then(res => {
        setProjects(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProjects();
  }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(keyword);
    setPage(0);
  };

  const handleConfirm = async () => {
    if (!confirmModal) return;
    const { type, project } = confirmModal;
    try {
      if (type === 'lock') {
        await adminApi.updateProjectArchived(project.id, !project.archived);
      } else if (type === 'delete') {
        await adminApi.deleteProject(project.id);
      }
      setConfirmModal(null);
      fetchProjects();
    } catch (err) {
      alert('Lỗi khi thực hiện hành động: ' + (err?.response?.data?.message || err.message));
      setConfirmModal(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-on-surface">Quản lý Dự Án</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm dự án..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="px-4 py-2 bg-surface border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary"
          />
          <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90">
            Tìm kiếm
          </button>
        </form>
      </div>

      <div className="bg-surface border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-on-surface-variant">
            <thead className="bg-surface-container-lowest text-on-surface font-semibold border-b border-outline-variant/20">
              <tr>
                <th className="px-6 py-4">Dự án</th>
                <th className="px-6 py-4">Chủ sở hữu</th>
                <th className="px-6 py-4 text-center">Thành viên</th>
                <th className="px-6 py-4 text-center">Công việc</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-on-surface">{project.name}</p>
                    <p className="text-xs text-on-surface-variant truncate w-48">{project.description}</p>
                  </td>
                  <td className="px-6 py-4">{project.adminName}</td>
                  <td className="px-6 py-4 text-center font-medium">{project.memberCount}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-on-surface">{project.completedTasks} / {project.totalTasks}</span>
                      <div className="w-16 h-1.5 bg-surface-container-high rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${project.progress}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {project.archived ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-500">Đã khóa</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500">Hoạt động</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setConfirmModal({ type: 'lock', project })}
                        className={`text-sm px-3 py-1 rounded-lg border ${
                          project.archived
                          ? 'border-primary text-primary hover:bg-primary/10'
                          : 'border-orange-500 text-orange-500 hover:bg-orange-500/10'
                        } transition-colors`}
                      >
                        {project.archived ? 'Mở khóa' : 'Khóa'}
                      </button>
                      <button
                        onClick={() => setConfirmModal({ type: 'delete', project })}
                        className="text-sm px-3 py-1 rounded-lg border border-error text-error hover:bg-error/10 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-on-surface-variant">Không tìm thấy dự án nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-outline-variant/20">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                confirmModal.type === 'delete' ? 'bg-error/10' : 'bg-orange-500/10'
              }`}>
                <span className={`material-symbols-outlined text-[20px] ${
                  confirmModal.type === 'delete' ? 'text-error' : 'text-orange-500'
                }`}>
                  {confirmModal.type === 'delete' ? 'delete' : confirmModal.project.archived ? 'lock_open' : 'lock'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface">
                  {confirmModal.type === 'delete'
                    ? 'Xóa dự án'
                    : confirmModal.project.archived ? 'Mở khóa dự án' : 'Khóa dự án'}
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  {confirmModal.type === 'delete'
                    ? <>Bạn có chắc muốn xóa dự án <strong>"{confirmModal.project.name}"</strong>? Hành động này không thể hoàn tác và chủ sở hữu sẽ nhận được thông báo.</>
                    : confirmModal.project.archived
                      ? <>Bạn có muốn mở khóa dự án <strong>"{confirmModal.project.name}"</strong>? Chủ sở hữu sẽ nhận được thông báo.</>
                      : <>Bạn có muốn khóa dự án <strong>"{confirmModal.project.name}"</strong>? Chủ sở hữu sẽ nhận được thông báo.</>
                  }
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-sm rounded-xl border border-outline-variant/30 text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm rounded-xl font-semibold text-white transition-colors ${
                  confirmModal.type === 'delete' ? 'bg-error hover:bg-error/90' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

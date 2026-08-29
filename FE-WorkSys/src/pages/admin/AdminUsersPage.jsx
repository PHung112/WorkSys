import React, { useState, useEffect } from 'react';
import adminApi from '../../api/adminApi';
import Pagination from '../../components/common/Pagination';
import AdminStatusBadge from '../../components/common/AdminStatusBadge';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    const params = { page, size: 10 };
    if (search) params.keyword = search;
    adminApi.getUsers(params)
      .then(res => {
        setUsers(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(keyword);
    setPage(0);
  };

  const handleAction = async (id, actionType, value) => {
    try {
      if (actionType === 'status') {
        await adminApi.updateUserStatus(id, value);
      } else if (actionType === 'role') {
        await adminApi.updateUserRole(id, value);
      }
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi thực hiện hành động');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-on-surface">Quản lý Người Dùng</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm username/email..."
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
                <th className="px-6 py-4">Người dùng</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Dự án</th>
                <th className="px-6 py-4 text-center">Công việc</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">{user.username}</p>
                        <p className="text-xs text-on-surface-variant truncate w-40">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <AdminStatusBadge type="role" value={user.systemRole} />
                  </td>
                  <td className="px-6 py-4">
                    <AdminStatusBadge type="status" value={user.status} />
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{user.projectCount}</td>
                  <td className="px-6 py-4 text-center font-medium">{user.taskCount}</td>
                  <td className="px-6 py-4 text-right">
                    <select
                      className="text-sm bg-surface-container-high border border-outline-variant/30 rounded-lg px-2 py-1 outline-none cursor-pointer"
                      onChange={(e) => {
                        const [type, val] = e.target.value.split(':');
                        if(type && val) {
                          if (window.confirm(`Bạn có chắc chắn muốn thay đổi ${type} thành ${val} không?`)) {
                            handleAction(user.id, type, val);
                          }
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">Hành động...</option>
                      {user.status === 'ACTIVE' ? (
                        <option value="status:INACTIVE">Vô hiệu hóa</option>
                      ) : (
                        <option value="status:ACTIVE">Kích hoạt</option>
                      )}
                      {user.systemRole === 'USER' ? (
                        <option value="role:SYSTEM_ADMIN">Cấp quyền Admin</option>
                      ) : (
                        <option value="role:USER">Gỡ quyền Admin</option>
                      )}
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-on-surface-variant">Không tìm thấy người dùng nào.</td>
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

import React, { useState, useEffect } from 'react';
import adminApi from '../../api/adminApi';
import Pagination from '../../components/common/Pagination';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchLogs = () => {
    adminApi.getAuditLogs({ page, size: 20 })
      .then(res => {
        setLogs(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-on-surface">Nhật ký Hệ thống</h2>

      <div className="bg-surface border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-on-surface-variant">
            <thead className="bg-surface-container-lowest text-on-surface font-semibold border-b border-outline-variant/20">
              <tr>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Người thực hiện</th>
                <th className="px-6 py-4">Hành động</th>
                <th className="px-6 py-4">Loại đối tượng</th>
                <th className="px-6 py-4">Tên đối tượng</th>
                <th className="px-6 py-4">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest transition-colors font-mono text-[13px]">
                  <td className="px-6 py-3 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="px-6 py-3 font-medium text-primary">{log.actorName}</td>
                  <td className="px-6 py-3"><span className="px-2 py-1 bg-surface-container-high rounded text-on-surface">{log.action}</span></td>
                  <td className="px-6 py-3">{log.targetType}</td>
                  <td className="px-6 py-3">{log.targetLabel} <span className="text-outline-variant">(ID: {log.targetId})</span></td>
                  <td className="px-6 py-3 truncate max-w-xs" title={log.metadata}>{log.metadata || '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-on-surface-variant font-sans text-sm">Không có nhật ký nào.</td>
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

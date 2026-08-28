import React, { useState, useEffect } from 'react';
import adminApi from '../../api/adminApi';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse flex space-x-4"><div className="h-4 bg-outline-variant/30 rounded w-1/4"></div></div>;
  }

  const statCards = [
    { label: 'Tổng số User', value: stats.totalUsers, icon: 'group' },
    { label: 'User hoạt động', value: stats.activeUsers, icon: 'how_to_reg', color: 'text-green-500' },
    { label: 'Tổng số Dự án', value: stats.totalProjects, icon: 'folder' },
    { label: 'Tổng số Công việc', value: stats.totalTasks, icon: 'task' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-on-surface">Tổng quan Hệ thống</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-surface p-6 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface-variant mb-1">{card.label}</p>
              <h3 className="text-3xl font-bold text-on-surface">{card.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-surface-container-high ${card.color || 'text-primary'}`}>
              <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

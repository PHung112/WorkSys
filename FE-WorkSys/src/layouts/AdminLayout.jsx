import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = sessionStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (!currentUser || currentUser.systemRole !== 'SYSTEM_ADMIN') {
      navigate('/projects');
    }
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.systemRole !== 'SYSTEM_ADMIN') {
    return null;
  }

  const menuItems = [
    { path: '/admin', label: 'Tổng quan', icon: 'dashboard', end: true },
    { path: '/admin/users', label: 'Quản lý người dùng', icon: 'group' },
    { path: '/admin/projects', label: 'Quản lý dự án', icon: 'folder' },
    { path: '/admin/audit-logs', label: 'Nhật ký hoạt động', icon: 'history' },
    { path: '/admin/system-status', label: 'Trạng thái hệ thống', icon: 'monitor_heart' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-outline-variant/20 bg-surface flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-outline-variant/20">
          <div className="w-8 h-8 bg-error rounded-lg flex items-center justify-center font-bold text-lg text-on-error">W</div>
          <span className="ml-3 font-sans text-xl font-bold text-on-surface tracking-tight">WorkSys</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-outline-variant/20">
          <button
            onClick={() => navigate('/projects')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface hover:bg-surface-container-high transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Về WorkSys
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-surface-container-lowest">
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-8 border-b border-outline-variant/20 bg-surface">
          <h1 className="text-lg font-semibold text-on-surface">Quản trị hệ thống</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary overflow-hidden">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                currentUser.username?.[0]?.toUpperCase()
              )}
            </div>
            <span className="text-sm font-medium text-on-surface">{currentUser.username}</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

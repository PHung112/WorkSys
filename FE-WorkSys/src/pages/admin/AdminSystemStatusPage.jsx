import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../../api/adminApi';
import http from '../../api/axiosConfig';

const CHECK_TIMEOUT = 5000;

function StatusBadge({ status }) {
  if (status === 'checking') return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
      <span className="w-2 h-2 rounded-full bg-outline-variant animate-pulse"></span>Đang kiểm tra...
    </span>
  );
  if (status === 'ok') return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-500">
      <span className="w-2 h-2 rounded-full bg-green-500"></span>Hoạt động
    </span>
  );
  if (status === 'warn') return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-500">
      <span className="w-2 h-2 rounded-full bg-orange-500"></span>Cảnh báo
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-error">
      <span className="w-2 h-2 rounded-full bg-error"></span>Lỗi
    </span>
  );
}

export default function AdminSystemStatusPage() {
  const [checks, setChecks] = useState({
    api:        { label: 'API Backend', icon: 'dns',           status: 'checking', detail: '' },
    database:   { label: 'Cơ sở dữ liệu', icon: 'storage',   status: 'checking', detail: '' },
    auth:       { label: 'Xác thực (JWT)', icon: 'lock',      status: 'checking', detail: '' },
    users:      { label: 'Quản lý người dùng', icon: 'group', status: 'checking', detail: '' },
    projects:   { label: 'Quản lý dự án', icon: 'folder',     status: 'checking', detail: '' },
    notifs:     { label: 'Thông báo (WebSocket)', icon: 'notifications', status: 'checking', detail: '' },
    auditLogs:  { label: 'Nhật ký hoạt động', icon: 'history', status: 'checking', detail: '' },
  });
  const [lastChecked, setLastChecked] = useState(null);
  const [running, setRunning] = useState(false);

  const setCheck = (key, status, detail) =>
    setChecks(prev => ({ ...prev, [key]: { ...prev[key], status, detail } }));

  const runChecks = useCallback(async () => {
    setRunning(true);
    // Reset all to checking
    setChecks(prev => Object.fromEntries(
      Object.entries(prev).map(([k, v]) => [k, { ...v, status: 'checking', detail: '' }])
    ));

    // 1. API Backend
    try {
      const t0 = Date.now();
      await http.get('/actuator/health', { timeout: CHECK_TIMEOUT }).catch(() => {
        // actuator may not exist, try dashboard as fallback
        return adminApi.getDashboard();
      });
      setCheck('api', 'ok', `Phản hồi sau ${Date.now() - t0}ms`);
    } catch {
      // Try dashboard as final fallback
      try {
        const t0 = Date.now();
        await adminApi.getDashboard();
        setCheck('api', 'ok', `Phản hồi sau ${Date.now() - t0}ms`);
      } catch {
        setCheck('api', 'error', 'Không thể kết nối tới server');
      }
    }

    // 2. Database + Users (via users API)
    try {
      const t0 = Date.now();
      const res = await adminApi.getUsers({ page: 0, size: 1 });
      const count = res.data.totalElements;
      setCheck('database', 'ok', `Kết nối thành công`);
      setCheck('users', 'ok', `${count} người dùng trong hệ thống`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Lỗi không xác định';
      setCheck('database', 'error', 'Truy vấn DB thất bại');
      setCheck('users', 'error', msg);
    }

    // 3. Auth (JWT) - check via current session
    const token = sessionStorage.getItem('token');
    if (token) {
      // parse expiry from JWT payload
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = new Date(payload.exp * 1000);
        const now = new Date();
        const diffMin = Math.round((expiresAt - now) / 60000);
        if (diffMin > 0) {
          setCheck('auth', 'ok', `Token hợp lệ, hết hạn sau ${diffMin} phút`);
        } else {
          setCheck('auth', 'warn', 'Token đã hết hạn');
        }
      } catch {
        setCheck('auth', 'warn', 'Không thể đọc token');
      }
    } else {
      setCheck('auth', 'error', 'Không tìm thấy token');
    }

    // 4. Projects
    try {
      const res = await adminApi.getProjects({ page: 0, size: 1 });
      const total = res.data.totalElements;
      const archived = res.data.content.filter(p => p.archived).length;
      setCheck('projects', 'ok', `${total} dự án`);
    } catch (err) {
      setCheck('projects', 'error', err?.response?.data?.message || 'Không tải được dữ liệu');
    }

    // 5. Audit logs
    try {
      const res = await adminApi.getAuditLogs({ page: 0, size: 1 });
      setCheck('auditLogs', 'ok', `${res.data.totalElements} bản ghi`);
    } catch {
      setCheck('auditLogs', 'error', 'Không tải được nhật ký');
    }

    // 6. WebSocket / Notifications - just check if SockJS endpoint reachable
    try {
      await fetch('http://localhost:8080/ws/info', { signal: AbortSignal.timeout(3000) });
      setCheck('notifs', 'ok', 'WebSocket endpoint phản hồi');
    } catch {
      setCheck('notifs', 'warn', 'WebSocket không phản hồi (có thể bình thường nếu không có kết nối active)');
    }

    setLastChecked(new Date());
    setRunning(false);
  }, []);

  useEffect(() => { runChecks(); }, []);

  const overallStatus = Object.values(checks).some(c => c.status === 'error') ? 'error'
    : Object.values(checks).some(c => c.status === 'warn') ? 'warn'
    : Object.values(checks).every(c => c.status === 'ok') ? 'ok'
    : 'checking';

  const overallColors = {
    error:    'from-red-500/10 to-red-500/5 border-red-500/20',
    warn:     'from-orange-500/10 to-orange-500/5 border-orange-500/20',
    ok:       'from-green-500/10 to-green-500/5 border-green-500/20',
    checking: 'from-surface-container to-surface-container border-outline-variant/20',
  };
  const overallText = { error: 'Có sự cố', warn: 'Cần chú ý', ok: 'Tất cả hoạt động bình thường', checking: 'Đang kiểm tra...' };
  const overallIcon = { error: 'error', warn: 'warning', ok: 'check_circle', checking: 'pending' };
  const overallIconColor = { error: 'text-error', warn: 'text-orange-500', ok: 'text-green-500', checking: 'text-on-surface-variant' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-on-surface">Trạng thái Hệ thống</h2>
        <button
          onClick={runChecks}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition"
        >
          <span className={`material-symbols-outlined text-[18px] ${running ? 'animate-spin' : ''}`}>refresh</span>
          {running ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
        </button>
      </div>

      {/* Overall status banner */}
      <div className={`bg-gradient-to-r ${overallColors[overallStatus]} border rounded-2xl p-5 flex items-center gap-4`}>
        <span className={`material-symbols-outlined text-[36px] ${overallIconColor[overallStatus]}`}>
          {overallIcon[overallStatus]}
        </span>
        <div>
          <p className="font-bold text-on-surface text-lg">{overallText[overallStatus]}</p>
          {lastChecked && (
            <p className="text-sm text-on-surface-variant">
              Lần kiểm tra cuối: {lastChecked.toLocaleTimeString('vi-VN')}
            </p>
          )}
        </div>
      </div>

      {/* Individual checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(checks).map(([key, check]) => (
          <div key={key} className="bg-surface border border-outline-variant/20 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              check.status === 'ok' ? 'bg-green-500/10' :
              check.status === 'warn' ? 'bg-orange-500/10' :
              check.status === 'error' ? 'bg-error/10' :
              'bg-surface-container-high'
            }`}>
              <span className={`material-symbols-outlined text-[20px] ${
                check.status === 'ok' ? 'text-green-500' :
                check.status === 'warn' ? 'text-orange-500' :
                check.status === 'error' ? 'text-error' :
                'text-on-surface-variant'
              }`}>{check.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-on-surface text-sm">{check.label}</p>
                <StatusBadge status={check.status} />
              </div>
              <p className="text-xs text-on-surface-variant truncate">{check.detail || '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info note */}
      <div className="bg-surface-container-high rounded-xl p-4 flex gap-3 text-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">info</span>
        <p>
          Trang này kiểm tra tình trạng các chức năng quan trọng của hệ thống bằng cách thực hiện các yêu cầu thử nghiệm. 
          Một số kiểm tra có thể hiển thị cảnh báo ngay cả khi hệ thống hoạt động bình thường.
        </p>
      </div>
    </div>
  );
}

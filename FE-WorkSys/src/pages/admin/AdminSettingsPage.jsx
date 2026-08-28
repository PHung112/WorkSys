import React from 'react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-on-surface">System Settings</h2>
      
      <div className="bg-surface border border-outline-variant/20 rounded-2xl p-12 text-center shadow-sm">
        <span className="material-symbols-outlined text-6xl text-primary/30 mb-4 block">build</span>
        <h3 className="text-xl font-bold text-on-surface mb-2">Sắp ra mắt</h3>
        <p className="text-on-surface-variant max-w-md mx-auto">
          Tính năng cấu hình hệ thống (như thay đổi logo, quy định mật khẩu, email SMTP, giới hạn file upload) sẽ được cập nhật trong phiên bản tiếp theo.
        </p>
      </div>
    </div>
  );
}

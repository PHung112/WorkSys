import React from 'react';

const AdminStatusBadge = ({ type, value }) => {
  if (type === 'role') {
    if (value === 'SYSTEM_ADMIN') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error border border-error/20 inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">shield_person</span>
          Admin
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant/50 inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">person</span>
        User
      </span>
    );
  }

  if (type === 'status') {
    if (value === 'ACTIVE') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          Active
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-outline-variant/20 text-on-surface-variant border border-outline-variant/30 inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
        Inactive
      </span>
    );
  }

  return null;
};

export default AdminStatusBadge;

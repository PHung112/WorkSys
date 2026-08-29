import { useState } from "react";

export default function ArchivedTasksModal({ isOpen, onClose, archivedTasks }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-surface-container-high w-full max-w-2xl rounded-2xl flex flex-col border border-outline-variant/20 shadow-2xl max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-highest shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
            <div>
              <h2 className="font-semibold text-on-surface text-base">Kho lưu trữ Task</h2>
              <p className="text-on-surface-variant text-xs">Các task đã hoàn thành sau 2 ngày</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {archivedTasks && archivedTasks.length > 0 ? (
            <div className="flex flex-col gap-3">
              {archivedTasks.map((task) => (
                <div key={task.id} className="bg-surface-container p-4 rounded-xl border border-outline-variant/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-on-surface text-sm mb-1 line-through opacity-80 flex items-center gap-2">
                      {task.title}
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-[10px] font-bold uppercase tracking-wider no-underline">
                        [{task.status}]
                      </span>
                    </h3>
                    <div className="text-xs text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Lưu trữ lúc: {new Date(task.archivedAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-60">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">inventory_2</span>
              <p className="text-on-surface font-medium mb-1">Kho lưu trữ trống</p>
              <p className="text-on-surface-variant text-sm text-center max-w-xs">Chưa có task nào được tự động chuyển vào kho lưu trữ (sau 2 ngày hoàn thành).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

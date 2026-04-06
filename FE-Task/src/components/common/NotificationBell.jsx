import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import notificationApi from "../../api/notificationApi";
import { subscribeRealtime } from "../../realtime/wsClient";

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = (Date.now() - new Date(isoString)) / 1000;
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const isOpenRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.data.count ?? 0);
    } catch {
      // silently ignore — user may not be logged in
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getMyNotifications();
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.read).length);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Realtime notifications by user topic
  useEffect(() => {
    const rawUser = sessionStorage.getItem("currentUser");
    if (!rawUser) return;

    let userId;
    try {
      userId = JSON.parse(rawUser)?.id;
    } catch {
      userId = null;
    }
    if (!userId) return;

    const unsubscribe = subscribeRealtime(`/topic/users/${userId}/notifications`, async () => {
      await fetchUnreadCount();
      if (isOpenRef.current) {
        await fetchNotifications();
      }
    });

    return () => unsubscribe();
  }, [fetchUnreadCount, fetchNotifications]);

  // Open dropdown → fetch full list
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAccept = async (id) => {
    try {
      await notificationApi.acceptInvite(id);
      window.dispatchEvent(new CustomEvent("inviteAccepted"));
      await fetchNotifications();
    } catch (err) {
      alert(err?.response?.data?.error || "Có lỗi xảy ra");
    }
  };

  const handleDecline = async (id) => {
    try {
      await notificationApi.declineInvite(id);
      await fetchNotifications();
    } catch (err) {
      alert(err?.response?.data?.error || "Có lỗi xảy ra");
    }
  };

  const handleMarkRead = async (n) => {
    if (!n.read) {
      try {
        await notificationApi.markAsRead(n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      alert(err?.response?.data?.error || "Có lỗi xảy ra");
    }
  };

  const handleTaskNotificationClick = async (n) => {
    await handleMarkRead(n);
    setIsOpen(false);
    navigate(`/projects?goto=${n.projectId}`);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white"
        title="Thông báo"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Thông báo</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <>
                  <span className="text-xs text-white/40">{unreadCount} chưa đọc</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAllAsRead();
                    }}
                    className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                    title="Đánh dấu tất cả đã xem"
                  >
                    Đánh dấu tất cả
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-white/40 text-sm">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-sm">Không có thông báo</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() =>
                    n.type === "TASK_ASSIGNED" || n.type === "TASK_ACCEPTED" || n.type === "DEADLINE_REMINDER"
                      ? handleTaskNotificationClick(n)
                      : handleMarkRead(n)
                  }
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition ${
                    !n.read ? "bg-purple-900/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Dot */}
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.read ? "bg-purple-400" : "bg-transparent"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/85 text-sm leading-snug">{n.message}</p>
                      <p className="text-white/35 text-xs mt-1">{timeAgo(n.createdAt)}</p>

                      {/* Accept / Decline for pending invites */}
                      {n.type === "INVITE" && n.status === "PENDING" && (
                        <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleAccept(n.id)}
                            className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                          >
                            Chấp nhận
                          </button>
                          <button
                            onClick={() => handleDecline(n.id)}
                            className="px-3 py-1 text-xs border border-white/20 hover:bg-white/10 text-white/70 rounded-lg transition"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}

                      {n.type === "INVITE" && n.status === "ACCEPTED" && (
                        <span className="mt-1 inline-block text-xs text-green-400">✓ Đã chấp nhận</span>
                      )}
                      {n.type === "INVITE" && n.status === "DECLINED" && (
                        <span className="mt-1 inline-block text-xs text-red-400">✗ Đã từ chối</span>
                      )}
                      {(n.type === "TASK_ASSIGNED" || n.type === "TASK_ACCEPTED") && (
                        <span className="mt-1 inline-block text-xs text-purple-400/70">→ Xem task</span>
                      )}
                      {n.type === "DEADLINE_REMINDER" && (
                        <span className="mt-1 inline-block text-xs text-orange-400/80">⏰ → Xem task</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

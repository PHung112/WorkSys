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
        className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-4xl bg-gray-500/20 transition-all relative flex items-center justify-center cursor-pointer"
        title="Thông báo"
      >
        <span className="material-symbols-outlined !text-[20px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-[-6px] right-[-4px] bg-red-500 text-on-error !text-[9px] font-bold rounded-full min-w-3 h-3 flex items-center justify-center p-1 leading-none ring-2 ring-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container border border-outline-variant/20 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
            <span className="text-on-surface font-label-md">Thông báo</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <>
                  <span className="text-xs text-on-surface-variant">{unreadCount} chưa đọc</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAllAsRead();
                    }}
                    className="px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition font-label-xs cursor-pointer"
                    title="Đánh dấu tất cả đã xem"
                  >
                    Đánh dấu tất cả
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="py-8 text-center text-on-surface-variant font-body-sm text-sm">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant font-body-sm text-sm">Không có thông báo</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() =>
                    n.type === "TASK_ASSIGNED" || n.type === "TASK_ACCEPTED" || n.type === "DEADLINE_REMINDER"
                      ? handleTaskNotificationClick(n)
                      : handleMarkRead(n)
                  }
                  className={`px-4 py-3 cursor-pointer hover:bg-surface-container-high transition ${!n.read ? "bg-primary/5" : ""
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Dot */}
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-body-sm text-on-surface text-xs leading-snug line-clamp-2" title={n.message}>{n.message}</p>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="font-label-xs text-on-surface-variant text-xs">{timeAgo(n.createdAt)}</p>

                        {n.type === "INVITE" && n.status === "ACCEPTED" && (
                          <span className="inline-flex items-center gap-1 text-xs text-tertiary font-label-xs">
                            <span className="material-symbols-outlined !text-[12px]">check_circle</span> Đã chấp nhận
                          </span>
                        )}
                        {n.type === "INVITE" && n.status === "DECLINED" && (
                          <span className="inline-flex items-center gap-1 text-xs text-error font-label-xs">
                            <span className="material-symbols-outlined !text-[12px]">cancel</span> Đã từ chối
                          </span>
                        )}
                      </div>

                      {/* Accept / Decline for pending invites */}
                      {n.type === "INVITE" && n.status === "PENDING" && (
                        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleAccept(n.id)}
                            className="px-3 py-1.5 text-xs bg-primary hover:bg-primary/90 text-on-primary rounded-lg transition font-label-md cursor-pointer shadow-sm"
                          >
                            Chấp nhận
                          </button>
                          <button
                            onClick={() => handleDecline(n.id)}
                            className="px-3 py-1.5 text-xs bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface rounded-lg transition font-label-md cursor-pointer border border-outline-variant/20"
                          >
                            Từ chối
                          </button>
                        </div>
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

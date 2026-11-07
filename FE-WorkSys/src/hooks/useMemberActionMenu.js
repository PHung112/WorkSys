import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Custom Hook quản lý trạng thái và tính toán tọa độ cho Floating Action Menu
 * của thành viên trong danh sách (tự động đảo hướng Dropdown / Dropup & giới hạn maxHeight)
 */
export function useMemberActionMenu() {
  const [activeMenuMemberId, setActiveMenuMemberId] = useState(null);
  const [activeMember, setActiveMember] = useState(null);
  const [menuCoords, setMenuCoords] = useState(null);
  const menuRef = useRef(null);

  const handleCloseMenu = useCallback(() => {
    setActiveMenuMemberId(null);
    setActiveMember(null);
    setMenuCoords(null);
  }, []);

  // Đóng dropdown khi click ra ngoài, cuộn trang ngoài hoặc resize cửa sổ
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        handleCloseMenu();
      }
    };

    const handleScroll = (e) => {
      // Bỏ qua nếu thao tác cuộn diễn ra bên trong chính menu dropdown
      if (menuRef.current && (menuRef.current === e.target || menuRef.current.contains(e.target))) {
        return;
      }
      handleCloseMenu();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleCloseMenu);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleCloseMenu);
    };
  }, [handleCloseMenu]);

  // Mở/Đóng menu với thuật toán tự động tính toán không gian (Auto Placement & Dynamic Height)
  const handleToggleMenu = useCallback((e, member) => {
    e.stopPropagation();
    const memberUserId = member.userId || member.id;
    if (activeMenuMemberId === memberUserId) {
      handleCloseMenu();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Ước tính chiều cao menu (~175px)
    const menuEstimatedHeight = 175;

    // Nếu khoảng trống bên dưới không đủ (< 190px) và bên trên nhiều chỗ hơn -> mở Dropup
    const isUp = spaceBelow < menuEstimatedHeight + 15 && spaceAbove > spaceBelow;

    // Tính maxHeight linh hoạt để vừa vặn trong màn hình
    const availableSpace = isUp ? spaceAbove - 16 : spaceBelow - 16;
    const maxHeight = Math.max(120, Math.min(availableSpace, 280));

    setMenuCoords({
      top: isUp ? undefined : rect.bottom + 6,
      bottom: isUp ? window.innerHeight - rect.top + 6 : undefined,
      right: Math.max(12, window.innerWidth - rect.right),
      maxHeight,
      isUp,
    });
    setActiveMenuMemberId(memberUserId);
    setActiveMember(member);
  }, [activeMenuMemberId, handleCloseMenu]);

  return {
    activeMenuMemberId,
    activeMember,
    menuCoords,
    menuRef,
    handleToggleMenu,
    handleCloseMenu,
  };
}

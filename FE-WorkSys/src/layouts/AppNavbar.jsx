import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import NotificationBell from "../components/common/NotificationBell";

export default function AppNavbar() {
  const navigate = useNavigate();
  const raw = sessionStorage.getItem("currentUser");
  const currentUser = raw ? JSON.parse(raw) : null;
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("currentUser");
    setIsProfileOpen(false);
    navigate("/auth");
  };

  const handleMenuClick = (tab) => {
    setIsProfileOpen(false);
    navigate(`/${tab}`);
  };

  return (
    <header className="sticky top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-white/20">
      <div className="h-16 w-full px-10 flex items-center justify-between">
        <button onClick={() => navigate('/projects')} className="flex items-center gap-4 hover:opacity-80 transition cursor-pointer">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-lg text-on-primary">W</div>
          <span className="font-sans text-xl font-bold text-on-surface tracking-tight">WorkSys</span>
        </button>

        <div className="flex items-center gap-4">
          <NotificationBell />
          {currentUser && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 hover:bg-surface-container-high transition cursor-pointer px-3 py-1.5 rounded-full"
              >
                <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary overflow-hidden shrink-0">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.username?.[0]?.toUpperCase()
                  )}
                </div>
                <span className="font-mono text-sm font-medium text-on-surface">
                  {currentUser.username}
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-container border border-outline-variant/20 rounded-xl shadow-2xl z-50 py-2 flex flex-col">
                  <div className="px-4 py-2 border-b border-outline-variant/10 mb-1">
                    <p className="font-body-sm font-semibold text-on-surface truncate">{currentUser.username}</p>
                    <p className="text-xs text-on-surface-variant truncate">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={() => handleMenuClick('profile')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer text-left text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    Hồ sơ
                  </button>
                  <button
                    onClick={() => handleMenuClick('security')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer text-left text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">security</span>
                    Bảo mật
                  </button>
                  <div className="my-1 border-t border-outline-variant/10"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-error/10 text-error transition-colors cursor-pointer text-left text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

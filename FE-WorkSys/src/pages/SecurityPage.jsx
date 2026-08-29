import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/axiosConfig";

// Trang bảo mật: đổi mật khẩu
export default function SecurityPage() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Load user data
  useEffect(() => {
    const saved = sessionStorage.getItem("currentUser");
    if (!saved) {
      navigate("/auth");
      return;
    }
    const user = JSON.parse(saved);
    setCurrentUser(user);
  }, [navigate]);

  // Đổi mật khẩu sau khi validate dữ liệu form ở client.
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Mật khẩu mới và xác nhận không khớp");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      await http.post("/api/auth/change-password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
      setSuccessMsg("✓ Đổi mật khẩu thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      const msg = err?.response?.data?.error || "Đổi mật khẩu thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden bg-background min-h-screen">
      <div className="absolute -top-64 -right-64 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-50"></div>
      
      <div className="px-container-margin py-stack-lg max-w-3xl mx-auto w-full flex-1 flex flex-col gap-stack-lg z-10 relative">
        <div className="flex-1 w-full flex flex-col gap-stack-lg">
          {/* Notifications area */}
          {(successMsg || error) && (
            <div className={`px-4 py-3 rounded-xl border ${successMsg ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-error/10 border-error/20 text-error'}`}>
              {successMsg || error}
            </div>
          )}

          <section id="security" className="flex flex-col gap-stack-md relative z-10 mb-stack-lg mt-6 lg:mt-0">
            <h3 className="font-headline-md text-on-background">Bảo mật</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-surface-container rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-9xl">vpn_key</span>
                </div>

                {!showPasswordForm ? (
                  <>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[18px]">password</span>
                        </div>
                        <h4 className="font-label-md text-on-surface text-base">Mật khẩu</h4>
                      </div>
                      <p className="font-body-sm text-on-surface-variant mb-6 relative z-10">Đổi mật khẩu định kỳ để bảo vệ tài khoản</p>
                    </div>
                    <button type="button" onClick={() => setShowPasswordForm(true)} className="w-full px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md rounded-lg transition-colors text-left flex justify-between items-center shadow-sm relative z-10">
                      Đổi mật khẩu
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">arrow_forward</span>
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px]">password</span>
                      </div>
                      <h4 className="font-label-md text-on-surface text-base">Đổi mật khẩu</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="font-label-md text-on-surface-variant">Mật khẩu cũ</label>
                        <input type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm(p => ({ ...p, oldPassword: e.target.value }))} className="bg-surface-container-lowest text-on-surface font-body-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container transition-all shadow-sm" required placeholder="Nhập mật khẩu cũ" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-md text-on-surface-variant">Mật khẩu mới</label>
                        <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} className="bg-surface-container-lowest text-on-surface font-body-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container transition-all shadow-sm" required placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-md text-on-surface-variant">Xác nhận mật khẩu</label>
                        <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} className="bg-surface-container-lowest text-on-surface font-body-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container transition-all shadow-sm" required placeholder="Nhập lại mật khẩu mới" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" }); setError(""); }} className="px-4 py-2 bg-transparent hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface font-label-md rounded-lg transition-colors">Hủy</button>
                      <button type="submit" disabled={loading} className="px-5 py-2 bg-primary text-on-primary hover:bg-primary/90 font-label-md rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50">
                        {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import userApi from "../api/userApi";
import http from "../api/axiosConfig";
import { uploadToCloudinary } from "../config/cloudinaryConfig";

const inputCls =
  "w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500 transition";
const labelCls = "text-white/60 text-sm mb-1.5 block";

// Trang hồ sơ người dùng: chỉnh sửa thông tin cá nhân, avatar và mật khẩu.
export default function UserProfilePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({ username: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // Load user data
  useEffect(() => {
    const saved = sessionStorage.getItem("currentUser");
    if (!saved) {
      navigate("/auth");
      return;
    }
    const user = JSON.parse(saved);
    setCurrentUser(user);
    setForm({ username: user.username || "", email: user.email || "" });
    if (user.avatarUrl) {
      setAvatarPreview(user.avatarUrl);
    }
  }, [navigate]);

  // Cập nhật username/email và đồng bộ lại currentUser trong sessionStorage.
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await userApi.updateUser(currentUser.id, {
        username: form.username,
        email: form.email,
      });

      // Update sessionStorage
      const updatedUser = {
        ...currentUser,
        username: form.username,
        email: form.email,
      };
      sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      setSuccessMsg("✓ Cập nhật thông tin thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      const msg = err?.response?.data?.error || "Cập nhật thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra file avatar hợp lệ rồi tạo preview trước khi upload.
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không vượt quá 5MB");
      return;
    }

    setAvatarFile(file);
    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
    };
    reader.readAsDataURL(file);
    setError("");
  };

  // Upload ảnh lên Cloudinary, lưu URL về backend và cập nhật session user.
  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    setError("");
    setSuccessMsg("");

    try {
      // Step 1: Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(avatarFile);

      // Step 2: Save URL to backend
      const res = await userApi.updateAvatarUrl(currentUser.id, imageUrl);

      // Step 3: Update sessionStorage with new avatar
      const updatedUser = { ...currentUser, avatarUrl: res.data.avatarUrl };
      sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      setAvatarFile(null);
      setSuccessMsg("✓ Cập nhật avatar thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      const msg = err?.response?.data?.error || "Upload avatar thất bại";
      setError(msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

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
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate("/projects")}
            className="text-white/60 hover:text-white transition mb-4"
          >
            ← Quay lại
          </button>
          <h1 className="text-3xl font-bold">Chỉnh sửa hồ sơ cá nhân</h1>
        </div>

        <div className="space-y-8">
          {/* ════════ Avatar ════════ */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">Ảnh đại diện</h2>

            <div className="flex items-center gap-6">
              {/* Avatar preview */}
              <div className="w-24 h-24 bg-purple-600/40 rounded-full flex items-center justify-center text-4xl font-bold shrink-0 overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser.username?.[0]?.toUpperCase()
                )}
              </div>

              {/* Upload area */}
              <div className="flex-1">
                <label className={labelCls}>Chọn ảnh (tối đa 5MB)</label>
                <div className="relative">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-full py-2 px-4 border border-white/15 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition"
                  >
                    Chọn ảnh
                  </button>
                </div>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={handleUploadAvatar}
                    disabled={uploadingAvatar}
                    className="w-full mt-3 py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg font-semibold transition"
                  >
                    {uploadingAvatar ? "Đang tải..." : "Lưu ảnh"}
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* ════════ Thông tin cơ bản ════════ */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">Thông tin cơ bản</h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className={labelCls}>Tên đăng nhập</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, username: e.target.value }))
                  }
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className={inputCls}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl font-semibold transition shadow-lg shadow-purple-500/20"
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>
          </div>

          {/* ════════ Đổi mật khẩu ════════ */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <button
              type="button"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="w-full text-left flex items-center justify-between py-3 px-4 border border-white/15 hover:bg-white/5 rounded-lg transition"
            >
              <h2 className="text-lg font-semibold">Đổi mật khẩu</h2>
              <span className="text-white/50">
                {showPasswordForm ? "−" : "+"}
              </span>
            </button>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                <div>
                  <label className={labelCls}>Mật khẩu cũ</label>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        oldPassword: e.target.value,
                      }))
                    }
                    placeholder="Nhập mật khẩu cũ"
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Mật khẩu mới</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Nhập lại mật khẩu mới"
                    className={inputCls}
                    required
                  />
                </div>

                {error && !showPasswordForm && (
                  <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold transition shadow-lg shadow-blue-500/20"
                  >
                    {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({
                        oldPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setError("");
                    }}
                    className="flex-1 py-3 border border-white/15 hover:bg-white/5 rounded-xl font-semibold transition"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Show success/error messages */}
          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/25 rounded-xl px-4 py-3 text-green-400 text-sm">
              {successMsg}
            </div>
          )}
          {error && showPasswordForm && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import userApi from "../api/userApi";
import { uploadToCloudinary } from "../config/cloudinaryConfig";

// Trang hồ sơ người dùng: chỉnh sửa thông tin cá nhân, avatar.
export default function UserProfilePage() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({ username: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
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

          <section id="profile" className="flex flex-col gap-stack-md mt-6 lg:mt-0">
            <header className="flex items-baseline justify-between mb-4">
              <h2 className="font-headline-lg text-on-background">Chỉnh sửa hồ sơ cá nhân</h2>
            </header>

            <div className="bg-surface-container rounded-2xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary-container/10 rounded-bl-full translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-110 duration-500 pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative inline-block shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden shadow-md ring-4 ring-background z-10 relative bg-surface-container-high flex items-center justify-center text-4xl font-bold text-on-surface">
                    {avatarPreview ? (
                      <img alt="Profile Photo" src={avatarPreview} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  <button type="button" onClick={() => avatarInputRef.current?.click()} aria-label="Upload new photo" className="absolute bottom-0 right-0 p-1.5 bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors shadow-sm z-20">
                    <span className="material-symbols-outlined text-[16px] block">upload</span>
                  </button>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <h3 className="font-headline-md text-on-surface">{currentUser.username}</h3>
                  <p className="font-body-sm text-on-surface-variant">{currentUser.email}</p>
                </div>
                {avatarFile && (
                  <button type="button" onClick={handleUploadAvatar} disabled={uploadingAvatar} className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary font-label-md rounded-lg transition-colors shadow-sm disabled:opacity-50">
                    {uploadingAvatar ? "Đang tải..." : "Lưu ảnh"}
                  </button>
                )}
              </div>

              <div className="h-px bg-outline-variant/20 w-full"></div>

              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="username" className="font-label-md text-on-surface-variant">Tên đăng nhập</label>
                    <input id="username" type="text" value={form.username} onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))} className="bg-surface-container-lowest text-on-surface font-body-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container transition-all shadow-sm" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="font-label-md text-on-surface-variant">Email</label>
                    <input id="email" type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="bg-surface-container-lowest text-on-surface font-body-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container transition-all shadow-sm" required />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <button type="submit" disabled={loading} className="px-5 py-2 bg-primary text-on-primary hover:bg-primary/90 font-label-md rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Cấu hình Cloudinary
export const CLOUDINARY_CONFIG = {
  cloudName: "dud6jryis",
  uploadPreset: "task_management_preset",
  folders: {
    avatars: "worksys/avatars",
    tasks: "worksys/tasks",
  },
};

// Upload Avatar lên Cloudinary (lưu vào folder worksys/avatars/ và tự động ghi đè theo userId)
export const uploadAvatarToCloudinary = async (file, userId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
  formData.append("folder", CLOUDINARY_CONFIG.folders.avatars);
  formData.append("asset_folder", CLOUDINARY_CONFIG.folders.avatars);
  
  if (userId) {
    formData.append("public_id", `${CLOUDINARY_CONFIG.folders.avatars}/avatar_user_${userId}`);
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "Upload avatar thất bại");
    }

    // Thêm query timestamp (?t=...) để trình duyệt và CDN lập tức load ảnh mới, tránh dính cache cũ
    const cleanUrl = data.secure_url ? data.secure_url.split("?")[0] : data.secure_url;
    return `${cleanUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error("Cloudinary avatar upload error:", error);
    throw error;
  }
};

// Upload file tài liệu / đính kèm / bài nộp task lên Cloudinary (lưu vào folder worksys/tasks/)
export const uploadFileToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
  formData.append("folder", CLOUDINARY_CONFIG.folders.tasks);
  formData.append("asset_folder", CLOUDINARY_CONFIG.folders.tasks);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "Upload file thất bại");
    }

    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary file upload error:", error);
    throw error;
  }
};

// Hàm hỗ trợ tải file về máy trực tiếp (Force Download) thay vì chỉ mở tab mới
export const triggerDownload = async (url, customFilename = "download") => {
  if (!url) return;
  try {
    let downloadUrl = url;
    if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
      downloadUrl = url.replace("/upload/", "/upload/fl_attachment/");
    }

    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Tìm phần mở rộng file nếu có
    const extension = url.split(".").pop().split(/[?#]/)[0];
    const filename = extension && extension.length <= 5 && !customFilename.endsWith(`.${extension}`)
      ? `${customFilename}.${extension}`
      : customFilename;

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.warn("Direct blob download failed, falling back to window open:", err);
    const fallbackUrl = url.includes("res.cloudinary.com") && url.includes("/upload/")
      ? url.replace("/upload/", "/upload/fl_attachment/")
      : url;
    window.open(fallbackUrl, "_blank");
  }
};

// Giữ lại alias uploadToCloudinary để tương thích ngược
export const uploadToCloudinary = uploadAvatarToCloudinary;

// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  cloudName: "dud6jryis",
  uploadPreset: "task_management_preset", // We'll create this in settings
};

// Upload image to Cloudinary
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.secure_url; // Return the secure URL
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

# Hướng dẫn Setup Cloudinary cho Task Management

## Thông tin Cloudinary của bạn:

- **Cloud Name**: dud6jryis
- **API Key**: 763579341335442
- **API Secret**: 2RfgcfiK-bITkPqyh5NvKJu1_yE ⚠️ (Giữ bí mật, không đẩy lên GitHub)

## Bước 1: Tạo Upload Preset trong Cloudinary Dashboard

1. Vào **https://cloudinary.com/console/settings/upload**
2. Kéo xuống tìm phần **Upload presets**
3. Nhấn nút **Add upload preset** (hoặc **Create preset**)
4. Điền thông tin:
   - **Preset Name**: `task_management_preset` (phải khớp với file `cloudinaryConfig.js`)
   - **Signing Mode**: Chọn **Unsigned** (để không cần gửi API Secret từ Frontend)
   - Nhấn **Save**

> ℹ️ Nếu không thấy nút Add, hãy đảm bảo đã login và có quyền truy cập settings

## Bước 2: Cấu trúc dự án sau khi setup

### Frontend (React)

```
FE-Task/
src/
  config/
    cloudinaryConfig.js          ✅ (Đã tạo)
  pages/
    UserProfilePage.jsx          ✅ (Đã cập nhật)
  api/
    userApi.js                   ✅ (Đã cập nhật)
```

### Backend (Spring Boot)

```
Task-Management/
src/main/java/.../
  controller/
    UserController.java          ✅ (Đã cập nhật - PUT instead of POST)
  service/
    UserService.java             ✅ (updateAvatar() method)
```

## Bước 3: Luồng hoạt động

```
1. User chọn ảnh → Frontend validate (type, size ≤ 5MB)
2. ↓
3. Frontend upload trực tiếp đến Cloudinary API
4. ↓
5. Cloudinary trả về secure_url
6. ↓
7. Frontend gửi URL đến Backend: PUT /api/users/{id}/avatar
8. ↓
9. Backend lưu URL string vào MySQL (avatarUrl column)
10. ↓
11. Frontend cập nhật sessionStorage + hiển thị avatar
```

## Bước 4: Test tính năng

1. **Khởi động Backend**:

   ```bash
   cd Task-Management
   mvn spring-boot:run
   ```

2. **Khởi động Frontend**:

   ```bash
   cd FE-Task
   npm install axios  # (nếu chưa có)
   npm run dev
   ```

3. **Test Avatar Upload**:
   - Đăng nhập → Nhấn Profile button
   - Click "Chọn ảnh" → Chọn ảnh từ máy (< 5MB)
   - Click "Lưu ảnh"
   - ✅ Avatar hiển thị trong navbar ngay lập tức
   - Refresh page → Avatar vẫn hiển thị (lưu trong DB)

## Lợi ích của Cloudinary

✅ **Không cần lưu file trên server** → Tiết kiệm storage  
✅ **CDN tự động** → Ảnh load nhanh toàn cầu  
✅ **Xử lý ảnh thông minh** → Tự resize, optimize  
✅ **An toàn** → Không cần expose API Secret từ Frontend  
✅ **Miễn phí** → 25GB storage + 25M unlimited transformations/tháng

## Troubleshooting

**Lỗi "Upload preset not found"**

- ✅ Kiểm tra upload preset name khớp với `cloudinaryConfig.js`
- ✅ Verify preset đã được tạo với Signing Mode = Unsigned

**Ảnh không hiển thị**

- ✅ Check browser console cho CORS errors
- ✅ Đảm bảo avatarUrl được lưu đúng trong MySQL (check database)

**Upload bị fail**

- ✅ Check file size < 5MB
- ✅ Kiểm tra file type phải là image/\* (PNG, JPG, GIF, WebP)
- ✅ Verification Cloud Name và Upload Preset đúng

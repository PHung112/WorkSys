# ⚡ HƯỚNG DẪN TEST NHANH

## 🚀 BƯỚC 1: KHỞI ĐỘNG SERVER
```bash
mvnw spring-boot:run
```
Đợi server khởi động xong (khoảng 10-20 giây)

---

## 📝 BƯỚC 2: TEST BẰNG POSTMAN

### Cách 1: Import Collection (KHUYÊN DÙNG)
1. Mở Postman
2. Click **Import** → Chọn file `Task-Management-API.postman_collection.json`
3. Tất cả 23 API sẽ được import sẵn!

### Cách 2: Test thủ công
Làm theo thứ tự dưới đây:

---

## 🎯 TEST FLOW ĐẦY ĐỦ (Copy & Paste vào Postman)

### 1️⃣ TẠO 3 USERS

**POST** `http://localhost:8080/api/users`
```json
{
    "username": "admin",
    "email": "admin@gmail.com",
    "password": "123456"
}
```

**POST** `http://localhost:8080/api/users`
```json
{
    "username": "member1",
    "email": "member1@gmail.com",
    "password": "123456"
}
```

**POST** `http://localhost:8080/api/users`
```json
{
    "username": "member2",
    "email": "member2@gmail.com",
    "password": "123456"
}
```

✅ **Kiểm tra:** GET `http://localhost:8080/api/users`

---

### 2️⃣ TẠO PROJECT

**POST** `http://localhost:8080/api/projects`
```json
{
    "name": "Website Bán Hàng",
    "description": "Dự án xây dựng web bán hàng online",
    "creatorId": 1
}
```

✅ **Kiểm tra:** GET `http://localhost:8080/api/projects`

---

### 3️⃣ MỜI MEMBERS VÀO PROJECT

**POST** `http://localhost:8080/api/projects/1/invite`
```json
{
    "userId": 2,
    "role": "MEMBER"
}
```

**POST** `http://localhost:8080/api/projects/1/invite`
```json
{
    "userId": 3,
    "role": "VIEWER"
}
```

✅ **Kiểm tra:** GET `http://localhost:8080/api/projects/1/members`

---

### 4️⃣ TẠO TASKS

**POST** `http://localhost:8080/api/tasks`
```json
{
    "projectId": 1,
    "assignedToId": 2,
    "title": "Thiết kế giao diện trang chủ",
    "description": "Thiết kế UI/UX cho trang chủ website",
    "deadline": "2026-03-15"
}
```

**POST** `http://localhost:8080/api/tasks`
```json
{
    "projectId": 1,
    "assignedToId": 2,
    "title": "Code chức năng đăng nhập",
    "description": "Backend + Frontend cho login",
    "deadline": "2026-03-20"
}
```

**POST** `http://localhost:8080/api/tasks`
```json
{
    "projectId": 1,
    "assignedToId": 3,
    "title": "Viết tài liệu API",
    "description": "Document tất cả API endpoints",
    "deadline": "2026-03-10"
}
```

✅ **Kiểm tra:** 
- GET `http://localhost:8080/api/tasks/project/1` (xem tasks của project 1)
- GET `http://localhost:8080/api/tasks/user/2` (xem tasks của member1)

---

### 5️⃣ MEMBER NHẬN VÀ NỘP TASK

**Member 2 nhận task 1:**
POST `http://localhost:8080/api/tasks/1/accept?memberId=2`

✅ **Kiểm tra:** GET `http://localhost:8080/api/tasks/1` (status = IN_PROGRESS)

**Member 2 nộp task 1:**
POST `http://localhost:8080/api/tasks/1/submit?memberId=2`

✅ **Kiểm tra:** GET `http://localhost:8080/api/tasks/1` (status = SUBMITTED)

---

### 6️⃣ CẬP NHẬT DỮ LIỆU

**Cập nhật task:**
PUT `http://localhost:8080/api/tasks/2`
```json
{
    "title": "Code chức năng đăng nhập & đăng ký",
    "description": "Mở rộng thêm tính năng register",
    "deadline": "2026-03-25"
}
```

**Đổi role member:**
PUT `http://localhost:8080/api/projects/1/members/3`
```json
{
    "role": "MEMBER"
}
```

**Cập nhật project:**
PUT `http://localhost:8080/api/projects/1`
```json
{
    "name": "Website Bán Hàng Online",
    "description": "E-commerce platform hoàn chỉnh"
}
```

---

### 7️⃣ XÓA DỮ LIỆU

**Xóa member khỏi project:**
DELETE `http://localhost:8080/api/projects/1/members/3`

**Xóa task:**
DELETE `http://localhost:8080/api/tasks/3`

---

## ✅ CHECKLIST - ĐÃ TEST XONG CHƯA?

- [ ] Tạo được users
- [ ] Lấy được danh sách users
- [ ] Tạo được project
- [ ] Mời được members vào project
- [ ] Xem được danh sách members
- [ ] Tạo được tasks
- [ ] Lấy tasks theo project
- [ ] Lấy tasks theo user
- [ ] Member nhận task được (status đổi thành IN_PROGRESS)
- [ ] Member nộp task được (status đổi thành SUBMITTED)
- [ ] Cập nhật task được
- [ ] Đổi role member được
- [ ] Xóa member khỏi project được
- [ ] Xóa task được

---

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi test xong, bạn sẽ có:
- ✅ 3 users trong database
- ✅ 1 project với members
- ✅ Nhiều tasks với các status khác nhau
- ✅ Hiểu được flow hoạt động của hệ thống

---

## 🔍 XEM DATABASE

Truy cập H2 Console để xem database:
- URL: **http://localhost:8080/h2-console**
- JDBC URL: `jdbc:h2:mem:testdb`
- Username: `sa`
- Password: *(để trống)*

Sau đó chạy các query:
```sql
SELECT * FROM users;
SELECT * FROM projects;
SELECT * FROM project_members;
SELECT * FROM tasks;
```

---

## 🎉 NẾU TẤT CẢ ĐỀU OK → SẴN SÀNG LÀM FRONTEND!


# 🚀 TASK MANAGEMENT SYSTEM - BACKEND

Hệ thống quản lý công việc nhóm với Spring Boot

---

## 📋 TÍNH NĂNG

### 👤 Quản lý Users

- Tạo, xem, sửa, xóa user
- Quản lý thông tin cá nhân

### 📁 Quản lý Projects

- Tạo và quản lý projects
- Mời members vào project
- Phân quyền: ADMIN, MEMBER, VIEWER
- Xóa members khỏi project
- Thay đổi role của members

### ✅ Quản lý Tasks

- Tạo task và assign cho members
- Xem tasks theo project hoặc user
- Member nhận task (ASSIGNED → IN_PROGRESS)
- Member nộp task (IN_PROGRESS → SUBMITTED)
- Cập nhật và xóa tasks

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

- **Java 17+**
- **Spring Boot 3.x**
- **Spring Data JPA**
- **Spring Security**
- **H2 Database** (có thể chuyển sang MySQL/PostgreSQL)
- **Maven**

---

## 📦 CÀI ĐẶT VÀ CHẠY

### 1. Clone project

```bash
cd C:\Users\Phi Hung\Desktop\Task-Management
```

### 2. Build project

```bash
mvnw clean install
```

### 3. Chạy server

```bash
mvnw spring-boot:run
```

Server sẽ chạy tại: **http://localhost:8080**

---

## 📚 TÀI LIỆU API

### Xem chi tiết tất cả API:

- 📄 **API-SUMMARY.md** - Tổng hợp đầy đủ
- 📄 **HUONG-DAN-TEST-API-POSTMAN.md** (nếu có)

### Import vào Postman:

📥 Import file: **Task-Management-API.postman_collection.json**

---

## 🔗 DANH SÁCH API

### 👤 Users (`/api/users`)

- `POST /api/users` - Tạo user
- `GET /api/users` - Lấy tất cả users
- `GET /api/users/{id}` - Lấy user theo ID
- `PUT /api/users/{id}` - Cập nhật user
- `DELETE /api/users/{id}` - Xóa user

### 📁 Projects (`/api/projects`)

- `POST /api/projects` - Tạo project
- `GET /api/projects` - Lấy tất cả projects
- `GET /api/projects/{id}` - Lấy project theo ID
- `PUT /api/projects/{id}` - Cập nhật project
- `DELETE /api/projects/{id}` - Xóa project
- `GET /api/projects/{projectId}/members` - Lấy members
- `POST /api/projects/{projectId}/invite` - Mời member
- `PUT /api/projects/{projectId}/members/{userId}` - Đổi role
- `DELETE /api/projects/{projectId}/members/{userId}` - Xóa member

### ✅ Tasks (`/api/tasks`)

- `POST /api/tasks` - Tạo task
- `GET /api/tasks` - Lấy tất cả tasks
- `GET /api/tasks/{id}` - Lấy task theo ID
- `GET /api/tasks/project/{projectId}` - Lấy tasks của project
- `GET /api/tasks/user/{userId}` - Lấy tasks của user
- `PUT /api/tasks/{id}` - Cập nhật task
- `DELETE /api/tasks/{id}` - Xóa task
- `POST /api/tasks/{taskId}/accept?memberId={id}` - Nhận task
- `POST /api/tasks/{taskId}/submit?memberId={id}` - Nộp task

---

## 💡 VÍ DỤ WORKFLOW

### 1. Tạo Users

```bash
POST /api/users
{
    "username": "admin",
    "email": "admin@gmail.com",
    "password": "123456"
}
```

### 2. Tạo Project

```bash
POST /api/projects
{
    "name": "Website Bán Hàng",
    "description": "Dự án xây dựng web bán hàng",
    "creatorId": 1
}
```

### 3. Mời Members

```bash
POST /api/projects/1/invite
{
    "userId": 2,
    "role": "MEMBER"
}
```

### 4. Tạo Task

```bash
POST /api/tasks
{
    "projectId": 1,
    "assignedToId": 2,
    "title": "Thiết kế giao diện trang chủ",
    "description": "Thiết kế UI/UX cho trang chủ",
    "deadline": "2026-03-30"
}
```

### 5. Member Nhận Task

```bash
POST /api/tasks/1/accept?memberId=2
```

### 6. Member Nộp Task

```bash
POST /api/tasks/1/submit?memberId=2
```

---

## 📊 DATABASE

### H2 Console (Development)

- URL: **http://localhost:8080/h2-console**
- JDBC URL: `jdbc:h2:mem:testdb`
- Username: `sa`
- Password: _(để trống)_

### Các Entity:

- **User** - Thông tin người dùng
- **Project** - Thông tin dự án
- **ProjectMember** - Thành viên trong project (Many-to-Many)
- **Task** - Công việc cần làm
- **Role** - Enum: ADMIN, MEMBER, VIEWER
- **TaskStatus** - Enum: ASSIGNED, IN_PROGRESS, SUBMITTED, COMPLETED

---

## 🔐 SECURITY

Hiện tại đang disable security để dễ test.

File config: `src/main/java/.../security/SecurityConfig.java`

---

## 📁 CẤU TRÚC PROJECT

```
src/main/java/trandinhphihung_project/Task/Management/
├── controller/          # REST Controllers
│   ├── UserController.java
│   ├── ProjectController.java
│   └── TaskController.java
├── service/            # Business Logic
│   ├── UserService.java
│   ├── ProjectService.java
│   └── TaskService.java
├── repository/         # Database Access
│   ├── UserRepository.java
│   ├── ProjectRepository.java
│   ├── TaskRepository.java
│   └── ProjectMemberRepository.java
├── entity/            # Database Models
│   ├── User.java
│   ├── Project.java
│   ├── ProjectMember.java
│   ├── Task.java
│   ├── Role.java
│   └── TaskStatus.java
└── security/          # Security Config
    └── SecurityConfig.java
```

---

## 🎯 NEXT STEPS

### Cho Backend:

- [ ] Thêm validation cho input
- [ ] Xử lý exception tốt hơn
- [ ] Thêm pagination cho GET all
- [ ] Thêm API approve task (ADMIN)
- [ ] Thêm authentication JWT
- [ ] Deploy lên server

### Cho Frontend:

- [ ] Tạo giao diện quản lý Users
- [ ] Tạo giao diện quản lý Projects
- [ ] Tạo giao diện quản lý Tasks
- [ ] Dashboard thống kê
- [ ] Login/Register

---

## 👨‍💻 DEVELOPER

**Tran Dinh Phi Hung**

---

## 📝 LICENSE

MIT License

---

## ✅ STATUS: HOÀN THIỆN - SẴN SÀNG CHO FRONTEND! 🎉

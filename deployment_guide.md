# Hướng Dẫn Deploy Toàn Tập (EC2 + Docker + Nginx + Certbot + Cloudflare)

Hướng dẫn này sẽ đi từ đầu đến cuối, giúp bạn tự tay deploy ứng dụng lên server thực tế với bảo mật HTTPS đạt chuẩn (sử dụng Certbot) và qua proxy của Cloudflare.

---

## Bước 1: Build và Đẩy (Push) Image lên Docker Hub (Làm trên máy của bạn)

Vì bạn sẽ chạy ứng dụng trên EC2, server cần tải image chứa code của bạn từ trên mạng về. Do đó, bạn phải đưa 2 image (FE và BE) lên kho lưu trữ Docker Hub.

1. **Đăng nhập Docker trên máy tính của bạn:**
   Mở terminal và gõ:
   ```bash
   docker login
   ```
   (Nhập Username và Password tài khoản Docker Hub của bạn).

2. **Build và Push:**
   Tại thư mục chứa file `docker-compose.yml` trên máy bạn, chạy:
   ```bash
   docker-compose build
   docker-compose push
   ```
   *Lưu ý:* Hãy chắc chắn rằng trong `docker-compose.yml`, tên image bắt đầu bằng Username Docker Hub của bạn (ví dụ: `phung112/task_fe:v1`).

---

## Bước 2: Chuẩn bị Source trên EC2

Kết nối SSH vào máy chủ EC2 của bạn và thiết lập thư mục chạy ứng dụng.

1. **Tạo thư mục dự án:**
   ```bash
   mkdir -p ~/task-management/Task-Management
   cd ~/task-management
   ```

2. **Copy file lên EC2:**
   Bạn cần có 2 file quan trọng nhất nằm trên EC2:
   - `docker-compose.yml` (nằm trong thư mục `task-management/`)
   - `task_management.sql` (nằm trong thư mục `task-management/Task-Management/` để khi MySQL khởi động nó tự lấy file này tạo database).

   *Mẹo:* Bạn có thể mở nano trên EC2 rồi copy nội dung từ máy tính paste qua cho nhanh.
   ```bash
   # Tạo và paste nội dung docker-compose.yml
   nano docker-compose.yml 
   
   # Tạo và paste nội dung SQL
   nano Task-Management/task_management.sql
   ```

---

## Bước 3: Khởi chạy Ứng dụng bằng Docker trên EC2

Đảm bảo bạn đang đứng ở thư mục `~/task-management`, chạy lệnh sau để kéo image về và chạy ngầm (background):
```bash
docker-compose up -d
```
Kiểm tra xem 3 container (FE, BE, DB) đã chạy xanh tươi chưa bằng lệnh:
```bash
docker ps
```

---

## Bước 4: Cài đặt Nginx và Certbot

Chạy lệnh dưới đây để cài đặt cả Nginx và phần mềm lấy chứng chỉ SSL (Certbot):
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

---

## Bước 5: Cấu hình Nginx (Tạm thời là HTTP)

Để Certbot có thể cấp phát chứng chỉ, Nginx phải chạy được HTTP (Cổng 80) cho domain của bạn trước.

1. **Tạo file cấu hình:**
   ```bash
   sudo nano /etc/nginx/sites-available/app.tdphihung.id.vn
   ```

2. **Dán cấu hình cơ bản này vào:**
   > [!IMPORTANT]
   > Cấu hình này định tuyến đường dẫn `/api/` vào Backend (8081) và `/` vào Frontend (5174).

   ```nginx
   server {
       listen 80;
       server_name app.tdphihung.id.vn;

       location /api/ {
           proxy_pass http://localhost:8081; # Lưu ý không có dấu / ở cuối
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location / {
           proxy_pass http://localhost:5174;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }
   }
   ```

3. **Kích hoạt Nginx:**
   ```bash
   sudo rm /etc/nginx/sites-enabled/default
   sudo ln -s /etc/nginx/sites-available/app.tdphihung.id.vn /etc/nginx/sites-enabled/
   
   # Kiểm tra xem có gõ sai không
   sudo nginx -t
   
   # Chạy lại Nginx
   sudo systemctl reload nginx
   ```

---

## Bước 6: Cấu hình Cloudflare để chuẩn bị chạy Certbot

> [!WARNING]
> Vì Cloudflare đang chặn ở giữa (Proxy), nếu bạn chạy Certbot lúc này nó có thể bị lỗi xác thực. Để cài đặt Certbot chuẩn xác, bạn cần cấu hình lại Cloudflare một chút.

1. Vào trang quản lý của **Cloudflare**.
2. Chọn phần **SSL/TLS** -> **Overview**.
3. Chọn chế độ **Full (strict)**. (Chế độ này bắt buộc Server của bạn phải có chứng chỉ xịn từ Let's Encrypt - là thứ ta chuẩn bị cài).

---

## Bước 7: Cài Chứng Chỉ SSL bằng Certbot

Quay lại màn hình SSH của EC2, chạy lệnh sau để tự động lấy chứng chỉ và nhờ nó nhúng thẳng vào file Nginx ở Bước 5:

```bash
sudo certbot --nginx -d app.tdphihung.id.vn
```
- Khi được hỏi email, hãy nhập email của bạn.
- Bấm `Y` để đồng ý điều khoản.
- Certbot sẽ giao tiếp với Let's Encrypt. Nếu thành công, nó sẽ tự động thêm phần HTTPS (Listen 443 và đường dẫn đến chứng chỉ SSL) vào file config nginx của bạn và reload lại Nginx.

---

## Hoàn Tất! 🎉

Lúc này kiến trúc của bạn sẽ hoạt động hoàn hảo và siêu bảo mật:
- Trình duyệt (HTTPS) -> **Cloudflare** -> (HTTPS) -> **Nginx (Certbot SSL)** -> **Docker (Frontend/Backend)**.

Bạn chỉ cần truy cập `https://app.tdphihung.id.vn` là sẽ vào được Web. Khi bạn đăng nhập hay thao tác, trình duyệt sẽ ngầm gọi `https://app.tdphihung.id.vn/api/...` và chui lọt xuống đúng Spring Boot Backend!

package worksys.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import worksys.entity.User;
import worksys.repository.UserRepository;
import worksys.security.JwtUtil;
import worksys.service.EmailService;
import worksys.service.UserService;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final RedisTemplate<String, Object> redisTemplate;

    // Fallback in-memory cache nếu Redis tạm thời không khả dụng
    private static final ConcurrentHashMap<String, String> localOtpCache = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, Long> localOtpExpiry = new ConcurrentHashMap<>();

    public AuthController(UserService userService,
                          UserRepository userRepository,
                          JwtUtil jwtUtil,
                          EmailService emailService,
                          RedisTemplate<String, Object> redisTemplate) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Bước 1: Gửi mã OTP xác thực qua email trước khi tạo tài khoản
     */
    @PostMapping("/send-register-otp")
    public ResponseEntity<?> sendRegisterOtp(@RequestBody @Valid SendOtpRequest request) {
        String email = request.email != null ? request.email.trim().toLowerCase() : "";
        String username = request.username != null ? request.username.trim() : "";

        if (email.isBlank() || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng nhập đầy đủ tên đăng nhập và email."));
        }

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tên đăng nhập '" + username + "' đã được sử dụng. Vui lòng chọn tên khác."));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Địa chỉ email '" + email + "' đã được đăng ký tài khoản."));
        }

        // Sinh mã OTP 6 chữ số ngẫu nhiên
        String otp = String.format("%06d", new SecureRandom().nextInt(1000000));
        String redisKey = "reg_otp:" + email;

        // Lưu vào Redis (TTL 5 phút) kèm fallback RAM
        try {
            redisTemplate.opsForValue().set(redisKey, otp, Duration.ofMinutes(5));
        } catch (Exception e) {
            log.warn("Không thể lưu OTP vào Redis (sử dụng in-memory cache fallback): {}", e.getMessage());
            localOtpCache.put(redisKey, otp);
            localOtpExpiry.put(redisKey, System.currentTimeMillis() + 5 * 60 * 1000);
        }

        // Gửi email
        try {
            emailService.sendRegistrationOtp(email, otp);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Mã xác thực OTP đã được gửi đến " + email,
                "email", email
        ));
    }

    /**
     * Bước 2: Đối chiếu OTP và hoàn tất tạo tài khoản
     */
    @PostMapping("/verify-and-register")
    public ResponseEntity<?> verifyAndRegister(@RequestBody @Valid VerifyRegisterRequest request) {
        String email = request.email != null ? request.email.trim().toLowerCase() : "";
        String username = request.username != null ? request.username.trim() : "";
        String otp = request.otp != null ? request.otp.trim() : "";
        String password = request.password != null ? request.password : "";

        if (email.isBlank() || username.isBlank() || password.isBlank() || otp.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng điền đầy đủ thông tin và mã xác thực OTP."));
        }

        if (password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mật khẩu phải có tối thiểu 6 ký tự."));
        }

        String redisKey = "reg_otp:" + email;
        String cachedOtp = null;

        try {
            Object val = redisTemplate.opsForValue().get(redisKey);
            if (val != null) {
                cachedOtp = val.toString();
            }
        } catch (Exception e) {
            log.warn("Không thể lấy OTP từ Redis, kiểm tra local cache: {}", e.getMessage());
        }

        if (cachedOtp == null) {
            Long expiry = localOtpExpiry.get(redisKey);
            if (expiry != null && System.currentTimeMillis() <= expiry) {
                cachedOtp = localOtpCache.get(redisKey);
            }
        }

        if (cachedOtp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mã xác thực OTP đã hết hạn hoặc không tồn tại. Vui lòng bấm 'Gửi lại mã'."));
        }

        if (!cachedOtp.equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mã xác thực OTP không chính xác. Vui lòng thử lại."));
        }

        // Kiểm tra lại tính duy nhất trước khi tạo tài khoản
        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tên đăng nhập đã được sử dụng."));
        }
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Địa chỉ email đã được sử dụng."));
        }

        try {
            User user = userService.createUser(username, email, password);

            // Xóa mã OTP sau khi dùng xong
            try {
                redisTemplate.delete(redisKey);
            } catch (Exception ignored) {}
            localOtpCache.remove(redisKey);
            localOtpExpiry.remove(redisKey);

            String token = jwtUtil.generateToken(user.getId(), user.getUsername());
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("token", token);
            body.put("id", user.getId());
            body.put("username", user.getUsername());
            body.put("email", user.getEmail());
            body.put("avatarUrl", user.getAvatarUrl());
            body.put("systemRole", user.getSystemRole());
            body.put("status", user.getStatus());
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Không thể tạo tài khoản: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterRequest request) {
        try {
            User user = userService.createUser(request.username, request.email, request.password);
            String token = jwtUtil.generateToken(user.getId(), user.getUsername());
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("token", token);
            body.put("id", user.getId());
            body.put("username", user.getUsername());
            body.put("email", user.getEmail());
            body.put("avatarUrl", user.getAvatarUrl());
            body.put("systemRole", user.getSystemRole());
            body.put("status", user.getStatus());
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username hoặc email đã tồn tại"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(request.username, request.password);
            String token = jwtUtil.generateToken(user.getId(), user.getUsername());
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("token", token);
            body.put("id", user.getId());
            body.put("username", user.getUsername());
            body.put("email", user.getEmail());
            body.put("avatarUrl", user.getAvatarUrl());
            body.put("systemRole", user.getSystemRole());
            body.put("status", user.getStatus());
            return ResponseEntity.ok(body);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            String username = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getName();
            userService.changePassword(username, request.oldPassword, request.newPassword);
            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class SendOtpRequest {
        @NotBlank(message = "Tên đăng nhập không được để trống")
        public String username;

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        public String email;
    }

    public static class VerifyRegisterRequest {
        @NotBlank(message = "Tên đăng nhập không được để trống")
        public String username;

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        public String email;

        @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
        public String password;

        @NotBlank(message = "Vui lòng nhập mã OTP")
        public String otp;
    }

    public static class LoginRequest {
        public String username;
        public String password;
    }

    public static class RegisterRequest {
        public String username;
        public String email;
        @Size(min = 6, message = "Mật khẩu tối thiếu 6 ký tự")
        public String password;
    }

    public static class ChangePasswordRequest {
        public String oldPassword;
        public String newPassword;
    }
}

package trandinhphihung_project.Task.Management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import trandinhphihung_project.Task.Management.entity.User;
import trandinhphihung_project.Task.Management.security.JwtUtil;
import trandinhphihung_project.Task.Management.service.UserService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterRequest request) {
        try {
            User user = userService.createUser(request.username, request.email, request.password);
            String token = jwtUtil.generateToken(user.getId(), user.getUsername());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "email", user.getEmail()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username hoặc email đã tồn tại"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(request.username, request.password);
            String token = jwtUtil.generateToken(user.getId(), user.getUsername());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "email", user.getEmail()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            // Lấy user từ token (đã lưu trong SecurityContext bằng JwtFilter)
            String username = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getName();
            userService.changePassword(username, request.oldPassword, request.newPassword);
            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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

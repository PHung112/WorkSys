package trandinhphihung_project.Task.Management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import trandinhphihung_project.Task.Management.entity.User;
import trandinhphihung_project.Task.Management.service.UserService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Lấy user theo ID
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // Lấy tất cả user
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // Tìm kiếm user theo username
    @GetMapping("/search")
    public List<User> searchUsers(@RequestParam String q) {
        return userService.searchByUsername(q);
    }

    // Cập nhật user - nhận JSON từ body
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody @Valid UpdateUserRequest request) {
        return userService.updateUser(id, request.username, request.email, request.password);
    }

    // Update avatar URL (after uploading to Cloudinary)
    @PutMapping("/{id}/avatar")
    public ResponseEntity<?> updateAvatar(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String avatarUrl = request.get("avatarUrl");
            if (avatarUrl == null || avatarUrl.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Avatar URL không được để trống"));
            }

            User updatedUser = userService.updateAvatar(id, avatarUrl);

            return ResponseEntity.ok(Map.of(
                    "avatarUrl", updatedUser.getAvatarUrl(),
                    "message", "Avatar updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Xóa user
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    // DTO classes
    public static class CreateUserRequest {
        public String username;
        public String email;
        @Size(min = 6, message = "Mật khẩu tối thiếu 6 ký tự")
        public String password;
    }

    public static class UpdateUserRequest {
        public String username;
        public String email;
        public String password; // Optional
    }
}

package trandinhphihung_project.Task.Management.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import trandinhphihung_project.Task.Management.entity.User;
import trandinhphihung_project.Task.Management.repository.UserRepository;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Tạo user mới
    public User createUser(String username, String email, String password) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    // Lấy user theo ID
    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Lấy tất cả user
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Cập nhật user
    public User updateUser(Long id, String username, String email, String password) {
        User user = getUserById(id);
        if (username != null)
            user.setUsername(username);
        if (email != null)
            user.setEmail(email);
        if (password != null)
            user.setPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    // Tìm kiếm user theo username
    public List<User> searchByUsername(String keyword) {
        return userRepository.findByUsernameContainingIgnoreCase(keyword);
    }

    // Xóa user
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public User login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Tên đăng nhập hoặc Mật khẩu không chính xác!"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Tên đăng nhập hoặc Mật khẩu không chính xác!");
        }
        return user;
    }

    // Xử lý đăng nhập/đăng ký bằng Google OAuth2
    public User findOrCreateGoogleUser(String email, String googleId, String name, String avatarUrl) {
        // B2: Tìm user theo email
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            // B3.2: Nếu user đã tồn tại → cập nhật Google info
            User user = existingUser.get();
            user.setGoogleId(googleId);
            user.setAvatarUrl(avatarUrl);
            return userRepository.save(user);
        } else {
            // B3.1: Nếu user chưa tồn tại → tạo user mới
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setGoogleId(googleId);
            newUser.setUsername(name != null ? name : email.split("@")[0]); // Mặc định username từ tên hoặc email
            newUser.setAvatarUrl(avatarUrl);
            newUser.setPassword(""); // Google user không cần password
            return userRepository.save(newUser);
        }
    }

    // Đổi mật khẩu
    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        // Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác");
        }

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // Cập nhật avatar user
    public User updateAvatar(Long userId, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
        user.setAvatarUrl(avatarUrl);
        return userRepository.save(user);
    }
}

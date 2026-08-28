package worksys.dto;

public class ProjectMemberDTO {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private String role;
    private String avatarUrl;

    public ProjectMemberDTO() {
    }

    public ProjectMemberDTO(Long id, Long userId, String username, String email, String role) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.role = role;
    }

    public ProjectMemberDTO(Long id, Long userId, String username, String email, String role, String avatarUrl) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.role = role;
        this.avatarUrl = avatarUrl;
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}

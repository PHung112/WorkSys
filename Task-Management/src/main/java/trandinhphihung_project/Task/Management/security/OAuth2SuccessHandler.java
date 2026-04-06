package trandinhphihung_project.Task.Management.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import trandinhphihung_project.Task.Management.entity.User;
import trandinhphihung_project.Task.Management.service.UserService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Value("${app.oauth2.redirect-url}")
    private String redirectUrl;

    public OAuth2SuccessHandler(@Lazy UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        // B4: Nhận thông tin từ Google
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        if (email == null || email.isEmpty()) {
            throw new IOException("Email không được trả về từ Google");
        }

        String googleId = oAuth2User.getName(); // Google Sub ID
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        // B3: Xử lý trong Database - Tìm hoặc tạo User
        User user = userService.findOrCreateGoogleUser(email, googleId, name, picture);

        // B5: Tạo JWT Token
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        // B6: Redirect về Frontend kèm token
        // Ví dụ:
        // http://localhost:5173/oauth/callback?token=...&id=...&username=...&email=...
        String targetUrl = redirectUrl + "/oauth/callback"
                + "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8)
                + "&id=" + user.getId()
                + "&username=" + URLEncoder.encode(user.getUsername(), StandardCharsets.UTF_8)
                + "&email=" + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8);

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}

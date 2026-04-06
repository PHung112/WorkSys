package trandinhphihung_project.Task.Management.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.oauth2.redirect-url}")
    private String redirectUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException exception) throws IOException, ServletException {
        // Redirect về frontend kèm error message (URL encode)
        String errorMessage = exception.getMessage() != null ? exception.getMessage() : "Đăng nhập Google thất bại";
        String encodedError = java.net.URLEncoder.encode(errorMessage, "UTF-8");
        String targetUrl = redirectUrl + "/oauth/callback?error=" + encodedError;
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}

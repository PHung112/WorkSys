package worksys.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import worksys.security.IdempotencyInterceptor;

import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final IdempotencyInterceptor idempotencyInterceptor;

    public WebMvcConfig(IdempotencyInterceptor idempotencyInterceptor) {
        this.idempotencyInterceptor = idempotencyInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Áp dụng Idempotency Interceptor cho toàn bộ API
        registry.addInterceptor(idempotencyInterceptor)
                .addPathPatterns("/api/**");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cấu hình để phục vụ các tệp tải lên từ thư mục /uploads
        String uploadDir = Paths.get("").toAbsolutePath().toString() + "/uploads/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDir)
                .setCachePeriod(3600);
    }
}

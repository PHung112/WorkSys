package worksys.config;

import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Cấu hình Redis Cache cho toàn bộ hệ thống WorkSys
 * Áp dụng Cache-Aside Pattern với TTL tự động và serialization an toàn (JSON).
 */
@Configuration
@EnableCaching
public class RedisConfig implements CachingConfigurer {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        RedisSerializer<Object> jsonSerializer = RedisSerializer.json();

        template.setKeySerializer(RedisSerializer.string());
        template.setHashKeySerializer(RedisSerializer.string());
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisSerializer<Object> jsonSerializer = RedisSerializer.json();

        // Cấu hình mặc định: TTL 10 phút, format JSON dễ đọc, key chuỗi UTF-8
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(RedisSerializer.string()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer));

        // Tùy chỉnh TTL cho từng vùng cache nghiệp vụ
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        // Danh sách dự án của user: TTL 10 phút
        cacheConfigurations.put("user_projects", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        // Chi tiết dự án: TTL 15 phút
        cacheConfigurations.put("project_details", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        // Báo cáo thống kê hiệu suất dự án: TTL 10 phút
        cacheConfigurations.put("project_analytics", defaultConfig.entryTtl(Duration.ofMinutes(10)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }

    @Override
    public CacheErrorHandler errorHandler() {
        // Tích hợp handler chống sập hệ thống khi Redis mất kết nối
        return new CustomCacheErrorHandler();
    }
}

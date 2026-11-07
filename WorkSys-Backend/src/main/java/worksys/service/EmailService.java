package worksys.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Gửi mã OTP xác thực đăng ký tài khoản qua Email
     * @param toEmail Địa chỉ email người nhận
     * @param otp Mã xác thực 6 chữ số
     */
    public void sendRegistrationOtp(String toEmail, String otp) {
        if (fromEmail == null || fromEmail.isBlank()) {
            log.warn("==================================================================");
            log.warn("[DEV MODE] Chưa cấu hình MAIL_USERNAME / MAIL_PASSWORD trong .env");
            log.warn("[DEV MODE] Mã OTP đăng ký cho email {}: {}", toEmail, otp);
            log.warn("==================================================================");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromEmail, "WorkSys Team");
            helper.setTo(toEmail);
            helper.setSubject("WorkSys - Mã xác thực đăng ký tài khoản: " + otp);

            String htmlContent = buildOtpEmailHtml(otp);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Đã gửi email OTP xác thực thành công tới: {}", toEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi khi gửi email xác thực tới {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Không thể gửi email xác thực: " + e.getMessage());
        } catch (Exception e) {
            log.error("Lỗi hệ thống khi gửi email tới {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Lỗi dịch vụ email: " + e.getMessage());
        }
    }

    private String buildOtpEmailHtml(String otp) {
        String template = """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 0; color: #f8fafc; }
                    .container { max-width: 520px; margin: 40px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
                    .header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; }
                    .content { padding: 32px 28px; line-height: 1.6; font-size: 15px; color: #cbd5e1; }
                    .otp-box { background-color: #0f172a; border: 2px dashed #4f46e5; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
                    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #818cf8; margin: 0; }
                    .expire-note { font-size: 13px; color: #94a3b8; margin-top: 10px; }
                    .footer { padding: 20px 28px; background-color: #0f172a; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>WORKSYS</h1>
                    </div>
                    <div class="content">
                        <p>Xin chào bạn,</p>
                        <p>Cảm ơn bạn đã lựa chọn hệ thống quản lý công việc <strong>WorkSys</strong>. Để hoàn tất quy trình kích hoạt tài khoản, vui lòng sử dụng mã xác thực bên dưới:</p>
                        <div class="otp-box">
                            <div class="otp-code">{{OTP}}</div>
                            <div class="expire-note">Mã này có hiệu lực trong vòng <strong>5 phút</strong>.</div>
                        </div>
                        <p style="font-size: 13px; color: #94a3b8;">Nếu bạn không thực hiện yêu cầu đăng ký này, vui lòng bỏ qua email. Tuyệt đối không chia sẻ mã này với bất kỳ ai để bảo vệ an toàn cho tài khoản.</p>
                    </div>
                    <div class="footer">
                        &copy; WorkSys Management System. Mọi quyền được bảo lưu.
                    </div>
                </div>
            </body>
            </html>
            """;
        return template.replace("{{OTP}}", otp);
    }
}

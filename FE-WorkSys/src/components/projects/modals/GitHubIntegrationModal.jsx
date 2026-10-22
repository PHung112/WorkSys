import { useState, useEffect } from "react";
import Modal from "../../common/Modal";
import { inputCls, labelCls, btnPrimary, btnSecondary } from "../../common/formStyles";
import projectApi from "../../../api/projectApi";

export default function GitHubIntegrationModal({
  isOpen,
  onClose,
  project,
  onSaved,
}) {
  const [githubRepo, setGithubRepo] = useState("");
  const [githubSecret, setGithubSecret] = useState("");
  const [ngrokBaseUrl, setNgrokBaseUrl] = useState("http://localhost:8080");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (project) {
      setGithubRepo(project.githubRepo || "");
      setGithubSecret(project.githubSecret || "");
      setErrorMessage("");
      setSuccessMessage("");
      setTestResult(null);
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  // Tính toán webhook payload URL hoàn chỉnh
  const cleanBase = ngrokBaseUrl.trim().replace(/\/+$/, "");
  const webhookUrl = `${cleanBase}/api/webhooks/github`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await projectApi.updateGithubConfig(project.id, {
        githubRepo: githubRepo.trim(),
        githubSecret: githubSecret.trim(),
      });
      setSuccessMessage("Đã lưu cấu hình GitHub Webhook thành công!");
      if (onSaved) {
        onSaved(res.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || "Không thể lưu cấu hình");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await projectApi.testGithubWebhook();
      setTestResult({
        success: true,
        data: res.data,
      });
    } catch (err) {
      setTestResult({
        success: false,
        error: err.response?.data?.message || err.message || "Không thể kết nối tới Webhook endpoint",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Modal title="🔗 Tích hợp GitHub Webhook (Smart Sync)" onClose={onClose}>
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar text-on-surface">
        {/* Giới thiệu ngắn */}
        <div className="p-3.5 bg-surface-container-high/60 border border-outline-variant/20 rounded-xl text-xs space-y-1.5">
          <p className="font-semibold text-primary flex items-center gap-1.5 m-0 text-sm">
            <span className="material-symbols-outlined text-[18px]">sync</span>
            Tự động đổi trạng thái Task khi Commit hoặc Merge Pull Request
          </p>
          <p className="text-on-surface-variant m-0">
            Khi thành viên đẩy commit <code className="bg-surface-container px-1.5 py-0.5 rounded text-amber-300 font-mono">done #12</code> hoặc <code className="bg-surface-container px-1.5 py-0.5 rounded text-amber-300 font-mono">fix #12</code>, thẻ task tương ứng sẽ tự động nhảy sang <strong>DONE</strong> trên bảng Kanban ngay lập tức!
          </p>
        </div>

        {/* Form cấu hình Repo */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelCls}>
              Repository GitHub (owner/repo hoặc link URL) *
            </label>
            <input
              type="text"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="ví dụ: phung112/WorkSys hoặc https://github.com/phung112/WorkSys"
              className={inputCls}
              required
            />
            <p className="text-[11px] text-on-surface-variant/70 mt-1">
              Nhập tên repository chứa source code của dự án này.
            </p>
          </div>

          <div>
            <label className={labelCls}>
              Webhook Secret (Tùy chọn - Bảo mật HMAC-SHA256)
            </label>
            <input
              type="text"
              value={githubSecret}
              onChange={(e) => setGithubSecret(e.target.value)}
              placeholder="Để trống nếu test local, hoặc nhập chuỗi secret bí mật"
              className={inputCls}
            />
            <p className="text-[11px] text-on-surface-variant/70 mt-1">
              Dùng để xác thực chữ ký chống giả mạo request từ GitHub. Nếu để trống, server sẽ nhận webhook mà không cần ký.
            </p>
          </div>

          {errorMessage && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
              {successMessage}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className={`${btnPrimary} flex items-center gap-1.5`}
            >
              {isSaving ? "Đang lưu..." : "Lưu cấu hình Repository"}
            </button>
          </div>
        </form>

        <hr className="border-outline-variant/15 my-2" />

        {/* Hướng dẫn Webhook với ngrok */}
        <div className="space-y-3">
          <h4 className="font-semibold text-xs tracking-wider uppercase text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
            Cấu hình Webhook trên GitHub (Test với ngrok ở máy bạn)
          </h4>

          {/* Ô nhập ngrok Domain */}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">
              Địa chỉ server Backend của bạn (Hoặc ngrok URL khi test local):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ngrokBaseUrl}
                onChange={(e) => setNgrokBaseUrl(e.target.value)}
                placeholder="ví dụ: https://a1b2-xxxx.ngrok-free.app"
                className={inputCls}
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-medium border border-outline-variant/20 transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                {isTesting ? "Đang kiểm tra..." : "Test Health"}
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-2.5 rounded-xl text-xs border ${
                testResult.success
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-red-500/10 border-red-500/20 text-red-300"
              }`}
            >
              {testResult.success ? (
                <span>✅ Webhook endpoint Backend đang ONLINE sẵn sàng tiếp nhận!</span>
              ) : (
                <span>❌ Không kết nối được tới Webhook endpoint: {testResult.error}</span>
              )}
            </div>
          )}

          {/* Link Webhook Payload URL để copy */}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">
              Payload URL cần dán vào GitHub:
            </label>
            <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2">
              <span className="font-mono text-xs text-primary truncate flex-1 select-all">
                {webhookUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied ? "check" : "content_copy"}
                </span>
                <span>{copied ? "Đã copy!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Các bước cấu hình trên GitHub */}
          <div className="p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl space-y-2 text-xs">
            <p className="font-semibold text-on-surface m-0">3 bước cài đặt trên GitHub:</p>
            <ol className="list-decimal pl-4 space-y-1 text-on-surface-variant m-0">
              <li>
                Mở Repo trên GitHub ➔ <strong>Settings</strong> ➔ <strong>Webhooks</strong> ➔ Bấm <strong>Add webhook</strong>.
              </li>
              <li>
                Dán <strong>Payload URL</strong> ở trên vào. Chọn <strong>Content type: <code className="text-primary font-mono font-bold">application/json</code></strong>.
              </li>
              <li>
                Ở mục <em>Which events would you like to trigger this webhook?</em> ➔ Chọn <strong>Let me select individual events</strong> ➔ Tích chọn: <strong>Pushes</strong> và <strong>Pull requests</strong> ➔ Bấm <strong>Add webhook</strong>.
              </li>
            </ol>
          </div>

          {/* Bảng Cheat Sheet cú pháp */}
          <div className="p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl space-y-2 text-xs">
            <p className="font-semibold text-on-surface m-0">Cú pháp Smart Commits được hỗ trợ:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-surface-container rounded-lg border border-outline-variant/10">
                <span className="font-mono text-emerald-400 font-bold block mb-0.5">
                  done #15, fix #15, closes #15
                </span>
                <span className="text-on-surface-variant">➔ Chuyển task sang <strong>DONE</strong></span>
              </div>
              <div className="p-2 bg-surface-container rounded-lg border border-outline-variant/10">
                <span className="font-mono text-blue-400 font-bold block mb-0.5">
                  start #15, doing #15
                </span>
                <span className="text-on-surface-variant">➔ Chuyển task sang <strong>IN_PROGRESS</strong></span>
              </div>
              <div className="p-2 bg-surface-container rounded-lg border border-outline-variant/10 col-span-1 sm:col-span-2">
                <span className="font-mono text-purple-400 font-bold block mb-0.5">
                  Tạo Pull Request có ghi "done #15" hoặc "fix #15"
                </span>
                <span className="text-on-surface-variant">
                  ➔ Khi mở PR: chuyển sang <strong>SUBMITTED</strong> (Chờ duyệt) <br />
                  ➔ Khi merge PR: chuyển sang <strong>DONE</strong> (Hoàn thành)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nút đóng */}
        <div className="flex justify-end pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}

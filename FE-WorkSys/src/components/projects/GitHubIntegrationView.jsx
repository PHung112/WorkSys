import { useState, useEffect } from "react";
import projectApi from "../../api/projectApi";
import { inputCls, labelCls, btnPrimary } from "../common/formStyles";

/**
 * Component quản lý cấu hình GitHub Webhook trực tiếp bên trong ProjectDetail (dạng Sub-View)
 */
export default function GitHubIntegrationView({
  selectedProject,
  onBackToKanban,
  onProjectUpdated,
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
    if (selectedProject) {
      setGithubRepo(selectedProject.githubRepo || "");
      setGithubSecret(selectedProject.githubSecret || "");
      setErrorMessage("");
      setSuccessMessage("");
      setTestResult(null);
    }
  }, [selectedProject]);

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
      const res = await projectApi.updateGithubConfig(selectedProject.id, {
        githubRepo: githubRepo.trim(),
        githubSecret: githubSecret.trim(),
      });
      setSuccessMessage("Đã lưu cấu hình GitHub Webhook thành công!");
      if (onProjectUpdated) {
        onProjectUpdated(res.data);
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
    <div className="flex-1 flex flex-col w-full h-full px-container-margin overflow-y-auto custom-scrollbar pb-12">
      {/* Header thanh điều hướng */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToKanban}
            className="h-9 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg flex items-center gap-1.5 text-xs font-medium border border-outline-variant/20 transition-colors cursor-pointer"
            title="Quay lại Bảng công việc Kanban"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Bảng công việc</span>
          </button>
          <div className="h-4 w-px bg-outline-variant/20 hidden sm:block"></div>
          <div>
            <h2 className="font-display text-xl font-bold text-on-background flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-[24px] text-primary">sync_alt</span>
              <span>Tích hợp GitHub Webhook (Smart Sync)</span>
              {selectedProject?.githubRepo && (
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Đã liên kết
                </span>
              )}
            </h2>
            <p className="text-on-surface-variant text-xs mt-0.5">
              Tự động hóa quy trình làm việc: Chuyển trạng thái nhiệm vụ khi lập trình viên Commit hoặc Merge Pull Request
            </p>
          </div>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="h-9 px-3.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg flex items-center gap-1.5 text-xs font-medium border border-outline-variant/20 transition-colors cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">wifi_tethering</span>
          <span>{isTesting ? "Đang kiểm tra..." : "Kiểm tra Webhook"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Cột trái: Form cấu hình (5 cột) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-display text-base font-bold text-on-background flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-[20px] text-primary">settings</span>
              <span>Cài đặt Repository</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className={labelCls}>
                  Repository GitHub (owner/repo hoặc link URL) *
                </label>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="ví dụ: phung112/WorkSys"
                  className={inputCls}
                  required
                />
                <p className="text-[11px] text-on-surface-variant/70 mt-1">
                  Nhập tên repository chứa mã nguồn của dự án này.
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
                  placeholder="Để trống nếu test local, hoặc nhập chuỗi bí mật"
                  className={inputCls}
                />
                <p className="text-[11px] text-on-surface-variant/70 mt-1">
                  Nếu để trống, server sẽ chấp nhận webhook mà không cần ký xác thực.
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

              <button
                type="submit"
                disabled={isSaving}
                className={`${btnPrimary} w-full flex items-center justify-center gap-1.5 cursor-pointer py-2.5`}
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{isSaving ? "Đang lưu..." : "Lưu cấu hình Repository"}</span>
              </button>
            </form>
          </div>

          {/* Test Health Result */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs border ${
                testResult.success
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-red-500/10 border-red-500/20 text-red-300"
              }`}
            >
              {testResult.success ? (
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-1.5 m-0 text-sm">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Webhook Endpoint đang ONLINE!
                  </p>
                  <p className="m-0 text-on-surface-variant text-[11px]">
                    Backend đã sẵn sàng tiếp nhận các sự kiện push và pull_request từ GitHub.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-1.5 m-0 text-sm">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    Không thể kết nối:
                  </p>
                  <p className="m-0 text-xs">{testResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cột phải: Hướng dẫn cài đặt & Cú pháp Smart Commits (7 cột) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card Webhook URL */}
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-display text-base font-bold text-on-background flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-[20px] text-primary">link</span>
              <span>Payload URL dành cho GitHub</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Địa chỉ Backend hoặc ngrok URL (khi test local):
              </label>
              <input
                type="text"
                value={ngrokBaseUrl}
                onChange={(e) => setNgrokBaseUrl(e.target.value)}
                placeholder="ví dụ: https://a1b2-xxxx.ngrok-free.app"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Payload URL cần dán vào GitHub:
              </label>
              <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2">
                <span className="font-mono text-xs text-primary truncate flex-1 select-all font-semibold">
                  {webhookUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copied ? "check" : "content_copy"}
                  </span>
                  <span>{copied ? "Đã copy!" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card Các bước cài đặt GitHub */}
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-display text-base font-bold text-on-background flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-[20px] text-amber-400">checklist</span>
              <span>3 bước cấu hình trên GitHub</span>
            </h3>
            <ol className="list-decimal pl-4 space-y-2 text-on-surface-variant m-0 leading-relaxed">
              <li>
                Mở Repo trên GitHub ➔ <strong>Settings</strong> ➔ Chọn tab <strong>Webhooks</strong> ở menu bên trái ➔ Bấm <strong>Add webhook</strong>.
              </li>
              <li>
                Dán <strong>Payload URL</strong> ở ô trên vào. Mục <strong>Content type</strong>: Chọn <code className="text-primary font-mono font-bold bg-surface-container px-1.5 py-0.5 rounded">application/json</code>.
              </li>
              <li>
                Ở mục <em>Which events would you like to trigger this webhook?</em> ➔ Chọn <strong>Let me select individual events</strong> ➔ Tích chọn: <strong>Pushes</strong> và <strong>Pull requests</strong> ➔ Bấm <strong>Add webhook</strong>.
              </li>
            </ol>
          </div>

          {/* Card Cú pháp Smart Commits */}
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-display text-base font-bold text-on-background flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-[20px] text-purple-400">magic_button</span>
              <span>Cú pháp Smart Commits tự động đổi trạng thái</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/10">
                <span className="font-mono text-emerald-400 font-bold block mb-1 text-xs">
                  done #15, fix #15, closes #15
                </span>
                <span className="text-on-surface-variant text-[11px]">
                  ➔ Tự động chuyển Task sang <strong>DONE</strong> và lưu link commit!
                </span>
              </div>

              <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/10">
                <span className="font-mono text-blue-400 font-bold block mb-1 text-xs">
                  start #15, doing #15
                </span>
                <span className="text-on-surface-variant text-[11px]">
                  ➔ Tự động chuyển Task từ TODO sang <strong>IN_PROGRESS</strong>.
                </span>
              </div>

              <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/10 col-span-1 sm:col-span-2">
                <span className="font-mono text-purple-400 font-bold block mb-1 text-xs">
                  Pull Request chứa mã "done #15" hoặc "fix #15"
                </span>
                <span className="text-on-surface-variant text-[11px] leading-relaxed block">
                  ➔ <strong>Khi mở PR:</strong> chuyển sang <strong>SUBMITTED</strong> (Đã nộp, chờ duyệt code). <br />
                  ➔ <strong>Khi merge PR:</strong> chuyển sang <strong>DONE</strong> (Hoàn thành nhiệm vụ)!
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

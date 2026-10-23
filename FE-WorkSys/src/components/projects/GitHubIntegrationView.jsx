import { useState, useEffect, useMemo } from "react";
import githubApi from "../../api/githubApi";
import projectApi from "../../api/projectApi";
import { inputCls, labelCls, btnPrimary } from "../common/formStyles";

/**
 * Sub-View Tích hợp GitHub: Hỗ trợ KẾT NỐI 1-CLICK (Tự động tạo Webhook qua GitHub API)
 * và Cấu hình thủ công (Manual Fallback).
 */
export default function GitHubIntegrationView({
  selectedProject,
  onBackToKanban,
  onProjectUpdated,
}) {
  // Tab chế độ: "1click" (Khuyên dùng) hoặc "manual" (Thủ công)
  const [activeMode, setActiveMode] = useState("1click");

  // Trạng thái tài khoản GitHub của người dùng hiện tại
  const [userStatus, setUserStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Danh sách repositories lấy từ GitHub
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");

  // Cấu hình URL Webhook
  const [webhookBaseUrl, setWebhookBaseUrl] = useState("https://worksys-phung.loca.lt");
  const [customTunnelUrl, setCustomTunnelUrl] = useState("");

  // Form Token kết nối
  const [tokenInput, setTokenInput] = useState("");
  const [isConnectingToken, setIsConnectingToken] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Thao tác 1-Click
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Manual Mode State
  const [manualRepo, setManualRepo] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [copiedManual, setCopiedManual] = useState(false);

  // Test Webhook Health Check
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Thông báo phản hồi
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  // 1. Tải trạng thái tài khoản GitHub của user
  const fetchUserStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await githubApi.getStatus();
      setUserStatus(res.data);
      if (res.data.defaultWebhookBaseUrl) {
        setWebhookBaseUrl(res.data.defaultWebhookBaseUrl);
        setCustomTunnelUrl(res.data.defaultWebhookBaseUrl);
      }
      if (res.data.connected) {
        fetchRepos();
      }
    } catch (err) {
      console.error("Lỗi lấy trạng thái GitHub:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  // 2. Tải danh sách Repositories
  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await githubApi.getRepos();
      setRepos(res.data || []);

      // Tự động chọn repo nếu tên trùng hoặc gần giống tên dự án
      if (selectedProject?.name && res.data?.length > 0) {
        const pName = selectedProject.name.toLowerCase().trim();
        const matched = res.data.find(
          (r) =>
            r.name.toLowerCase() === pName ||
            r.name.toLowerCase().includes(pName) ||
            pName.includes(r.name.toLowerCase())
        );
        if (matched) {
          setSelectedRepo(matched.fullName);
        } else if (res.data[0]) {
          setSelectedRepo(res.data[0].fullName);
        }
      }
    } catch (err) {
      console.error("Lỗi lấy repositories:", err);
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    fetchUserStatus();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      setManualRepo(selectedProject.githubRepo || "");
      setManualSecret(selectedProject.githubSecret || "");
      if (selectedProject.githubRepo) {
        setSelectedRepo(selectedProject.githubRepo);
      }
    }
  }, [selectedProject]);

  // Lọc repo theo từ khóa tìm kiếm
  const filteredRepos = useMemo(() => {
    if (!repoSearch.trim()) return repos;
    return repos.filter((r) =>
      r.fullName.toLowerCase().includes(repoSearch.toLowerCase().trim())
    );
  }, [repos, repoSearch]);

  // Xử lý liên kết tài khoản bằng Token
  const handleConnectToken = async (e) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsConnectingToken(true);
    setFeedback(null);
    try {
      const res = await githubApi.connectToken(tokenInput.trim());
      setFeedback({ type: "success", text: res.data.message || "Liên kết GitHub thành công!" });
      setTokenInput("");
      setShowTokenInput(false);
      await fetchUserStatus();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || err.message || "Không thể xác thực GitHub Token",
      });
    } finally {
      setIsConnectingToken(false);
    }
  };

  // Xử lý ngắt kết nối tài khoản GitHub người dùng
  const handleDisconnectUser = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn ngắt kết nối tài khoản GitHub khỏi hệ thống?")) return;
    try {
      await githubApi.disconnectUser();
      setUserStatus((prev) => ({ ...prev, connected: false, username: null }));
      setRepos([]);
      setFeedback({ type: "success", text: "Đã ngắt kết nối tài khoản GitHub." });
    } catch (err) {
      setFeedback({ type: "error", text: "Lỗi khi ngắt kết nối tài khoản." });
    }
  };

  // KÍCH HOẠT WEBHOOK 1-CLICK
  const handleAutoConnect = async () => {
    if (!selectedRepo) {
      setFeedback({ type: "error", text: "Vui lòng chọn một Repository từ danh sách!" });
      return;
    }

    setIsAutoConnecting(true);
    setFeedback(null);

    try {
      const targetTunnel = customTunnelUrl.trim() || webhookBaseUrl;
      const res = await githubApi.autoConnectProject(selectedProject.id, {
        repoFullName: selectedRepo,
        customWebhookUrl: targetTunnel,
      });

      setFeedback({
        type: "success",
        text: `⚡ Kích hoạt Webhook 1-Click thành công trên repository "${selectedRepo}"!`,
      });

      if (onProjectUpdated && res.data?.project) {
        onProjectUpdated(res.data.project);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || err.message || "Lỗi khi tự động kích hoạt Webhook",
      });
    } finally {
      setIsAutoConnecting(false);
    }
  };

  // NGẮT KẾT NỐI REPOSITORY KHỎI DỰ ÁN
  const handleDisconnectProject = async () => {
    if (
      !window.confirm(
        `Bạn có chắc muốn ngắt kết nối dự án khỏi repository "${selectedProject.githubRepo}"? Webhook trên GitHub sẽ được tự động xóa.`
      )
    ) {
      return;
    }

    setIsDisconnecting(true);
    setFeedback(null);
    try {
      const res = await githubApi.disconnectProject(selectedProject.id);
      setFeedback({
        type: "success",
        text: "Đã ngắt kết nối repository và gỡ bỏ Webhook thành công!",
      });
      if (onProjectUpdated && res.data?.project) {
        onProjectUpdated(res.data.project);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || err.message || "Lỗi khi ngắt kết nối dự án",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Lưu cấu hình thủ công (Manual)
  const handleSaveManual = async (e) => {
    e.preventDefault();
    setIsSavingManual(true);
    setFeedback(null);
    try {
      const res = await projectApi.updateGithubConfig(selectedProject.id, {
        githubRepo: manualRepo.trim(),
        githubSecret: manualSecret.trim(),
      });
      setFeedback({ type: "success", text: "Đã lưu cấu hình thủ công thành công!" });
      if (onProjectUpdated) {
        onProjectUpdated(res.data);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || err.message || "Không thể lưu cấu hình",
      });
    } finally {
      setIsSavingManual(false);
    }
  };

  // Test Webhook endpoint health
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await projectApi.testGithubWebhook();
      setTestResult({ success: true, data: res.data });
    } catch (err) {
      setTestResult({
        success: false,
        error: err.response?.data?.message || err.message || "Không thể kết nối tới Webhook endpoint",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const manualWebhookUrl = `${customTunnelUrl.trim().replace(/\/+$/, "") || "http://localhost:8080"}/api/webhooks/github`;

  return (
    <div className="flex-1 flex flex-col w-full h-full px-container-margin overflow-y-auto custom-scrollbar pb-12">
      {/* Header thanh điều hướng & Tabs */}
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
              <span>Tích hợp GitHub (1-Click Smart Sync)</span>
              {selectedProject?.githubRepo && (
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Đang hoạt động: {selectedProject.githubRepo}
                </span>
              )}
            </h2>
            <p className="text-on-surface-variant text-xs mt-0.5">
              Tự động hóa hoàn toàn: Chọn Repo ➔ 1 Click kích hoạt Webhook ➔ Chuyển trạng thái Task khi commit hoặc merge PR
            </p>
          </div>
        </div>

        {/* Nút chuyển chế độ 1-Click vs Thủ công & Test */}
        <div className="flex items-center gap-2">
          <div className="bg-surface-container p-0.5 rounded-lg border border-outline-variant/20 flex text-xs">
            <button
              onClick={() => setActiveMode("1click")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === "1click"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">bolt</span>
              <span>1-Click Auto</span>
            </button>
            <button
              onClick={() => setActiveMode("manual")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === "manual"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">tune</span>
              <span>Thủ công (Manual)</span>
            </button>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="h-8 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg flex items-center gap-1.5 text-xs font-medium border border-outline-variant/20 transition-colors cursor-pointer shrink-0"
            title="Kiểm tra xem Webhook Endpoint Backend có đang Online không"
          >
            <span className="material-symbols-outlined text-[15px] text-primary">wifi_tethering</span>
            <span>{isTesting ? "..." : "Kiểm tra Webhook"}</span>
          </button>
        </div>
      </div>

      {/* Thông báo Alert */}
      {feedback && (
        <div
          className={`mt-4 p-3.5 rounded-xl text-xs border flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-red-500/10 border-red-500/20 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {feedback.type === "success" ? "check_circle" : "error"}
            </span>
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Test Health Result */}
      {testResult && (
        <div
          className={`mt-3 p-3.5 rounded-xl text-xs border ${
            testResult.success
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-red-500/10 border-red-500/20 text-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="font-bold flex items-center gap-1.5 m-0 text-xs">
              <span className="material-symbols-outlined text-[16px]">
                {testResult.success ? "check_circle" : "error"}
              </span>
              {testResult.success
                ? "Webhook Endpoint đang ONLINE! Đã sẵn sàng tiếp nhận push & PR."
                : `Không thể kết nối: ${testResult.error}`}
            </p>
            <button
              onClick={() => setTestResult(null)}
              className="text-on-surface-variant hover:text-on-surface text-[11px] underline cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CHẾ ĐỘ 1: KẾT NỐI 1-CLICK TỰ ĐỘNG (RECOMMENDED) */}
      {/* ======================================================== */}
      {activeMode === "1click" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
          {/* CỘT TRÁI (7 CỘT): KHỐI THAO TÁC 1-CLICK */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. KHỐI TRẠNG THÁI LIÊN KẾT TÀI KHOẢN GITHUB */}
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-on-background m-0">
                      Tài khoản GitHub
                    </h3>
                    <p className="text-[11px] text-on-surface-variant m-0">
                      {userStatus?.connected
                        ? `Đã liên kết với @${userStatus.username}`
                        : "Chưa liên kết tài khoản GitHub"}
                    </p>
                  </div>
                </div>

                {userStatus?.connected ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-md font-mono text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      @{userStatus.username}
                    </span>
                    <button
                      onClick={handleDisconnectUser}
                      className="px-2.5 py-1 bg-surface-container hover:bg-red-500/10 hover:text-red-400 text-on-surface-variant rounded-md text-xs border border-outline-variant/20 transition-colors cursor-pointer"
                      title="Ngắt kết nối tài khoản này"
                    >
                      Đổi tài khoản
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTokenInput(!showTokenInput)}
                    className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-on-primary rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_link</span>
                    <span>Kết nối tài khoản</span>
                  </button>
                )}
              </div>

              {/* Form nhập Token (Hiện khi chưa kết nối hoặc khi user muốn đổi) */}
              {(!userStatus?.connected || showTokenInput) && (
                <div className="p-4 bg-surface-container/60 rounded-xl border border-outline-variant/20 space-y-3 mt-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-on-background m-0 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-amber-400">key</span>
                        <span>Nhập GitHub Personal Access Token (PAT)</span>
                      </h4>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                        Chỉ cần tạo Token 1 lần (cần quyền <code className="text-primary font-bold">repo</code> và{" "}
                        <code className="text-primary font-bold">admin:repo_hook</code>). Hệ thống sẽ tự động ghi nhớ cho các dự án sau!
                      </p>
                    </div>

                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo,admin:repo_hook&description=WorkSys-Integration"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-primary border border-primary/20 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0 whitespace-nowrap"
                    >
                      <span>Tạo Token trên GitHub</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  </div>

                  <form onSubmit={handleConnectToken} className="flex gap-2">
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="Dán token ghp_xxxx vào đây..."
                      className={`${inputCls} text-xs font-mono flex-1`}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isConnectingToken || !tokenInput.trim()}
                      className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-on-primary rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isConnectingToken ? "hourglass_empty" : "check"}
                      </span>
                      <span>{isConnectingToken ? "Đang kiểm tra..." : "Xác nhận"}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* 2. KHỐI TRẠNG THÁI REPOSITORY CỦA DỰ ÁN */}
            {selectedProject?.githubRepo ? (
              // Trạng thái: DỰ ÁN ĐÃ KẾT NỐI REPO
              <div className="bg-gradient-to-br from-emerald-500/10 via-surface-container-low to-surface-container-low border border-emerald-500/30 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <span className="material-symbols-outlined text-[24px]">verified</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        Webhook 1-Click đang hoạt động
                      </span>
                      <h3 className="font-display text-base font-bold text-on-background m-0 flex items-center gap-2">
                        <span>{selectedProject.githubRepo}</span>
                        <a
                          href={`https://github.com/${selectedProject.githubRepo}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-on-surface-variant hover:text-primary transition-colors"
                          title="Mở repository trên GitHub"
                        >
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        </a>
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={handleDisconnectProject}
                    disabled={isDisconnecting}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">link_off</span>
                    <span>{isDisconnecting ? "Đang hủy..." : "Ngắt kết nối"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-outline-variant/10 text-xs">
                  <div className="bg-surface-container/60 p-2.5 rounded-xl border border-outline-variant/10">
                    <span className="text-on-surface-variant text-[11px] block">Tự động bắt sự kiện:</span>
                    <span className="font-bold text-on-surface mt-0.5 block">Push & Pull Requests</span>
                  </div>
                  <div className="bg-surface-container/60 p-2.5 rounded-xl border border-outline-variant/10">
                    <span className="text-on-surface-variant text-[11px] block">Bảo mật HMAC:</span>
                    <span className="font-bold text-emerald-400 mt-0.5 block">Đã mã hóa SHA-256</span>
                  </div>
                  <div className="bg-surface-container/60 p-2.5 rounded-xl border border-outline-variant/10 col-span-2 sm:col-span-1">
                    <span className="text-on-surface-variant text-[11px] block">Webhook ID GitHub:</span>
                    <span className="font-mono font-bold text-primary mt-0.5 block">
                      #{selectedProject.githubWebhookId || "Managed"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // Trạng thái: DỰ ÁN CHƯA KẾT NỐI REPO ➔ CHO CHỌN REPO & 1-CLICK KÍCH HOẠT
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="font-display text-base font-bold text-on-background flex items-center gap-2 m-0">
                    <span className="material-symbols-outlined text-[20px] text-primary">bolt</span>
                    <span>Chọn Repository để kích hoạt 1-Click</span>
                  </h3>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Chọn repo của bạn từ danh sách bên dưới, hệ thống sẽ tự động cấu hình Webhook trên GitHub chỉ bằng 1 nút bấm!
                  </p>
                </div>

                {!userStatus?.connected ? (
                  <div className="p-6 bg-surface-container rounded-xl border border-dashed border-outline-variant/30 text-center space-y-3">
                    <span className="material-symbols-outlined text-[36px] text-primary">hub</span>
                    <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                      Vui lòng kết nối tài khoản GitHub ở trên để WorkSys tự động tải danh sách các Repositories của bạn.
                    </p>
                    <button
                      onClick={() => setShowTokenInput(true)}
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-on-primary rounded-lg text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">key</span>
                      <span>Kết nối Token ngay</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Ô tìm kiếm & Dropdown chọn Repository */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-on-surface-variant">
                          Chọn Repository GitHub ({repos.length} repos) *
                        </label>
                        <button
                          type="button"
                          onClick={fetchRepos}
                          disabled={loadingRepos}
                          className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {loadingRepos ? "hourglass_empty" : "refresh"}
                          </span>
                          <span>Làm mới danh sách</span>
                        </button>
                      </div>

                      {/* Filter Search */}
                      <div className="relative mb-2">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[16px]">
                          search
                        </span>
                        <input
                          type="text"
                          value={repoSearch}
                          onChange={(e) => setRepoSearch(e.target.value)}
                          placeholder="Lọc nhanh theo tên repo (ví dụ: portfolio, worksys...)"
                          className={`${inputCls} text-xs pl-9`}
                        />
                      </div>

                      {/* Danh sách chọn Repo */}
                      <div className="max-h-52 overflow-y-auto custom-scrollbar border border-outline-variant/20 rounded-xl bg-surface-container divide-y divide-outline-variant/10">
                        {loadingRepos ? (
                          <div className="p-4 text-center text-xs text-on-surface-variant">
                            Đang tải danh sách Repositories...
                          </div>
                        ) : filteredRepos.length === 0 ? (
                          <div className="p-4 text-center text-xs text-on-surface-variant italic">
                            Không tìm thấy repository nào phù hợp
                          </div>
                        ) : (
                          filteredRepos.map((repo) => (
                            <div
                              key={repo.id}
                              onClick={() => setSelectedRepo(repo.fullName)}
                              className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                selectedRepo === repo.fullName
                                  ? "bg-primary/15 border-l-4 border-primary text-on-background font-bold"
                                  : "hover:bg-surface-container-high text-on-surface"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                                  {repo.isPrivate ? "lock" : "public"}
                                </span>
                                <span className="truncate">{repo.fullName}</span>
                              </div>
                              {selectedRepo === repo.fullName && (
                                <span className="material-symbols-outlined text-primary text-[18px]">
                                  check_circle
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Cấu hình URL Tunnel / ngrok (cho phép tùy chỉnh nếu chạy localtunnel khác) */}
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Địa chỉ Webhook Base URL (localtunnel / ngrok):
                      </label>
                      <input
                        type="text"
                        value={customTunnelUrl}
                        onChange={(e) => setCustomTunnelUrl(e.target.value)}
                        placeholder="https://worksys-phung.loca.lt"
                        className={`${inputCls} text-xs font-mono`}
                      />
                      <p className="text-[11px] text-on-surface-variant/70 mt-1">
                        Hệ thống tự động nối thêm <code className="text-primary font-bold">/api/webhooks/github</code> vào sau URL này.
                      </p>
                    </div>

                    {/* NÚT KÍCH HOẠT 1-CLICK */}
                    <button
                      type="button"
                      onClick={handleAutoConnect}
                      disabled={isAutoConnecting || !selectedRepo}
                      className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 disabled:opacity-50 text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isAutoConnecting ? "hourglass_empty" : "bolt"}
                      </span>
                      <span>
                        {isAutoConnecting
                          ? "Đang tự động thiết lập Webhook..."
                          : `Kích hoạt Webhook 1-Click cho ${selectedRepo || "dự án"}`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CỘT PHẢI (5 CỘT): HƯỚNG DẪN CÚ PHÁP SMART COMMITS */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
              <h3 className="font-display text-base font-bold text-on-background flex items-center gap-2 m-0">
                <span className="material-symbols-outlined text-[20px] text-purple-400">magic_button</span>
                <span>Cú pháp Smart Commits</span>
              </h3>
              <p className="text-on-surface-variant text-xs m-0">
                Khi lập trình viên commit hoặc merge PR trên GitHub, hệ thống tự động nhận diện và cập nhật trạng thái nhiệm vụ:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-emerald-400 font-bold text-xs">
                      done #&lt;id&gt;
                    </span>
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded">
                      HOÀN THÀNH
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-[11px] m-0">
                    Ví dụ: <code className="text-primary font-bold">git commit -m "done #5 fix bug login"</code>
                    <br />➔ Tự động chuyển Task #5 sang <strong>DONE</strong> và lưu link commit!
                  </p>
                </div>

                <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-blue-400 font-bold text-xs">
                      start #&lt;id&gt;
                    </span>
                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded">
                      ĐANG LÀM
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-[11px] m-0">
                    Ví dụ: <code className="text-primary font-bold">git commit -m "start #5 bat dau lam"</code>
                    <br />➔ Tự động chuyển Task #5 sang <strong>IN_PROGRESS</strong>.
                  </p>
                </div>

                <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-purple-400 font-bold text-xs">
                      Pull Request (PR)
                    </span>
                    <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded">
                      TỰ ĐỘNG SYNC
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-[11px] m-0 leading-relaxed">
                    ➔ <strong>Mở PR</strong> có chứa <code className="text-primary">done #5</code>: Task chuyển sang <strong>SUBMITTED</strong> (chờ duyệt).
                    <br />➔ <strong>Khi PR được Merge</strong>: Task tự động sang <strong>DONE</strong>!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CHẾ ĐỘ 2: CẤU HÌNH THỦ CÔNG (MANUAL FALLBACK) */}
      {/* ======================================================== */}
      {activeMode === "manual" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
          {/* Cột trái: Form cấu hình thủ công */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-display text-base font-bold text-on-background flex items-center gap-2 m-0">
                <span className="material-symbols-outlined text-[20px] text-primary">settings</span>
                <span>Cấu hình thủ công Repository</span>
              </h3>

              <form onSubmit={handleSaveManual} className="space-y-4">
                <div>
                  <label className={labelCls}>
                    Repository GitHub (owner/repo hoặc link URL) *
                  </label>
                  <input
                    type="text"
                    value={manualRepo}
                    onChange={(e) => setManualRepo(e.target.value)}
                    placeholder="ví dụ: PHung112/WorkSys"
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Webhook Secret (Tùy chọn - Xác thực HMAC)
                  </label>
                  <input
                    type="text"
                    value={manualSecret}
                    onChange={(e) => setManualSecret(e.target.value)}
                    placeholder="Để trống hoặc chuỗi bí mật bất kỳ"
                    className={inputCls}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingManual}
                  className={`${btnPrimary} w-full flex items-center justify-center gap-1.5 cursor-pointer py-2.5`}
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{isSavingManual ? "Đang lưu..." : "Lưu cấu hình thủ công"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Cột phải: URL và 3 bước cài đặt thủ công trên GitHub */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-display text-base font-bold text-on-background flex items-center gap-2 m-0">
                <span className="material-symbols-outlined text-[20px] text-primary">link</span>
                <span>Payload URL để dán vào GitHub Webhook</span>
              </h3>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Địa chỉ localtunnel / ngrok:
                </label>
                <input
                  type="text"
                  value={customTunnelUrl}
                  onChange={(e) => setCustomTunnelUrl(e.target.value)}
                  placeholder="https://worksys-phung.loca.lt"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Payload URL hoàn chỉnh:
                </label>
                <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2">
                  <span className="font-mono text-xs text-primary truncate flex-1 select-all font-semibold">
                    {manualWebhookUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(manualWebhookUrl);
                      setCopiedManual(true);
                      setTimeout(() => setCopiedManual(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedManual ? "check" : "content_copy"}
                    </span>
                    <span>{copiedManual ? "Đã copy!" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
              <h3 className="font-display text-base font-bold text-on-background flex items-center gap-2 m-0">
                <span className="material-symbols-outlined text-[20px] text-amber-400">checklist</span>
                <span>3 bước cấu hình thủ công trên GitHub Settings</span>
              </h3>
              <ol className="list-decimal pl-4 space-y-2 text-on-surface-variant m-0 leading-relaxed">
                <li>
                  Mở Repo trên GitHub ➔ <strong>Settings</strong> ➔ <strong>Webhooks</strong> ➔ <strong>Add webhook</strong>.
                </li>
                <li>
                  Dán <strong>Payload URL</strong> vào. Content type chọn <code className="text-primary font-mono font-bold">application/json</code>.
                </li>
                <li>
                  Chọn <strong>Individual events</strong> ➔ Tích chọn <strong>Pushes</strong> và <strong>Pull requests</strong> ➔ Bấm <strong>Add webhook</strong>.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

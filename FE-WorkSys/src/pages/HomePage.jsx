import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function HomePage() {
  const navigate = useNavigate();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="bg-background font-sans text-on-background selection:bg-primary/30">
      <main className="w-full">
        <div className="flex flex-col w-full">
          {/* Hero Section */}
          <section className="relative w-full overflow-hidden flex flex-col items-center justify-center pt-24 pb-20 md:pt-48 md:pb-32 px-6">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/30 font-mono text-xs font-semibold tracking-wider text-primary mb-4 shadow-sm shadow-black/20">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                <span>Quản lý dự án thế hệ mới</span>
              </div>
              <h1 className="font-sans text-5xl md:text-7xl font-bold text-on-background max-w-3xl leading-[1.05] tracking-tight">
                Tổ chức công việc. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">Quản lý dễ dàng.</span>
              </h1>
              <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto mt-4">
                WorkSys giúp bạn tổ chức công việc, phân công nhiệm vụ và theo dõi tiến độ dự án chính xác, tăng hiệu quả làm việc của đội nhóm.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-4">
                <button onClick={() => navigate("/auth?tab=login")} className="bg-primary text-on-primary font-mono text-sm font-medium px-8 py-4 rounded-lg hover:bg-primary-fixed-dim transition-all shadow-[0_0_20px_rgba(192,193,255,0.2)] hover:shadow-[0_0_30px_rgba(192,193,255,0.4)] flex items-center justify-center gap-2 group cursor-pointer">
                  Dùng miễn phí ngay
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Hero Mockup */}
            <div className="relative z-10 w-full max-w-6xl mx-auto mt-24 aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden bg-surface-container-highest shadow-2xl border border-outline-variant/20 group">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-20"></div>
              <div className="absolute top-0 w-full h-10 bg-surface-container-low border-b border-outline-variant/20 flex items-center px-4 gap-2 z-30">
                <div className="w-3 h-3 rounded-full bg-error"></div>
                <div className="w-3 h-3 rounded-full bg-tertiary-container"></div>
                <div className="w-3 h-3 rounded-full bg-primary"></div>
              </div>
              <div className="bg-cover bg-top w-full h-full" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB6HevP0Mf3Z9B0on1uyuC4Mj1FVf3cQfzr5r6FMjnQ9TgBdNpKaTEPKeC9vdadopZRVgLvP4I_yR8B4IUCrW8nYidu_YyP9VX905fZd6INvUbNu4r4Y6NarNmg8Nx9JEqnsWlZ7SpzYS1I4S_1xtyGh5HvZQZc8rRwefn7_DeAwyIBUvGZclsTWItClh7jVNoHFwvt2-ygpvBQcbYjjuKK07UA2F5Fr6PvO6hlURORbQn5bdUqCOIpFA')" }}></div>
            </div>
          </section>

          {/* Logo Cloud */}
          <section className="w-full py-16 px-6 border-y border-outline-variant/10 bg-surface-container-lowest">
            <div className="max-w-7xl mx-auto">
              <p className="text-center font-mono text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-8">Được tin tưởng bởi các đội ngũ kỹ sư hàng đầu</p>
              <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                <svg className="h-6 w-auto text-on-surface" fill="currentColor" viewBox="0 0 100 30"><path d="M10,15 A5,5 0 1,1 20,15 A5,5 0 1,1 10,15 M30,5 L30,25 M40,15 A5,5 0 1,1 50,15 A5,5 0 1,1 40,15 M60,5 L60,25 M70,15 A5,5 0 1,1 80,15 A5,5 0 1,1 70,15" fill="none" stroke="currentColor" strokeWidth="2"></path></svg>
                <svg className="h-6 w-auto text-on-surface" fill="currentColor" viewBox="0 0 100 30"><rect height="20" rx="4" width="20" x="10" y="5"></rect><circle cx="50" cy="15" r="10"></circle><polygon points="70,25 80,5 90,25"></polygon></svg>
                <svg className="h-6 w-auto text-on-surface" fill="currentColor" viewBox="0 0 100 30"><path d="M10,25 Q30,5 50,25 T90,25" fill="none" stroke="currentColor" strokeWidth="3"></path></svg>
                <svg className="h-6 w-auto text-on-surface" fill="currentColor" viewBox="0 0 100 30"><circle cx="20" cy="15" fill="currentColor" r="8"></circle><circle cx="50" cy="15" fill="none" r="8" stroke="currentColor" strokeWidth="3"></circle><circle cx="80" cy="15" fill="currentColor" r="8"></circle></svg>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="w-full py-32 px-6 bg-background" id="features">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row gap-12 justify-between items-start mb-24">
                <div className="max-w-xl">
                  <h2 className="font-sans text-4xl font-bold text-on-background mb-4">Tại sao chọn WorkSys?</h2>
                  <p className="font-sans text-lg text-on-surface-variant">Đầy đủ tính năng cho một team hiện đại, được gói gọn trong một giao diện hiệu năng cao.</p>
                </div>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(300px,_auto)]">
                {/* Feature 1: Quản lý Project */}
                <div className="md:col-span-8 bg-surface-container-low rounded-xl p-8 relative overflow-hidden group shadow-md border border-outline-variant/10">
                  <div className="relative z-10 w-2/3">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6">
                      <span className="material-symbols-outlined">folder_managed</span>
                    </div>
                    <h3 className="font-sans text-2xl font-semibold text-on-surface mb-2">Quản lý Project</h3>
                    <p className="font-sans text-sm text-on-surface-variant mb-6">Tạo nhiều dự án, phân quyền rõ ràng. Xem toàn bộ thông tin project chỉ trong một cái nhìn.</p>
                  </div>
                  {/* Decorative UI */}
                  <div className="absolute -bottom-10 -right-10 w-3/4 h-[120%] bg-surface-container rounded-tl-xl p-4 shadow-xl border border-outline-variant/20 transform group-hover:-translate-y-2 group-hover:-translate-x-2 transition-transform duration-500">
                    <div className="flex gap-4 h-full">
                      <div className="w-1/3 bg-surface-container-high rounded-md p-3 space-y-3">
                        <div className="h-2 w-12 bg-outline-variant/40 rounded"></div>
                        <div className="h-16 w-full bg-surface-container-highest rounded border border-outline-variant/10"></div>
                        <div className="h-16 w-full bg-surface-container-highest rounded border border-outline-variant/10"></div>
                      </div>
                      <div className="w-1/3 bg-surface-container-high rounded-md p-3 space-y-3">
                        <div className="h-2 w-16 bg-primary/40 rounded"></div>
                        <div className="h-24 w-full bg-surface-container-highest rounded border border-primary/20"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 2: Stats */}
                <div className="md:col-span-4 bg-surface-container-low rounded-xl p-8 relative overflow-hidden group shadow-md border border-outline-variant/10 flex flex-col justify-center">
                  <div className="relative z-10 space-y-6">
                    <div>
                      <div className="text-4xl font-black bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">10K+</div>
                      <div className="text-on-surface-variant mt-1 font-mono text-xs uppercase tracking-wider">Dự án hoàn thành</div>
                    </div>
                    <div>
                      <div className="text-4xl font-black bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">50K+</div>
                      <div className="text-on-surface-variant mt-1 font-mono text-xs uppercase tracking-wider">Người dùng tin tưởng</div>
                    </div>
                    <div>
                      <div className="text-4xl font-black bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">99.9%</div>
                      <div className="text-on-surface-variant mt-1 font-mono text-xs uppercase tracking-wider">Uptime đảm bảo</div>
                    </div>
                  </div>
                </div>

                {/* Feature 3: Cộng tác nhóm */}
                <div className="md:col-span-5 bg-surface-container-low rounded-xl p-8 relative overflow-hidden group shadow-md border border-outline-variant/10">
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-secondary/20 text-on-surface rounded-lg flex items-center justify-center mb-6">
                      <span className="material-symbols-outlined">group</span>
                    </div>
                    <h3 className="font-sans text-2xl font-semibold text-on-surface mb-2">Cộng tác nhóm</h3>
                    <p className="font-sans text-sm text-on-surface-variant">Mời thành viên, gán vai trò Manager/Member. Quản lý nhóm dễ dàng không giới hạn.</p>
                  </div>
                  <div className="mt-6 flex flex-col gap-3">
                    <div className="bg-surface-container p-3 rounded-lg flex gap-3 items-start border border-outline-variant/10">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0"></div>
                      <div className="space-y-1 w-full">
                        <div className="h-2 w-1/4 bg-on-surface/20 rounded"></div>
                        <div className="h-2 w-3/4 bg-on-surface/40 rounded"></div>
                      </div>
                    </div>
                    <div className="bg-surface-container p-3 rounded-lg flex gap-3 items-start border border-outline-variant/10 ml-6">
                      <div className="w-6 h-6 rounded-full bg-tertiary/20 flex-shrink-0"></div>
                      <div className="space-y-1 w-full">
                        <div className="h-2 w-1/3 bg-on-surface/20 rounded"></div>
                        <div className="h-2 w-2/3 bg-on-surface/40 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 4: Task Tracking */}
                <div className="md:col-span-7 bg-surface-container-low rounded-xl p-8 relative overflow-hidden group shadow-md border border-outline-variant/10">
                  <div className="relative z-10 max-w-md">
                    <div className="w-12 h-12 bg-surface-container-highest text-on-surface rounded-lg flex items-center justify-center mb-6 border border-outline-variant/20">
                      <span className="material-symbols-outlined">view_kanban</span>
                    </div>
                    <h3 className="font-sans text-2xl font-semibold text-on-surface mb-2">Task Tracking</h3>
                    <p className="font-sans text-sm text-on-surface-variant">Tạo task, giao việc, theo dõi trạng thái TODO → IN PROGRESS → DONE theo thời gian thực.</p>
                  </div>
                  {/* Decorative integration lines */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full opacity-30">
                    <svg height="100%" viewBox="0 0 200 200" width="100%">
                      <path className="text-on-surface-variant" d="M0,100 L100,100" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1"></path>
                      <circle className="text-on-surface-variant" cx="100" cy="100" fill="none" r="40" stroke="currentColor" strokeWidth="1"></circle>
                      <circle className="text-primary" cx="100" cy="100" fill="currentColor" r="4"></circle>
                      <circle className="text-on-surface-variant" cx="60" cy="100" fill="currentColor" r="6"></circle>
                      <circle className="text-on-surface-variant" cx="140" cy="100" fill="currentColor" r="6"></circle>
                      <circle className="text-on-surface-variant" cx="100" cy="60" fill="currentColor" r="6"></circle>
                      <circle className="text-on-surface-variant" cx="100" cy="140" fill="currentColor" r="6"></circle>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* AI Section */}
          <section className="w-full py-32 px-6 bg-surface-container-lowest relative overflow-hidden border-y border-outline-variant/10" id="ai-capabilities">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-16">
              <div className="w-full md:w-1/2 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-mono text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                  WorkSys Intelligence
                </div>
                <h2 className="font-sans text-3xl md:text-4xl font-bold text-on-surface">Không gian làm việc thông minh.</h2>
                <p className="font-sans text-lg text-on-surface-variant">
                  Ngừng việc tổng hợp báo cáo thủ công. WorkSys AI liên tục phân tích tiến độ, cập nhật task và thảo luận để đưa ra bản tóm tắt chính xác ngay lập tức.
                </p>
                <ul className="space-y-4 pt-4">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                    <div>
                      <strong className="font-mono text-sm text-on-surface block">Tóm tắt Sprint Tự động</strong>
                      <span className="font-sans text-sm text-on-surface-variant">Tạo báo cáo tiến độ hàng tuần mà không tốn công sức.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                    <div>
                      <strong className="font-mono text-sm text-on-surface block">Phát hiện Rủi ro</strong>
                      <span className="font-sans text-sm text-on-surface-variant">Nhận diện các task bị block và dự báo chậm trễ timeline.</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="w-full md:w-1/2 bg-surface-container rounded-xl p-6 border border-outline-variant/20 shadow-xl">
                <div className="flex flex-col gap-4">
                  <div className="self-end bg-surface-container-highest p-3 rounded-lg rounded-tr-none border border-outline-variant/10 max-w-[80%]">
                    <p className="font-sans text-sm text-on-surface">Tóm tắt tiến độ dự án WorkSys.</p>
                  </div>
                  <div className="self-start bg-primary/10 p-4 rounded-lg rounded-tl-none border border-primary/20 max-w-[90%] space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">auto_awesome</span>
                      <span className="font-mono text-xs text-primary uppercase">WorkSys AI</span>
                    </div>
                    <p className="font-sans text-sm text-on-surface">Dự án hiện đã hoàn thành <strong>85%</strong> và đang tiến độ release.</p>
                    <div className="bg-surface-container p-3 rounded border border-outline-variant/10 mt-2 font-mono text-xs text-on-surface-variant">
                      &gt; Tính năng quản lý task đã hoàn tất<br />
                      &gt; Đang chờ review Frontend<br />
                      &gt; <span className="text-error">Blocker: Chưa cập nhật tài liệu API</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Workflow / Timeline Section */}
          <section className="w-full py-32 px-6 bg-background">
            <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-20">
                <h2 className="font-sans text-3xl md:text-4xl font-bold text-on-background mb-4">Từ ý tưởng đến triển khai.</h2>
                <p className="font-sans text-lg text-on-surface-variant">Quy trình mượt mà cho các team hiệu suất cao.</p>
              </div>
              <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-px bg-outline-variant/20 hidden md:block -translate-y-1/2"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Step 1 */}
                  <div className="relative bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 text-center flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center font-mono text-sm text-on-surface absolute -top-4 md:top-1/2 md:-translate-y-1/2 z-10 shadow-sm">1</div>
                    <div className="mt-4 md:mt-12">
                      <span className="material-symbols-outlined text-primary text-3xl mb-4">map</span>
                      <h3 className="font-sans text-xl font-semibold text-on-surface mb-2">Lập kế hoạch</h3>
                      <p className="font-sans text-sm text-on-surface-variant">V?ch ra m?c ti…u, d?nh nghia y…u c?u v… d?t milestones.</p>
                    </div>
                  </div>
                  {/* Step 2 */}
                  <div className="relative bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 text-center flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center font-mono text-sm text-on-surface absolute -top-4 md:top-1/2 md:-translate-y-1/2 z-10 shadow-sm">2</div>
                    <div className="mt-4 md:mt-12">
                      <span className="material-symbols-outlined text-tertiary text-3xl mb-4">account_tree</span>
                      <h3 className="font-sans text-xl font-semibold text-on-surface mb-2">Tổ chức</h3>
                      <p className="font-sans text-sm text-on-surface-variant">Chia nhỏ công việc, phân công người làm, lập kế hoạch sprint.</p>
                    </div>
                  </div>
                  {/* Step 3 */}
                  <div className="relative bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 text-center flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center font-mono text-sm text-on-surface absolute -top-4 md:top-1/2 md:-translate-y-1/2 z-10 shadow-sm">3</div>
                    <div className="mt-4 md:mt-12">
                      <span className="material-symbols-outlined text-primary text-3xl mb-4">terminal</span>
                      <h3 className="font-sans text-xl font-semibold text-on-surface mb-2">Thực thi</h3>
                      <p className="font-sans text-sm text-on-surface-variant">Làm việc, review code và cập nhật tiến độ theo thời gian thực.</p>
                    </div>
                  </div>
                  {/* Step 4 */}
                  <div className="relative bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 text-center flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center font-mono text-sm text-on-surface absolute -top-4 md:top-1/2 md:-translate-y-1/2 z-10 shadow-sm">4</div>
                    <div className="mt-4 md:mt-12">
                      <span className="material-symbols-outlined text-tertiary text-3xl mb-4">query_stats</span>
                      <h3 className="font-sans text-xl font-semibold text-on-surface mb-2">Phân tích</h3>
                      <p className="font-sans text-sm text-on-surface-variant">Review kết quả, phát hiện điểm nghẽn và cải tiến.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="w-full py-32 px-6 bg-surface-container relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-surface-container to-surface-container"></div>
            <div className="max-w-4xl mx-auto relative z-10 text-center bg-surface-container-low p-12 md:p-24 rounded-2xl border border-outline-variant/20 shadow-2xl">
              <h2 className="font-sans text-4xl md:text-5xl font-bold text-on-surface mb-6">Sẵn sàng bắt đầu?</h2>
              <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
                Tham gia ngay hôm nay và quản lý dự án của bạn hiệu quả hơn. Cài đặt chỉ mất vài phút.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={() => navigate("/auth?tab=register")} className="bg-primary text-on-primary font-mono text-sm font-medium px-8 py-4 rounded-lg hover:bg-primary-fixed-dim transition-all shadow-lg hover:shadow-[0_0_20px_rgba(192,193,255,0.4)] cursor-pointer">
                  Tạo tài khoản miễn phí
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary-fixed hover:shadow-primary/50 hover:scale-110 active:scale-95 transition-all duration-300 ${
          showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
      </button>
    </div>
  );
}
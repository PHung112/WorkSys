import { useNavigate } from "react-router-dom";

// Landing page giới thiệu sản phẩm và điều hướng nhanh tới luồng đăng nhập/đăng ký.
export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center pt-15 pb-20 px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/15 border border-purple-500/25 rounded-full text-purple-300 text-sm mb-8">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
          Quản lý dự án thế hệ mới
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
          Tổ chức công việc,
          <br />
          <span className="bg-linear-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
            quản lý dễ dàng
          </span>
        </h1>
        <p className="text-lg text-white/55 max-w-2xl mb-10 leading-relaxed">
          TaskFlow giúp bạn tổ chức công việc, phân công nhiệm vụ và theo dõi
          tiến độ dự án chính xác, tăng hiệu quả làm việc của đội nhóm.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => navigate("/auth?tab=login")}
            className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold text-base transition shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40"
          >
            Dùng miễn phí ngay
          </button>
        </div>
        {/* Hero image placeholder */}
        <div className="mt-16 w-full max-w-4xl bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
          <div className="flex gap-4">
            <div className="w-48 bg-white/5 rounded-xl p-3 space-y-2">
              <div className="text-xs text-white/40 font-medium mb-3">
                📁 Projects
              </div>
              {["Website Redesign", "Mobile App", "API v2"].map((p, i) => (
                <div
                  key={i}
                  className={`px-3 py-2 rounded-lg text-xs font-medium ${i === 0 ? "bg-purple-600 text-white" : "text-white/50 hover:bg-white/5"}`}
                >
                  {p}
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex gap-3">
                {[
                  {
                    label: "TODO",
                    color: "text-slate-400",
                    bg: "bg-slate-700/50",
                    count: 3,
                  },
                  {
                    label: "IN PROGRESS",
                    color: "text-blue-400",
                    bg: "bg-blue-500/10",
                    count: 2,
                  },
                  {
                    label: "DONE",
                    color: "text-green-400",
                    bg: "bg-green-500/10",
                    count: 5,
                  },
                ].map((col, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${col.bg} border border-white/10 rounded-xl p-3`}
                  >
                    <div className={`text-xs font-semibold ${col.color} mb-2`}>
                      {col.label} · {col.count}
                    </div>
                    {Array.from({ length: Math.min(col.count, 2) }).map(
                      (_, j) => (
                        <div
                          key={j}
                          className="bg-white/5 rounded-lg p-2 mb-2 text-xs text-white/60"
                        >
                          Task #{i * 2 + j + 1}
                        </div>
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Tại sao chọn TaskFlow?</h2>
          <p className="text-white/50">
            Đầy đủ tính năng cho một team hiện đại
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "📁",
              title: "Quản lý Project",
              desc: "Tạo nhiều dự án, phân quyền rõ ràng. Xem toàn bộ thông tin project chỉ trong một cái nhìn.",
              tag: "Tạo · Sửa · Xóa",
            },
            {
              icon: "👥",
              title: "Cộng tác nhóm",
              desc: "Mời thành viên, gán vai trò Manager/Member. Quản lý nhóm dễ dàng không giới hạn.",
              tag: "Mời · Phân quyền · Loại bỏ",
            },
            {
              icon: "✅",
              title: "Task Tracking",
              desc: "Tạo task, giao việc, theo dõi trạng thái TODO → IN PROGRESS → DONE theo thời gian thực.",
              tag: "Nhận · Nộp · Theo dõi",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="p-6 bg-white/4 border border-white/10 rounded-2xl hover:bg-white/7 hover:border-purple-500/30 transition group"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed mb-4">
                {f.desc}
              </p>
              <span className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">
                {f.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-white/10 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center px-8">
          {[
            { n: "10K+", l: "Dự án hoàn thành" },
            { n: "50K+", l: "Người dùng tin tưởng" },
            { n: "99.9%", l: "Uptime đảm bảo" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-4xl font-black bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {s.n}
              </div>
              <div className="text-white/50 mt-1 text-sm">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8 text-center">
        <div className="max-w-2xl mx-auto bg-linear-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/20 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-white/55 mb-8">
            Tham gia ngay hôm nay và quản lý dự án của bạn hiệu quả hơn.
          </p>
          <button
            onClick={() => navigate("/auth?tab=register")}
            className="px-10 py-3.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-lg transition shadow-xl shadow-purple-500/30"
          >
            Tạo tài khoản miễn phí
          </button>
        </div>
      </section>
    </div>
  );
}

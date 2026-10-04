import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary/20 selection:text-primary relative overflow-x-hidden">
      {/* Background Ambient Glow Effects */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[650px] opacity-60 blur-[130px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(129, 140, 248, 0.22) 0%, rgba(99, 102, 241, 0.12) 40%, rgba(192, 132, 252, 0.05) 70%, transparent 100%)'
        }}
      />
      <div
        className="pointer-events-none absolute top-[900px] -left-48 w-[600px] h-[600px] opacity-30 blur-[140px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)'
        }}
      />
      <div
        className="pointer-events-none absolute top-[1600px] -right-48 w-[700px] h-[700px] opacity-25 blur-[150px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(217, 70, 239, 0.15) 0%, transparent 70%)'
        }}
      />



      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 pb-24 space-y-28 md:space-y-36">

        {/* ===================== PHẦN 1: HERO SECTION ===================== */}
        <section className="relative text-center flex flex-col items-center pt-4 md:pt-8">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/20 backdrop-blur-md mb-8 hover:border-primary/50 transition-colors shadow-sm cursor-default">
            <span className="material-symbols-outlined text-primary text-base animate-pulse">bolt</span>
            <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Quản lý dự án thế hệ mới
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary/80" />
            <span className="font-mono text-xs text-primary font-medium">v2.4 Release</span>
          </div>

          {/* Heading H1 (2 Lines) */}
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-on-background max-w-4xl leading-[1.12]">
            Tối ưu hóa nhịp điệu công việc
            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-400 to-tertiary">
              Nhanh chóng & Chuẩn xác
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-on-surface-variant max-w-2xl font-sans leading-relaxed">
            Hợp nhất giao việc, tiến độ Kanban, phân quyền tổ chức và dữ liệu phân tích theo thời gian thực trong một không gian tối giản, trực quan.
          </p>

          {/* CTA & Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate("/auth?tab=register")}
              className="cursor-pointer group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-on-primary font-semibold text-base shadow-[0_0_35px_-6px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_-2px_rgba(99,102,241,0.7)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 overflow-hidden"
            >
              <span className="relative z-10">Dùng miễn phí ngay</span>
              <span className="material-symbols-outlined relative z-10 text-lg transition-transform duration-300 group-hover:translate-x-1.5">
                arrow_forward
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </button>

          </div>


          {/* 3D Dashboard Mockup (21:9 Aspect Ratio) */}
          <div className="mt-14 w-full relative">
            <div className="relative mx-auto rounded-3xl p-2.5 sm:p-3.5 bg-gradient-to-b from-outline-variant/30 via-outline-variant/10 to-transparent shadow-2xl backdrop-blur-sm border border-outline-variant/20">
              <div className="w-full aspect-[21/9] min-h-[300px] md:min-h-[440px] rounded-2xl bg-surface-container-lowest border border-outline-variant/20 overflow-hidden relative flex flex-col shadow-inner">

                {/* Mockup Header bar */}
                <div className="h-11 bg-surface-container-low/90 border-b border-outline-variant/10 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-3 font-mono text-xs text-on-surface-variant/60 hidden sm:inline">
                      worksys.cloud/workspace/sprint-48
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container text-xs font-mono text-on-surface-variant">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Live Sync</span>
                    </div>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">tune</span>
                  </div>
                </div>

                {/* Mockup Body Content */}
                <div className="flex-1 p-4 md:p-6 grid grid-cols-12 gap-4 bg-gradient-to-b from-surface-container-lowest to-surface-container-low/40">
                  {/* Mock Sidebar */}
                  <div className="hidden lg:flex col-span-3 flex-col justify-between border-r border-outline-variant/10 pr-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container text-on-background font-medium text-xs">
                        <span className="material-symbols-outlined text-primary text-base">dashboard</span>
                        <span>Workspace Q1 / 2026</span>
                      </div>
                      <div className="space-y-1.5 pl-2 font-mono text-xs text-on-surface-variant">
                        <div className="flex items-center justify-between p-1.5 rounded hover:bg-surface-container/60 cursor-pointer">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded bg-primary" /> Engineering
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high">14</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded bg-surface-container-high/50 text-on-background cursor-pointer">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded bg-tertiary" /> Product Design
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">8</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded hover:bg-surface-container/60 cursor-pointer">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded bg-emerald-400" /> Marketing Growth
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high">5</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/10">
                      <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
                        <span className="font-mono">Sprint Tiến độ</span>
                        <span className="text-primary font-bold">82%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-tertiary w-[82%]" />
                      </div>
                    </div>
                  </div>

                  {/* Mock Main Panel (Kanban Columns in 21:9 view) */}
                  <div className="col-span-12 lg:col-span-9 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase font-mono tracking-wider text-on-surface-variant">
                          Active Sprint #48: Core Infrastructure
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          <div className="w-6 h-6 rounded-full bg-primary/30 border border-outline-variant flex items-center justify-center text-[10px] text-primary font-bold">JD</div>
                          <div className="w-6 h-6 rounded-full bg-tertiary/30 border border-outline-variant flex items-center justify-center text-[10px] text-tertiary font-bold">AN</div>
                          <div className="w-6 h-6 rounded-full bg-indigo-500/30 border border-outline-variant flex items-center justify-center text-[10px] text-indigo-300 font-bold">+5</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-mono text-[11px]">+ Add Task</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 flex-1">
                      {/* Column 1 */}
                      <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/10 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400" /> Cần làm
                          </span>
                          <span className="text-[10px]">3</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/20 shadow-sm space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-tertiary px-1.5 py-0.5 rounded bg-tertiary/10">Architecture</span>
                            <span className="material-symbols-outlined text-xs text-on-surface-variant">flag</span>
                          </div>
                          <p className="text-xs font-medium text-on-surface line-clamp-1">Thiết lập GraphQL Gateway v2</p>
                          <div className="flex items-center justify-between pt-1 border-t border-outline-variant/10 text-[10px] text-on-surface-variant">
                            <span>Hạn: 28/02</span>
                            <span className="w-4 h-4 rounded-full bg-surface-container-high text-center">T</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-container/60 border border-outline-variant/10 space-y-1.5">
                          <span className="text-[10px] font-mono text-primary px-1.5 py-0.5 rounded bg-primary/10">Security</span>
                          <p className="text-xs font-medium text-on-surface line-clamp-1">Review Token Rotation & RBAC</p>
                        </div>
                      </div>

                      {/* Column 2 */}
                      <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/10 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary" /> Đang xử lý
                          </span>
                          <span className="text-[10px]">4</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-container border border-primary/30 shadow-md shadow-primary/5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-primary px-1.5 py-0.5 rounded bg-primary/10">UI/UX</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </div>
                          <p className="text-xs font-medium text-on-surface line-clamp-1">Dark Mode Bento Dashboard Kit</p>
                          <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-3/4" />
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/20 space-y-1.5">
                          <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-400/10">Database</span>
                          <p className="text-xs font-medium text-on-surface line-clamp-1">Postgres Index Partitioning</p>
                        </div>
                      </div>

                      {/* Column 3 */}
                      <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/10 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Hoàn thành
                          </span>
                          <span className="text-[10px]">9</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-container/70 border border-outline-variant/10 space-y-1.5 opacity-85">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-emerald-400 line-through">DevOps</span>
                            <span className="material-symbols-outlined text-xs text-emerald-400">check</span>
                          </div>
                          <p className="text-xs font-medium text-on-surface-variant line-through line-clamp-1">Cluster Kube Autoscaling</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-container/70 border border-outline-variant/10 space-y-1.5 opacity-85">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-emerald-400 line-through">Auth</span>
                            <span className="material-symbols-outlined text-xs text-emerald-400">check</span>
                          </div>
                          <p className="text-xs font-medium text-on-surface-variant line-through line-clamp-1">SSO Saml2 & Google OAuth</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle highlight overlay */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-primary/5 to-white/5" />
              </div>
            </div>
          </div>
        </section>

        {/* ===================== PHẦN 2: SOCIAL PROOF ===================== */}
        <section className="text-center pt-4">
          <p className="text-xs sm:text-sm font-mono uppercase tracking-widest text-on-surface-variant">
            Được tin tưởng bởi các đội ngũ kỹ sư hàng đầu
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 lg:gap-10 items-center justify-items-center">
            {/* Logo 1: NEXUS TECH */}
            <div className="group flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
              <svg className="w-7 h-7 text-primary" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="16,3 29,10 29,22 16,29 3,22 3,10" />
                <line x1="16" y1="3" x2="16" y2="29" />
              </svg>
              <span className="font-display font-bold text-base tracking-wider text-on-background">NEXUS</span>
            </div>

            {/* Logo 2: HYPERCLOUD */}
            <div className="group flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
              <svg className="w-7 h-7 text-tertiary" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="16" cy="16" r="12" />
                <path d="M10 16h12M16 10v12" />
              </svg>
              <span className="font-display font-bold text-base tracking-wider text-on-background">HYPERLAB</span>
            </div>

            {/* Logo 3: SYNTAX.IO */}
            <div className="group flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
              <svg className="w-7 h-7 text-primary" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 10L3 16L9 22" />
                <path d="M23 10L29 16L23 22" />
                <line x1="19" y1="7" x2="13" y2="25" />
              </svg>
              <span className="font-display font-bold text-base tracking-wider text-on-background">SYNTAX</span>
            </div>

            {/* Logo 4: QUANTUM FLOW */}
            <div className="group flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
              <svg className="w-7 h-7 text-tertiary" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="5" y="5" width="22" height="22" rx="4" />
                <circle cx="16" cy="16" r="4" />
              </svg>
              <span className="font-display font-bold text-base tracking-wider text-on-background">QUANTUM</span>
            </div>

            {/* Logo 5: APEX AI */}
            <div className="group flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer col-span-2 sm:col-span-1">
              <svg className="w-7 h-7 text-primary" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 26L16 6L28 26H4Z" />
                <circle cx="16" cy="18" r="2" fill="currentColor" />
              </svg>
              <span className="font-display font-bold text-base tracking-wider text-on-background">APEX.AI</span>
            </div>
          </div>
        </section>

        {/* ===================== PHẦN 3: FEATURES (BENTO GRID) ===================== */}
        <section id="features" className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">widgets</span>
                <span>Kiến trúc hệ thống</span>
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-on-background tracking-tight">
                Tại sao chọn WorkSys?
              </h2>
            </div>
            <p className="text-on-surface-variant max-w-md text-sm sm:text-base">
              Thiết kế theo triết lý giảm thiểu ma sát, tập trung hoàn toàn vào hiệu suất và sự đồng bộ liền mạch của đội ngũ.
            </p>
          </div>

          {/* Bento Grid: 1 Big (col 8, row 2), 1 Wide (col 12 or 4), 2 Small */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* KHỐI 1: Quản lý Project thông minh (Khối to nhất - Col 7/8 on desktop) */}
            <div className="md:col-span-7 lg:col-span-8 bg-surface-container-low rounded-3xl p-7 lg:p-9 border border-outline-variant/10 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden shadow-sm">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">account_tree</span>
                </div>
                <div className="inline-block px-2.5 py-1 rounded-md bg-surface-container text-[11px] font-mono text-primary mb-3">
                  AI-Powered Engine
                </div>
                <h3 className="font-display font-bold text-2xl text-on-background tracking-tight">
                  Quản lý Project thông minh
                </h3>
                <p className="mt-3 text-on-surface-variant text-sm sm:text-base leading-relaxed max-w-xl">
                  Tự động phân rã mục tiêu lớn thành các sprint hành động. Hệ thống dự đoán điểm nghẽn, tự động cân bằng khối lượng công việc giữa các thành viên.
                </p>
              </div>

              {/* Giả lập UI bên trong Khối To */}
              <div className="mt-8 pt-6 border-t border-outline-variant/10 relative z-10">
                <div className="bg-surface-container-lowest/80 rounded-2xl p-4 border border-outline-variant/10 backdrop-blur-md space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Core Platform Roadmap 2026
                    </span>
                    <span className="text-primary font-medium">94% Độ tin cậy AI</span>
                  </div>

                  {/* Timeline Bars Simulation */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-20 font-mono text-[11px] text-on-surface-variant truncate">Scylla DB</span>
                      <div className="flex-1 bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-primary to-indigo-400 h-full w-[85%] rounded-full" />
                      </div>
                      <span className="font-mono text-[10px] text-on-surface-variant w-8 text-right">85%</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-20 font-mono text-[11px] text-on-surface-variant truncate">Auth V2</span>
                      <div className="flex-1 bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-tertiary to-pink-400 h-full w-[60%] rounded-full" />
                      </div>
                      <span className="font-mono text-[10px] text-on-surface-variant w-8 text-right">60%</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-20 font-mono text-[11px] text-on-surface-variant truncate">SDK Mobile</span>
                      <div className="flex-1 bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-400 to-cyan-400 h-full w-[40%] rounded-full" />
                      </div>
                      <span className="font-mono text-[10px] text-on-surface-variant w-8 text-right">40%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ambient decoration */}
              <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* KHỐI 3: Phân quyền (Role) linh hoạt (Khối nhỏ 1 - Col 5/4) */}
            <div className="md:col-span-5 lg:col-span-4 bg-surface-container-low rounded-3xl p-7 lg:p-8 border border-outline-variant/10 hover:border-tertiary/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                </div>
                <div className="inline-block px-2.5 py-1 rounded-md bg-surface-container text-[11px] font-mono text-tertiary mb-3">
                  Granular RBAC
                </div>
                <h3 className="font-display font-bold text-xl text-on-background tracking-tight">
                  Phân quyền linh hoạt
                </h3>
                <p className="mt-2.5 text-on-surface-variant text-sm leading-relaxed">
                  Thiết lập vai trò chi tiết theo từng thư mục, tác vụ hoặc trạng thái duyệt. Kiểm soát dữ liệu tuyệt đối.
                </p>
              </div>

              {/* Giả lập Role Switcher UI */}
              <div className="mt-6 pt-5 border-t border-outline-variant/10">
                <div className="space-y-2 bg-surface-container-lowest/80 p-3 rounded-2xl border border-outline-variant/10">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container/70 border border-outline-variant/10">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-tertiary">shield_person</span>
                      <span className="text-xs font-medium text-on-background">Tech Lead</span>
                    </div>
                    <span className="text-[10px] font-mono bg-tertiary/20 text-tertiary px-2 py-0.5 rounded">All Access</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
                      <span className="text-xs text-on-surface-variant">Contributor</span>
                    </div>
                    <span className="text-[10px] font-mono bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded">Edit Only</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KHỐI 2: Bảng Kanban kéo thả (Khối ngang dài - Col 12 hoặc Col 8) */}
            <div className="md:col-span-12 lg:col-span-8 bg-surface-container-low rounded-3xl p-7 lg:p-8 border border-outline-variant/10 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden shadow-sm order-last lg:order-none">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">view_kanban</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-on-background tracking-tight">
                        Bảng Kanban kéo thả siêu mượt
                      </h3>
                      <p className="text-xs font-mono text-on-surface-variant">
                        60 FPS Drag & Drop • Tự động lưu tiến độ
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/10">
                    <span className="material-symbols-outlined text-sm text-emerald-400">touch_app</span>
                    <span className="text-xs font-mono text-on-surface-variant">Instant Reorder</span>
                  </div>
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl">
                  Trải nghiệm tương tác với độ trễ gần như bằng 0. Tùy biến cột linh hoạt, gán nhãn ưu tiên và lọc dữ liệu đa chiều chỉ bằng một cú nhấp.
                </p>
              </div>

              {/* Giả lập 3 thanh ngang tượng trưng cho Kanban */}
              <div className="mt-6 pt-5 border-t border-outline-variant/10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-container-lowest/80 p-3.5 rounded-2xl border border-outline-variant/10">
                  {/* Kanban Mini Column 1 */}
                  <div className="space-y-2 bg-surface-container/60 p-2.5 rounded-xl border border-outline-variant/10">
                    <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                      <span className="font-semibold text-on-surface">Khởi động</span>
                      <span>2</span>
                    </div>
                    <div className="h-6 bg-surface-container-high/80 rounded-lg border border-outline-variant/20 flex items-center px-2 text-[10px] text-on-surface-variant truncate">
                      Tối ưu SQL Query
                    </div>
                    <div className="h-6 bg-surface-container-high/50 rounded-lg border border-outline-variant/10 flex items-center px-2 text-[10px] text-on-surface-variant/70 truncate">
                      Cập nhật tài liệu API
                    </div>
                  </div>

                  {/* Kanban Mini Column 2 */}
                  <div className="space-y-2 bg-surface-container/60 p-2.5 rounded-xl border border-primary/20">
                    <div className="flex items-center justify-between text-[11px] font-mono text-primary">
                      <span className="font-semibold">Đang code</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    </div>
                    <div className="h-6 bg-primary/15 border border-primary/30 rounded-lg flex items-center px-2 text-[10px] text-primary font-medium truncate">
                      Refactor Landing Page
                    </div>
                    <div className="h-6 bg-surface-container-high/80 rounded-lg border border-outline-variant/20 flex items-center px-2 text-[10px] text-on-surface-variant truncate">
                      Sync Webhooks
                    </div>
                  </div>

                  {/* Kanban Mini Column 3 */}
                  <div className="space-y-2 bg-surface-container/60 p-2.5 rounded-xl border border-outline-variant/10">
                    <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
                      <span className="font-semibold">Đã xong</span>
                      <span className="material-symbols-outlined text-[12px]">done_all</span>
                    </div>
                    <div className="h-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center px-2 text-[10px] text-emerald-300 truncate">
                      Deploy Staging env
                    </div>
                    <div className="h-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center px-2 text-[10px] text-emerald-300 truncate">
                      Setup Cloudflare CDN
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KHỐI 4: Thống kê realtime (Khối nhỏ 2 - Col 4) */}
            <div className="md:col-span-12 lg:col-span-4 bg-surface-container-low rounded-3xl p-7 lg:p-8 border border-outline-variant/10 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">monitoring</span>
                </div>
                <div className="inline-block px-2.5 py-1 rounded-md bg-surface-container text-[11px] font-mono text-primary mb-3">
                  Live Telemetry
                </div>
                <h3 className="font-display font-bold text-xl text-on-background tracking-tight">
                  Thống kê realtime
                </h3>
                <p className="mt-2.5 text-on-surface-variant text-sm leading-relaxed">
                  Báo cáo trực quan về hiệu suất, cycle-time và thời gian phản hồi của từng cá nhân và team.
                </p>
              </div>

              {/* Giả lập biểu đồ realtime nhỏ */}
              <div className="mt-6 pt-5 border-t border-outline-variant/10">
                <div className="bg-surface-container-lowest/80 p-3.5 rounded-2xl border border-outline-variant/10">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-mono text-xs text-on-surface-variant">Tốc độ hoàn thành</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">+28.4%</span>
                  </div>
                  {/* Mini Bar Chart Representation */}
                  <div className="flex items-end gap-2 h-14 pt-2">
                    <div className="flex-1 bg-surface-container-high rounded-t h-[40%]" />
                    <div className="flex-1 bg-surface-container-high rounded-t h-[65%]" />
                    <div className="flex-1 bg-primary/40 rounded-t h-[50%]" />
                    <div className="flex-1 bg-primary/60 rounded-t h-[80%]" />
                    <div className="flex-1 bg-gradient-to-t from-primary to-tertiary rounded-t h-[95%]" />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-on-surface-variant/60 mt-1.5">
                    <span>T2</span>
                    <span>T3</span>
                    <span>T4</span>
                    <span>T5</span>
                    <span>Hôm nay</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ===================== PHẦN 3.5: THE CREATOR (TESTIMONIAL) ===================== */}
        <section className="relative w-full max-w-5xl mx-auto py-10 md:py-20 px-4">
          <div className="flex flex-col md:flex-row items-center">
            {/* Image Side */}
            <div className="w-full max-w-sm md:w-5/12 relative z-10 md:translate-x-12 -translate-y-6 md:translate-y-0">
              <div className="aspect-[4/5] w-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-background bg-surface-container">
                <img
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1470&auto=format&fit=crop"
                  alt="Developer"
                  className="w-full h-full object-cover grayscale mix-blend-luminosity hover:grayscale-0 hover:mix-blend-normal transition-all duration-700"
                />
              </div>
            </div>

            {/* Content Side */}
            <div className="w-full md:w-8/12 bg-primary rounded-3xl p-8 pt-12 md:p-14 md:pl-20 flex flex-col justify-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-indigo-800 opacity-90"></div>

              <div className="relative z-10 text-on-primary">
                <div className="flex items-center gap-2 mb-8">
                  <span className="material-symbols-outlined text-3xl">developer_board</span>
                  <span className="font-display font-bold text-xl tracking-tight">WorkSys Team</span>
                </div>

                <div className="relative">
                  <span className="text-8xl font-serif text-on-primary/20 leading-none absolute -top-6 -left-4 pointer-events-none">"</span>
                  <p className="font-sans text-lg md:text-xl font-medium leading-relaxed mb-8 relative z-10">
                    Sứ mệnh của chúng tôi là xóa bỏ rào cản kỹ thuật trong vận hành. Bạn không cần phải là một kỹ sư hay chuyên gia AI. Nếu bạn làm việc trên hệ thống, bạn nghiễm nhiên sở hữu sức mạnh của tự động hóa và phân tích thông minh. Đó mới là sức mạnh thực sự — khi năng lực vĩ đại trở thành thuộc tính của hệ thống, chứ không chỉ thuộc về một vài cá nhân kiệt xuất.
                  </p>
                </div>

                <div className="flex flex-col gap-1 mb-8">
                  <span className="font-mono text-xs uppercase tracking-widest font-bold">Z - Nhà sáng lập</span>
                  <span className="text-sm text-on-primary/80">Kỹ sư trưởng & Kiến trúc sư hệ thống</span>
                </div>

                <div>
                  <a href="#" className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity group">
                    Đọc câu chuyện của chúng tôi
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== PHẦN 4: BOTTOM CTA & FOOTER ===================== */}
        <section className="space-y-20">

          {/* Big Horizontal Banner CTA */}
          <div className="relative rounded-3xl bg-surface-container-high p-8 sm:p-12 md:p-16 border border-outline-variant/20 overflow-hidden shadow-2xl">
            {/* Ambient Background Light in Banner */}
            <div
              className="absolute -top-32 -right-32 w-96 h-96 opacity-40 blur-[100px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(217, 70, 239, 0.2) 60%, transparent 100%)'
              }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-xs font-mono text-primary border border-outline-variant/20">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Bắt đầu trong hôm nay
                </div>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-on-background tracking-tight">
                  Sẵn sàng tối ưu hóa công việc?
                </h2>
                <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed">
                  Gia nhập hơn 12,000+ nhóm kỹ thuật và nhà sáng tạo đã biến năng suất thành lợi thế cạnh tranh với WorkSys.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:self-center">
                <button
                  onClick={() => navigate("/auth?tab=register")}
                  className="cursor-pointer px-4 py-4 rounded-2xl bg-primary text-on-primary font-semibold text-sm shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_45px_rgba(99,102,241,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Đăng ký ngay</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
                <button className="px-6 py-4 rounded-2xl bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/20 text-on-surface hover:text-on-background font-medium text-sm transition-colors flex items-center justify-center cursor-pointer">
                  Liên hệ Doanh nghiệp
                </button>
              </div>
            </div>
          </div>



        </section>

      </main>
    </div>
  );
}
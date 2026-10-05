import { useNavigate } from 'react-router-dom';

export default function PublicNavbar() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-white/20">
      <div className="h-16 w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 group cursor-pointer hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-tertiary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-on-primary text-2xl">layers</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold text-2xl tracking-tight text-on-background">WorkSys</span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
        </button>
        <nav className="hidden md:flex items-center gap-8">
          <a className="font-mono text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors" href="/#features">Tính năng</a>
          <a className="font-mono text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors" href="/#ai-capabilities">AI</a>
          <a className="font-mono text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors" href="#">Sản phẩm</a>
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/auth?tab=login')} className="font-mono text-sm font-medium text-on-surface-variant hover:text-on-surface px-4 py-2 cursor-pointer transition-colors">
            Đăng nhập
          </button>
          <button onClick={() => navigate('/auth?tab=register')} className="font-mono text-sm font-medium text-on-surface-variant hover:text-on-surface px-4 py-2 cursor-pointer transition-colors">
            Đăng ký
          </button>
        </div>
      </div>
    </header>
  );
}

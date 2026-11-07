import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';

export default function PublicNavbar() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-white/20">
      <div className="h-16 w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Logo to="/" />
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

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/10 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-on-surface-variant font-mono text-sm">
        <span>� 2026 WorkSys.</span>
        <div className="flex gap-8">
          <a className="hover:text-on-surface transition-colors" href="#">Trạng thái</a>
          <a className="hover:text-on-surface transition-colors" href="#">Bảo mật</a>
          <a className="hover:text-on-surface transition-colors" href="#">Tài liệu</a>
        </div>
      </div>
    </footer>
  );
}

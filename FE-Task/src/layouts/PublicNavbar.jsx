import { useNavigate } from 'react-router-dom'

export default function PublicNavbar() {
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 flex items-center justify-between px-8 py-4 border-b border-white/10 bg-slate-900 z-999">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">T</div>
        <span className="text-xl font-bold tracking-tight">TaskFlow</span>
      </button>
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/auth?tab=login')}
          className="px-4 py-2 text-white/70 hover:text-white transition text-sm font-medium"
        >
          Đăng nhập
        </button>
        <button
          onClick={() => navigate('/auth?tab=register')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-sm font-semibold shadow-lg shadow-purple-500/20"
        >
          Đăng ký
        </button>
      </div>
    </nav>
  )
}

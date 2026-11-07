import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component Logo thống nhất cho toàn bộ hệ thống WorkSys
 * @param {string} [to] - Đường dẫn chuyển trang khi bấm vào logo
 * @param {function} [onClick] - Custom click handler
 * @param {'sm' | 'md' | 'lg'} [size='md'] - Kích thước logo
 * @param {boolean} [showText=true] - Ẩn/hiện chữ 'WorkSys'
 * @param {boolean} [showDot=true] - Ẩn/hiện dấu chấm animated pulse
 * @param {string} [badge] - Nhãn huy hiệu phụ (ví dụ: 'Admin')
 * @param {string} [className] - Class tùy biến thêm bên ngoài
 */
export default function Logo({
  to,
  onClick,
  size = 'md',
  showText = true,
  showDot = true,
  badge,
  className = '',
}) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      navigate(to);
    }
  };

  const isClickable = Boolean(onClick || to);

  const sizeConfig = {
    sm: {
      box: 'w-8 h-8 rounded-lg shadow-md',
      icon: 'text-lg',
      text: 'text-xl',
      dot: 'w-1.5 h-1.5',
    },
    md: {
      box: 'w-10 h-10 rounded-xl shadow-lg',
      icon: 'text-2xl',
      text: 'text-2xl',
      dot: 'w-2 h-2',
    },
    lg: {
      box: 'w-12 h-12 rounded-2xl shadow-xl',
      icon: 'text-3xl',
      text: 'text-3xl',
      dot: 'w-2.5 h-2.5',
    },
  };

  const conf = sizeConfig[size] || sizeConfig.md;

  const content = (
    <div className={`flex items-center gap-3 ${isClickable ? 'group cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}>
      {/* Icon logo hình khối gradient layers */}
      <div
        className={`${conf.box} bg-gradient-to-tr from-primary to-tertiary flex items-center justify-center shadow-primary/20 ${
          isClickable ? 'group-hover:scale-105 transition-transform duration-300' : ''
        }`}
      >
        <span className={`material-symbols-outlined text-on-primary ${conf.icon}`}>layers</span>
      </div>

      {/* Tên thương hiệu WorkSys & Dot */}
      {showText && (
        <div className="flex items-baseline gap-1">
          <span className={`font-display font-bold ${conf.text} tracking-tight text-on-background`}>
            WorkSys
          </span>
          {showDot && <span className={`${conf.dot} rounded-full bg-primary animate-pulse`} />}
          {badge && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (isClickable) {
    return (
      <button type="button" onClick={handleClick} className="flex items-center text-left focus:outline-none cursor-pointer">
        {content}
      </button>
    );
  }

  return content;
}

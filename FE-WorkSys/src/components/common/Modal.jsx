export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
      <div className="bg-background border border-outline-variant/20 rounded-xl p-stack-lg w-full max-w-md shadow-2xl transform transition-transform">
        <div className="flex justify-between items-center mb-stack-md">
          <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

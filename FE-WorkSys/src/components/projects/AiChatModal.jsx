import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

// Các gợi ý câu hỏi nhanh để admin bấm nhanh mà không phải gõ
const QUICK_PROMPTS = [
  { icon: "summarize", label: "Tóm tắt tiến độ hôm nay", prompt: "Hãy tóm tắt tình hình tiến độ các task trong dự án hôm nay." },
  { icon: "warning", label: "Task nào đang trễ hạn?", prompt: "Liệt kê các task đang quá hạn hoặc có nguy cơ trễ hạn và cho tôi biết ai đang phụ trách." },
  { icon: "bar_chart", label: "Tổng quan hoàn thành", prompt: "Bao nhiêu phần trăm công việc đã hoàn thành? Có bao nhiêu task đã DONE, đang IN_PROGRESS, chưa bắt đầu?" },
  { icon: "person_search", label: "Ai đang quá tải?", prompt: "Thành viên nào đang đảm nhận nhiều task nhất? Ai có nguy cơ quá tải?" },
];

export default function AiChatModal({ isOpen, onClose, projectId }) {
  // Đọc token trực tiếp từ sessionStorage (tương tự cách axiosConfig.js hoạt động)
  const token = sessionStorage.getItem("token");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Xin chào! Tôi là trợ lý AI của dự án. Tôi có thể giúp bạn tóm tắt tiến độ, phân tích rủi ro và đưa ra khuyến nghị cho team. Bạn muốn hỏi gì?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Tự cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input khi modal mở
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (promptText) => {
    const text = promptText || input.trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`/api/ai/project/${projectId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: text }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: `Xin lỗi, đã xảy ra lỗi khi kết nối đến AI: ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-surface-container-high w-full sm:max-w-2xl sm:rounded-2xl flex flex-col border border-outline-variant/20 shadow-2xl"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-highest shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                magic_button
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-on-surface text-sm">Trợ lý AI dự án</h2>
              <p className="text-on-surface-variant text-xs">Powered by Google Gemini</p>
            </div>
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-semibold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"></span>
              Online
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${
                msg.role === "ai"
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-highest text-on-surface-variant"
              }`}>
                {msg.role === "ai"
                  ? <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  : <span className="material-symbols-outlined text-[14px]">person</span>
                }
              </div>
              {/* Bubble */}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "ai"
                  ? "bg-surface-container-low border border-outline-variant/10 text-on-surface rounded-tl-sm"
                  : "bg-primary/90 text-on-primary rounded-tr-sm"
              }`}>
                {msg.role === "ai" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&>ul]:pl-4 [&>ol]:pl-4 [&>ul>li]:my-0.5 [&>ol>li]:my-0.5 [&>p]:my-1 [&>h1]:text-base [&>h2]:text-base [&>h3]:text-sm [&>strong]:text-on-surface">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-primary/10 text-primary mt-0.5">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => sendMessage(qp.prompt)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest hover:border-primary/30 transition-all"
              >
                <span className="material-symbols-outlined text-[13px] text-primary">{qp.icon}</span>
                {qp.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="px-4 pb-4 shrink-0">
          <div className="flex items-end gap-2 bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2 focus-within:border-primary/50 transition-colors">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi về tiến độ, task, thành viên..."
              className="flex-1 bg-transparent text-on-surface text-sm resize-none outline-none placeholder:text-on-surface-variant/50 max-h-32 custom-scrollbar"
              style={{ fieldSizing: "content" }}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:bg-primary-fixed transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
          <p className="text-center text-on-surface-variant/40 text-[10px] mt-1.5">
            Nhấn Enter để gửi · Shift+Enter để xuống dòng
          </p>
        </div>
      </div>
    </div>
  );
}

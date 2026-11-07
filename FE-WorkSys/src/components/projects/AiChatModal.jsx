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
  }, [messages, isLoading]);

  // Focus input khi widget mở
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
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
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[360px] sm:w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-5rem)] flex flex-col bg-[#1b1924] rounded-2xl shadow-2xl shadow-black/60 border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header — kiểu Facebook Messenger */}
      <div className="px-4 py-3 bg-[#231f30]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar with online status */}
          <div className="relative w-9 h-9 shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                smart_toy
              </span>
            </div>
            {/* Green dot active */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#231f30]" />
          </div>

          <div className="flex flex-col min-w-0">
            <h2 className="font-semibold text-white text-[13.5px] leading-tight truncate">
              Trợ lý AI dự án
            </h2>
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5 leading-tight mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              Đang hoạt động
            </p>
          </div>
        </div>

        {/* Nút tắt chat duy nhất theo yêu cầu */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Đóng đoạn chat"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Messages Area — nền tối Messenger với bong bóng tím / xám */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar bg-gradient-to-b from-[#241e33] via-[#1b1727] to-[#14121d]">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* Bot Avatar bên trái */}
            {msg.role === "ai" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mb-0.5 shadow-sm">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  smart_toy
                </span>
              </div>
            )}

            {/* Bubble */}
            <div
              className={`text-[13.5px] leading-relaxed max-w-[82%] shadow-sm ${
                msg.role === "ai"
                  ? "bg-[#2b2738] border border-white/5 text-[#f1f0f5] px-3.5 py-2.5 rounded-[18px] rounded-bl-sm"
                  : "bg-gradient-to-r from-[#9d6cf8] to-[#8054d4] text-white px-3.5 py-2.5 rounded-[18px] rounded-br-sm break-words whitespace-pre-wrap"
              }`}
            >
              {msg.role === "ai" ? (
                <div className="prose prose-sm prose-invert max-w-none text-[13.5px] break-words [&>p]:my-1 [&>ul]:pl-4 [&>ol]:pl-4 [&>ul>li]:my-0.5 [&>ol>li]:my-0.5 [&>strong]:text-white [&>code]:bg-black/30 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>pre]:bg-black/40 [&>pre]:p-2 [&>pre]:rounded-lg">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator (Typing dots Messenger) */}
        {isLoading && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mb-0.5 shadow-sm">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                smart_toy
              </span>
            </div>
            <div className="bg-[#2b2738] border border-white/5 px-3.5 py-2.5 rounded-[18px] rounded-bl-sm flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts (gợi ý nhanh khi chưa chat nhiều) */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-3 py-1.5 flex flex-wrap gap-1.5 shrink-0 bg-[#1e192c]/80 border-t border-white/5">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              onClick={() => sendMessage(qp.prompt)}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#2d283c] border border-purple-500/20 text-purple-200 hover:text-white hover:bg-purple-900/40 hover:border-purple-400/40 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[13px] text-purple-400">{qp.icon}</span>
              {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area — thanh nhập Messenger đơn giản chỉ có ô nhập và nút gửi */}
      <div className="px-3 py-2.5 bg-[#1f1a2c]/95 backdrop-blur-md border-t border-white/10 shrink-0 flex items-center gap-2">
        <div className="flex-1 flex items-center bg-[#2d283c] rounded-full px-3.5 py-1 border border-white/5 focus-within:border-purple-500/50 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Aa"
            className="flex-1 bg-transparent text-[13.5px] text-white placeholder-gray-400/60 outline-none resize-none py-1 max-h-24 custom-scrollbar"
            style={{ fieldSizing: "content" }}
            disabled={isLoading}
          />
        </div>

        {/* Nút gửi duy nhất theo yêu cầu */}
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          title="Gửi"
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
            input.trim() && !isLoading
              ? "bg-[#9d6cf8] text-white hover:bg-[#8d58f3] shadow-md hover:scale-105 active:scale-95"
              : "text-gray-500 bg-white/5 cursor-not-allowed opacity-40"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </div>
    </div>
  );
}

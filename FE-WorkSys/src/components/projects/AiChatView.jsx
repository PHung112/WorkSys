import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const QUICK_PROMPTS = [
  { icon: "summarize", label: "Tóm tắt tiến độ hôm nay", prompt: "Hãy tóm tắt tình hình tiến độ các task trong dự án hôm nay." },
  { icon: "warning", label: "Task nào đang trễ hạn?", prompt: "Liệt kê các task đang quá hạn hoặc có nguy cơ trễ hạn và cho tôi biết ai đang phụ trách." },
  { icon: "bar_chart", label: "Tổng quan hoàn thành", prompt: "Bao nhiêu phần trăm công việc đã hoàn thành? Có bao nhiêu task đã DONE, đang IN_PROGRESS, chưa bắt đầu?" },
  { icon: "person_search", label: "Ai đang quá tải?", prompt: "Thành viên nào đang đảm nhận nhiều task nhất? Ai có nguy cơ quá tải?" },
];

/**
 * Component hiển thị màn hình Chat AI trực tiếp bên trong ProjectDetail
 */
export default function AiChatView({
  projectId,
  selectedProject,
  onBackToKanban,
}) {
  const token = sessionStorage.getItem("token");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `Xin chào! Tôi là trợ lý AI thông minh của dự án **${selectedProject?.name || ""}**. Tôi có thể giúp bạn phân tích tiến độ, thống kê khối lượng công việc, phát hiện các task trễ hạn và đưa ra đề xuất tối ưu. Bạn cần hỗ trợ gì?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  return (
    <div className="flex-1 flex flex-col w-full h-full px-container-margin overflow-hidden pb-6">
      {/* Header thanh điều hướng */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToKanban}
            className="h-9 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg flex items-center gap-1.5 text-xs font-medium border border-outline-variant/20 transition-colors cursor-pointer"
            title="Quay lại Bảng công việc Kanban"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Bảng công việc</span>
          </button>
          <div className="h-4 w-px bg-outline-variant/20 hidden sm:block"></div>
          <div>
            <h2 className="font-display text-xl font-bold text-on-background flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-[24px] text-purple-400">smart_toy</span>
              <span>Trợ lý AI Dự án (Project Chatbot)</span>
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-full border border-purple-500/20">
                Google Gemini
              </span>
            </h2>
            <p className="text-on-surface-variant text-xs mt-0.5">
              Hỏi đáp, phân tích số liệu và tư vấn tiến độ công việc theo thời gian thực
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages([{
            role: "ai",
            text: `Đã làm mới đoạn hội thoại! Bạn có thể đặt câu hỏi mới về dự án **${selectedProject?.name || ""}**.`,
          }])}
          className="h-9 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-lg flex items-center gap-1.5 text-xs font-medium border border-outline-variant/20 transition-colors cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span>Làm mới hội thoại</span>
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-surface-container-low border border-outline-variant/20 rounded-2xl overflow-hidden my-4 shadow-sm min-h-0">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm shadow-sm ${
                  msg.role === "ai"
                    ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white"
                    : "bg-surface-container-highest text-primary font-bold"
                }`}
              >
                {msg.role === "ai" ? (
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    smart_toy
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">person</span>
                )}
              </div>

              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-on-primary rounded-tr-sm"
                    : "bg-surface-container text-on-surface border border-outline-variant/20 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.role === "ai" ? (
                  <div className="prose prose-invert prose-sm max-w-none [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p:last-child]:mb-0">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap m-0">{msg.text}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] animate-pulse">smart_toy</span>
              </div>
              <div className="bg-surface-container border border-outline-variant/20 rounded-2xl rounded-tl-sm px-4 py-3 text-on-surface-variant flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
                <span className="text-xs">AI đang phân tích dữ liệu dự án...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-surface-container/40 border-t border-outline-variant/10 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <span className="text-[11px] text-on-surface-variant shrink-0 font-medium">Gợi ý nhanh:</span>
          {QUICK_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(item.prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-surface-container-high hover:bg-purple-600/20 text-on-surface-variant hover:text-purple-300 rounded-lg text-xs font-medium border border-outline-variant/15 transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[14px] text-purple-400">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-4 bg-surface-container border-t border-outline-variant/15 shrink-0">
          <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-1.5 focus-within:border-purple-500/50 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi cho trợ lý AI... (Enter để gửi, Shift+Enter để xuống dòng)"
              rows={1}
              className="flex-1 bg-transparent border-none text-xs md:text-sm text-on-surface outline-none resize-none py-1.5 placeholder:text-on-surface-variant/50 max-h-28 custom-scrollbar"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-sm"
              title="Gửi tin nhắn"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

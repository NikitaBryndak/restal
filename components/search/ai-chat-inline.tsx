"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { Send, ArrowLeft, ArrowDown, Loader2, Bot, Sparkles, Plane, User, MapPin, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TripPlanCard, { type TripPlan } from "./trip-plan-card";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AiChatInlineProps = {
  onClose: () => void;
  initialQuery?: string;
};

export default function AiChatInline({ onClose, initialQuery }: AiChatInlineProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialQuerySent = useRef(false);

  // Load chat history from session storage on mount
  useEffect(() => {
    const savedChat = sessionStorage.getItem("ai_chat_history");
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
  }, []);

  // Save chat history to session storage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("ai_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem("ai_chat_history");
    setTripPlan(null);
    setPlanError(null);
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const [visitorId, setVisitorId] = useState("");

  // Scroll locking and initialization
  useLayoutEffect(() => {
    // Immediate scroll to top
    window.scrollTo({ top: 0, behavior: "instant" });

    // Lock body scroll to prevent background scrolling
    document.body.style.overflow = "hidden";

    // Set active state for CSS transitions (nav/footer hiding)
    document.body.setAttribute("data-chat-active", "true");

    let id = localStorage.getItem("ai_visitor_id");
    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("ai_visitor_id", id);
    }
    setVisitorId(id);

    return () => {
      // Cleanup
      document.body.style.overflow = "";
      document.body.removeAttribute("data-chat-active");
    };
  }, []);

  // Mount animation
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    return () => setMounted(false);
  }, []);

  // Scroll tracking
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (inputRef.current) setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  // Send initial query
  useEffect(() => {
    if (initialQuery && !initialQuerySent.current && messages.length === 0) {
      initialQuerySent.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, visitorId }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Вибачте, сталася помилка. Спробуйте ще раз або зв'яжіться з нами через сторінку контактів." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  const generateTripPlan = async () => {
    if (messages.length < 2 || isPlanLoading) return;
    setIsPlanLoading(true);
    setPlanError(null);
    setTripPlan(null);

    try {
      const res = await fetch("/api/chat/trip-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "not_enough_info") {
          setPlanError("Поки недостатньо деталей для плану. Розкажіть більше про вашу подорож!");
        } else if (res.status === 429) {
          setPlanError("Ви досягли ліміту запитів на сьогодні. Зверніться до менеджера через сторінку контактів.");
        } else {
          setPlanError("Не вдалося сформувати план. Спробуйте ще раз.");
        }
        return;
      }

      const data = await res.json();
      setTripPlan(data.plan);
      setTimeout(scrollToBottom, 100);
    } catch {
      setPlanError("Помилка з'єднання. Спробуйте ще раз.");
    } finally {
      setIsPlanLoading(false);
    }
  };

  // Show "Generate Plan" button after 4+ messages (at least 2 exchanges)
  const showPlanButton = messages.length >= 4 && !tripPlan;

  const quickQuestions = [
    { emoji: "🧳", text: "Спланувати подорож" },
    { emoji: "🏖️", text: "Куди поїхати на пляж?" },
    { emoji: "🔥", text: "Гарячі тури" },
    { emoji: "✈️", text: "Найкращі напрямки" },
    { emoji: "💰", text: "Бюджетний відпочинок" },
    { emoji: "👨‍👩‍👧‍👦", text: "Відпочинок з дітьми" },
  ];

  return (
    <div className={`fixed inset-0 z-100 w-full h-dvh bg-black flex justify-center transition-all duration-700 ${mounted ? "opacity-100" : "opacity-0 translate-y-8"}`}>
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl flex flex-col h-full relative px-4 sm:px-6">

      {/* Header */}
      <div className="flex items-center gap-4 py-4 sticky top-0 z-20 bg-black/60 backdrop-blur-2xl border-b border-white/10 px-2 sm:px-0">
        <button
          onClick={onClose}
          className="group flex items-center justify-center w-10 h-10 text-white/70 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
        >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 flex items-center justify-center shadow-lg shadow-accent/10">
              <Bot className="w-5 h-5 text-accent" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
          </div>
          <div className="leading-tight flex-1 text-left flex flex-col items-start justify-center">
            <h2 className="text-white text-[15px] font-semibold tracking-wide m-0 p-0">RestAL Assistant</h2>
            <div className="text-emerald-400/90 text-[11px] font-medium flex items-center gap-1.5 mt-0.5 justify-start">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              онлайн
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Очистити чат"
              className="p-2.5 text-white/50 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors"
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-3 relative px-1 scroll-smooth pb-32"
        style={{ scrollbarWidth: "none" }}
      >
        {messages.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full gap-8 transition-all duration-500 delay-200 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            {/* Elegant intro graphic */}
            <div className="relative group">
              <div className="absolute inset-0 w-32 h-32 -m-6 rounded-full bg-accent/20 blur-3xl animate-pulse group-hover:bg-accent/30 transition-colors duration-700" />
              <div className="relative w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-accent/20 to-accent/5 border border-accent/30 flex items-center justify-center shadow-2xl shadow-accent/20 rotate-3 group-hover:rotate-6 transition-transform duration-500">
                <Plane className="w-8 h-8 text-white -rotate-12 group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>

            <div className="text-center space-y-4 max-w-md mt-2">
              <h3 className="text-white text-3xl font-bold tracking-tight">Персональний Тур-AI</h3>
              <p className="text-white/50 text-[15px] leading-relaxed font-medium">
                Почнемо складати вашу ідеальну подорож. Я допоможу знайти напрямок, дізнатися про погоду та обрати готель.
              </p>
            </div>

            {/* Quick questions layout - Masonry style tags */}
            <div className="flex flex-wrap justify-center gap-3 w-full max-w-xl mt-4 px-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={q.text}
                  onClick={() => sendMessage(`${q.emoji} ${q.text}`)}
                  disabled={isLoading}
                  className={`group relative px-5 py-3 text-[14px] text-white/80 hover:text-white bg-white/5 hover:bg-accent/15 border border-white/10 hover:border-accent/40 rounded-full transition-all duration-300 flex items-center gap-2.5 overflow-hidden hover:shadow-[0_0_20px_rgba(15,164,230,0.15)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: `${300 + i * 60}ms` }}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{q.emoji}</span>
                  <span className="font-medium tracking-wide">{q.text}</span>
                </button>
              ))}
            </div>

            {isLoading && (
              <div className="flex gap-1.5 items-center mt-4">
                <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" />
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 space-y-5 px-0 sm:px-2">
            {/** AI Travel Planner timeline style */}
            <div className="space-y-8 pb-10 mt-4 relative">
              {/* Central dashed line for timeline - coordinates with icons */}
              <div className="absolute left-[23px] sm:left-[27px] top-6 bottom-4 w-px border-l-2 border-dashed border-white/10 z-0" />

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className="flex gap-5 sm:gap-7 items-start relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  {/* Timeline icon */}
                  {msg.role === "assistant" ? (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-accent to-accent/80 border-[4px] border-black flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(15,164,230,0.3)] z-10 relative">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/5 border-[4px] border-black flex items-center justify-center shrink-0 shadow-lg backdrop-blur-md z-10 relative mt-1">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white/50" />
                    </div>
                  )}

                  {/* Content block */}
                  <div
                    className={`flex-1 pt-1 ${
                      msg.role === "user"
                        ? "min-h-[3rem] sm:min-h-[3.5rem] flex items-center mt-1"
                        : ""
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-[16px] sm:text-[18px] font-semibold text-white/90 text-left whitespace-pre-wrap tracking-wide leading-snug">
                        {msg.content}
                      </p>
                    ) : (
                      <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 rounded-3xl rounded-tl-[4px] p-5 sm:p-7 shadow-xl shadow-black/20 backdrop-blur-md">
                        <div className="text-left prose prose-invert prose-sm sm:prose-base max-w-none prose-p:leading-[1.7] prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-a:text-accent hover:prose-a:text-accent/80 prose-strong:text-white/95 prose-ul:ml-2 prose-ol:ml-2 prose-headings:font-bold prose-headings:text-white/95 prose-headings:tracking-tight">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-5 sm:gap-7 items-start relative z-10 animate-in fade-in duration-300 mt-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/5 border-[4px] border-black flex items-center justify-center shrink-0 shadow-lg backdrop-blur-md z-10 relative">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-accent animate-pulse" />
                  </div>
                  <div className="flex-1 mt-1.5">
                    <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-3xl rounded-tl-[4px] px-6 py-5 w-fit flex items-center shadow-lg backdrop-blur-md">
                      <div className="flex gap-2 items-center h-4">
                        <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trip Plan: generate button */}
            {showPlanButton && !isLoading && (
              <div className="flex justify-center py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <button
                  onClick={generateTripPlan}
                  disabled={isPlanLoading}
                  className="group flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-accent/20 to-accent/10 hover:from-accent hover:to-accent/90 border border-accent/30 hover:border-accent rounded-full text-accent hover:text-white text-sm font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(15,164,230,0.15)] hover:shadow-[0_0_30px_rgba(15,164,230,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isPlanLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Формую план...
                    </>
                  ) : (
                    <>
                      <Plane className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                      ✨ Сформувати план подорожі
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Trip Plan: error message */}
            {planError && (
              <div className="flex justify-center py-2 animate-in fade-in duration-300">
                <p className="text-orange-400/80 text-xs text-center max-w-sm">{planError}</p>
              </div>
            )}

            {/* Trip Plan: visual card */}
            {tripPlan && (
              <div className="py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TripPlanCard
                  plan={tripPlan}
                  onClose={() => setTripPlan(null)}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom */}
      {showScrollButton && (
        <div className="absolute bottom-28 right-4 sm:right-6 z-20 animate-in fade-in slide-in-from-bottom-5 duration-300 delay-100">
          <button
            onClick={scrollToBottom}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all border border-white/10 backdrop-blur-md shadow-2xl hover:scale-105 active:scale-95"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input area — always at the bottom */}
      <div className={`absolute bottom-0 left-0 right-0 py-4 px-4 sm:px-6 transition-all duration-500 delay-300 bg-gradient-to-t from-black via-black/95 to-transparent pt-12 z-10 pointer-events-none ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="relative max-w-3xl mx-auto pointer-events-auto">
          <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-2xl border border-white/10 focus-within:border-accent/40 rounded-2xl px-4 py-1.5 transition-all duration-300 focus-within:bg-black/80 focus-within:shadow-[0_0_40px_rgba(15,164,230,0.1)]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишіть повідомлення (наприклад: Готелі в Дубаї)..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-white text-[15px] placeholder-white/30 outline-none py-3.5 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-accent/20 hover:bg-accent text-accent hover:text-white flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:hover:bg-accent/20 disabled:hover:text-accent shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-white/30 text-center mt-3 tracking-wide font-medium">
            AI може допускати помилки. Перевіряйте важливу інформацію.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

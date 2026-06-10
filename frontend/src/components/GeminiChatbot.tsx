import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, Bot, User, Loader2, RefreshCw, Maximize2, Minimize2, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { geminiStore, Message, syncGeminiUserSession } from "../services/geminiStore";

interface GeminiChatbotProps {
  userId?: string;
  mode?: "widget" | "full";
  initialCollapsed?: boolean;
}

export function GeminiChatbot({ userId, mode = "widget", initialCollapsed = false }: GeminiChatbotProps) {
  const [messages, setMessages] = useState<Message[]>(geminiStore.getMessages());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Sync user boundaries
  useEffect(() => {
    syncGeminiUserSession(userId);
  }, [userId]);

  // Subscribe to shared message store updates
  useEffect(() => {
    const unsubscribe = geminiStore.subscribe(() => {
      setMessages(geminiStore.getMessages());
    });
    return unsubscribe;
  }, []);

  // Scroll to the bottom locally within the active scrollable container to prevent parent layout offsets
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, loading, isCollapsed]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    if (!textToSend) {
      setInput("");
    }

    const currentMessages = [...messages, { role: "user" as const, content: text }];
    geminiStore.setMessages(currentMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: currentMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed response from Gemini");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      // Add placeholder assistant message that we will populate incrementally
      let streamedAssistantContent = "";
      geminiStore.setMessages([
        ...currentMessages,
        { role: "assistant", content: "" },
      ]);

      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            if (cleanLine.startsWith("data: ")) {
              const dataStr = cleanLine.substring(6);
              if (dataStr === "[DONE]") {
                done = true;
                break;
              }

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  streamedAssistantContent += parsed.text;
                  geminiStore.setMessages([
                    ...currentMessages,
                    { role: "assistant", content: streamedAssistantContent },
                  ]);
                }
              } catch (e) {
                console.error("Error parsing streaming line:", e);
              }
            }
          }
        }
      }

      // Flush remaining buffer if applicable
      if (buffer.trim().startsWith("data: ")) {
        const cleanLine = buffer.trim();
        const dataStr = cleanLine.substring(6);
        if (dataStr !== "[DONE]") {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              streamedAssistantContent += parsed.text;
              geminiStore.setMessages([
                ...currentMessages,
                { role: "assistant", content: streamedAssistantContent },
              ]);
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err: any) {
      console.error("[STREAM CHAT ERROR]", err);
      // Fallback in case stream breaks or fails
      geminiStore.setMessages([
        ...currentMessages,
        {
          role: "assistant",
          content: "Sorry, I had trouble reaching the AI server. Please make sure the Gemini API key is configured.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleLayout = () => {
    if (mode === "widget") {
      // Dispatches the global custom event to switch to full-page workspace
      window.dispatchEvent(new CustomEvent("switch-tab", { detail: { tab: "gemini-workspace" } }));
    } else {
      // Dispatches event to go back to the previous tab (e.g. feed)
      window.dispatchEvent(new CustomEvent("switch-tab", { detail: { tab: "goback" } }));
      if (window.innerWidth < 1024) {
        // Automatically route back into the website header mobile menu/menubar with a safe transition delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("open-mobile-menu"));
        }, 80);
      }
    }
  };

  const presetPrompts = [
    "💡 Give me project ideas",
    "🚀 Standout portfolio tips",
    "📋 Format my problem statement",
  ];

  // ==================== RENDERING FOR FULL-PAGE WORKSPACE ====================
  if (mode === "full") {
    return (
      <div className="w-full h-[calc(100vh-220px)] min-h-[500px] lg:h-[calc(100vh-170px)] bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800 p-0 shadow-xl flex flex-col overflow-hidden select-none transition-all duration-300">
        
        {/* Header bar area */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-indigo-50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLayout}
              className="p-2 mr-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title="Return to previous screen"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>Gemini AI Workspace</span>
                  <span className="text-[9px] bg-emerald-550/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                    Session Persistent
                  </span>
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-550 hidden sm:block">
                  Design complex systems, map database models, and write polished portfolio outlines
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => geminiStore.clearChat()}
              title="Clear current workspace chats"
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer font-bold border border-transparent"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Workspace</span>
            </button>

            <button
              onClick={toggleLayout}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl transition-all cursor-pointer font-extrabold border border-indigo-100/10"
              title="Restore small widget companion"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Small Window</span>
            </button>
          </div>
        </div>

        {/* Content area splitting helper prompts and main workspace */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-white/20 dark:bg-slate-950/10">
          
          {/* Sidebar Panel - helper prompts & blueprints */}
          <div className="hidden lg:flex flex-col w-72 border-r border-slate-100 dark:border-slate-800 p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/10 select-none">
            <div className="space-y-2">
              <h4 className="text-[11px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">Companion Blueprints</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Click any layout shortcut below to have Gemini immediately outline modern project files, architecture strategies, or relational SQL schemas.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest font-mono">Quick Inquiries</span>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSend("Design a state-persisted project widget incorporating beautiful, eye-catching glassmorphism styling and clear step-by-step instructions.")}
                  className="text-left p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:shadow-xs transition-all text-[11px] font-bold text-slate-650 dark:text-slate-350 cursor-pointer"
                >
                  ✨ High-fidelity glass styling
                </button>
                <button
                  onClick={() => handleSend("Describe full-stack code organization strategy using Vite server integrations and database repositories, ideal for portfolio presentation.")}
                  className="text-left p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:shadow-xs transition-all text-[11px] font-bold text-slate-650 dark:text-slate-350 cursor-pointer"
                >
                  📂 Full-stack code layout
                </button>
                <button
                  onClick={() => handleSend("Outline an original local neighborhood problem or community platform idea that will standout in developer interview discussions.")}
                  className="text-left p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:shadow-xs transition-all text-[11px] font-bold text-slate-650 dark:text-slate-350 cursor-pointer"
                >
                  💡 Local community solutions
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-150 dark:border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <Bot className="w-3.5 h-3.5 text-emerald-500" />
              <span>Independent Chat Box</span>
            </div>
          </div>

          {/* Main vertical chat console */}
          <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 bg-white/40 dark:bg-slate-900/10">
            {/* Feed */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrolls-custom bg-slate-50/10 dark:bg-slate-950/5">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-8.5 h-8.5 rounded-xl bg-indigo-650 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Bot className="w-4.5 h-4.5" />
                    </div>
                  )}
                  <div
                    className={`p-4 rounded-2xl text-[12.5px] leading-relaxed max-w-[85vw] sm:max-w-[75%] shadow-xs whitespace-pre-line ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white/90 dark:bg-slate-800/90 border border-slate-150 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="w-8.5 h-8.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3.5 justify-start items-center">
                  <div className="w-8.5 h-8.5 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <div className="bg-white/95 dark:bg-slate-800/95 border border-slate-150 dark:border-slate-800/60 p-4 rounded-2xl rounded-tl-none flex items-center gap-2.5 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleFormSubmit} ref={formRef} className="p-4 border-t border-slate-150 dark:border-slate-850/85 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask Gemini for architectural templates, SQL outlines, or formatting suggestions..."
                className="flex-1 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-xs sm:text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 shadow-inner"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-550 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ask Gemini</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDERING FOR SIDEBAR/DRAWER COMPANION WIDGET ====================
  const handleWidgetCardClick = (e: React.MouseEvent) => {
    if (isCollapsed) {
      e.stopPropagation();
      // Directly switches top page workspace to help them instantly!
      toggleLayout();
    }
  };

  return (
    <div 
      onClick={handleWidgetCardClick}
      className={`w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-all select-none duration-300 ${
        isCollapsed 
          ? "cursor-pointer hover:bg-white/90 dark:hover:bg-slate-900/90 hover:border-indigo-400/50 dark:hover:border-indigo-500/40 hover:shadow-xs" 
          : "space-y-3"
      }`}
    >
      {/* Header section with maximize trigger */}
      <div className={`flex items-center justify-between ${isCollapsed ? "" : "border-b border-indigo-50 dark:border-slate-800/50 pb-2.5"}`}>
        <div className="flex items-center gap-1.5 shrink-0 max-w-[55%]">
          <div className="p-1 px-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
            Gemini Assistant
          </h3>
          <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider font-mono">
            Free
          </span>
        </div>
        
        {/* Navigation Actions (Using tiny compact icon triggers to completely prevent layout offsets or overflow) */}
        <div className="flex items-center gap-1 p-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={toggleLayout}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer p-1.5 rounded-lg hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 flex items-center justify-center transition-all border border-transparent hover:border-indigo-100/45 shrink-0"
            title="Expand chat to Full Screen workspace page"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-slate-605 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center shrink-0"
            title={isCollapsed ? "Expand chatbot" : "Collapse chatbot"}
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-3"
          >
            {/* Messages Area */}
            <div ref={chatScrollRef} className="h-56 overflow-y-auto space-y-3 pr-1 scrolls-custom border border-slate-100 dark:border-slate-800/40 p-2.5 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`p-2.5 rounded-2xl text-[11px] max-w-[85%] leading-relaxed ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 rounded-tl-none pr-3"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start items-center">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/60 p-2.5 rounded-2xl rounded-tl-none flex items-center gap-1 text-[11px] text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-550" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Presets (Refined transparent alpha colors for smooth non-flicker switches) */}
            {messages.length <= 1 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Quick Topics
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {presetPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSend(p)}
                      className="text-[10px] bg-slate-200/50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-705 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-2.5 py-1 rounded-lg cursor-pointer text-left font-semibold border border-transparent dark:border-slate-700/30 transition-all duration-200"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleFormSubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask Gemini..."
                className="flex-1 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 bg-indigo-600 hover:bg-indigo-550 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 animate-fade-in"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => geminiStore.clearChat()}
                title="Clear Chat Log"
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-705 dark:text-slate-400 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import { apiFetch } from "../api/client";

export function ChatBot() {
  const t = useT();

  const SYSTEM_PROMPT = t("chatbot.systemPrompt");
  const GREETING = t("chatbot.greeting");
  const ERROR_MESSAGE = t("chatbot.errorMessage");

  const QUICK_REPLIES = [
    t("chatbot.quickReplies.howToOrder"),
    t("chatbot.quickReplies.howToBecomeMerchant"),
    t("chatbot.quickReplies.whereOrders"),
    t("chatbot.quickReplies.whatIsVertigo"),
  ];

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // The Groq API key lives on the backend now — we just send the
      // conversation and the server proxies it (see ChatController).
      const data = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...newMessages,
          ],
        }),
      });

      const reply = data?.reply ?? "";
      if (!reply) throw new Error(t("chatbot.emptyResponse"));

      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("[ChatBot]", err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `${ERROR_MESSAGE}\n\n(${err.message})` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t("chatbot.closeChat") : t("chatbot.openChat")}
        className="fixed bottom-5 right-5 z-[90] grid h-14 w-14 place-items-center rounded-full bg-eco-coral text-white shadow-xl ring-4 ring-white/40 transition hover:brightness-95 active:scale-95 md:bottom-6 md:right-6"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M18 6 6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
            <path
              d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[90] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-2xl backdrop-blur-xl md:right-6">
          {/* Header */}
          <div className="flex items-center gap-3 bg-eco-green px-4 py-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-eco-coral">
              <span className="text-sm font-bold text-white">V</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-bold leading-tight text-eco-beige">
                {t("chatbot.title")}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                </span>
                <p className="text-[11px] font-medium text-eco-beige/75">{t("chatbot.online")}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex max-h-[420px] min-h-[320px] flex-col gap-3 overflow-y-auto bg-eco-beige/40 px-4 py-4"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={[
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-eco-coral text-white"
                    : "mr-auto bg-white text-eco-green",
                ].join(" ")}
              >
                {m.content}
              </div>
            ))}

            {/* Quick-reply chips — only when conversation is at the greeting */}
            {messages.length === 1 && !loading && (
              <div className="mr-auto flex flex-wrap gap-2">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-eco-green/20 bg-white px-3 py-1.5 text-xs font-semibold text-eco-green shadow-sm transition hover:border-eco-coral/40 hover:bg-eco-coral/5 active:scale-[0.98]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="mr-auto flex items-center gap-1 rounded-2xl bg-white px-3.5 py-3 shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-eco-green/50 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-eco-green/50 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-eco-green/50" />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-eco-green/10 bg-white p-3">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
              placeholder={t("chatbot.inputPlaceholder")}
              className="flex-1 resize-none rounded-xl border border-eco-green/15 bg-eco-beige/30 px-3 py-2 text-sm text-eco-green placeholder:text-eco-green/40 focus:border-eco-coral/40 focus:outline-none focus:ring-2 focus:ring-eco-coral/25"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label={t("chatbot.send")}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-eco-coral text-white transition hover:brightness-95 active:scale-95 disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M4 12h15M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

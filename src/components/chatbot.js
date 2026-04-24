import { useEffect, useRef, useState } from "react";

const SYSTEM_PROMPT = `You are Vertigo's friendly in-app assistant. Your job is to answer users' questions and help them navigate the website — nothing more. Do not invent features that don't exist.

ABOUT VERTIGO
Vertigo is a food rescue app in Algeria (Oran, Mostaganem, Sidi Bel Abbès) that connects consumers with local restaurants and stores selling surplus food at a discount. Basket types are Bakery, Food, Grocery, and Dessert/Surprise.

HOW THE APP WORKS (walk users through this when asked)
1. Sign up at /signup (name, email, phone, password) or log in at /login.
2. Browse deals at /deals — a grid of nearby restaurants with discounts. Users can sort by Best discount, Distance, or Rating, and pick a radius (2–50 km). The app uses the browser's geolocation; if denied, it falls back to Oran center.
3. Each deal card has an "Order now" button. One click places an order; no payment in-app — users pay at pickup.
4. Customers track their orders at /orders. Status stages: Pending → Preparing → On the way → Delivered. When the order says "On the way", the customer can tap "Mark received".
5. Customers can flag a restaurant from a deal card or order row (Report button).

BECOMING A MERCHANT
Users who want to sell surplus food apply at /become-merchant. The form requires shop name, city, description, full address, and a Registre de Commerce (business registration number). Admin reviews every application. Once approved, the user's role becomes Gerant and they see "My restaurant" in the header.

MERCHANT DASHBOARD (/my-restaurant)
Approved merchants see incoming orders and update status with buttons: "Start preparing", "Mark on the way", "Mark delivered". They can also cancel or report a customer.

ADMIN
Admins approve or reject merchant applications at /admin/approvals.

NAV LINKS (direct users here when helpful)
- /deals — deals feed
- /orders — my orders
- /my-restaurant — merchant dashboard (gérants only)
- /become-merchant — apply as a merchant
- /admin/approvals — admin review (admins only)
- /login, /signup — auth pages

LANGUAGE
Detect the user's language and always reply in the same one. Fluently support English and French. If they switch mid-conversation, switch with them.

STYLE
- Keep answers short, warm, and concrete. 1–3 sentences unless they ask for details.
- Point to specific pages/buttons when relevant ("Go to /deals and tap Order now").
- Don't make up features (no in-app payment, no delivery tracking on a map, no reviews/ratings system beyond existing stars).
- If a question isn't about Vertigo, food rescue, or navigating the site, politely redirect.`;

const GREETING =
  "Hi! I'm Vertigo's assistant 🌱 Ask me anything about rescuing food, baskets, or how the app works.\n\nBonjour ! Je suis l'assistant Vertigo 🌱 Posez-moi vos questions sur la récupération alimentaire, les paniers ou le fonctionnement de l'application.";

const ERROR_MESSAGE =
  "Sorry, I'm having trouble right now. Please try again! / Désolé, j'ai un problème en ce moment. Veuillez réessayer !";

const QUICK_REPLIES = [
  "How do I order?",
  "How do I become a merchant?",
  "Where do I see my orders?",
  "What is Vertigo?",
];

export function ChatBot() {
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
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_OPENROUTER_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Vertigo",
        },
        body: JSON.stringify({
          model: "inclusionai/ling-2.6-flash:free",
          max_tokens: 1024,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...newMessages,
          ],
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content ?? "";

      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("[ChatBot]", err);
      setMessages((m) => [...m, { role: "assistant", content: ERROR_MESSAGE }]);
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
        aria-label={open ? "Close chat" : "Open chat"}
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
            <div className="min-w-0">
              <p className="font-heading text-sm font-bold text-eco-beige">
                Vertigo Assistant
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                <p className="text-[11px] text-eco-beige/75">Online</p>
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
              placeholder="Ask anything… / Pose ta question…"
              className="flex-1 resize-none rounded-xl border border-eco-green/15 bg-eco-beige/30 px-3 py-2 text-sm text-eco-green placeholder:text-eco-green/40 focus:border-eco-coral/40 focus:outline-none focus:ring-2 focus:ring-eco-coral/25"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send"
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

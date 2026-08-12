import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { motion, AnimatePresence, FadeIn } from "../components/motion";
import { EASE } from "../components/motion";

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderMarkdown(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

const GREETING =
  "Hello! I'm your Aimdeed AI assistant. I can help you with NEET/JEE preparation strategies, syllabus doubts, or technical support. How can I assist you today?";

export default function Chatbot() {
  const [messages, setMessages] = useState([{ sender: "bot", text: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { sender: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const data = await api.chat(message);
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply || "" }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "I apologize, but I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="page-hero" style={{ paddingBottom: "2rem" }}>
        <div className="container">
          <FadeIn>
            <motion.div
              style={{
                width: 64,
                height: 64,
                margin: "0 auto 1rem",
                borderRadius: "50%",
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
              }}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <i className="ri-robot-2-line"></i>
            </motion.div>
            <h1 className="page-title" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Aimdeed AI Assistant
            </h1>
            <motion.p
              className="text-success mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <i className="ri-checkbox-circle-fill me-1"></i>Online & Ready to Help
            </motion.p>
          </FadeIn>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <FadeIn className="glass-card chat-container" style={{ display: "flex", flexDirection: "column" }}>
            <div className="chat-body" ref={bodyRef}>
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: EASE }}
                  >
                    {m.sender === "user" ? (
                      <div className="chat-bubble user">{m.text}</div>
                    ) : (
                      <div
                        className="chat-bubble bot chatbot-response"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <motion.div
                  className="chat-bubble bot"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="spinner-border spinner-border-sm me-2"></span>Thinking...
                </motion.div>
              )}
            </div>

            <div className="d-flex gap-2 mt-3" style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "1rem" }}>
              <input
                type="text"
                className="form-control form-control-glass"
                placeholder="Type your doubt..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                autoComplete="off"
              />
              <button className="btn-premium flex-shrink-0" onClick={sendMessage} disabled={loading || !input.trim()}>
                <i className="ri-send-plane-2-line"></i>
              </button>
            </div>
            <p className="text-muted small mt-2 mb-0 text-center" style={{ fontSize: "0.75rem" }}>
              AI may produce inaccurate information about people, places, or facts.
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}

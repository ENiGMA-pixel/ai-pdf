import { useState, useRef, useEffect } from "react";

export default function ChatPanel({ onSend, onClose, prefilledMessage, onPrefilledConsumed }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi! I've read your document. Ask me anything — summaries, explanations, key points, or deep dives.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-send prefilled message (from "Explain This")
  useEffect(() => {
    if (prefilledMessage) {
      setInput(prefilledMessage);
      onPrefilledConsumed?.();
    }
  }, [prefilledMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsLoading(true);

    try {
      const reply = await onSend(text);
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: `⚠️ Error: ${e.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "Summarize this document",
    "What are the key points?",
    "Explain the main argument",
  ];

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <span>🤖</span>
          <span>Ask Gemini</span>
        </div>
        <button style={styles.closeBtn} onClick={onClose} title="Close chat">✕</button>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.row,
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "ai" && <span style={styles.avatar}>🤖</span>}
            <div
              style={{
                ...styles.bubble,
                ...(msg.role === "user" ? styles.userBubble : styles.aiBubble),
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ ...styles.row, justifyContent: "flex-start" }}>
            <span style={styles.avatar}>🤖</span>
            <div style={{ ...styles.bubble, ...styles.aiBubble, ...styles.dotsBubble }}>
              <span style={{ ...styles.dot, animationDelay: "0s" }} />
              <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
              <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length === 1 && !isLoading && (
        <div style={styles.quickPrompts}>
          {quickPrompts.map((p) => (
            <button
              key={p}
              style={styles.quickBtn}
              onClick={() => handleSend(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={styles.inputRow}>
        <textarea
          style={styles.textarea}
          placeholder="Ask anything about this document…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={isLoading}
        />
        <button
          style={{
            ...styles.sendBtn,
            ...(!input.trim() || isLoading ? styles.sendDisabled : {}),
          }}
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
        >
          ➤
        </button>
      </div>

      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  panel: {
    width: "40%",
    minWidth: "300px",
    maxWidth: "480px",
    background: "#12122a",
    borderLeft: "1px solid #2a2a4a",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid #2a2a4a",
    flexShrink: 0,
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600",
    color: "#e0e0e0",
    fontSize: "15px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#555",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 6px",
    borderRadius: "4px",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  row: { display: "flex", alignItems: "flex-start", gap: "8px" },
  avatar: { fontSize: "18px", flexShrink: 0, marginTop: "2px" },
  bubble: {
    maxWidth: "87%",
    padding: "10px 14px",
    borderRadius: "14px",
    fontSize: "14px",
    lineHeight: "1.65",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  aiBubble: {
    background: "#1e1e3a",
    color: "#d0d0e8",
    borderBottomLeftRadius: "4px",
  },
  userBubble: {
    background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
    color: "#fff",
    borderBottomRightRadius: "4px",
  },
  dotsBubble: {
    display: "flex",
    gap: "5px",
    alignItems: "center",
    padding: "14px 18px",
  },
  dot: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#6c63ff",
    animation: "dotBounce 1.2s infinite",
  },
  quickPrompts: {
    padding: "0 14px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flexShrink: 0,
  },
  quickBtn: {
    padding: "8px 14px",
    background: "rgba(108,99,255,0.07)",
    border: "1px solid rgba(108,99,255,0.22)",
    color: "#9d97ff",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
    textAlign: "left",
  },
  inputRow: {
    display: "flex",
    gap: "8px",
    padding: "12px 14px",
    borderTop: "1px solid #2a2a4a",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    color: "#e0e0e0",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "14px",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: "1.5",
  },
  sendBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
    border: "none",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendDisabled: { opacity: 0.35, cursor: "not-allowed" },
};

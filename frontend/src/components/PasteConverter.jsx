import { useState } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function PasteConverter({ onUpload }) {
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("my-document");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConvert = async () => {
    if (!text.trim()) { setError("Please paste some text first."); return; }
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/paste-to-pdf/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), filename: filename || "my-document" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Conversion failed");
      }

      const data = await res.json();
      onUpload(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.icon}>📝</span>
          <div>
            <h2 style={styles.title}>Paste Text</h2>
            <p style={styles.subtitle}>Paste any text — articles, chat logs, notes — and convert to a readable PDF</p>
          </div>
        </div>

        {/* Filename */}
        <div style={styles.field}>
          <label style={styles.label}>Document name</label>
          <input
            style={styles.input}
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="my-document"
          />
        </div>

        {/* Text area */}
        <div style={styles.field}>
          <label style={styles.label}>Paste your text here</label>
          <textarea
            style={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Paste your article, chat conversation, notes, or any long text here…\n\nTip: Chat logs are automatically formatted with speaker headings!"}
            rows={12}
          />
          <div style={styles.stats}>
            <span>{wordCount.toLocaleString()} words</span>
            <span>{charCount.toLocaleString()} characters</span>
          </div>
        </div>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        <button
          style={{ ...styles.btn, ...(isLoading || !text.trim() ? styles.btnDisabled : {}) }}
          onClick={handleConvert}
          disabled={isLoading || !text.trim()}
        >
          {isLoading ? (
            <><span style={styles.spinner} /> Converting…</>
          ) : (
            "📄 Convert to PDF & Open"
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const styles = {
  wrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 20px",
    overflowY: "auto",
  },
  card: {
    width: "100%",
    maxWidth: "600px",
    background: "#14142a",
    border: "1px solid #2a2a4a",
    borderRadius: "18px",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  cardHeader: { display: "flex", alignItems: "flex-start", gap: "14px" },
  icon: { fontSize: "32px", flexShrink: 0 },
  title: { fontSize: "20px", fontWeight: "700", color: "#e0e0e0", margin: "0 0 4px" },
  subtitle: { fontSize: "13px", color: "#666", margin: 0, lineHeight: "1.4" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: {
    padding: "10px 14px",
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: "10px",
    color: "#e0e0e0",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
  },
  textarea: {
    padding: "14px",
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: "12px",
    color: "#d0d0e0",
    fontSize: "14px",
    lineHeight: "1.6",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
    minHeight: "220px",
  },
  stats: {
    display: "flex",
    gap: "14px",
    fontSize: "11px",
    color: "#555",
    justifyContent: "flex-end",
  },
  error: {
    background: "rgba(255,80,80,0.08)",
    border: "1px solid rgba(255,80,80,0.25)",
    color: "#ff6b6b",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
  },
  btn: {
    padding: "14px",
    background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  btnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  spinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
};

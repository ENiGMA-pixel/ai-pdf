import { useState, useEffect } from "react";

export default function SmartChapters({ sessionId, apiUrl, onChapterJump }) {
  const [chapters, setChapters] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeChapter, setActiveChapter] = useState(null);

  useEffect(() => {
    if (sessionId) loadChapters();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadChapters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/generate-chapters/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setChapters(data.chapters || []);
        setSummary(data.summary || []);
      }
    } catch (err) {
      console.error("Chapters error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterClick = (chapter, idx) => {
    setActiveChapter(idx);
    // sentence_index from the backend aligns with the frontend's sentence array
    if (chapter.sentence_index !== undefined) {
      onChapterJump?.(chapter.sentence_index);
    }
    setExpanded(false); // close panel after jump
  };

  if (!chapters && !summary && !loading) return null;

  return (
    <div style={styles.container}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={styles.toggleBtn}
        title="Table of Contents"
      >
        {loading ? "⏳" : "📚"}{" "}
        {loading ? "Analyzing…" : expanded ? "Hide Contents" : "Contents"}
        {chapters?.length > 0 && !loading && (
          <span style={styles.badge}>{chapters.length}</span>
        )}
      </button>

      {expanded && (
        <div style={styles.panel}>
          {/* Summary */}
          {summary && summary.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionLabel}>📌 KEY POINTS</div>
              <ul style={styles.summaryList}>
                {summary.map((pt, i) => (
                  <li key={i} style={styles.summaryItem}>
                    <span style={styles.bullet}>▸</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chapters */}
          {chapters && chapters.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionLabel}>📄 CHAPTERS</div>
              {chapters.map((ch, i) => (
                <button
                  key={i}
                  style={{
                    ...styles.chapterBtn,
                    ...(activeChapter === i ? styles.chapterBtnActive : {}),
                  }}
                  onClick={() => handleChapterClick(ch, i)}
                >
                  <span style={styles.chNum}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={styles.chContent}>
                    <span style={styles.chTitle}>{ch.title}</span>
                    <span style={styles.chDesc}>{ch.description}</span>
                  </span>
                  <span style={styles.chArrow}>→</span>
                </button>
              ))}
            </div>
          )}

          <button style={styles.refreshBtn} onClick={loadChapters} disabled={loading}>
            {loading ? "Refreshing…" : "🔄 Refresh"}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    bottom: "82px",
    left: "16px",
    zIndex: 50,
    maxWidth: "320px",
  },
  toggleBtn: {
    padding: "9px 16px",
    background: "linear-gradient(135deg, #6c63ff, #8a7cff)",
    color: "#fff",
    border: "none",
    borderRadius: "24px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(108,99,255,0.4)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  badge: {
    background: "rgba(255,255,255,0.25)",
    borderRadius: "10px",
    padding: "1px 7px",
    fontSize: "11px",
    fontWeight: "700",
  },
  panel: {
    marginTop: "10px",
    background: "#14142a",
    border: "1px solid #3a3a6a",
    borderRadius: "12px",
    padding: "16px",
    maxHeight: "420px",
    overflowY: "auto",
    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
  },
  section: { marginBottom: "18px" },
  sectionLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#6c63ff",
    letterSpacing: "1px",
    marginBottom: "10px",
  },
  summaryList: { listStyle: "none", padding: 0, margin: 0 },
  summaryItem: {
    display: "flex",
    gap: "8px",
    fontSize: "12px",
    color: "#aaa",
    marginBottom: "7px",
    lineHeight: "1.45",
  },
  bullet: { color: "#6c63ff", flexShrink: 0, marginTop: "1px" },
  chapterBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 10px",
    background: "rgba(108,99,255,0.04)",
    border: "1px solid rgba(108,99,255,0.15)",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "6px",
    textAlign: "left",
    transition: "all 0.15s",
  },
  chapterBtnActive: {
    background: "rgba(108,99,255,0.15)",
    border: "1px solid rgba(108,99,255,0.5)",
  },
  chNum: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6c63ff",
    minWidth: "22px",
    flexShrink: 0,
  },
  chContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  chTitle: { fontSize: "12px", fontWeight: "600", color: "#e0e0e0" },
  chDesc: { fontSize: "11px", color: "#666", lineHeight: "1.3" },
  chArrow: { fontSize: "13px", color: "#555", flexShrink: 0 },
  refreshBtn: {
    width: "100%",
    padding: "7px",
    background: "rgba(108,99,255,0.08)",
    color: "#6c63ff",
    border: "1px solid rgba(108,99,255,0.3)",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

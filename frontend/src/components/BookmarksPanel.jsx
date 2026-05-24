import { useState } from "react";

export default function BookmarksPanel({ bookmarks, onJumpTo, onDelete, onClose }) {
  const [noteInput, setNoteInput] = useState({});

  const sorted = [...bookmarks].sort((a, b) => a.sentence_index - b.sentence_index);

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div style={styles.title}>🔖 Bookmarks</div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {sorted.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>🏷️</p>
            <p style={styles.emptyText}>No bookmarks yet.</p>
            <p style={styles.emptyHint}>Hover over any sentence and click 🏷️ to bookmark it.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {sorted.map((bm) => (
              <div key={bm.id} style={styles.item}>
                <div style={styles.itemTop}>
                  <span style={styles.itemIndex}>#{bm.sentence_index + 1}</span>
                  <div style={styles.itemActions}>
                    <button
                      style={styles.jumpBtn}
                      onClick={() => { onJumpTo?.(bm.sentence_index); onClose(); }}
                    >
                      Jump →
                    </button>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => onDelete?.(bm.id)}
                      title="Remove bookmark"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <p style={styles.excerpt}>
                  "{bm.sentence_text.slice(0, 120)}{bm.sentence_text.length > 120 ? "…" : ""}"
                </p>
                {bm.note && <p style={styles.note}>📝 {bm.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 200,
    display: "flex",
    justifyContent: "flex-end",
  },
  panel: {
    width: "360px",
    maxWidth: "100vw",
    background: "#14142a",
    borderLeft: "1px solid #3a3a6a",
    display: "flex",
    flexDirection: "column",
    animation: "slideInRight 0.25s ease",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 18px",
    borderBottom: "1px solid #2a2a4a",
    flexShrink: 0,
  },
  title: { fontSize: "16px", fontWeight: "700", color: "#e0e0e0" },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#555",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 6px",
  },
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    gap: "8px",
  },
  emptyIcon: { fontSize: "36px", margin: 0 },
  emptyText: { fontSize: "15px", color: "#888", margin: 0 },
  emptyHint: { fontSize: "12px", color: "#555", textAlign: "center", margin: 0 },
  list: { flex: 1, overflowY: "auto", padding: "12px" },
  item: {
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: "10px",
    padding: "12px 14px",
    marginBottom: "10px",
  },
  itemTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  itemIndex: { fontSize: "11px", color: "#6c63ff", fontWeight: "700" },
  itemActions: { display: "flex", gap: "8px", alignItems: "center" },
  jumpBtn: {
    padding: "4px 10px",
    background: "rgba(108,99,255,0.15)",
    border: "1px solid rgba(108,99,255,0.4)",
    color: "#9d97ff",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#555",
    cursor: "pointer",
    fontSize: "13px",
    padding: "2px 4px",
  },
  excerpt: {
    fontSize: "13px",
    color: "#bbb",
    margin: "0 0 4px",
    lineHeight: "1.5",
    fontStyle: "italic",
  },
  note: { fontSize: "12px", color: "#888", margin: 0 },
};

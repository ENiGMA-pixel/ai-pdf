import { useEffect, useRef, useState, useCallback } from "react";

function splitIntoSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 3);
}

export default function TextViewer({
  text,
  currentSentenceIndex,
  isChatOpen,
  onExplain,        // (selectedText) => void — triggers explain panel
  onBookmark,       // (sentenceIndex, sentenceText) => void
  onJumpTo,         // setter so chapters can scroll here
  bookmarkedIndices, // Set<number>
}) {
  const activeRef = useRef(null);
  const containerRef = useRef(null);
  const [selection, setSelection] = useState(null); // { text, x, y }
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const sentences = splitIntoSentences(text);

  // Auto-scroll to currently spoken sentence
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentSentenceIndex]);

  // Expose a jump function so SmartChapters can scroll to a sentence index
  useEffect(() => {
    if (onJumpTo) {
      onJumpTo((index) => {
        const el = containerRef.current?.querySelector(`[data-idx="${index}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [onJumpTo]);

  // Detect text selection for Explain This popup
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim();
    if (selectedText && selectedText.length > 10) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({
        text: selectedText,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    } else {
      setSelection(null);
    }
  }, []);

  const handleExplainClick = () => {
    if (selection) {
      onExplain?.(selection.text);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const progress =
    sentences.length > 0
      ? Math.round(((currentSentenceIndex + 1) / sentences.length) * 100)
      : 0;

  return (
    <div
      ref={containerRef}
      style={{ ...styles.viewer, width: isChatOpen ? "60%" : "100%" }}
      onMouseUp={handleMouseUp}
    >
      {/* Progress indicator */}
      <div style={styles.progressBar}>
        <div style={styles.progressInfo}>
          <span style={styles.progressLabel}>Reading Progress</span>
          <span style={styles.progressPct}>{progress}%</span>
        </div>
        <div style={styles.progressTrack}>
          <div
            style={{ ...styles.progressFill, width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Selection popup: Explain This */}
      {selection && (
        <div
          style={{
            ...styles.selectionPopup,
            left: `${selection.x}px`,
            top: `${selection.y + window.scrollY}px`,
          }}
        >
          <button style={styles.explainBtn} onClick={handleExplainClick}>
            💡 Explain This
          </button>
        </div>
      )}

      {/* Text body */}
      <div style={styles.textBody}>
        {sentences.map((sentence, i) => (
          <span
            key={i}
            data-idx={i}
            ref={i === currentSentenceIndex ? activeRef : null}
            style={{
              ...styles.sentence,
              ...(i === currentSentenceIndex ? styles.active : {}),
              ...(i < currentSentenceIndex ? styles.read : {}),
              ...(hoveredIndex === i ? styles.hovered : {}),
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(-1)}
          >
            {sentence + " "}
            {/* Bookmark button — appears on hover */}
            {hoveredIndex === i && (
              <button
                style={{
                  ...styles.bookmarkInline,
                  ...(bookmarkedIndices?.has(i) ? styles.bookmarkActive : {}),
                }}
                title={bookmarkedIndices?.has(i) ? "Bookmarked" : "Bookmark this"}
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark?.(i, sentence);
                }}
              >
                {bookmarkedIndices?.has(i) ? "🔖" : "🏷️"}
              </button>
            )}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes highlightPop {
          0%   { background: rgba(108,99,255,0.5); }
          100% { background: rgba(108,99,255,0.25); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  viewer: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease",
    position: "relative",
  },
  progressBar: {
    padding: "10px 32px 6px",
    borderBottom: "1px solid #1e1e3a",
    flexShrink: 0,
    background: "#0f0f1a",
    position: "sticky",
    top: 0,
    zIndex: 5,
  },
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  progressLabel: { fontSize: "11px", color: "#555", fontWeight: "500" },
  progressPct: { fontSize: "11px", color: "#6c63ff", fontWeight: "700" },
  progressTrack: {
    height: "4px",
    background: "#1e1e3a",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6c63ff, #a78bfa)",
    borderRadius: "2px",
    transition: "width 0.4s ease",
  },
  selectionPopup: {
    position: "fixed",
    transform: "translateX(-50%) translateY(-100%)",
    zIndex: 200,
    pointerEvents: "all",
  },
  explainBtn: {
    padding: "7px 14px",
    background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(108,99,255,0.5)",
    whiteSpace: "nowrap",
  },
  textBody: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "28px 32px 80px",
    fontSize: "17px",
    lineHeight: "1.95",
    color: "#c8c8d8",
  },
  sentence: {
    transition: "all 0.25s ease",
    borderRadius: "4px",
    padding: "2px 3px",
    position: "relative",
    display: "inline",
  },
  active: {
    background: "rgba(108, 99, 255, 0.25)",
    color: "#ffffff",
    fontWeight: "500",
    animation: "highlightPop 0.3s ease",
  },
  read: { color: "#4a4a6a" },
  hovered: {
    background: "rgba(108, 99, 255, 0.1)",
    cursor: "text",
  },
  bookmarkInline: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    padding: "0 2px",
    verticalAlign: "middle",
    opacity: 0.7,
    lineHeight: 1,
  },
  bookmarkActive: { opacity: 1 },
};

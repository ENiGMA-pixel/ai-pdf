import { useState, useEffect } from "react";
import { Highlight3, Copy, Search } from "lucide-react";

export default function StructuredTextViewer({ 
  pages, 
  onSentenceSelect,
  onExplain,
  onBookmark
}) {
  const [selectedText, setSelectedText] = useState("");
  const [showExplain, setShowExplain] = useState(false);
  const [selectionPos, setSelectionPos] = useState({ x: 0, y: 0 });

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length > 5) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(text);
      setSelectionPos({ x: rect.left, y: rect.top - 50 });
      setShowExplain(true);
    } else {
      setShowExplain(false);
    }
  };

  return (
    <div style={styles.container} onMouseUp={handleMouseUp}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <h2 style={styles.title}>Document</h2>
        <div style={styles.toolbarButtons}>
          <button style={styles.toolBtn} title="Print">
            🖨️
          </button>
          <button style={styles.toolBtn} title="Download">
            📥
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {pages.map((page, pageIdx) => (
          <div key={pageIdx} style={styles.page}>
            {/* Page Header */}
            <div style={styles.pageHeader}>
              Page {page.page}
            </div>

            {/* Text Content */}
            {page.text && (
              <div style={styles.pageText}>
                {renderText(page.text)}
              </div>
            )}

            {/* Tables */}
            {page.tables && page.tables.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>📊 Tables</h3>
                {page.tables.map((table, tIdx) => (
                  <div key={tIdx} style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <tbody>
                        {table.data.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} style={styles.tableCell}>
                                {cell || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* Images */}
            {page.images && page.images.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>🖼️ Images</h3>
                {page.images.map((img, iIdx) => (
                  <div key={iIdx} style={styles.imageCard}>
                    <div style={styles.imagePreview}>
                      <img
                        src={`data:image/png;base64,${img.base64}`}
                        alt={`Image ${iIdx + 1}`}
                        style={styles.image}
                      />
                    </div>
                    <div style={styles.imageContent}>
                      <h4 style={styles.imageTitle}>Image Analysis</h4>
                      <p style={styles.imageDescription}>
                        {img.description}
                      </p>
                      <button
                        style={styles.explainBtn}
                        onClick={() => onExplain(img.description)}
                      >
                        ✨ Ask about this image
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Page Break */}
            {pageIdx < pages.length - 1 && (
              <div style={styles.pageBreak} />
            )}
          </div>
        ))}
      </div>

      {/* Selection Popup */}
      {showExplain && (
        <div
          style={{
            ...styles.popup,
            left: selectionPos.x,
            top: selectionPos.y,
          }}
        >
          <button
            style={styles.popupBtn}
            onClick={() => onExplain(selectedText)}
          >
            ✨ Explain "{selectedText.substring(0, 30)}..."
          </button>
          <button
            style={styles.popupBtn}
            onClick={() => onBookmark(selectedText)}
          >
            🔖 Bookmark
          </button>
          <button
            style={styles.popupBtn}
            onClick={() => {
              navigator.clipboard.writeText(selectedText);
            }}
          >
            📋 Copy
          </button>
        </div>
      )}
    </div>
  );
}

function renderText(text) {
  return text
    .split("\n\n")
    .map((para, idx) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      // Detect headings
      const isHeading =
        trimmed.length < 100 && 
        trimmed.split("\n").length === 1 &&
        (trimmed.endsWith(":") || /^[A-Z][A-Z\s]{5,}$/.test(trimmed));

      return (
        <div
          key={idx}
          style={isHeading ? styles.heading : styles.paragraph}
        >
          {trimmed}
        </div>
      );
    })
    .filter(Boolean);
}

const styles = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    color: "#1a1a1a",
    overflow: "hidden",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    background: "#f5f5f5",
    borderBottom: "1px solid #e0e0e0",
  },

  title: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
  },

  toolbarButtons: {
    display: "flex",
    gap: "8px",
  },

  toolBtn: {
    padding: "6px 12px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },

  content: {
    flex: 1,
    overflow: "auto",
    padding: "20px",
  },

  page: {
    maxWidth: "900px",
    margin: "0 auto 40px",
    background: "#fff",
    borderRadius: "8px",
    padding: "32px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },

  pageHeader: {
    fontSize: "12px",
    color: "#999",
    marginBottom: "16px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  pageText: {
    fontSize: "15px",
    lineHeight: "1.8",
    color: "#333",
    marginBottom: "20px",
  },

  paragraph: {
    marginBottom: "12px",
    textAlign: "justify",
  },

  heading: {
    fontSize: "18px",
    fontWeight: "700",
    marginTop: "20px",
    marginBottom: "12px",
    color: "#000",
  },

  section: {
    marginTop: "24px",
    padding: "16px",
    background: "#f9f9f9",
    borderRadius: "8px",
  },

  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    margin: "0 0 12px 0",
    color: "#333",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  tableCell: {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "left",
    fontSize: "13px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  imageCard: {
    display: "flex",
    gap: "16px",
    padding: "16px",
    background: "#fff",
    borderRadius: "8px",
    marginBottom: "12px",
    border: "1px solid #e0e0e0",
  },

  imagePreview: {
    minWidth: "150px",
    height: "150px",
    overflow: "hidden",
    borderRadius: "6px",
    background: "#f5f5f5",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  imageContent: {
    flex: 1,
  },

  imageTitle: {
    margin: "0 0 8px 0",
    fontSize: "13px",
    fontWeight: "600",
    color: "#333",
  },

  imageDescription: {
    margin: "0 0 12px 0",
    fontSize: "13px",
    lineHeight: "1.6",
    color: "#666",
  },

  explainBtn: {
    padding: "6px 12px",
    background: "#6c63ff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },

  pageBreak: {
    margin: "32px 0",
    borderBottom: "2px dashed #ddd",
  },

  popup: {
    position: "fixed",
    zIndex: 1000,
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  popupBtn: {
    padding: "8px 12px",
    background: "#6c63ff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
};
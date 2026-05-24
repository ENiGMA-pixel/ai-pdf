import { useState, useRef } from "react";

export default function PDFUploader({ onUpload, error }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a PDF file.");
      return;
    }
    onUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={styles.wrap}>
      <div
        style={{ ...styles.zone, ...(isDragging ? styles.zoneDrag : {}) }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <div style={styles.icon}>📄</div>
        <p style={styles.heading}>Drop your PDF here</p>
        <p style={styles.sub}>or click to browse</p>
        <p style={styles.hint}>Supports large PDFs · Text is extracted automatically</p>
      </div>

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      <div style={styles.features}>
        {["🔊 Text-to-Speech", "🤖 AI Chat", "📚 Smart Chapters", "💡 Explain This", "🔖 Bookmarks"].map((f) => (
          <span key={f} style={styles.featureTag}>{f}</span>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 20px",
    gap: "24px",
  },
  zone: {
    width: "100%",
    maxWidth: "480px",
    border: "2px dashed #3a3a6a",
    borderRadius: "20px",
    padding: "56px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "rgba(108,99,255,0.03)",
  },
  zoneDrag: {
    border: "2px dashed #6c63ff",
    background: "rgba(108,99,255,0.08)",
    transform: "scale(1.01)",
  },
  icon: { fontSize: "56px", marginBottom: "8px" },
  heading: { fontSize: "20px", fontWeight: "700", color: "#e0e0e0", margin: 0 },
  sub: { fontSize: "14px", color: "#666", margin: 0 },
  hint: { fontSize: "12px", color: "#444", margin: "4px 0 0" },
  error: {
    background: "rgba(255,80,80,0.1)",
    border: "1px solid rgba(255,80,80,0.3)",
    color: "#ff6b6b",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "14px",
    maxWidth: "480px",
    width: "100%",
  },
  features: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
    maxWidth: "480px",
  },
  featureTag: {
    padding: "6px 14px",
    background: "rgba(108,99,255,0.08)",
    border: "1px solid rgba(108,99,255,0.2)",
    color: "#9d97ff",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
  },
};

import { useState, useCallback, useRef } from "react";
import PDFUploader from "./components/PDFUploader";
import PasteConverter from "./components/PasteConverter";
import AudioPlayer from "./components/AudioPlayer";
import ChatPanel from "./components/ChatPanel";
import TextViewer from "./components/TextViewer";
import SmartChapters from "./components/SmartChapters";
import BookmarksPanel from "./components/BookmarksPanel";

// ⚠️  In GitHub Codespaces: replace with your forwarded port URL
// e.g. "https://YOUR-CODESPACE-8000.preview.app.github.dev"
// In production: set REACT_APP_API_URL env var
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function App() {
  // ── Document state ──────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState(null);
  const [pdfText, setPdfText] = useState("");
  const [filename, setFilename] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadMode, setUploadMode] = useState("pdf"); // "pdf" | "paste"

  // ── Playback state ───────────────────────────────────────────────────────────
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [jumpToSentence, setJumpToSentence] = useState(null); // triggers AudioPlayer + TextViewer jump

  // ── UI panels ────────────────────────────────────────────────────────────────
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  // ── Explain This ─────────────────────────────────────────────────────────────
  const [explainPrefill, setExplainPrefill] = useState(null);

  // ── Bookmarks (local state; also persisted on backend) ───────────────────────
  const [bookmarks, setBookmarks] = useState([]); // array of bookmark objects
  const bookmarkedIndices = new Set(bookmarks.map((b) => b.sentence_index));

  // ── TextViewer jump function ref ─────────────────────────────────────────────
  const textViewerJumpRef = useRef(null);

  // ── Upload PDF ───────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (file) => {
    setIsLoading(true);
    setError("");
    setPdfText("");
    setSessionId(null);
    setBookmarks([]);
    setCurrentSentenceIndex(-1);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload-pdf/`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();
      setSessionId(data.session_id);
      setPdfText(data.full_text);
      setFilename(data.filename);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Paste-to-PDF callback ────────────────────────────────────────────────────
  const handlePasteUpload = useCallback((data) => {
    setSessionId(data.session_id);
    setPdfText(data.full_text);
    setFilename(data.filename);
    setUploadMode("pdf");
    setBookmarks([]);
    setCurrentSentenceIndex(-1);
    setIsLoading(false);
  }, []);

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(
    async (message) => {
      if (!sessionId) return null;
      const res = await fetch(`${API_BASE}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Chat failed");
      }
      const data = await res.json();
      return data.ai_response;
    },
    [sessionId]
  );

  // ── Explain This ─────────────────────────────────────────────────────────────
  const handleExplain = useCallback(
    async (selectedText) => {
      // Open chat and prefill with explain request
      setIsChatOpen(true);
      setExplainPrefill(
        `Please explain this passage in simple terms:\n\n"${selectedText}"`
      );
    },
    []
  );

  // ── Chapter jump ─────────────────────────────────────────────────────────────
  const handleChapterJump = useCallback((sentenceIndex) => {
    setJumpToSentence(sentenceIndex);
    // Also scroll text viewer
    textViewerJumpRef.current?.(sentenceIndex);
    // Reset after a tick so the same chapter can be clicked again
    setTimeout(() => setJumpToSentence(null), 300);
  }, []);

  // ── Bookmarks ────────────────────────────────────────────────────────────────
  const handleAddBookmark = useCallback(
    async (sentenceIndex, sentenceText) => {
      if (!sessionId) return;

      // Toggle off if already bookmarked
      const existing = bookmarks.find((b) => b.sentence_index === sentenceIndex);
      if (existing) {
        handleDeleteBookmark(existing.id);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/bookmark/add/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            sentence_index: sentenceIndex,
            sentence_text: sentenceText,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setBookmarks(data.bookmarks);
        }
      } catch (e) {
        console.error("Bookmark error:", e);
      }
    },
    [sessionId, bookmarks] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleDeleteBookmark = useCallback(
    async (bookmarkId) => {
      if (!sessionId) return;
      try {
        const res = await fetch(`${API_BASE}/bookmark/delete/`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, bookmark_id: bookmarkId }),
        });
        if (res.ok) {
          const data = await res.json();
          setBookmarks(data.bookmarks);
        }
      } catch (e) {
        console.error("Delete bookmark error:", e);
      }
    },
    [sessionId]
  );

  // ── Reset ────────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setSessionId(null);
    setPdfText("");
    setFilename("");
    setBookmarks([]);
    setCurrentSentenceIndex(-1);
    setIsChatOpen(false);
    setIsBookmarksOpen(false);
    setExplainPrefill(null);
    setError("");
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>📖</span>
          <span style={styles.appTitle}>AI PDF Reader</span>
        </div>

        {sessionId && (
          <div style={styles.headerCenter}>
            <span style={styles.filenameTag}>📄 {filename}</span>
          </div>
        )}

        <div style={styles.headerRight}>
          {sessionId && (
            <>
              <button
                style={{ ...styles.hBtn, ...(isBookmarksOpen ? styles.hBtnActive : {}) }}
                onClick={() => setIsBookmarksOpen(!isBookmarksOpen)}
                title="Bookmarks"
              >
                🔖 {bookmarks.length > 0 && <span style={styles.dot}>{bookmarks.length}</span>}
              </button>
              <button
                style={{ ...styles.hBtn, ...(isChatOpen ? styles.hBtnActive : {}) }}
                onClick={() => setIsChatOpen(!isChatOpen)}
              >
                💬 Ask AI
              </button>
              <button style={styles.hBtnGhost} onClick={handleReset} title="Load new PDF">
                ＋ New
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        {/* Upload mode tabs */}
        {!sessionId && !isLoading && (
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(uploadMode === "pdf" ? styles.tabActive : {}) }}
              onClick={() => setUploadMode("pdf")}
            >
              📄 Upload PDF
            </button>
            <button
              style={{ ...styles.tab, ...(uploadMode === "paste" ? styles.tabActive : {}) }}
              onClick={() => setUploadMode("paste")}
            >
              📝 Paste Text
            </button>
          </div>
        )}

        {/* Upload screens */}
        {!sessionId && !isLoading && uploadMode === "pdf" && (
          <PDFUploader onUpload={handleUpload} error={error} />
        )}
        {!sessionId && !isLoading && uploadMode === "paste" && (
          <PasteConverter onUpload={handlePasteUpload} />
        )}

        {/* Loading */}
        {isLoading && (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Reading your document…</p>
            <p style={styles.loadingSub}>Gemini is loading the full context</p>
          </div>
        )}

        {/* Reader */}
        {sessionId && !isLoading && (
          <div style={styles.reader}>
            <TextViewer
              text={pdfText}
              currentSentenceIndex={currentSentenceIndex}
              isChatOpen={isChatOpen}
              onExplain={handleExplain}
              onBookmark={handleAddBookmark}
              bookmarkedIndices={bookmarkedIndices}
              onJumpTo={(fn) => { textViewerJumpRef.current = fn; }}
            />
            {isChatOpen && (
              <ChatPanel
                onSend={handleSendMessage}
                onClose={() => setIsChatOpen(false)}
                prefilledMessage={explainPrefill}
                onPrefilledConsumed={() => setExplainPrefill(null)}
              />
            )}
          </div>
        )}
      </main>

      {/* Smart Chapters (floating) */}
      {sessionId && (
        <SmartChapters
          sessionId={sessionId}
          apiUrl={API_BASE}
          onChapterJump={handleChapterJump}
        />
      )}

      {/* Bookmarks panel (slide-in) */}
      {isBookmarksOpen && (
        <BookmarksPanel
          bookmarks={bookmarks}
          onJumpTo={(idx) => {
            handleChapterJump(idx);
          }}
          onDelete={handleDeleteBookmark}
          onClose={() => setIsBookmarksOpen(false)}
        />
      )}

      {/* Audio Player */}
      {sessionId && pdfText && (
        <AudioPlayer
          text={pdfText}
          onSentenceChange={setCurrentSentenceIndex}
          jumpToSentence={jumpToSentence}
        />
      )}

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f0f1a; }
        ::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0f0f1a",
    color: "#e0e0e0",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "#1a1a2e",
    borderBottom: "1px solid #2a2a4a",
    flexShrink: 0,
    zIndex: 10,
    gap: "12px",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  headerCenter: { flex: 1, display: "flex", justifyContent: "center", overflow: "hidden" },
  headerRight: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 },
  logo: { fontSize: "22px" },
  appTitle: { fontSize: "17px", fontWeight: "700", color: "#6c63ff" },
  filenameTag: {
    fontSize: "13px",
    color: "#777",
    maxWidth: "260px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  hBtn: {
    padding: "7px 14px",
    background: "transparent",
    border: "1px solid #3a3a5a",
    color: "#aaa",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  hBtnActive: {
    background: "#6c63ff",
    border: "1px solid #6c63ff",
    color: "#fff",
  },
  hBtnGhost: {
    padding: "7px 14px",
    background: "transparent",
    border: "1px dashed #3a3a5a",
    color: "#666",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
  },
  dot: {
    background: "#ff6b9d",
    color: "#fff",
    borderRadius: "10px",
    padding: "1px 6px",
    fontSize: "10px",
    fontWeight: "700",
  },
  main: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  tabs: {
    display: "flex",
    gap: "8px",
    padding: "12px 20px",
    background: "#1a1a2e",
    borderBottom: "1px solid #2a2a4a",
    flexShrink: 0,
    justifyContent: "center",
  },
  tab: {
    padding: "9px 22px",
    background: "transparent",
    border: "1px solid #3a3a5a",
    color: "#888",
    borderRadius: "22px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  tabActive: {
    background: "#6c63ff",
    border: "1px solid #6c63ff",
    color: "#fff",
    fontWeight: "700",
  },
  loading: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
  },
  spinner: {
    width: "44px",
    height: "44px",
    border: "4px solid #2a2a4a",
    borderTop: "4px solid #6c63ff",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
  },
  loadingText: { fontSize: "17px", color: "#e0e0e0", margin: 0 },
  loadingSub: { fontSize: "13px", color: "#555", margin: 0 },
  reader: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    animation: "fadeIn 0.3s ease",
  },
};

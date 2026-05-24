import { useState, useEffect, useRef, useCallback } from "react";

function splitIntoSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 3);
}

export default function AudioPlayer({ text, onSentenceChange, jumpToSentence }) {
  const [sentences, setSentences] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const indexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const speedRef = useRef(1);
  const voiceRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { voiceRef.current = selectedVoice; }, [selectedVoice]);

  // Load browser voices
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
      setVoices(v);
      if (v.length > 0 && !voiceRef.current) {
        setSelectedVoice(v[0]);
        voiceRef.current = v[0];
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Parse text whenever it changes
  useEffect(() => {
    const s = splitIntoSentences(text);
    setSentences(s);
    setCurrentIndex(0);
    indexRef.current = 0;
    stopSpeech();
  }, [text]);

  // Allow external jump (from chapter click)
  useEffect(() => {
    if (jumpToSentence !== undefined && jumpToSentence !== null) {
      const clamped = Math.max(0, Math.min(sentences.length - 1, jumpToSentence));
      indexRef.current = clamped;
      setCurrentIndex(clamped);
      onSentenceChange?.(clamped);
      if (isPlayingRef.current) {
        window.speechSynthesis.cancel();
        setTimeout(() => speakFrom(clamped), 80);
      }
    }
  }, [jumpToSentence]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    isPlayingRef.current = false;
    setIsPlaying(false);
  };

  const speakFrom = useCallback(
    (startIndex) => {
      window.speechSynthesis.cancel();

      const go = (i) => {
        if (i >= sentences.length || !isPlayingRef.current) {
          setIsPlaying(false);
          isPlayingRef.current = false;
          return;
        }

        const utt = new SpeechSynthesisUtterance(sentences[i]);
        utt.rate = speedRef.current;
        if (voiceRef.current) utt.voice = voiceRef.current;

        utt.onstart = () => {
          setCurrentIndex(i);
          indexRef.current = i;
          onSentenceChange?.(i);
        };

        utt.onend = () => {
          if (isPlayingRef.current) go(i + 1);
        };

        utt.onerror = (e) => {
          if (e.error !== "interrupted") console.error("TTS error:", e.error);
        };

        window.speechSynthesis.speak(utt);
      };

      go(startIndex);
    },
    [sentences, onSentenceChange]
  );

  const handlePlayPause = () => {
    if (isPlaying) {
      stopSpeech();
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      speakFrom(indexRef.current);
    }
  };

  const seek = (direction) => {
    const step = Math.max(1, Math.round(3 / speedRef.current));
    const next = Math.max(0, Math.min(sentences.length - 1, indexRef.current + direction * step));
    indexRef.current = next;
    setCurrentIndex(next);
    onSentenceChange?.(next);
    if (isPlayingRef.current) {
      window.speechSynthesis.cancel();
      setTimeout(() => speakFrom(next), 80);
    }
  };

  const handleSpeedChange = (s) => {
    speedRef.current = s;
    setSpeed(s);
    setShowSpeedMenu(false);
    if (isPlayingRef.current) {
      const i = indexRef.current;
      window.speechSynthesis.cancel();
      setTimeout(() => speakFrom(i), 80);
    }
  };

  const handleVoiceChange = (e) => {
    const v = voices.find((v) => v.name === e.target.value);
    if (v) {
      voiceRef.current = v;
      setSelectedVoice(v);
      if (isPlayingRef.current) {
        const i = indexRef.current;
        window.speechSynthesis.cancel();
        setTimeout(() => speakFrom(i), 80);
      }
    }
  };

  const progress = sentences.length > 0 ? (currentIndex / sentences.length) * 100 : 0;

  return (
    <div style={styles.player}>
      {/* Thin progress bar at very top */}
      <div style={styles.miniBar}>
        <div style={{ ...styles.miniBarFill, width: `${progress}%` }} />
      </div>

      <div style={styles.controls}>
        {/* Sentence counter */}
        <div style={styles.left}>
          <span style={styles.counter}>
            {sentences.length > 0 ? `${currentIndex + 1} / ${sentences.length}` : "—"}
          </span>
        </div>

        {/* Transport */}
        <div style={styles.transport}>
          <button style={styles.seekBtn} onClick={() => seek(-1)} title="Back ~10s">
            ⏪
          </button>
          <button style={styles.playBtn} onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button style={styles.seekBtn} onClick={() => seek(1)} title="Forward ~10s">
            ⏩
          </button>
        </div>

        {/* Right controls */}
        <div style={styles.right}>
          {/* Speed picker */}
          <div style={styles.speedWrap}>
            <button style={styles.controlChip} onClick={() => setShowSpeedMenu(!showSpeedMenu)}>
              {speed}×
            </button>
            {showSpeedMenu && (
              <div style={styles.popup}>
                {[0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                  <button
                    key={s}
                    style={{ ...styles.popupItem, ...(speed === s ? styles.popupItemActive : {}) }}
                    onClick={() => handleSpeedChange(s)}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice selector */}
          {voices.length > 1 && (
            <select
              style={styles.voiceSelect}
              value={selectedVoice?.name || ""}
              onChange={handleVoiceChange}
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name.split(" ").slice(0, 3).join(" ")}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  player: {
    background: "#0d0d20",
    borderTop: "1px solid #2a2a4a",
    flexShrink: 0,
  },
  miniBar: { height: "3px", background: "#1a1a30", width: "100%" },
  miniBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6c63ff, #a78bfa)",
    transition: "width 0.4s ease",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    gap: "12px",
  },
  left: { minWidth: "80px" },
  counter: { fontSize: "12px", color: "#555", fontVariantNumeric: "tabular-nums" },
  transport: { display: "flex", alignItems: "center", gap: "18px" },
  seekBtn: {
    background: "none",
    border: "none",
    fontSize: "22px",
    cursor: "pointer",
    opacity: 0.65,
    padding: "4px",
    lineHeight: 1,
    transition: "opacity 0.15s",
  },
  playBtn: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
    border: "none",
    fontSize: "22px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 22px rgba(108,99,255,0.45)",
    flexShrink: 0,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: "160px",
    justifyContent: "flex-end",
  },
  speedWrap: { position: "relative" },
  controlChip: {
    padding: "5px 11px",
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    color: "#9d97ff",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  popup: {
    position: "absolute",
    bottom: "42px",
    right: 0,
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: "10px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
  popupItem: {
    padding: "9px 22px",
    background: "none",
    border: "none",
    color: "#ccc",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "center",
  },
  popupItemActive: { background: "rgba(108,99,255,0.2)", color: "#9d97ff", fontWeight: "700" },
  voiceSelect: {
    padding: "5px 8px",
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    color: "#888",
    borderRadius: "8px",
    fontSize: "12px",
    maxWidth: "140px",
  },
};

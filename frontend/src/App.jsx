"""
FRONTEND: Complete Modern App.jsx with Professional UI
Install: npm install framer-motion lucide-react
"""

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Search, Plus, Settings, LogOut, Bookmark, Share2, Download } from "lucide-react";

// Pages
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import ReaderPage from "./pages/Reader";
import RecentsPage from "./pages/Recents";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userId, setUserId] = useState(localStorage.getItem("user_id"));
  const [user, setUser] = useState(null);

  // Navigation state
  const [currentPage, setCurrentPage] = useState("dashboard"); // dashboard, reader, recents
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // PDF state
  const [currentSession, setCurrentSession] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  // Load user on mount
  useEffect(() => {
    if (token) {
      fetchUser();
      fetchRecents();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecents = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentSessions(data.sessions.slice(0, 5));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (newToken, newUserId) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user_id", newUserId);
    setToken(newToken);
    setUserId(newUserId);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    setToken(null);
    setUserId(null);
    setCurrentPage("dashboard");
  };

  const handleSelectPDF = (session) => {
    setCurrentSession(session);
    setPdfPages(session.pages || []);
    setCurrentPage("reader");
  };

  const handleNewPDF = () => {
    setCurrentPage("dashboard");
    setCurrentSession(null);
  };

  // Show login
  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Main app with sidebar
  return (
    <motion.div style={styles.layout}>
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Sidebar */}
      <motion.aside
        style={{
          ...styles.sidebar,
          width: sidebarOpen ? "280px" : "80px",
        }}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <motion.div
          style={styles.logo}
          whileHover={{ scale: 1.05 }}
          onClick={() => setCurrentPage("dashboard")}
        >
          <motion.span style={styles.logoIcon}>📖</motion.span>
          {sidebarOpen && <span style={styles.logoText}>PDFMind</span>}
        </motion.div>

        {/* New PDF Button */}
        <motion.button
          style={styles.newButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNewPDF}
        >
          <Plus size={20} />
          {sidebarOpen && <span>New PDF</span>}
        </motion.button>

        {/* Search */}
        {sidebarOpen && (
          <motion.div style={styles.searchBox}>
            <Search size={18} color="#999" />
            <input
              type="text"
              placeholder="Search PDFs..."
              style={styles.searchInput}
            />
          </motion.div>
        )}

        {/* Navigation */}
        <nav style={styles.nav}>
          {[
            { id: "dashboard", label: "Dashboard", icon: "📊" },
            { id: "recents", label: "Recents", icon: "🕐" },
          ].map((item) => (
            <motion.button
              key={item.id}
              style={{
                ...styles.navItem,
                ...(currentPage === item.id ? styles.navItemActive : {}),
              }}
              whileHover={{ x: 4 }}
              onClick={() => setCurrentPage(item.id)}
            >
              <span>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        {/* Recents List */}
        {sidebarOpen && (
          <motion.div style={styles.recentsList}>
            <h3 style={styles.recentsTitle}>RECENT</h3>
            {recentSessions.map((session) => (
              <motion.button
                key={session.id}
                style={styles.recentItem}
                whileHover={{ x: 5, backgroundColor: "rgba(108, 99, 255, 0.1)" }}
                onClick={() => handleSelectPDF(session)}
              >
                <span>📄</span>
                <div style={styles.recentInfo}>
                  <div style={styles.recentFileName}>{session.filename}</div>
                  <div style={styles.recentDate}>
                    {new Date(session.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Footer */}
        <div style={styles.sidebarFooter}>
          <motion.button
            style={styles.sidebarBtn}
            whileHover={{ scale: 1.1 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "«" : "»"}
          </motion.button>
          {sidebarOpen && (
            <motion.button
              style={styles.logoutBtn}
              whileHover={{ scale: 1.05 }}
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </motion.button>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main style={styles.main}>
        {/* Header */}
        <motion.header style={styles.header}>
          <h1 style={styles.pageTitle}>
            {currentPage === "dashboard" && "Dashboard"}
            {currentPage === "recents" && "Recent PDFs"}
            {currentPage === "reader" && currentSession?.filename}
          </h1>

          {user && (
            <div style={styles.userProfile}>
              <img
                src={`https://ui-avatars.com/api/?name=${user.username}`}
                alt={user.username}
                style={styles.avatar}
              />
              <span style={styles.userName}>{user.username}</span>
            </div>
          )}
        </motion.header>

        {/* Pages */}
        <motion.div style={styles.content}>
          <AnimatePresence mode="wait">
            {currentPage === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <DashboardPage
                  onSelectPDF={handleSelectPDF}
                  token={token}
                  apiUrl={API_BASE}
                />
              </motion.div>
            )}

            {currentPage === "recents" && (
              <motion.div
                key="recents"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <RecentsPage
                  sessions={recentSessions}
                  onSelect={handleSelectPDF}
                  token={token}
                  apiUrl={API_BASE}
                />
              </motion.div>
            )}

            {currentPage === "reader" && currentSession && (
              <motion.div
                key="reader"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ReaderPage
                  session={currentSession}
                  pages={pdfPages}
                  token={token}
                  apiUrl={API_BASE}
                  onBack={() => setCurrentPage("dashboard")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.main>
    </motion.div>
  );
}

// Animated Background Component
function AnimatedBackground() {
  return (
    <div style={styles.bgContainer}>
      <motion.div
        style={styles.blob1}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      <motion.div
        style={styles.blob2}
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
          rotate: [360, 180, 0],
        }}
        transition={{ duration: 15, repeat: Infinity }}
      />
    </div>
  );
}

// Styles
const styles = {
  layout: {
    display: "flex",
    height: "100vh",
    background: "linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%)",
    position: "relative",
    overflow: "hidden",
  },

  bgContainer: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
  },

  blob1: {
    position: "absolute",
    width: "600px",
    height: "600px",
    background: "linear-gradient(135deg, rgba(108, 99, 255, 0.3), rgba(138, 124, 255, 0.2))",
    borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
    filter: "blur(40px)",
    top: "-300px",
    left: "-300px",
  },

  blob2: {
    position: "absolute",
    width: "400px",
    height: "400px",
    background: "linear-gradient(135deg, rgba(255, 107, 157, 0.2), rgba(192, 108, 132, 0.1))",
    borderRadius: "20% 80% 30% 70% / 60% 40% 60% 40%",
    filter: "blur(50px)",
    bottom: "-200px",
    right: "-200px",
  },

  // Sidebar
  sidebar: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRight: "1px solid rgba(0, 0, 0, 0.05)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease",
    zIndex: 100,
    position: "relative",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    marginBottom: "24px",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "all 0.2s",
  },

  logoIcon: {
    fontSize: "32px",
  },

  logoText: {
    fontSize: "20px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #6c63ff 0%, #8a7cff 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  newButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    background: "linear-gradient(135deg, #6c63ff 0%, #8a7cff 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "24px",
    boxShadow: "0 4px 15px rgba(108, 99, 255, 0.3)",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "rgba(0, 0, 0, 0.03)",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    marginBottom: "24px",
  },

  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#333",
    fontSize: "13px",
    outline: "none",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "24px",
  },

  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    background: "transparent",
    border: "none",
    borderRadius: "8px",
    color: "#666",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  },

  navItemActive: {
    background: "linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(138, 124, 255, 0.05) 100%)",
    color: "#6c63ff",
    fontWeight: "600",
  },

  recentsList: {
    flex: 1,
    overflow: "auto",
    marginBottom: "16px",
  },

  recentsTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "12px",
    paddingLeft: "8px",
  },

  recentItem: {
    display: "flex",
    gap: "12px",
    padding: "10px 8px",
    borderRadius: "6px",
    marginBottom: "6px",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    textAlign: "left",
    transition: "all 0.2s",
  },

  recentInfo: {
    flex: 1,
    minWidth: 0,
  },

  recentFileName: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#333",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  recentDate: {
    fontSize: "11px",
    color: "#999",
    marginTop: "2px",
  },

  sidebarFooter: {
    display: "flex",
    gap: "8px",
    paddingTop: "12px",
    borderTop: "1px solid #e0e0e0",
  },

  sidebarBtn: {
    padding: "8px 12px",
    background: "transparent",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#666",
  },

  logoutBtn: {
    flex: 1,
    padding: "8px 12px",
    background: "rgba(255, 59, 48, 0.1)",
    color: "#ff6b6b",
    border: "1px solid rgba(255, 59, 48, 0.2)",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },

  // Main
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    zIndex: 1,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },

  pageTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: 0,
  },

  userProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "2px solid #6c63ff",
  },

  userName: {
    fontSize: "14px",
    color: "#333",
    fontWeight: "500",
  },

  content: {
    flex: 1,
    overflow: "auto",
    padding: "24px",
  },
};

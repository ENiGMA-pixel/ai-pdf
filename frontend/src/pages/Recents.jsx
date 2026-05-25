import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function RecentsPage({ sessions, onSelect, token, apiUrl }) {
  const [groupedSessions, setGroupedSessions] = useState({});

  useEffect(() => {
    if (sessions) {
      const grouped = groupByDate(sessions);
      setGroupedSessions(grouped);
    }
  }, [sessions]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      style={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Object.entries(groupedSessions).map(([date, items]) => (
        <motion.div key={date} style={styles.group}>
          <h3 style={styles.groupTitle}>{date}</h3>
          <div style={styles.grid}>
            {items.map((session) => (
              <motion.div
                key={session.id}
                style={styles.card}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => onSelect(session)}
              >
                <div style={styles.cardIcon}>📄</div>
                <h4 style={styles.cardTitle}>{session.filename}</h4>
                <p style={styles.cardMeta}>
                  {session.total_pages} pages
                </p>
                {session.summary && (
                  <p style={styles.cardSummary}>
                    {JSON.parse(session.summary)[0]}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function groupByDate(sessions) {
  const grouped = {};
  
  sessions.forEach((session) => {
    const date = new Date(session.updated_at);
    const today = new Date();
    
    let label;
    if (date.toDateString() === today.toDateString()) {
      label = "Today";
    } else {
      label = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
    
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(session);
  });
  
  return grouped;
}

const styles = {
  container: {
    padding: "24px",
  },

  group: {
    marginBottom: "40px",
  },

  groupTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "16px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },

  card: {
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    padding: "20px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  cardIcon: {
    fontSize: "28px",
    marginBottom: "12px",
  },

  cardTitle: {
    margin: "0 0 8px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a1a",
  },

  cardMeta: {
    margin: "0 0 12px 0",
    fontSize: "12px",
    color: "#999",
  },

  cardSummary: {
    margin: 0,
    fontSize: "13px",
    color: "#666",
    lineHeight: "1.4",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
};
import { useRef, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

const InterviewRoom = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sessionid, setSessionId] = useState("");
  const [userInput, setUserInput] = useState(""); // 👈 NEW
  const hasStarted = useRef(false);
  const location = useLocation();
  const { topic } = location.state || {};

  const playAudio = async (text) => {
    try {
      // Tip: encodeURIComponent handles spaces/special chars in the URL
      const response = await fetch(
        `http://localhost:16000/tts?text=${encodeURIComponent(text)}&speaker_id=p376`
      );
      if (!response.ok) throw new Error("TTS request failed");
      // 3. Convert the response to a Blob (Binary Large Object)
      const blob = await response.blob();
      // 4. Create a temporary URL for the browser to "see" the file
      const url = window.URL.createObjectURL(blob);
      // 5. Play it
      const audio = new Audio(url);
      audio.play();
      // Clean up memory after playing (optional but good practice)
      audio.onended = () => {
        window.URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  const startInterview = async () => {
    try {
      const response = await fetch("http://localhost:16000/api/start-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interview_topic: topic.toLowerCase().split(" ")[0]
        })
      });

      const data = await response.json();
      setSessionId(data.session_id);
      setMessage(data.message);
      setMessages((prev) => [...prev, data.message]);
      playAudio(data.message);
    } catch (error) {
      console.error(error);
    }
  };

  const getResponse = async (prompt) => {
    try {
      const response = await fetch("http://localhost:16000/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionid,
          user_answer: prompt,
        }),
      });

      const data = await response.json();
      playAudio(data.message);
      return data;
    } catch (error) {
      console.error("Error getting response:", error);
    }
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;
    const prompt = userInput;
    setMessages((prev) => [...prev, prompt]);
    setUserInput(""); 

    const data = await getResponse(prompt);
    if (data?.message) {
      setMessages((prev) => [...prev, data.message]);
    }
  };

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    startInterview();
  }, []);

  return (
    <div style={sharedStyles.pageWrapper}>
      <header style={stylesRoom.header}>
        <h1 style={stylesRoom.title}>Interview in Progress...</h1>
        <Link to="/" style={stylesRoom.leaveButton}>Leave Room</Link>
      </header>

      <main style={stylesRoom.mainContainer}>
        <section style={stylesRoom.aiSection}>
          <h2 style={stylesRoom.label}>AI Interviewer</h2>

          <div style={stylesRoom.aiBubble}>
            {messages.length === 0 ? (
              "Starting interview..."
            ) : (
              messages.map((msg, index) => (
                <div key={index} style={stylesRoom.messageBox}>
                  {msg}
                </div>
              ))
            )}
          </div>

        </section>

        <section style={stylesRoom.userSection}>
          <h2 style={stylesRoom.label}>Your Answer</h2>

          <textarea
            style={stylesRoom.answerArea}
            placeholder="Type your response here..."
            value={userInput}                          // 👈 bind state
            onChange={(e) => setUserInput(e.target.value)} // 👈 capture input
          />
          <button style={stylesRoom.submitButton} onClick={handleSubmit}> Submit Answer </button>
        </section>
      </main>
    </div>
  );
};


const InterviewList = () => (
  <div style={sharedStyles.pageWrapper}>
    <h1 style={stylesList.header}>Welcome to thkinh AI interview</h1>
    <ul style={stylesList.container}>
      {['React Interview', 'Linux Interview', 'Devops Interview'].map((title) => (
        <div key={title} style={stylesList.card}>
          <li>{title}</li>
          <Link to="/room" state={{topic: title}} style={stylesList.joinButton}>Join</Link>
        </div>
      ))}
    </ul>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InterviewList />} />
        <Route path="/room" element={<InterviewRoom />} />
      </Routes>
    </Router>
  );
}

// 1. Shared Layout Logic (Reduced due to index.css)
const sharedStyles = {
  pageWrapper: {
    display: 'flex',
    color: '#999999',
    flexDirection: 'column',
    height: '100vh', // Force the page to be exactly the screen height
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden', // Prevent the whole page from scrolling
  }
};

// 2. List Styles
const stylesList = {
  header: { marginBottom: '40px', fontSize: '2rem', fontWeight: '300' },
  container: { display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '500px', listStyle: 'none' },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    marginBottom: '12px',
    borderRadius: '8px',
    border: '1px solid #333'
  },
  joinButton: { backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }
};

const stylesRoom = {
  header: { 
    width: '100%', 
    maxWidth: '900px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    padding: '20px' 
  },
  mainContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    flex: 1, // This tells the container to fill all remaining vertical space
    width: '100%', 
    maxWidth: '900px', 
    overflow: 'hidden' // Keeps the container itself from growing
  },
  aiSection: {
    flex: 1, // This makes the AI section expand to fill the gap
    padding: '20px',
    overflowY: 'auto', // 👈 This enables the scrollbar
    borderLeft: '4px solid #4CAF50',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  aiBubble: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px', // Space between messages
    fontSize: '1.2rem',
    lineHeight: '1.6',
  },
  userSection: {
    // Removed position: absolute
    width: '100%',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    borderTop: '1px solid #333'
  },
  messageBox: {
    backgroundColor: '#1e1e1e',
    color: '#999999',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #333',
    maxWidth: '80%',
    wordBreak: 'break-word'
  },
  label: { fontSize: '0.8rem', textTransform: 'uppercase', color: '#888' },
  answerArea: { backgroundColor: '#252525', color: 'white', border: '1px solid #444', borderRadius: '8px', padding: '15px', minHeight: '150px', fontFamily: 'inherit' },
  submitButton: { alignSelf: 'flex-end', backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }
};

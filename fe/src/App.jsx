import { useRef, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';


const Typewriter = ({ text, speed = 40, onUpdate }) => {
  const [displayedText, setDisplayedText] = useState("");
  const index = useRef(0);

  useEffect(() => {
    // Reset everything when text changes
    index.current = 0;
    setDisplayedText("");

    const timer = setInterval(() => {
      // Logic: Always slice from the ORIGINAL text based on the ref index
      if (index.current < text.length) {
        index.current += 1;
        setDisplayedText(text.slice(0, index.current));
      } else {
        clearInterval(timer);
      }
      
      if(onUpdate) onUpdate();
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span style={{ background: 'inherit', display: 'inline-block' }}>
      {displayedText}
    </span>
  );
};

const InterviewRoom = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sessionid, setSessionId] = useState("");
  const [userInput, setUserInput] = useState(""); // 👈 NEW
  const [isMuted, setIsMute] = useState(false);
  const hasStarted = useRef(false);
  const location = useLocation();
  const { topic } = location.state || {};
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:16000";

  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const playAudio = async (text) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tts?text=${encodeURIComponent(text)}&speaker_id=p360`);
      if (!response.ok) throw new Error("TTS request failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ""; // Force stop loading
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.muted = isMuted;

      if (!isMuted) {
        audio.play().catch(e => console.error("Playback blocked", e));
      }

      audio.onended = () => {
        window.URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      if (isMuted) {
        audioRef.current.pause();
      } else {
        console.log("play");
        audioRef.current.play().catch(() => {});
      }
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (urlRef.current) {
        window.URL.revokeObjectURL(urlRef.current);
      }
    };
  }, []);

  const startInterview = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/start-interview`, {
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
      const response = await fetch(`${API_BASE_URL}/api/answer`, {
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

  const scrollRef = useRef(null);
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'auto' // Use 'auto' for typewriter to avoid "shaky" smooth scrolling
      });
    }
  };

  const toggleMute = () => {
    setIsMute(!isMuted);
  }

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
        <section ref={scrollRef} style={stylesRoom.aiSection}>
          <h2 style={stylesRoom.label}>AI Interviewer</h2>
          <div style={stylesRoom.aiBubble}>
            {messages.length === 0 ? ("Starting interview...") : (
              messages.map((msg, index) => (
                <div key={index} style={stylesRoom.messageBox}>
                  {index === messages.length - 1 ? (<Typewriter text={msg} speed={10} onUpdate={scrollToBottom}/>) : (msg)}
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

          <div style={{display: 'flex', flexDirection: 'row', justifyContent:'right'}}>
            <button onClick={toggleMute} style={isMuted ? stylesRoom.muteButtonActive : stylesRoom.muteButton}>
              {isMuted ? '🔇 Unmute' : '🔊 Mute'}
            </button>
            <button style={stylesRoom.submitButton} onClick={handleSubmit}> Submit Answer </button>
          </div>
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
  muteButton: {
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'inherit',
    color: '#999999',
    cursor: 'pointer',
    alignSelf: 'flex-end',
    fontWeight: 'bold',
    padding: '12px 24px',
    marginRight: '5px'
  },
  muteButtonActive: {
    borderRadius: '4px',
    border: 'none',
    color: '#999999',
    cursor: 'pointer',
    alignSelf: 'flex-end',
    fontWeight: 'bold',
    padding: '12px 24px',
    marginRight: '5px'
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

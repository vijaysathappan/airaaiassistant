import { useState, useRef, useEffect } from "react";
import emailjs from '@emailjs/browser';
import axios from "axios";
import { Mic, UploadCloud, Cpu, User, FileText, Check, Square, PlusCircle, Download, Settings, X, Sliders, Briefcase, Globe } from "lucide-react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const VolcanoIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 9L3 21h18l-5.5-12H8.5z" />
    <path d="M8.5 9 Q 12 14 15.5 9" fill="url(#lavaGradient)" stroke="none" />
    <path d="M12 2v3" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
    <path d="M15 3.5l-1 1.5" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 3.5l1 1.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    <defs>
      <linearGradient id="lavaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#f97316" />
      </linearGradient>
    </defs>
  </svg>
);

// Reusable SVG Robot Component
const RobotEntity = ({ state }) => {
  return (
    <div className={`core-wrapper state-${state}`}>
      <svg width="300" height="300" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle className="ring-outer" cx="100" cy="100" r="90" fill="none" strokeWidth="1" strokeDasharray="10 5 30 15 5 5" />
        <circle className="ring-outer" cx="100" cy="100" r="80" fill="none" strokeWidth="2" strokeDasharray="50 20 10 10" opacity="0.5" />
        <circle className="ring-inner" cx="100" cy="100" r="65" fill="none" strokeWidth="4" strokeDasharray="40 10 100 20" />
        <circle className="ring-inner" cx="100" cy="100" r="58" fill="none" strokeWidth="1" strokeDasharray="5 5" opacity="0.8" />

        {/* Core Eye / Lens */}
        <circle cx="100" cy="100" r="42" fill="rgba(14, 165, 233, 0.05)" stroke="rgba(14, 165, 233, 0.3)" strokeWidth="2" />
        <circle className="core-eye" cx="100" cy="100" r="18" />
        <circle cx="100" cy="100" r="6" fill="#fff" opacity="0.9" />
      </svg>
    </div>
  );
};

function App() {
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState([]); // Past sessions array
  const [sidebarTab, setSidebarTab] = useState("log"); // 'log' or 'archives'
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Login State
  const [loginStep, setLoginStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [emailId, setEmailId] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // States: 'idle', 'listening', 'thinking', 'speaking'
  const [entityState, setEntityState] = useState("idle");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [fallbackText, setFallbackText] = useState("");
  const historyEndRef = useRef(null);

  // Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [language, setLanguage] = useState("EN");
  const [theme, setTheme] = useState("midnight"); // 'midnight', 'cyberpunk', 'glass'
  const [voiceGender, setVoiceGender] = useState("female"); // 'male', 'female'
  const [dialect, setDialect] = useState("formal"); // 'formal', 'casual'

  // Dynamic Entity Name based on selected language
  const getEntityName = (lang) => {
    switch (lang) {
      case 'TA': return 'துணை'; // Thunai (Companion/Helper)
      case 'HI': return 'साथी'; // Saathi (Companion/Helper)
      case 'TE': return 'సహాయకుడు'; // Sahayakudu
      case 'KN': return 'ಸಹಾಯಕ'; // Sahayaka
      case 'EN':
      default: return 'Assistant';
    }
  };

  const entityName = getEntityName(language);

  // Initialize Speech APIs safely
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;
  const recognitionRef = useRef(null);

  // Scroll to bottom of active history
  useEffect(() => {
    if (historyEndRef.current && sidebarTab === "log") {
      historyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, sidebarTab]);

  // Clean up synthesis on unmount
  useEffect(() => {
    return () => {
      if (synth && synth.speaking) synth.cancel();
    };
  }, [synth]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file.name);
    setEntityState("thinking");

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_URL}/api/v1/ingest/pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      let confirmMsg = "Document uploaded successfully. I have extracted semantic chunks. I am now aware of this context.";
      if (language === "TA") {
        confirmMsg = "ஆவணம் வெற்றிகரமாக பதிவேற்றப்பட்டது. நான் அதை படித்துவிட்டேன். இப்போது நான் இந்தச் சூழலை அறிந்திருக்கிறேன்.";
      } else if (language === "HI") {
        confirmMsg = "दस्तावेज़ सफलतापूर्वक अपलोड हो गया है। मैंने इसे पढ़ लिया है और मैं इस संदर्भ को समझ गया हूँ।";
      } else if (language === "TE") {
        confirmMsg = "డాక్యుమెంట్ విజయవంతంగా అప్‌లోడ్ చేయబడింది. నేను దీన్ని చదివాను మరియు ఈ సందర్భాన్ని అర్థం చేసుకున్నాను.";
      } else if (language === "KN") {
        confirmMsg = "ದಾಖಲೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಪ್ಲೋಡ್ ಮಾಡಲಾಗಿದೆ. ನಾನು ಇದನ್ನು ಓದಿದ್ದೇನೆ ಮತ್ತು ಈ ಸನ್ನಿವೇಶವನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ.";
      }

      setHistory(prev => [...prev, { role: 'aura', content: confirmMsg }]);
      speakResponse(confirmMsg, language);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document. Please check if the backend is running.");
    } finally {
      setEntityState("idle");
    }
  };

  const processUserQuery = async (queryText) => {
    if (!queryText || queryText.trim() === "") return;

    setHistory(prev => [...prev, { role: 'user', content: queryText }]);
    setEntityState("thinking");
    setSidebarTab("log");

    try {
      const response = await axios.post(`${API_URL}/api/v1/query`, null, {
        params: { query: queryText }
      });

      const answer = response.data.answer || "I'm sorry, I couldn't process that request.";

      setHistory(prev => [...prev, { role: 'aura', content: answer }]);
      speakResponse(answer, language);
    } catch (error) {
      console.error("Query error:", error);
      let errorMsg = "Connections to the AIRA intelligence core are currently offline. Please check your network or server status.";

      if (language === "TA") errorMsg = "ஏரா இன்டெலிஜென்ஸ் கோர் உடனான இணைப்புகள் தற்போது ஆஃப்லைனில் உள்ளன. உங்கள் நெட்வொர்க் அல்லது சர்வர் நிலையைச் சரிபார்க்கவும்.";
      else if (language === "HI") errorMsg = "AIRA इंटेलिजेंस कोर से कनेक्शन वर्तमान में ऑफलाइन हैं। कृपया अपने नेटवर्क या सर्वर की स्थिति की जाँच करें।";
      else if (language === "TE") errorMsg = "AIRA ఇంటెలిజెన్స్ కోర్ కనెక్షన్లు ప్రస్తుతం ఆఫ్‌లైన్‌లో ఉన్నాయి. దయచేసి మీ నెట్‌వర్క్ లేదా సర్వర్ స్థితిని తనిఖీ చేయండి.";
      else if (language === "KN") errorMsg = "AIRA ಇಂಟೆಲಿಜೆನ್ಸ್ ಕೋರ್ ಸಂಪರ್ಕಗಳು ಪ್ರಸ್ತುತ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿವೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ನೆಟ್‌ವರ್ಕ್ ಅಥವಾ ಸರ್ವರ್ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.";

      setHistory(prev => [...prev, { role: 'aura', content: errorMsg }]);
      speakResponse(errorMsg, language);
    } finally {
      setEntityState("idle");
    }
  };

  const speakResponse = (text, langCode = "EN") => {
    if (!synth) {
      setEntityState("idle");
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();

    let voice;
    if (langCode === "TA") {
      voice = voices.find(v => (v.lang.includes("ta") || v.name.includes("Tamil")) && (voiceGender === 'female' ? (v.name.includes("Female") || v.name.includes("Sangeeta")) : true));
    } else if (langCode === "HI") {
      voice = voices.find(v => (v.lang.includes("hi") || v.name.includes("Hindi")) && (voiceGender === 'female' ? (v.name.includes("Female") || v.name.includes("Kalpana")) : true));
    } else if (langCode === "TE") {
      voice = voices.find(v => (v.lang.includes("te") || v.name.includes("Telugu")) && (voiceGender === 'female' ? v.name.includes("Female") : true));
    } else if (langCode === "KN") {
      voice = voices.find(v => (v.lang.includes("kn") || v.name.includes("Kannada")) && (voiceGender === 'female' ? v.name.includes("Female") : true));
    } else {
      voice = voices.find(v => (v.name.includes("Google") || v.name.includes("Siri")) && v.lang.includes("en") && (voiceGender === 'female' ? (v.name.includes("Female") || v.name.includes("Zira")) : (v.name.includes("Male") || v.name.includes("David"))));
    }

    if (!voice) {
       // fallback search purely by lang if gender search fails
       voice = voices.find(v => v.lang.startsWith(langCode.toLowerCase()));
    }

    if (!voice) voice = voices[0];

    if (voice) utterance.voice = voice;

    if (langCode === "TA") utterance.lang = "ta-IN";
    else if (langCode === "HI") utterance.lang = "hi-IN";
    else if (langCode === "TE") utterance.lang = "te-IN";
    else if (langCode === "KN") utterance.lang = "kn-IN";
    else utterance.lang = "en-US";

    utterance.pitch = voicePitch;
    utterance.rate = voiceSpeed;

    utterance.onstart = () => setEntityState("speaking");
    utterance.onend = () => setEntityState("idle");
    utterance.onerror = () => setEntityState("idle");

    synth.speak(utterance);
  };

  const toggleListening = () => {
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }

    if (synth && synth.speaking) {
      synth.cancel();
      setEntityState('idle');
    }

    if (entityState === "listening") {
      if (recognitionRef.current) recognitionRef.current.stop();
      setEntityState("idle");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      if (language === "TA") recognition.lang = 'ta-IN';
      else if (language === "HI") recognition.lang = 'hi-IN';
      else if (language === "TE") recognition.lang = 'te-IN';
      else if (language === "KN") recognition.lang = 'kn-IN';
      else recognition.lang = 'en-US';

      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setEntityState("listening");

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        processUserQuery(transcript);
      };

      recognition.onerror = (e) => {
        if (e.error !== 'aborted') setEntityState("idle");
      };

      recognition.onend = () => {
        setEntityState((prev) => prev === 'listening' ? 'idle' : prev);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setEntityState("idle");
    }
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter') {
      const txt = fallbackText;
      setFallbackText("");
      processUserQuery(txt);
    }
  };

  const stopSpeaking = () => {
    if (synth && synth.speaking) {
      synth.cancel();
      setEntityState('idle');
    }
  };

  // --- NEW FEATURES: New Chat & Export & Sessions ---
  const handleNewChat = () => {
    if (synth && synth.speaking) synth.cancel();

    // Save current session to archives before clearing
    if (history.length > 0) {
      setSessions(prev => [
        {
          id: Date.now(),
          date: new Date().toLocaleString(),
          messages: history
        },
        ...prev
      ]);
    }

    setHistory([]);
    setUploadedFile(null);
    setEntityState("idle");
    setSidebarTab("log");
  };

  const handleExportChat = () => {
    if (history.length === 0) {
      alert("No transcript data available to export.");
      return;
    }

    let exportText = "=== CLINICAL TRANSCRIPT ===\nDate: " + new Date().toLocaleString() + "\n\n";
    history.forEach((msg) => {
      const roleLine = msg.role === 'user' ? "Dr. User" : entityName;
      exportText += `[${ roleLine }]: \n${ msg.content } \n\n`;
    });

    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.download = `AIRA_Transcript_${ Date.now() }.txt`;
    link.href = url;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const restoreSession = (session) => {
    // Prompt warning? Or just switch state
    if (history.length > 0 && confirm("Save current chat before restoring?")) {
      setSessions(prev => [{ id: Date.now(), date: new Date().toLocaleString(), messages: history }, ...prev]);
    }
    setHistory(session.messages);
    setSidebarTab("log");
  };

  const getVoiceTitle = () => {
    if (entityState === 'listening') {
      if (language === 'TA') return `${ entityName } கேட்கிறார்...`;
      if (language === 'HI') return `${ entityName } सुन रहा है...`;
      if (language === 'TE') return `${ entityName } వింటున్నారు...`;
      if (language === 'KN') return `${ entityName } ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದಾರೆ...`;
      return `${ entityName } is Listening...`;
    }
    if (entityState === 'thinking') {
      if (language === 'TA') return "தரவை பகுப்பாய்வு செய்கிறது...";
      if (language === 'HI') return "डेटा का विश्लेषण कर रहा है...";
      if (language === 'TE') return "డేటాను విశ్లేషిస్తోంది...";
      if (language === 'KN') return "ಡೇಟಾವನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...";
      return "Synthesizing Core Data...";
    }
    if (entityState === 'speaking') {
      if (language === 'TA') return `${ entityName } பேசுகிறார்`;
      if (language === 'HI') return `${ entityName } बोल रहा है`;
      if (language === 'TE') return `${ entityName } మాట్లాడుతున్నారు`;
      if (language === 'KN') return `${ entityName } ಮಾತನಾಡುತ್ತಿದ್ದಾರೆ`;
      return `${ entityName } Speaking`;
    }
    if (language === 'TA') return `${ entityName } தயார் நிலையில்`;
    if (language === 'HI') return `${ entityName } तैयार है`;
    if (language === 'TE') return `${ entityName } సిద్ధంగా ఉన్నారు`;
    if (language === 'KN') return `${ entityName } ಸಿದ್ಧರಿದ್ದಾರೆ`;
    return `${ entityName } Standby`;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!userId || !emailId) return;

    setIsSendingOtp(true);

    // Generate a 6-digit OTP 
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      // Send real, live email using EmailJS
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: emailId,
          user_id: userId,
          otp_code: code,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      setGeneratedOtp(code);
      setLoginStep(2);
    } catch (error) {
      console.error("Failed to send OTP:", error);
      alert(`EmailJS Error: ${ error.text || error.message || "Failed to send OTP." } \n\nPlease check your Service ID, Template ID, and Public Key.`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp === generatedOtp) {
      setIsAuthenticated(true);
    } else {
      alert("Invalid OTP code. Please try again.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-wrapper">
        <div className="login-core-bg">
          <RobotEntity state="idle" />
        </div>
        <div className="login-panel">
          <div className="login-brand">
            <VolcanoIcon size={46} color="var(--accent-cyan)" />
            <h1 className="login-title">AIRA</h1>
          </div>
          <p className="login-subtitle">AIRA Assistive Intelligence System</p>

          {loginStep === 1 ? (
            <form className="login-form" onSubmit={handleRequestOtp}>
              <div className="input-group">
                <label>User ID</label>
                <input
                  type="text"
                  placeholder="Enter your user ID..."
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email ID..."
                  required
                  value={emailId}
                  onChange={(e) => setEmailId(e.target.value)}
                />
              </div>
              <button type="submit" className="login-btn" disabled={isSendingOtp}>
                {isSendingOtp ? "Dispatching Email..." : "Request Live OTP"}
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleVerifyOtp}>
              <div className="input-group">
                <label>Security OTP</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  required
                  maxLength={6}
                  style={{ letterSpacing: '0.25em', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', marginTop: '-0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                An OTP code was sent to<br /><strong style={{ color: '#fff' }}>{emailId}</strong>
              </p>

              <button type="submit" className="login-btn">Verify & Secure Login</button>

              <button
                type="button"
                className="action-btn"
                onClick={() => setLoginStep(1)}
                style={{ marginTop: '0.5rem', justifyContent: 'center', width: '100%', borderColor: 'var(--panel-border)' }}
              >
                Back to User Details
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`app-wrapper theme-${theme}`}>

      {/* LEFT SIDEBAR: Transcription / Comm Log & Archives */}
      <aside className="history-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title-row">
            <VolcanoIcon size={26} color="var(--accent-cyan)" />
            <span className="sidebar-title" style={{ textTransform: 'uppercase', marginLeft: '2px' }}>
              AIRA
            </span>
          </div>

          <div className="sidebar-actions">
            <button className="icon-action-btn" onClick={handleNewChat} title="Reset & Save Session">
              <PlusCircle size={16} />
            </button>
            <button className="icon-action-btn" onClick={handleExportChat} title="Export Transcript">
              <Download size={16} />
            </button>
            <button className="icon-action-btn" onClick={() => setShowSettings(true)} title="System Settings">
              <Settings size={16} />
            </button>
          </div>
        </div>

        <div className="sidebar-tabs">
          <button
            onClick={() => setSidebarTab('log')}
            className={`sidebar-tab ${sidebarTab === 'log' ? 'active' : ''}`}
          >
            Live Log
          </button>
          <button
            onClick={() => setSidebarTab('archive')}
            className={`sidebar-tab ${sidebarTab === 'archive' ? 'active' : ''}`}
          >
            Archives
          </button>
        </div>

        {sidebarTab === 'log' ? (
          <div className="chat-history-list">
            {history.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 'auto 0', fontStyle: 'italic', fontSize: '1rem' }}>
                {language === 'TA' ? "குரல் உள்ளீட்டிற்காக காத்திருக்கிறது..." : language === 'HI' ? "आवाज़ इनपुट की प्रतीक्षा है..." : "Awaiting voice input..."}<br /><br />
              </div>
            )}

            {history.map((msg, idx) => (
              <div className={`msg-block ${msg.role}`} key={idx}>
                <div className={`msg-role ${msg.role}`}>
                  {msg.role === 'user' ? <User size={14} /> : <Cpu size={14} />}
                  {msg.role === 'user' ? "Dr. User" : entityName}
                </div>
                <div className="msg-content">
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={historyEndRef} />
          </div>
        ) : (
          <div className="archive-list">
            {sessions.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '2rem 0', fontStyle: 'italic', fontSize: '0.9rem' }}>
                No archived sessions found. <br />Start a chat and click '+' to save it here.
              </div>
            )}
            {sessions.map(session => (
              <div className="archive-item" key={session.id} onClick={() => restoreSession(session)}>
                <div className="archive-date">{session.date}</div>
                <div className="archive-preview">
                  <User size={10} style={{ marginRight: '4px' }} />
                  {session.messages[0]?.content || "Empty Session"}
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* MAIN STAGE: The Voice-controlled Entity */}
      <main className="main-stage">
        <div className="entity-zone">
          <RobotEntity state={entityState} />
          <div className="entity-voice-title">{getVoiceTitle()}</div>
        </div>

        <div className="voice-deck">
          <button
            className={`mic-btn ${entityState === 'listening' ? 'active' : ''}`}
            onClick={toggleListening}
            title="Tap to speak"
            disabled={entityState === 'thinking'}
          >
            <Mic size={36} strokeWidth={2.5} />
          </button>

          <div className="deck-actions">
            {entityState === 'speaking' ? (
              <button className="action-btn" onClick={stopSpeaking} style={{ borderColor: '#fbbf24', color: '#fbbf24' }}>
                <Square size={16} fill="currentColor" /> Halt Speech
              </button>
            ) : (
              <label className={`action-btn ${uploadedFile ? 'attached' : ''}`}>
                {uploadedFile ? <Check size={16} /> : <UploadCloud size={16} />}
                <input type="file" accept="application/pdf" hidden onChange={handleFileUpload} disabled={entityState !== 'idle'} />
                {uploadedFile ? (language === 'TA' ? "ஆவணம் தயார்" : "Data Initialized") : (language === 'TA' ? "ஆவணத்தை பதிவேற்றவும்" : "Feed Document")}
              </label>
            )}

            <input
              type="text"
              className="fallback-input"
              placeholder={language === 'TA' ? "அல்லது இங்கே தட்டச்சு செய்யவும்..." : language === 'HI' ? "यहाँ टाइप करें..." : "Or type fallback query & press enter..."}
              value={fallbackText}
              onChange={(e) => setFallbackText(e.target.value)}
              onKeyDown={handleTextSubmit}
              disabled={entityState !== 'idle'}
            />
          </div>
        </div>
      </main>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><Sliders size={24} /> System Parameters</div>
              <button className="close-btn" onClick={() => setShowSettings(false)}><X size={20} /></button>
            </div>

            {/* GENERAL PREFS */}
            <div className="settings-section-title"><Globe size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> Regional Settings</div>

            <div className="setting-group">
              <label className="setting-label">Language / மொழி / भाषा</label>
              <select className="setting-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="EN">English (US/UK)</option>
                <option value="TA">Tamil (தமிழ்)</option>
                <option value="HI">Hindi (हिंदी)</option>
                <option value="TE">Telugu (తెలుగు)</option>
                <option value="KN">Kannada (ಕನ್ನಡ)</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">Interface Theme</label>
              <select className="setting-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="midnight">Midnight Onyx (Default)</option>
                <option value="cyberpunk">Cyberpunk Neon</option>
                <option value="glass">Pure Glassmorphism</option>
              </select>
            </div>

            {/* VOCAL PREFS */}
            <div className="settings-section-title" style={{ marginTop: '2rem' }}>Vocal Calibrations</div>

            <div className="setting-group">
              <label className="setting-label">Voice Identity</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  className={`sub-btn ${voiceGender === 'male' ? 'active' : ''}`} 
                  onClick={() => setVoiceGender('male')}
                  style={{flex: 1, height: '40px'}}
                >
                  Male / Boy
                </button>
                <button 
                  className={`sub-btn ${voiceGender === 'female' ? 'active' : ''}`} 
                  onClick={() => setVoiceGender('female')}
                  style={{flex: 1, height: '40px'}}
                >
                  Female / Girl
                </button>
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-label">Speech Dialect / behavior</label>
              <select className="setting-select" value={dialect} onChange={(e) => setDialect(e.target.value)}>
                <option value="formal">Formal / Professional</option>
                <option value="casual">Casual / Friendly</option>
                <option value="direct">Direct / Concise</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">{entityName} Vocal Pitch (Frequency)</label>
              <input
                type="range"
                min="0.5" max="2" step="0.1"
                value={voicePitch}
                onChange={e => setVoicePitch(parseFloat(e.target.value))}
                className="setting-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                <span>Deep</span><span>Standard</span><span>High</span>
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-label">{entityName} Vocal Rate (Speed)</label>
              <input
                type="range"
                min="0.5" max="2" step="0.1"
                value={voiceSpeed}
                onChange={e => setVoiceSpeed(parseFloat(e.target.value))}
                className="setting-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                <span>Slow</span><span>Standard</span><span>Rapid</span>
              </div>
            </div>

            {/* SUBSCRIPTION */}
            <div className="settings-section-title" style={{ marginTop: '2rem' }}><Briefcase size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> Licensing & Billing</div>

            <div className="sub-box">
              <div className="sub-info">
                <h4>{entityName} Basic Model</h4>
                <p>Limited queries. Community databank access.</p>
              </div>
              <button className="upgrade-btn">
                Upgrade to PRO
              </button>
            </div>

            <div className="setting-row" style={{ marginTop: '1.5rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>HIPAA Secure Mode</span>
              <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>ACTIVE</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;

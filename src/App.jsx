import { useState, useRef, useEffect, useCallback } from "react";
import tick from "./assets/check.png";
import notebook from "./assets/book.png";
import hero from "./assets/hero.png";
import uploadIcon from "./assets/upload.png";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-dark: #0a0a0a;
    --surface-glass: rgba(20, 20, 20, 0.6);
    --surface-solid: #141414;
    --surface-hover: rgba(40, 40, 40, 0.8);
    --border: rgba(255, 255, 255, 0.08);
    --border-glow: rgba(212, 168, 75, 0.3);
    
    --accent: #d4a84b;
    --accent-glow: rgba(212, 168, 75, 0.5);
    --accent-dim: rgba(212, 168, 75, 0.15);
    
    --emerald: #52b788;
    --emerald-dim: rgba(82, 183, 136, 0.15);
    
    --text-primary: #f8f9fa;
    --text-secondary: #adb5bd;
    --text-tertiary: #6c757d;
    
    --red: #ef476f;
    --red-dim: rgba(239, 71, 111, 0.15);
    
    --mono: 'JetBrains Mono', monospace;
    --sans: 'Outfit', sans-serif;
  }

  body { 
    font-family: var(--sans); 
    background-color: var(--bg-dark);
    background-image: 
      radial-gradient(circle at 15% 50%, rgba(212, 168, 75, 0.08), transparent 25%),
      radial-gradient(circle at 85% 30%, rgba(82, 183, 136, 0.08), transparent 25%);
    color: var(--text-primary); 
    height: 100vh;
    overflow: hidden;
  }

  .app {
    display: grid;
    grid-template-columns: 320px 1fr;
    height: 100vh;
    overflow: hidden;
    background: transparent;
  }

  /* SIDEBAR */
  .sidebar {
    background: var(--surface-glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 5px 0 30px rgba(0,0,0,0.2);
    z-index: 10;
  }

  .sidebar-header {
    padding: 24px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  .logo-icon {
    width: 36px; height: 36px;
    margin-top: 16px
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, var(--accent-dim), transparent);
    border: 1px solid var(--border-glow);
    box-shadow: 0 0 15px var(--accent-dim);
  }

  .logo-icon img {
    
    width: 40px;
    height: 40px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
  }

  .logo h1 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.5px;
  }

  .logo-sub {
    font-size: 12px;
    color: var(--accent);
    font-family: var(--mono);
    margin-left: 48px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* UPLOAD ZONE */
  .upload-zone {
    margin: 20px;
    border: 2px dashed var(--border);
    border-radius: 16px;
    padding: 30px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(0,0,0,0.2);
    position: relative;
    overflow: hidden;
  }

  .upload-zone::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at center, var(--accent-dim) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .upload-zone:hover, .upload-zone.drag {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.3), 0 0 20px var(--accent-dim);
  }

  .upload-zone:hover::before, .upload-zone.drag::before {
    opacity: 1;
  }

  .upload-zone input { display: none; }

  .upload-icon {
    font-size: 28px;
    margin-bottom: 12px;
    color: var(--text-tertiary);
    position: relative;
    z-index: 2;
    transition: transform 0.3s;
  }
  
  .upload-zone:hover .upload-icon {
    transform: scale(1.1);
  }

  .upload-icon img {
    width: 48px;
    height: 48px;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
  }

  .upload-text {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
    position: relative;
    z-index: 2;
  }

  .upload-text strong { 
    color: var(--accent); 
    font-weight: 500; 
    font-size: 14px;
    display: block;
    margin-bottom: 4px;
  }

  /* DOC META */
  .doc-meta {
    margin: 0 20px 20px;
    padding: 16px;
    background: linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
    border-radius: 12px;
    border: 1px solid var(--border);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }

  .doc-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .doc-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px dashed rgba(255,255,255,0.05);
  }
  .stat-row:last-child { border-bottom: none; padding-bottom: 0; }

  .stat-label {
    font-size: 12px;
    color: var(--text-tertiary);
    font-family: var(--mono);
  }

  .stat-val {
    font-size: 12px;
    color: var(--emerald);
    font-family: var(--mono);
    font-weight: 500;
    background: var(--emerald-dim);
    padding: 2px 8px;
    border-radius: 4px;
  }

  /* PIPELINE STEPS */
  .pipeline {
    flex: 1;
    overflow-y: auto;
    padding: 24px 20px;
  }

  .pipeline::-webkit-scrollbar { width: 4px; }
  .pipeline::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .pipeline-title {
    font-size: 11px;
    font-family: var(--mono);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pipeline-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }

  .step {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 12px 0;
    position: relative;
  }

  .step:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 15px; top: 38px;
    width: 2px; height: calc(100% - 16px);
    background: var(--border);
    border-radius: 1px;
  }

  .step.done:not(:last-child)::after {
    background: var(--emerald);
    box-shadow: 0 0 8px var(--emerald-dim);
  }

  .step-dot {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 2px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--text-tertiary);
    background: var(--surface-solid);
    position: relative;
    z-index: 2;
  }

  .step.done .step-dot {
    border-color: var(--emerald);
    background: var(--emerald-dim);
    color: var(--emerald);
    box-shadow: 0 0 15px rgba(82, 183, 136, 0.2);
  }

  .step.active .step-dot {
    border-color: var(--accent);
    background: var(--accent-dim);
    color: var(--accent);
    animation: pulse-ring 2s infinite;
  }

  @keyframes pulse-ring {
    0% { box-shadow: 0 0 0 0 rgba(212, 168, 75, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(212, 168, 75, 0); }
    100% { box-shadow: 0 0 0 0 rgba(212, 168, 75, 0); }
  }

  .step-info { 
    flex: 1; 
    padding-top: 6px;
  }

  .step-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 4px;
    transition: color 0.3s;
  }

  .step.done .step-name { color: var(--emerald); }
  .step.active .step-name { color: var(--text-primary); font-weight: 600; }

  .step-desc {
    font-size: 12px;
    color: var(--text-tertiary);
    line-height: 1.5;
  }

  /* MAIN CHAT AREA */
  .main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    position: relative;
  }

  .chat-header {
    padding: 20px 32px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(10, 10, 10, 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 5;
    box-shadow: 0 4px 30px rgba(0,0,0,0.1);
  }

  .chat-title { 
    font-size: 16px; 
    font-weight: 500; 
    color: var(--text-primary); 
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .chat-sub { 
    font-size: 13px; 
    color: var(--text-tertiary); 
    margin-top: 4px; 
  }

  .model-badge {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 20px;
    background: linear-gradient(90deg, var(--accent-dim), rgba(0,0,0,0));
    color: var(--accent);
    border: 1px solid var(--border-glow);
    box-shadow: 0 0 10px rgba(212, 168, 75, 0.1);
  }

  /* MESSAGES */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    scroll-behavior: smooth;
  }

  .messages::-webkit-scrollbar { width: 6px; }
  .messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  .messages::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

  /* WELCOME */
  .welcome {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px;
    gap: 24px;
    animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .welcome-icon {
    width: 80px;
    height: 80px;
    background: radial-gradient(circle at center, var(--accent-dim) 0%, transparent 70%);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin-bottom: 8px;
  }

  .welcome-icon img {
    width: 48px;
    height: 48px;
    filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
  }

  .welcome h2 {
    font-size: 28px;
    font-weight: 600;
    background: linear-gradient(135deg, #fff 0%, #adb5bd 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
  }

  .welcome p {
    font-size: 16px;
    color: var(--text-secondary);
    max-width: 480px;
    line-height: 1.6;
  }

  .welcome-steps {
    display: flex;
    gap: 16px;
    margin-top: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .welcome-step {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: 12px;
    font-size: 14px;
    color: var(--text-secondary);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transition: transform 0.2s, border-color 0.2s;
  }
  
  .welcome-step:hover {
    transform: translateY(-2px);
    border-color: rgba(255,255,255,0.1);
  }

  .ws-num {
    width: 24px; height: 24px;
    border-radius: 50%;
    background: var(--accent-dim);
    color: var(--accent);
    font-size: 12px;
    font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* MESSAGES */
  .msg {
    display: flex;
    gap: 16px;
    animation: messageSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes messageSlideIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .msg.user { flex-direction: row-reverse; }

  .msg-avatar {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
    font-weight: 600;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  }

  .msg.user .msg-avatar {
    background: linear-gradient(135deg, var(--accent), #b5852a);
    color: #000;
  }

  .msg.assistant .msg-avatar {
    background: linear-gradient(135deg, var(--emerald), #3d8f68);
    color: #000;
  }

  .msg-body { max-width: 75%; }
  .msg.user .msg-body { align-items: flex-end; display: flex; flex-direction: column; }

  .msg-bubble {
    padding: 16px 20px;
    border-radius: 16px;
    font-size: 15px;
    line-height: 1.6;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }

  .msg.user .msg-bubble {
    background: var(--surface-solid);
    border: 1px solid var(--border);
    color: var(--text-primary);
    border-top-right-radius: 4px;
  }

  .msg.assistant .msg-bubble {
    background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
    backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    color: var(--text-primary);
    border-top-left-radius: 4px;
  }

  .msg-chunks {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .chunk-badge {
    font-size: 11px;
    font-family: var(--mono);
    padding: 4px 10px;
    border-radius: 20px;
    background: var(--emerald-dim);
    color: var(--emerald);
    border: 1px solid rgba(82, 183, 136, 0.2);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .chunk-badge:hover {
    background: var(--emerald);
    color: #000;
  }

  /* THINKING */
  .thinking {
    display: flex;
    gap: 6px;
    padding: 16px 20px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: 16px;
    border-top-left-radius: 4px;
    width: fit-content;
    backdrop-filter: blur(10px);
  }

  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
  .dot:nth-child(1) { animation: blink 1.4s 0s infinite both; }
  .dot:nth-child(2) { animation: blink 1.4s 0.2s infinite both; }
  .dot:nth-child(3) { animation: blink 1.4s 0.4s infinite both; }
  @keyframes blink { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 8px var(--accent-glow); } }

  /* INPUT */
  .input-area {
    padding: 24px 32px;
    background: linear-gradient(0deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.8) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border);
    position: relative;
    z-index: 5;
  }

  .input-row {
    display: flex;
    gap: 16px;
    align-items: flex-end;
    max-width: 900px;
    margin: 0 auto;
  }

  .input-wrap {
    flex: 1;
    background: var(--surface-solid);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 12px 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 2px 5px rgba(0,0,0,0.2);
  }

  .input-wrap:focus-within { 
    border-color: var(--accent); 
    box-shadow: 0 4px 20px rgba(212, 168, 75, 0.15), inset 0 2px 5px rgba(0,0,0,0.2);
  }

  .chat-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-family: var(--sans);
    font-size: 15px;
    resize: none;
    max-height: 150px;
    min-height: 24px;
    line-height: 1.5;
  }

  .chat-input::placeholder { color: var(--text-tertiary); }

  .send-btn {
    width: 48px; height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--accent), #b5852a);
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #000;
    font-size: 20px;
    font-weight: 700;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
    box-shadow: 0 4px 15px rgba(212, 168, 75, 0.3);
  }

  .send-btn:hover:not(:disabled) { 
    transform: translateY(-2px) scale(1.05); 
    box-shadow: 0 6px 20px rgba(212, 168, 75, 0.4);
  }
  
  .send-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.95);
  }
  
  .send-btn:disabled { 
    background: var(--surface-solid); 
    color: var(--text-tertiary); 
    cursor: not-allowed; 
    box-shadow: none;
    border: 1px solid var(--border);
  }

  .input-hint {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-top: 12px;
    font-family: var(--sans);
    text-align: center;
  }

  /* PROGRESS BAR */
  .progress-bar {
    height: 4px;
    background: rgba(0,0,0,0.3);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 12px;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--emerald));
    border-radius: 2px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  
  .progress-fill::after {
    content: '';
    position: absolute;
    top: 0; left: 0; bottom: 0; right: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  /* CLEAR BTN */
  .clear-btn {
    font-size: 12px;
    font-family: var(--sans);
    font-weight: 500;
    color: var(--text-secondary);
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-btn:hover { 
    border-color: var(--red); 
    color: var(--red); 
    background: var(--red-dim); 
  }

  /* SUGGESTED QUESTIONS */
  .suggestions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
    justify-content: center;
  }

  .suggestion-btn {
    font-size: 13px;
    padding: 8px 16px;
    border-radius: 24px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: var(--sans);
    backdrop-filter: blur(10px);
  }

  .suggestion-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-dim);
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(212, 168, 75, 0.1);
  }

  /* ERROR */
  .error-msg {
    padding: 12px 16px;
    background: var(--red-dim);
    border: 1px solid rgba(239, 71, 111, 0.3);
    border-radius: 12px;
    font-size: 14px;
    color: var(--red);
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
  }
`;

const PIPELINE_STEPS = [
  { id: "upload", name: "Document ingestion", desc: "Load PDF or plain text file" },
  { id: "chunk", name: "Chunking", desc: "Sliding window (600 chars, 100 overlap)" },
  { id: "embed", name: "TF-IDF indexing", desc: "Build vector index over chunks" },
  { id: "ready", name: "Vector store ready", desc: "In-memory store indexed & ready" },
];

const SUGGESTIONS = [
  "What is this document about?",
  "Summarize the main points",
  "What are the key findings?",
  "List the most important topics",
];

export default function NotebookLM() {
  const [docState, setDocState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const processFile = useCallback(async (file) => {
    if (!file) return;
    const allowed = ["application/pdf", "text/plain", "text/markdown", "text/csv"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(txt|md|csv|pdf)$/i)) {
      setError("Please upload a PDF or plain text file (.txt, .md, .csv, .pdf)");
      return;
    }
    setError(null);
    setMessages([]);
    setPipelineStep(0);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgress(30); setPipelineStep(1);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      setProgress(60); setPipelineStep(2);

      const data = await response.json();

      setProgress(85); setPipelineStep(3);
      await new Promise(r => setTimeout(r, 300));

      setProgress(100);
      setDocState({
        name: data.metadata.name,
        charCount: data.metadata.charCount,
        chunkCount: data.metadata.chunkCount
      });
    } catch (err) {
      setError(err.message || "Failed to process document.");
      setPipelineStep(-1);
    }
  }, []);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer?.files[0] || e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const sendMessage = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q || !docState || loading) return;
    setInput("");
    setError(null);
    setLoading(true);

    const userMsg = { role: "user", content: q, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, history })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate answer");
      }

      const data = await response.json();

      const assistantMsg = {
        role: "assistant",
        content: data.answer,
        retrievedChunks: data.chunks.map(c => ({ chunk: c })),
        id: Date.now() + 1
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "error",
        content: err.message || "Something went wrong.",
        id: Date.now() + 1
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, docState, loading, messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const activePipelineStep = pipelineStep;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <div className="logo-icon"><img src={notebook} alt="Notebook" /></div>
              <h1>NotebookAI</h1>
            </div>
            <div className="logo-sub">RAG pipeline</div>
          </div>

          {/* Upload */}
          <div
            className={`upload-zone ${dragging ? "drag" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleFileDrop}
          >
            <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.csv" onChange={handleFileDrop} />
            <div className="upload-icon"><img src={uploadIcon} alt="Upload" /></div>
            <div className="upload-text">
              <strong>Drop a file or click to upload</strong><br />
              PDF, TXT, MD, CSV supported
            </div>
          </div>

          {/* Doc meta */}
          {docState && (
            <div className="doc-meta">
              <div className="doc-name">📄 {docState.name}</div>
              <div className="doc-stats">
                <div className="stat-row">
                  <span className="stat-label">characters</span>
                  <span className="stat-val">{docState.charCount.toLocaleString()}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">chunks</span>
                  <span className="stat-val">{docState.chunkCount}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">strategy</span>
                  <span className="stat-val">sliding-window</span>
                </div>
              </div>
              {progress > 0 && progress < 100 && (
                <div className="progress-bar" style={{marginTop: 8}}>
                  <div className="progress-fill" style={{width: `${progress}%`}} />
                </div>
              )}
            </div>
          )}

          {/* Pipeline steps */}
          <div className="pipeline">
            <div className="pipeline-title">RAG pipeline</div>
            {PIPELINE_STEPS.map((step, i) => {
              const state = activePipelineStep < 0 ? "idle"
                : i < activePipelineStep ? "done"
                : i === activePipelineStep ? "active"
                : docState && i <= 3 ? "done"
                : "idle";
              const finalState = docState ? "done" : state;
              return (
                <div key={step.id} className={`step ${finalState}`}>
                  <div className="step-dot">
                    {finalState === "done" ? "✓" : finalState === "active" ? "⋯" : i + 1}
                  </div>
                  <div className="step-info">
                    <div className="step-name">{step.name}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="chat-header">
            <div>
              <div className="chat-title">
                {docState ? docState.name : "No document loaded"}
              </div>
              <div className="chat-sub">
                {docState
                  ? `${docState.chunkCount} chunks indexed · ask anything about this document`
                  : "Upload a document to start chatting"}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {messages.length > 0 && (
                <button className="clear-btn" onClick={() => setMessages([])}>clear chat</button>
              )}
              <div className="model-badge">NotebookRAG</div>
            </div>
          </div>

          {/* Messages */}
          <div className="messages">
            {!docState && messages.length === 0 && (
              <div className="welcome">
                <div className="welcome-icon"><img src={hero} alt="hero" /></div>
                <h2>Your RAG-powered notebook</h2>
                <p>Upload any document and have a grounded conversation with it. Answers come only from your document — not from the model's memory.</p>
                <div className="welcome-steps">
                  {["Upload a document", "System chunks & indexes it", "Ask any question", "Get grounded answers"].map((s, i) => (
                    <div key={i} className="welcome-step">
                      <div className="ws-num">{i+1}</div>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {docState && messages.length === 0 && (
              <div className="welcome" style={{paddingTop:20}}>
                <div className="welcome-icon"><img src={tick} alt="tick" /></div>
                <h2>Document ready</h2>
                <p>Your document has been chunked and indexed. Ask anything about it below.</p>
              </div>
            )}

            {messages.map(msg => (
              msg.role === "error" ? (
                <div key={msg.id} className="error-msg">⚠ {msg.content}</div>
              ) : (
                <div key={msg.id} className={`msg ${msg.role}`}>
                  <div className="msg-avatar">
                    {msg.role === "user" ? "U" : "AI"}
                  </div>
                  <div className="msg-body">
                    <div className="msg-bubble">
                      {msg.content.split("\n").map((line, i) => (
                        <span key={i}>{line}{i < msg.content.split("\n").length - 1 && <br/>}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ))}

            {loading && (
              <div className="msg assistant">
                <div className="msg-avatar">AI</div>
                <div className="msg-body">
                  <div className="thinking">
                    <div className="dot"/><div className="dot"/><div className="dot"/>
                  </div>
                </div>
              </div>
            )}

            {error && !loading && <div className="error-msg">⚠ {error}</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="input-area">
            {docState && messages.length === 0 && (
              <div className="suggestions">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="suggestion-btn" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            )}
            <div className="input-row">
              <div className="input-wrap">
                <textarea
                  ref={textareaRef}
                  className="chat-input"
                  placeholder={docState ? "Ask a question about your document…" : "Upload a document first…"}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!docState || loading}
                  rows={1}
                  style={{resize:"none"}}
                />
              </div>
              <button
                className="send-btn"
                onClick={() => sendMessage()}
                disabled={!docState || loading || !input.trim()}
              >
                ↑
              </button>
            </div>
            <div className="input-hint">
              {docState
                ? `↵ to send · shift+↵ for newline · ${docState.chunkCount} chunks in context`
                : "drop a PDF or .txt file in the sidebar to begin"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

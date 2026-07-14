"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  ChevronDown, 
  Trash2,
  BookOpen,
  RotateCcw,
  Activity,
  X,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  FileCheck
} from 'lucide-react';

// Custom Elegant Lotus Icon from the reference image
const CozyLotusIcon = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="42" stroke="#C5A059" strokeWidth="2" fill="#FAF6EE"/>
    <path d="M50 25C50 25 42 42 42 55C42 63 46 67 50 67C54 67 58 63 58 55C58 42 50 25 50 25Z" fill="#1E4620" opacity="0.85"/>
    <path d="M50 35C50 35 34 46 34 57C34 64 40 68 46 68C48 68 50 67 50 67" stroke="#FAF6EE" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M50 35C50 35 66 46 66 57C66 64 60 68 54 68C52 68 50 67 50 67" stroke="#FAF6EE" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M30 60C35 65 42 67 50 67C58 67 65 65 70 60" stroke="#C5A059" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Traditional Golden Line/Bead Divider from the reference image
const CozyDivider = () => (
  <div className="flex items-center justify-center space-x-3 my-4 select-none">
    <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#C5A059]" />
    <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
    <div className="w-3 h-3 rounded-full border border-[#C5A059] flex items-center justify-center">
      <div className="w-1 h-1 rounded-full bg-[#C5A059]" />
    </div>
    <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
    <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#C5A059]" />
  </div>
);

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
  );
  const [apiStatus, setApiStatus] = useState("checking"); // checking | online | offline
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});

  // Dynamic Chat Session State
  const [sessions, setSessions] = useState([
    {
      id: "session-1",
      name: "ဆွေးနွေးမှု အသစ်",
      messages: []
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState("session-1");

  // Ingested files tracker
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: "Beautiful Myanmar Destinations", size: "Ready", chunks: 5, status: "success" }
  ]);

  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Inject the elegant Noto Sans Myanmar font to guarantee high fidelity rendering
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@300;400;500;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/`);
        if (response.ok) {
          setApiStatus("online");
        } else {
          setApiStatus("offline");
        }
      } catch (err) {
        setApiStatus("offline");
      }
    };
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 15000);
    return () => clearInterval(interval);
  }, [apiBaseUrl]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];
    if (latestMessage.role === 'assistant') {
      // Find all message containers inside the viewport feed
      const messageElements = chatContainer.querySelectorAll('.message-bubble-container');
      const lastElement = messageElements[messageElements.length - 1];
      
      if (lastElement) {
        // Calculate the relative vertical start point of the new text bubble
        const containerTop = chatContainer.getBoundingClientRect().top;
        const elementTop = lastElement.getBoundingClientRect().top;
        const scrollOffset = elementTop - containerTop - 16; // Maintain comfortable 16px top margin
        
        chatContainer.scrollBy({
          top: scrollOffset,
          behavior: 'smooth'
        });
      }
    } else {
      // User sent query: Snap immediately to the bottom so they see typing progress
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  useEffect(() => {
    if (isChatLoading) {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [isChatLoading]);

  const triggerNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 8000);
  };

  const createNewSession = () => {
    const newId = `session-${Date.now()}`;
    setSessions(prev => [
      ...prev,
      {
        id: newId,
        name: "ဆွေးနွေးမှု အသစ်",
        messages: []
      }
    ]);
    setActiveSessionId(newId);
  };

  const deleteSession = (id, e) => {
    e.stopPropagation();
    if (sessions.length === 1) {
      // Keep at least one empty session
      setSessions([
        {
          id: "session-1",
          name: "ဆွေးနွေးမှု အသစ်",
          messages: []
        }
      ]);
      setActiveSessionId("session-1");
      return;
    }
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      setActiveSessionId(remaining[remaining.length - 1].id);
    }
  };

  const clearCurrentSessionMessages = () => {
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [] } : s));
    triggerNotification("success", "ဆွေးနွေးမှု မှတ်တမ်းကို အောင်မြင်စွာ ရှင်းလင်းပြီးပါပြီ။");
  };

  const handleFileUpload = async (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ["pdf", "csv", "xlsx", "xls"];

    if (!allowedExtensions.includes(fileExtension)) {
      triggerNotification("error", "PDF, CSV နှင့် Excel (.xlsx, .xls) ဖိုင်များသာ တင်သွင်းနိုင်သည်။");
      return;
    }

    setIsUploading(true);
    const newFileEntry = {
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      chunks: "ဖတ်ရှုနေသည်...",
      status: "uploading"
    };

    setUploadedFiles(prev => [newFileEntry, ...prev]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiBaseUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorDetail = "ဖိုင်တင်သွင်းရန် မအောင်မြင်ပါ။";
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch (_) {}
        throw new Error(errorDetail);
      }

      const result = await response.json();
      
      setUploadedFiles(prev => 
        prev.map(f => f.name === file.name 
          ? { ...f, status: "success", chunks: result.chunks_count } 
          : f
        )
      );

      triggerNotification("success", `"${file.name}" ဖိုင်ကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!`);
    } catch (err) {
      console.error(err);
      setUploadedFiles(prev => 
        prev.map(f => f.name === file.name 
          ? { ...f, status: "error", chunks: "ကျရှုံးသည်" } 
          : f
        )
      );
      triggerNotification("error", `ကျရှုံးမှု: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    
    const queryText = inputValue.trim();
    if (!queryText) return;

    if (apiStatus === "offline") {
      triggerNotification("error", "ဒေတာဘေ့စ်စနစ် အော့ဖ်လိုင်းဖြစ်နေပါသည်။ ကျေးဇူးပြု၍ ဆာဗာကို အရင်ဖွင့်ပါ။");
      return;
    }

    const userMessageId = Date.now().toString();
    const updatedMessages = [
      ...messages,
      { id: userMessageId, role: "user", content: queryText, sources: [] }
    ];

    // Dynamic renaming of session based on the first query
    const sessionName = messages.length === 0 
      ? (queryText.length > 15 ? queryText.slice(0, 15) + "..." : queryText)
      : activeSession.name;

    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, name: sessionName, messages: updatedMessages } : s));
    setInputValue("");
    setIsChatLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: queryText })
      });

      if (!response.ok) {
        let errorDetail = "အဖြေရှာမတွေ့ပါ။";
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch (_) {}
        throw new Error(errorDetail);
      }

      const result = await response.json();

      const updatedWithAssistant = [
        ...updatedMessages,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.answer,
          sources: result.sources || []
        }
      ];

      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: updatedWithAssistant } : s));
    } catch (err) {
      console.error(err);
      triggerNotification("error", `ချို့ယွင်းချက်: ${err.message}`);
      const updatedWithError = [
        ...updatedMessages,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `🌸 ချို့ယွင်းချက်တစ်ခု ဖြစ်ပွားခဲ့သည်- ${err.message}`,
          sources: []
        }
      ];
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: updatedWithError } : s));
    } finally {
      setIsChatLoading(false);
    }
  };

  const toggleSource = (msgId, index) => {
    const key = `${msgId}-${index}`;
    setExpandedSources(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F1ECE1] text-[#3B3029] font-['Noto_Sans_Myanmar',sans-serif] antialiased selection:bg-[#E3D8BF]">
      
      {}
      <aside 
        className={`flex flex-col border-r border-[#DFD6BF] bg-[#E7DEC9] flex-shrink-0 shadow-sm transition-all duration-300 ${
          isSidebarOpen ? "w-80 md:w-85" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        {/* Sidebar Brand Logo */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-xl tracking-tight text-[#3B3029]">မြန်မာ ခရီးသွား AI</h1>
            <p className="text-[10px] text-[#7A6C5B] font-semibold tracking-wider uppercase mt-0.5">TOURISM COMPANION</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#DED4BE] text-[#5C4F44] transition-colors"
            title="Sidebar ပိတ်မည်"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* New chat action button */}
        <div className="px-5 py-2">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-start space-x-2.5 px-4 py-3 bg-[#FAF6EE] hover:bg-[#FFF] border border-[#D5C9B3] rounded-xl text-sm font-medium transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#8C765C]" />
            <span className="text-[#3B3029]">ဆွေးနွေးမှု အသစ်</span>
          </button>
        </div>

        <div className="px-5">
          <CozyDivider />
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar">
          {sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => setActiveSessionId(sess.id)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all ${
                  isActive 
                    ? "bg-[#FAF6EE]/80 border border-[#D5C9B3] text-[#3B3029] shadow-sm" 
                    : "hover:bg-[#DED4BE]/50 text-[#5C4F44]"
                }`}
              >
                <span className="text-sm font-medium truncate max-w-[80%]">{sess.name}</span>
                <button
                  onClick={(e) => deleteSession(sess.id, e)}
                  className="p-1 rounded-md hover:bg-[#E2D6BD] text-[#8C765C] transition-colors"
                  title="ဖျက်မည်"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-[#DFD6BF] flex items-center space-x-4 text-xs font-semibold text-[#8C7B6A] tracking-wide">
          <button onClick={() => setIsLogOpen(true)} className="hover:text-[#3B3029] transition-colors uppercase">health</button>
          <span>·</span>
          <span className="uppercase">sessions</span>
          <span>·</span>
          <button onClick={() => setIsDocsOpen(true)} className="hover:text-[#3B3029] transition-colors uppercase">docs</button>
        </div>
      </aside>

      {}
      <main className="flex-1 flex flex-col bg-[#F4EFE1] relative min-w-0">
        
        {/* Top Header Navbar */}
        <header className="h-16 px-8 border-b border-[#DFD6BF] bg-[#F4EFE1]/80 backdrop-blur-md flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center space-x-4 min-w-0">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg hover:bg-[#EADFC9] text-[#5C4F44] transition-colors flex-shrink-0"
                title="Sidebar ဖွင့်မည်"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
            <h2 className="font-bold text-base truncate text-[#3B3029]">{activeSession.name}</h2>
          </div>

          <div className="flex items-center space-x-1">
            {/* Header Tool buttons styled exactly like the reference image */}
            <button 
              onClick={() => setIsDocsOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-[#5C4F44] hover:text-[#3B3029] hover:bg-[#EADFC9]/50 rounded-lg transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
            </button>
            
            <span className="text-[#C5A059]/40 text-xs">|</span>

            <button 
              onClick={clearCurrentSessionMessages}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-[#5C4F44] hover:text-[#3B3029] hover:bg-[#EADFC9]/50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>မှတ်ဉာဏ် ရှင်းမည်</span>
            </button>

            <span className="text-[#C5A059]/40 text-xs">|</span>

            <button 
              onClick={() => setIsLogOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-[#5C4F44] hover:text-[#3B3029] hover:bg-[#EADFC9]/50 rounded-lg transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Log</span>
            </button>
          </div>
        </header>

        {/* Custom Notifications panel */}
        {notification && (
          <div className="absolute top-20 right-8 left-8 p-4 rounded-xl shadow-md flex items-start space-x-3 transition-all z-20 animate-in fade-in slide-in-from-top-4 duration-300 border bg-[#FAF6EE] border-[#C5A059]/30 text-[#3B3029]">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <p className="font-bold">{notification.type === 'success' ? 'အောင်မြင်မှု' : 'အသိပေးချက်'}</p>
              <p className="text-[#5C4F44] mt-0.5">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Chat Feed / Welcome State */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto h-full flex flex-col justify-center items-center text-center py-12">
              <CozyLotusIcon className="w-14 h-14 animate-fade-in" />
              
              <CozyDivider />

              <h3 className="font-bold text-2xl text-[#3B3029] mb-4">မင်္ဂလာပါ ခင်ဗျာ</h3>
              <p className="text-sm text-[#5C4F44] leading-relaxed max-w-lg">
                လှပတင့်တယ်တဲ့ မြန်မာပြည်အနှံ့ ခရီးထွက်ဖို့ အစီအစဉ်ဆွဲနေပြီလား ခင်ဗျာ။ စိတ်လှုပ်ရှားစရာ ခရီးစဉ်သစ်တွေ၊ ဒေသအစားအစာတွေနဲ့ လည်ပတ်စရာနေရာတွေကို အတူတူ ရှာဖွေကြည့်ရအောင်။
              </p>

              {/* Exact Suggested questions style */}
              <div className="mt-8 w-full max-w-lg space-y-2.5">
                {[
                  "ကချင်ပြည်နယ်ရဲ့ လှပတဲ့ တောင်တက်ခရီးစဉ်တွေအကြောင်း သိချင်ပါတယ်။",
                  "မြိတ်ကျွန်းစုကို သွားလည်ဖို့အတွက် ဘယ်လို ကြိုတင်ပြင်ဆင်မှုတွေ လုပ်ရမလဲ?",
                  "အင်းလေးကန်ကို သွားမယ်ဆိုရင် ဘယ်လိုလှုပ်ရှားမှုတွေ လုပ်ဆောင်လို့ရလဲ?"
                ].map((text, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputValue(text)}
                    className="w-full text-left p-3.5 text-xs font-medium bg-[#FAF6EE] hover:bg-[#FFF] border border-[#DFD6BF] hover:border-[#C5A059]/40 rounded-xl text-[#3B3029] transition-all flex items-center justify-between group shadow-sm"
                  >
                    <span>{text}</span>
                    <ChevronRight className="w-4 h-4 text-[#8C765C] group-hover:text-[#3B3029] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6 py-6">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex items-start space-x-4 message-bubble-container ${
                    message.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-[#8C765C] text-white border-[#8C765C]' 
                      : 'bg-[#FAF6EE] text-[#8C765C] border-[#DFD6BF]'
                  }`}>
                    {message.role === 'user' ? (
                      <span className="text-xs font-bold">ME</span>
                    ) : (
                      <CozyLotusIcon className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 max-w-[85%]">
                    <div className={`px-5 py-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                      message.role === 'user' 
                        ? 'bg-[#FAF6EE] text-[#3B3029] rounded-tr-none border border-[#DFD6BF]' 
                        : 'bg-[#FAF6EE] border border-[#DFD6BF] rounded-tl-none text-[#3B3029]'
                    }`}>
                      {message.role === 'user' ? (
                        message.content
                      ) : (
                        <div className="max-w-none text-sm leading-relaxed prose prose-stone">
                          <ReactMarkdown 
                            components={{
                              p: ({children}) => <p className="mb-2.5 last:mb-0 leading-relaxed text-[#3B3029]">{children}</p>,
                              ul: ({children}) => <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>,
                              li: ({children}) => <li className="text-[#3B3029]">{children}</li>,
                              strong: ({children}) => <strong className="font-bold text-[#8C765C]">{children}</strong>,
                              em: ({children}) => <em className="italic text-[#7A6C5B]">{children}</em>,
                              code({ className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                return match ? (
                                  <pre className="bg-[#F1ECE1] p-3 rounded-xl overflow-x-auto text-xs font-mono text-[#3B3029] my-2 border border-[#DFD6BF]">
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  </pre>
                                ) : (
                                  <code className="bg-[#F1ECE1] px-1.5 py-0.5 rounded text-xs font-mono text-[#8C765C] border border-[#DFD6BF]" {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Sourced Context References accordion */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-1 px-1">
                        <div className="flex items-center space-x-1.5 text-[10px] text-[#7A6C5B] font-bold tracking-wider uppercase mb-1">
                          <span>Sourced Knowledge ({message.sources.length}):</span>
                        </div>

                        <div className="space-y-1.5">
                          {message.sources.map((source, idx) => {
                            const isExpanded = expandedSources[`${message.id}-${idx}`];
                            return (
                              <div 
                                key={idx} 
                                className="text-xs bg-[#FAF6EE] border border-[#DFD6BF] rounded-xl overflow-hidden transition-all duration-200 hover:border-[#C5A059]/40"
                              >
                                <button 
                                  onClick={() => toggleSource(message.id, idx)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-[#FFF] text-[#3B3029] font-medium transition-colors text-left"
                                >
                                  <div className="flex items-center space-x-2 truncate min-w-0">
                                    <FileText className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                                    <span className="truncate text-xs font-bold text-[#3B3029]">{source.title}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 flex-shrink-0">
                                    <span className="text-[9px] px-2 py-0.5 rounded bg-[#F1ECE1] text-[#8C765C] font-mono border border-[#DFD6BF]">
                                      Match: {source.score ? source.score.toFixed(3) : "N/A"}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#8C7B6A]" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-[#8C7B6A]" />
                                    )}
                                  </div>
                                </button>

                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-1 text-[#5C4F44] border-t border-[#DFD6BF] bg-[#F1ECE1]/20 leading-relaxed font-mono text-[10px] whitespace-pre-wrap select-text">
                                    {`Retrieved Context Segment:\n-------------------------\n${source.content || "No segment available."}`}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Chat loading state */}
              {isChatLoading && (
                <div className="flex items-start space-x-4">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF6EE] border border-[#DFD6BF] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Loader2 className="w-4 h-4 text-[#8C765C] animate-spin" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="bg-[#FAF6EE] border border-[#DFD6BF] rounded-2xl rounded-tl-none px-5 py-3.5 text-sm flex items-center space-x-3">
                      <span className="text-[#5C4F44]">အချက်အလက်များကို ရှာဖွေဆန်းစစ်နေပါသည်...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wide Pill Chat Input Panel */}
        <footer className="p-6 border-t border-[#DFD6BF] bg-[#F4EFE1] flex-shrink-0">
          <form 
            onSubmit={handleSendMessage} 
            className="max-w-2xl mx-auto flex items-center space-x-3 bg-[#FAF6EE] border border-[#DFD6BF] focus-within:border-[#C5A059]/60 p-2 pl-5 rounded-full transition-all duration-300 shadow-sm"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="မေးခွန်းမေးပါ..."
              disabled={isChatLoading || apiStatus === 'offline'}
              className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm py-2 text-[#3B3029] placeholder-[#8C7B6A]/70 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isChatLoading || !inputValue.trim() || apiStatus === 'offline'}
              className="p-3 bg-[#FAF6EE] hover:bg-[#FFF] border border-[#DFD6BF] hover:border-[#C5A059]/40 disabled:bg-[#F1ECE1] text-[#8C765C] disabled:text-[#8C7B6A]/50 rounded-full transition-all flex-shrink-0 shadow-sm flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="text-center mt-3">
            <p className="text-[10px] text-[#8C7B6A] tracking-wider uppercase">
              မြန်မာ ခရီးသွား AI · အဖြေများကို သတိနဲ့ စိစစ်ပါ
            </p>
          </div>
        </footer>

        {}
        <div 
          className={`absolute top-0 right-0 h-full w-85 bg-[#FAF6EE] border-l border-[#DFD6BF] shadow-2xl z-30 transform transition-transform duration-300 ${
            isDocsOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6 border-b border-[#DFD6BF] flex items-center justify-between bg-[#F4EFE1]/40">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-[#8C765C]" />
              <h3 className="font-bold text-sm text-[#3B3029]"> travel catalog (ဖိုင်များ)</h3>
            </div>
            <button 
              onClick={() => setIsDocsOpen(false)}
              className="p-1 rounded-lg hover:bg-[#EADFC9] text-[#5C4F44] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-70px)] custom-scrollbar">
            <div>
              <p className="text-xs text-[#5C4F44] leading-relaxed mb-4">
                သင့်ရဲ့ ခရီးစဉ်အချက်အလက်များ၊ ဟိုတယ်စာရင်းများ (PDF, CSV, Excel) တင်သွင်းပြီး AI စနစ်ထဲသို့ ထည့်သွင်းနိုင်ပါသည်။
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#DFD6BF] bg-[#F4EFE1]/20 hover:bg-[#FAF6EE] rounded-2xl p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
                    <p className="text-xs font-bold text-[#8C765C]">သိမ်းဆည်းနေပါသည်...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <UploadCloud className="w-8 h-8 text-[#8C765C]" />
                    <p className="text-xs font-bold text-[#3B3029]">ဖိုင်တင်သွင်းရန် နှိပ်ပါ</p>
                    <p className="text-[9px] text-[#8C7B6A]">PDF, CSV သို့မဟုတ် Excel ဖိုင်များ</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-[#8C7B6A] uppercase tracking-wider">လက်ရှိ ဒေတာစုစည်းမှု</h4>
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="p-3 bg-[#F4EFE1]/40 border border-[#DFD6BF] rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#8C765C] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#3B3029] truncate" title={file.name}>{file.name}</p>
                        <p className="text-[10px] text-[#7A6C5B] mt-0.5">{file.chunks !== "ဖတ်ရှုနေသည်..." ? `${file.chunks} chunks` : file.chunks}</p>
                      </div>
                    </div>
                    {file.status === 'success' && <FileCheck className="w-4 h-4 text-green-600" />}
                    {file.status === 'uploading' && <Loader2 className="w-4 h-4 text-[#C5A059] animate-spin" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {}
        <div 
          className={`absolute top-0 right-0 h-full w-85 bg-[#1F1915] text-[#DCD3C7] shadow-2xl z-30 transform transition-transform duration-300 ${
            isLogOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6 border-b border-stone-800 flex items-center justify-between bg-stone-900">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm">System Telemetry Logs</h3>
            </div>
            <button 
              onClick={() => setIsLogOpen(false)}
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto h-[calc(100%-70px)] font-mono text-xs custom-scrollbar">
            <div className="space-y-1.5">
              <p className="text-stone-500">[2026-07-14 15:32:01] System started successfully.</p>
              <p className="text-stone-500">[2026-07-14 15:32:03] Connecting to vector database client...</p>
              <p className="text-amber-500">[2026-07-14 15:32:05] Qdrant Collection checked: my_knowledge_base (768 dimensions)</p>
              <p className="text-green-500">[2026-07-14 15:32:07] API BASE PATH: {apiBaseUrl}</p>
              <p className={`font-bold ${apiStatus === "online" ? "text-green-400" : "text-rose-400"}`}>
                [Telemetry Check] Server Status is: {apiStatus.toUpperCase()}
              </p>
            </div>
            <div className="border-t border-stone-800 pt-4 space-y-2">
              <h4 className="font-bold text-stone-400">Connection Settings:</h4>
              <div className="space-y-1.5">
                <label className="block text-[10px] text-stone-500">API BASE PATH:</label>
                <input 
                  type="text" 
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-850 p-2 rounded text-stone-200 outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  UploadCloud, 
  User, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  ChevronDown, 
  Compass, 
  Sparkles,
  HelpCircle,
  MapPin,
  FileCheck
} from 'lucide-react';

const PatheinUmbrellaIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 15C25 15 10 38 10 50C10 52 12 54 14 54C23 54 27 46 32 46C37 46 41 54 50 54C59 54 63 46 68 46C73 46 77 54 86 54C88 54 90 52 90 50C90 38 75 15 50 15Z" fill="#E88D67" stroke="#8C4A32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M50 54V85C50 87 48 89 46 89C44 89 43 87 43 85" stroke="#8C4A32" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M50 15V10C50 9 51 8 52 8C53 8 54 9 54 10V15" stroke="#8C4A32" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="50" cy="30" r="4" fill="#F3C68F" />
    <circle cx="32" cy="38" r="3" fill="#EE9B84" />
    <circle cx="68" cy="38" r="3" fill="#EE9B84" />
  </svg>
);

const PagodaArchIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5C50 5 44 22 41 28C38 34 26 35 20 37C14 39 12 43 18 45C24 47 40 46 41 50C42 54 36 78 36 85H64C64 78 58 54 59 50C60 46 76 47 82 45C88 43 86 39 80 37C74 35 62 34 59 28C56 22 50 5 50 5Z" fill="#F6D19B" stroke="#B07156" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M38 85C38 60 42 55 50 55C58 55 62 60 62 85" fill="#FFFBF5" stroke="#B07156" strokeWidth="3"/>
    <circle cx="50" cy="35" r="5" fill="#E88D67" />
  </svg>
);

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState("http://127.0.0.1:8000");
  const [apiStatus, setApiStatus] = useState("checking"); // checking | online | offline
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Mingalaba & Welcome! 🌸 I am your cozy **Myanmar Travel Assistant**.\n\nThink of me as your local friend! Drop your tour lists, spreadsheets, or guidebooks on the left. I will happily search through them to answer your questions about beautiful pagodas, delicious Mohinga, traditional Pathein umbrellas, and peaceful beaches! ✨",
      sources: []
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: "Beautiful Myanmar Destinations", size: "Ready", chunks: 5, status: "success" }
  ]);
  const [dragActive, setDragActive] = useState(false);
  const [notification, setNotification] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const triggerNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 8000);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ["pdf", "csv", "xlsx", "xls"];

    if (!allowedExtensions.includes(fileExtension)) {
      triggerNotification("error", "Only PDFs, CSVs, and Excel spreadsheets (.xlsx, .xls) are supported.");
      return;
    }

    setIsUploading(true);
    const newFileEntry = {
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      chunks: "Reading...",
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
        let errorDetail = "Failed to upload file.";
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch (_) {
          try {
            const rawText = await response.text();
            if (rawText) errorDetail = rawText;
          } catch (_) {}
        }
        throw new Error(errorDetail);
      }

      const result = await response.json();
      
      setUploadedFiles(prev => 
        prev.map(f => f.name === file.name 
          ? { ...f, status: "success", chunks: result.chunks_count } 
          : f
        )
      );

      triggerNotification("success", `Vectorized "${file.name}" into your local database!`);
    } catch (err) {
      console.error(err);
      setUploadedFiles(prev => 
        prev.map(f => f.name === file.name 
          ? { ...f, status: "error", chunks: "Failed" } 
          : f
        )
      );
      triggerNotification("error", `Upload Failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    
    const queryText = inputValue.trim();
    if (!queryText) return;

    if (apiStatus === "offline") {
      triggerNotification("error", "Your travel database is asleep! Please turn on the backend server on port 8000.");
      return;
    }

    const userMessageId = Date.now().toString();
    const newMessages = [
      ...messages,
      { id: userMessageId, role: "user", content: queryText, sources: [] }
    ];
    setMessages(newMessages);
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
        let errorDetail = "Failed to get an answer.";
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch (_) {
          try {
            const rawText = await response.text();
            if (rawText) errorDetail = rawText;
          } catch (_) {}
        }
        throw new Error(errorDetail);
      }

      const result = await response.json();

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.answer,
          sources: result.sources || []
        }
      ]);
    } catch (err) {
      console.error(err);
      triggerNotification("error", `Error: ${err.message}`);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `🌸 Oops, something went wrong: ${err.message}`,
          sources: []
        }
      ]);
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

  const selectSuggestion = (text) => {
    setInputValue(text);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FBF8F3] text-[#544B44] font-sans selection:bg-[#EED5C4] selection:text-[#80422B]">
      
      {/* SIDEBAR: Soft Sandstone & Pale Sandstone Container */}
      <aside className="w-80 md:w-96 flex flex-col border-r border-[#EBE3D5] bg-[#F5EFE6] flex-shrink-0 shadow-sm relative">
        
        {/* Soft Traditional Banner Ornament */}
        <div className="h-2 w-full bg-gradient-to-r from-[#E88D67] via-[#F3C68F] to-[#7EA172]" />

        {/* Sidebar Header: Arched Motif & Cozy Logo */}
        <div className="p-6 border-b border-[#EBE3D5] bg-[#FAF3F0]/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#F6D19B] rounded-2xl shadow-sm border border-[#E3B27E]">
              <PagodaArchIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide text-[#725446]">Bagan Guide</h1>
              <p className="text-[11px] text-[#A6887B] font-semibold tracking-wider uppercase">Local Travel Buddy</p>
            </div>
          </div>
          
          {/* Happy status display */}
          <div 
            className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-[#E2D9CD]"
            title={`Database is: ${apiStatus}`}
          >
            <span className={`w-2 h-2 rounded-full ${
              apiStatus === "online" ? "bg-[#7EA172] animate-pulse" : 
              apiStatus === "offline" ? "bg-[#D96B6B]" : "bg-[#F3C68F]"
            }`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A7065]">
              {apiStatus === "online" ? "Online" : "Resting"}
            </span>
          </div>
        </div>

        {/* Travel Document Pipeline Box */}
        <div className="p-6 flex flex-col flex-1 overflow-y-auto space-y-6">
          <div>
            <h2 className="text-xs font-bold text-[#B16A54] uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Sandalwood Trunk
            </h2>
            <p className="text-xs text-[#80746C] leading-relaxed mb-4">
              Pack your itineraries, local hotel lists, or maps here. I'll read and remember them instantly.
            </p>
            
            {/* Soft Pastel Sandalwood Ingestion Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[1.8rem] p-6 text-center cursor-pointer transition-all duration-300 ${
                dragActive 
                  ? "border-[#E88D67] bg-[#F7EAE2]" 
                  : "border-[#DFD3C3] bg-white hover:border-[#E88D67] hover:bg-[#FAF6F0]"
              }`}
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
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="w-8 h-8 text-[#E88D67] animate-spin" />
                  <p className="text-xs font-bold tracking-wider text-[#A66E53] uppercase">Reading maps...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3 group">
                  <div className="p-3 bg-[#FAF6F0] rounded-full border border-[#EBE3D5] group-hover:bg-[#FFF] transition-colors">
                    <UploadCloud className="w-6 h-6 text-[#A66E53]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#725446]">Drag & Drop your plans</p>
                    <p className="text-[10px] text-[#A2978F] mt-1">PDF, CSV, Excel sheets</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sourced Documents */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A796F] mb-3 flex items-center justify-between">
              <span>My Travel Catalog</span>
              <span className="bg-[#EBE3D5] text-[#7A6A5E] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                {uploadedFiles.length} files
              </span>
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {uploadedFiles.map((file, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#EBE3D5] hover:border-[#DFD3C3] transition-all shadow-sm"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-xl ${
                      file.status === 'success' ? 'bg-[#EFF5EE] text-[#7EA172]' :
                      file.status === 'error' ? 'bg-[#FDF3F3] text-[#D96B6B]' :
                      'bg-[#FAF8F5] text-[#A68F81]'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#5C4D44] truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-[#A2978F] mt-0.5">
                        {file.chunks !== "Reading..." && file.chunks !== "Failed" 
                          ? `${file.chunks} travel items` 
                          : file.chunks
                        }
                      </p>
                    </div>
                  </div>
                  
                  {file.status === 'success' && <FileCheck className="w-4 h-4 text-[#7EA172] flex-shrink-0" />}
                  {file.status === 'error' && <AlertCircle className="w-4 h-4 text-[#D96B6B] flex-shrink-0" />}
                  {file.status === 'uploading' && <Loader2 className="w-4 h-4 text-[#E88D67] animate-spin flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Soft Sidebar Footer */}
        <div className="p-4 border-t border-[#EBE3D5] bg-[#FAF3F0]/60 flex items-center justify-between text-[10px] text-[#A6998E]">
          <span className="font-bold tracking-wide uppercase text-[#B16A54]">Bagan Cloud Mode</span>
          <span>v3.5-flash</span>
        </div>
      </aside>

      {/* MAIN CONTAINER: Cozy Conversation Interface */}
      <main className="flex-1 flex flex-col bg-[#FCF9F4] relative">
        
        {/* Chat Screen Header with Pathein Umbrella Ornament */}
        <header className="px-8 py-5 border-b border-[#EBE3D5] bg-white/80 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <PatheinUmbrellaIcon className="w-8 h-8 animate-bounce" />
            <div>
              <h2 className="font-bold text-base text-[#523F35]">Golden Myanmar Companion</h2>
              <p className="text-xs text-[#9B887C]">Bright, cheerful local travel assistance</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-[#725446] flex items-center gap-1.5 font-bold bg-[#FAF3F0] px-3.5 py-1.5 rounded-full border border-[#EBE3D5]">
              <Sparkles className="w-3.5 h-3.5 text-[#E88D67]" />
              Ready to Chat
            </span>
          </div>
        </header>

        {/* Soft Toast Notification */}
        {notification && (
          <div className={`absolute top-20 right-8 left-8 p-4 rounded-2xl shadow-md flex items-start space-x-3 transition-all z-20 animate-in fade-in slide-in-from-top-4 duration-300 border ${
            notification.type === 'success' 
              ? 'bg-[#EFF5EE] border-[#D0E2CC] text-[#4E6B44]' 
              : 'bg-[#FDF3F3] border-[#F2D0D0] text-[#8C3E3E]'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-[#7EA172] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#D96B6B] flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <p className="font-bold">{notification.type === 'success' ? 'Yay!' : 'Notice'}</p>
              <p className="text-[#6B5A51] mt-0.5">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Cozy Conversation Feed */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex items-start space-x-4 max-w-4xl ${
                message.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Cute User and Bot Icons */}
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
                message.role === 'user' 
                  ? 'bg-[#E88D67] text-white border-[#D47953]' 
                  : 'bg-white text-[#E88D67] border-[#EBE3D5]'
              }`}>
                {message.role === 'user' ? <User className="w-4 h-4 font-bold" /> : <PatheinUmbrellaIcon className="w-5 h-5" />}
              </div>

              {/* Message Bubbles shaped nicely like arches */}
              <div className="flex flex-col space-y-2 max-w-[85%]">
                <div className={`px-5 py-4 rounded-[1.8rem] shadow-sm text-sm leading-relaxed ${
                  message.role === 'user' 
                    ? 'bg-[#E88D67] text-white font-medium rounded-tr-none' 
                    : 'bg-white border border-[#EBE3D5] rounded-tl-none text-[#52453C]'
                }`}>
                  {message.role === 'user' ? (
                    message.content
                  ) : (
                    <div className="max-w-none text-sm leading-relaxed prose prose-stone">
                      <ReactMarkdown 
                        components={{
                          p: ({children}) => <p className="mb-2.5 last:mb-0 leading-relaxed text-[#5C4E44]">{children}</p>,
                          ul: ({children}) => <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-[#5C4E44]">{children}</li>,
                          h1: ({children}) => <h1 className="text-base font-bold text-[#8C4A32] mb-2">{children}</h1>,
                          h2: ({children}) => <h2 className="text-sm font-bold text-[#8C4A32] mb-1.5">{children}</h2>,
                          h3: ({children}) => <h3 className="text-xs font-bold text-[#8C4A32] mb-1">{children}</h3>,
                          strong: ({children}) => <strong className="font-bold text-[#8C4A32]">{children}</strong>,
                          em: ({children}) => <em className="italic text-[#8C7668]">{children}</em>,
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <pre className="bg-[#FAF6F0] p-3 rounded-2xl overflow-x-auto text-xs font-mono text-[#7A594A] my-2 border border-[#EBE3D5]">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code className="bg-[#FAF3F0] px-1.5 py-0.5 rounded-lg text-xs font-mono text-[#B16A54] border border-[#EBE3D5]" {...props}>
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

                {/* Sourced Metadata Foldouts */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-1 px-1">
                    <div className="flex items-center space-x-1.5 text-[10px] text-[#A68F81] font-bold tracking-wider uppercase mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#F3C68F]" />
                      <span>Sourced Knowledge ({message.sources.length}):</span>
                    </div>

                    <div className="space-y-1.5">
                      {message.sources.map((source, idx) => {
                        const isExpanded = expandedSources[`${message.id}-${idx}`];
                        return (
                          <div 
                            key={idx} 
                            className="text-xs bg-white border border-[#EBE3D5] rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#DFD3C3]"
                          >
                            <button 
                              onClick={() => toggleSource(message.id, idx)}
                              className="w-full flex items-center justify-between p-3 hover:bg-[#FAF8F5] text-[#5C4D44] font-semibold transition-colors text-left"
                            >
                              <div className="flex items-center space-x-2 truncate min-w-0">
                                <FileText className="w-3.5 h-3.5 text-[#E88D67] flex-shrink-0" />
                                <span className="truncate text-xs font-bold text-[#523F35]">{source.title}</span>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EBE3D5] text-[#B16A54] font-mono">
                                  Match: {source.score ? source.score.toFixed(3) : "N/A"}
                                </span>
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-[#A6998E]" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-[#A6998E]" />
                                )}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="px-4 pb-4 pt-1 text-[#6B5C52] border-t border-[#EBE3D5] bg-[#FAFDF9]/40 leading-relaxed font-mono text-[10px] whitespace-pre-wrap select-text">
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

          {/* Golden thinking indicator */}
          {isChatLoading && (
            <div className="flex items-start space-x-4 max-w-4xl">
              <div className="w-9 h-9 rounded-2xl bg-white text-[#E88D67] border border-[#EBE3D5] flex items-center justify-center flex-shrink-0 shadow-sm">
                <PatheinUmbrellaIcon className="w-5 h-5 animate-spin" />
              </div>
              <div className="flex flex-col space-y-2">
                <div className="bg-white border border-[#EBE3D5] rounded-[1.8rem] rounded-tl-none px-5 py-3.5 text-sm flex items-center space-x-3">
                  <Loader2 className="w-4 h-4 text-[#E88D67] animate-spin" />
                  <span className="text-[#807064] font-bold">Loading~~~...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AND TRAVEL SUGGESTION FOOTER */}
        <footer className="p-8 border-t border-[#EBE3D5] bg-white">
          
          {/* Real Myanmar Tourism Suggestions */}
          {messages.length === 1 && (
            <div className="mb-6 max-w-4xl mx-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#B16A54] mb-2.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Frequently Asked Travel Questions
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "What is the best time of year to visit the temples of Bagan?",
                  "Can you outline a cozy 3-day itinerary for Inle Lake?",
                  "What are the cultural rules for visiting Shwedagon Pagoda?"
                ].map((text, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSuggestion(text)}
                    className="p-3.5 text-left text-xs font-bold rounded-[1.2rem] border border-[#EBE3D5] hover:border-[#E88D67] bg-[#FCFBF8] hover:bg-[#FAF6F0] text-[#7A6051] transition-all flex items-center justify-between group shadow-sm"
                  >
                    <span>{text}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#A69386] group-hover:text-[#E88D67] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form input bar */}
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center space-x-3 bg-[#FAF8F5] hover:bg-[#FFF] border border-[#EBE3D5] hover:border-[#DFD3C3] focus-within:border-[#E88D67] focus-within:bg-[#FFF] p-2 rounded-[1.8rem] transition-all duration-300 shadow-sm">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={apiStatus === 'offline' ? "Give me a moment to wake up..." : "Ask your local guide companion anything..."}
              disabled={isChatLoading || apiStatus === 'offline'}
              className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm px-4 py-2 text-[#523F35] placeholder-[#A6998E] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isChatLoading || !inputValue.trim() || apiStatus === 'offline'}
              className="p-3.5 bg-[#E88D67] hover:bg-[#D47953] disabled:bg-[#EBE3D5] disabled:text-[#A6998E] text-white font-bold rounded-[1.2rem] transition-all flex-shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </footer>

      </main>
    </div>
  );
}
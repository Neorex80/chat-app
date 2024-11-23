import React, { useState, useRef, useEffect } from 'react';
import { 
  MenuIcon,
  X,
  Send,
  User,
  Settings,
  LogOut,
  MessageSquare,
  Plus,
  Home,
  Sparkles
} from 'lucide-react';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    
    // Add user message
    const userMessage = {
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate AI response (replace with actual Grok API call)
    setTimeout(() => {
      const aiMessage = {
        content: "This is a simulated AI response. Replace this with actual Grok API integration.",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Redirect to login page or handle sign out
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const startNewChat = () => {
    setCurrentChat(new Date().toISOString());
    setMessages([]);
  };

  return (
    <div className="h-screen flex bg-[#1a1a2e] text-white overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`fixed lg:relative lg:translate-x-0 h-full transition-all duration-300 ease-in-out z-20
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarOpen ? 'w-72' : 'w-0'} lg:w-72`}
      >
        <div className="h-full bg-gradient-to-b from-[#1a1a2e]/95 to-[#1a1a2e]/98 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
              Your AI App
            </h1>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={startNewChat}
            className="w-full p-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-pink-500/20 
            hover:from-cyan-500/30 hover:to-pink-500/30 transition-all duration-300
            border border-white/10 hover:border-white/20 mb-4 flex items-center gap-2"
          >
            <Plus size={20} />
            New Chat
          </button>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            <button className="w-full p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2">
              <Home size={20} />
              Dashboard
            </button>
            <button className="w-full p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2">
              <MessageSquare size={20} />
              Conversations
            </button>
          </nav>

          {/* User Section */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <button className="w-full p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2">
              <Settings size={20} />
              Settings
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 text-red-400"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Top Bar */}
        <div className="h-16 border-b border-white/10 flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/60 hover:text-white transition-colors mr-4"
          >
            <MenuIcon size={24} />
          </button>
          <h2 className="text-xl font-semibold">Chat with AI</h2>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-pink-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-pink-500/20 ml-4'
                    : 'bg-white/5'
                }`}
              >
                {message.content}
              </div>
              {message.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form 
          onSubmit={handleSendMessage}
          className="border-t border-white/10 p-4"
        >
          <div className="relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-4 pr-12 rounded-lg bg-white/5 border border-white/10 
              placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/50
              transition-all duration-300"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/60 
              hover:text-white disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-300"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
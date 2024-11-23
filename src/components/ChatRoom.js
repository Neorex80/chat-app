import React, { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';
import {
  MenuIcon, X, Send, User, Settings, LogOut, MessageSquare,
  Plus, Home, Sparkles, Copy, Check, Image, ThumbsUp,
  ThumbsDown, Share, Code, FileText, Paperclip, AlertCircle,
  Loader2, Trash2, Edit3, Download, MoreVertical
} from 'lucide-react';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
// Initialize OpenAI with Grok configuration
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
  dangerouslyAllowBrowser: true
});

const markdownStyles = {
  h1: 'text-3xl font-bold mb-4 mt-6 pb-2 border-b border-white/10',
  h2: 'text-2xl font-bold mb-3 mt-5',
  h3: 'text-xl font-bold mb-2 mt-4',
  h4: 'text-lg font-bold mb-2 mt-3',
  p: 'mb-4 leading-relaxed',
  ul: 'list-disc pl-6 mb-4 space-y-2',
  ol: 'list-decimal pl-6 mb-4 space-y-2',
  li: 'pl-2',
  blockquote: 'border-l-4 border-white/20 pl-4 italic my-4',
  table: 'w-full border-collapse mb-4',
  th: 'border border-white/20 px-4 py-2 bg-white/5',
  td: 'border border-white/20 px-4 py-2',
  pre: 'mb-4',
  code: 'bg-white/10 rounded px-1.5 py-0.5',
  a: 'text-cyan-400 hover:underline',
  hr: 'my-8 border-white/10',
  img: 'max-w-full h-auto rounded-lg my-4'
};

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  // Save current conversation when messages change
  useEffect(() => {
    if (currentConversation && messages.length > 0) {
      saveConversation();
    }
  }, [messages]); 

  const loadConversations = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("No user logged in"); // Add logging to debug auth state
        return;
      }

      // Add index check to verify if composite index exists
      const q = query(
        collection(db, 'conversations'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      // Add error handling for missing index
      try {
        const querySnapshot = await getDocs(q);
        const loadedConversations = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log("Loaded conversations:", loadedConversations); // Log loaded data
        setConversations(loadedConversations);
      } catch (indexError) {
        // Check if error is due to missing index
        if (indexError.code === 'failed-precondition') {
          console.error('Missing index for query. Create a composite index for userId and timestamp');
          setError('Database index not configured properly. Please contact support.');
        } else {
          throw indexError; // Re-throw if it's a different error
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations: ' + err.message);
    }
  };

  const saveConversation = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("No user logged in");
        return;
      }
  
      const conversationData = {
        userId: user.uid,
        title: currentConversation.title,
        messages: messages,
        timestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
  
      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
  
      console.log("Conversation saved with ID: ", docRef.id);
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };
  

  const deleteConversation = async (conversationId) => {
    try {
      await deleteDoc(doc(db, 'conversations', conversationId));
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation');
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Initialize a new chat
  const startNewChat = () => {
    const newConversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date().toISOString(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    setMessages([]);
    setSidebarOpen(false);
  };

  // Stream response from Grok API
  const streamFromGrok = async (userMessage) => {
    try {
      const stream = await openai.chat.completions.create({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'You are Grok, a chatbot inspired by the Hitchhiker\'s Guide to the Galaxy. You are helpful, witty, and knowledgeable.',
          },
          ...messages.map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
          })),
          { role: 'user', content: userMessage },
        ],
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        setStreamingMessage((prev) => prev + content);
      }
      return fullResponse;
    } catch (err) {
      console.error('Grok API Error:', err);
      throw new Error(err.message || 'Failed to get response from Grok');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && !selectedFile) return;

    setIsLoading(true);
    setError(null);
    setStreamingMessage('');

    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      file: selectedFile
        ? {
            name: selectedFile.name,
            type: selectedFile.type,
            url: previewUrl,
          }
        : null,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setSelectedFile(null);
    setPreviewUrl(null);

    try {
      const grokResponse = await streamFromGrok(inputMessage);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: grokResponse,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setStreamingMessage('');

      if (currentConversation) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversation.id
              ? {
                  ...conv,
                  messages: [...conv.messages, userMessage, aiMessage],
                  title:
                    conv.messages.length === 0
                      ? generateTitle(inputMessage)
                      : conv.title,
                }
              : conv
          )
        );
      }
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: `Error: ${err.message}. Please try again.`,
          sender: 'system',
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTitle = (message) => {
    return message.length > 30 ? `${message.substring(0, 30)}...` : message;
  };

  const handleCopyMessage = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(content);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const saveEdit = (messageId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: editContent }
          : msg
      )
    );
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleDeleteMessage = (messageId) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const downloadConversation = () => {
    const content = messages
      .map((msg) => `${msg.sender}: ${msg.content}\n`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversation.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const MarkdownContent = ({ content }) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ node, ...props }) => <h1 className={markdownStyles.h1} {...props} />,
        h2: ({ node, ...props }) => <h2 className={markdownStyles.h2} {...props} />,
        h3: ({ node, ...props }) => <h3 className={markdownStyles.h3} {...props} />,
        h4: ({ node, ...props }) => <h4 className={markdownStyles.h4} {...props} />,
        p: ({ node, ...props }) => <p className={markdownStyles.p} {...props} />,
        ul: ({ node, ...props }) => <ul className={markdownStyles.ul} {...props} />,
        ol: ({ node, ...props }) => <ol className={markdownStyles.ol} {...props} />,
        li: ({ node, ...props }) => <li className={markdownStyles.li} {...props} />,
        blockquote: ({ node, ...props }) => <blockquote className={markdownStyles.blockquote} {...props} />,
        table: ({ node, ...props }) => <table className={markdownStyles.table} {...props} />,
        th: ({ node, ...props }) => <th className={markdownStyles.th} {...props} />,
        td: ({ node, ...props }) => <td className={markdownStyles.td} {...props} />,
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={atomDark}
              language={match[1]}
              PreTag="div"
              className={markdownStyles.pre}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={markdownStyles.code} {...props}>
              {children}
            </code>
          );
        },
        a: ({ node, ...props }) => <a className={markdownStyles.a} target="_blank" rel="noopener noreferrer" {...props} />,
        hr: ({ node, ...props }) => <hr className={markdownStyles.hr} {...props} />,
        img: ({ node, ...props }) => <img className={markdownStyles.img} {...props} />
      }}
      className="prose prose-invert max-w-none"
    >
      {content}
    </ReactMarkdown>
  );

  const MobileMenuButton = () => (
    <button
      onClick={() => setShowMobileMenu(!showMobileMenu)}
      className="fixed bottom-4 left-4 z-30 w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 flex items-center justify-center shadow-lg lg:hidden"
    >
      {showMobileMenu ? (
        <X size={20} className="text-white" />
      ) : (
        <MenuIcon size={20} className="text-white" />
      )}
    </button>
  );
  
  const MobileMenu = () => (
    <AnimatePresence>
      {showMobileMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
    </AnimatePresence>
  );


  const MessageComponent = ({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex gap-4 p-4 ${
        message.sender === 'user' ? 'bg-white/5' : ''
      }`}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-cyan-500 to-pink-500">
        {message.sender === 'user' ? (
          <User size={20} />
        ) : (
          <Sparkles size={20} />
        )}
      </div>
      <div className="flex-1">
        {editingMessageId === message.id ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-white/5 rounded p-2 text-white"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveEdit(message.id)}
                className="px-3 py-1 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30"
              >
                Save
              </button>
              <button
                onClick={() => setEditingMessageId(null)}
                className="px-3 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
              className="prose prose-invert max-w-none"
            >
              {message.content}
            </ReactMarkdown>
            {message.file && (
              <div className="mt-2">
                <img
                  src={message.file.url}
                  alt="Uploaded content"
                  className="max-w-sm rounded-lg"
                />
              </div>
            )}
          </>
        )}
        <div className="flex gap-2 mt-2 text-white/60">
          <button
            onClick={() => handleCopyMessage(message.content)}
            className="p-1 hover:text-white transition-colors"
          >
            {copiedMessageId === message.content ? (
              <Check size={16} />
            ) : (
              <Copy size={16} />
            )}
          </button>
          {message.sender === 'user' && (
            <>
              <button
                onClick={() => handleEditMessage(message)}
                className="p-1 hover:text-white transition-colors"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => handleDeleteMessage(message.id)}
                className="p-1 hover:text-white transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

  const ConversationList = () => (
    <div className="flex-1 overflow-y-auto space-y-2">
      <AnimatePresence>
        {conversations.map((conv) => (
          <motion.button
            key={conv.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => {
              setCurrentConversation(conv);
              setMessages(conv.messages);
              setSidebarOpen(false);
            }}
            className={`w-full p-3 rounded-lg text-left truncate hover:bg-white/5 transition-colors ${
              currentConversation?.id === conv.id ? 'bg-white/10' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={16} />
              <span className="truncate">{conv.title}</span>
            </div>
            <div className="text-xs text-white/60 mt-1">
              {new Date(conv.timestamp).toLocaleDateString()}
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="h-screen flex bg-[#1a1a2e] text-white overflow-hidden">
      <MobileMenu />
      <MobileMenuButton />
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden absolute top-4 left-4 z-20 text-white/60 hover:text-white transition-colors"
      >
        <MenuIcon size={24} />
      </button>

      {/* Sidebar */}
      <div className="fixed lg:static h-full w-72 z-30">
        <div className="h-full bg-gradient-to-b from-[#1a1a2e]/95 to-[#1a1a2e]/98 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
              Grok Chat
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <button
            onClick={startNewChat}
            className="w-full p-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-pink-500/20 hover:from-cyan-500/30 hover:to-pink-500/30 transition-all duration-300 border border-white/10 hover:border-white/20 mb-4 flex items-center gap-2"
          >
            <Plus size={20} />
            New Chat
          </button>
          <ConversationList />
          <div className="border-t border-white/10 pt-4 space-y-2">
            <button
              onClick={downloadConversation}
              className="w-full p-3 rounded-lg hover:bg-white/5 transition-colors flexitems-center gap-2"
            >
              <Download size={20} />
              Export Chat
            </button>
            <button className="w-full p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2">
              <Settings size={20} />
              Settings
            </button>
            <button
              onClick={() => signOut(auth)}
              className="w-full p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 text-red-400"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
  

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Chat header */}
        <div className="border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold">
            {currentConversation?.title || 'New Chat'}
          </h2>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <MessageComponent key={message.id} message={message} />
            ))}
          </AnimatePresence>

          {/* Streaming message */}
          {streamingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 p-4"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-cyan-500 to-pink-500">
                <Sparkles size={20} />
              </div>
              <div className="flex-1">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={atomDark}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                  className="prose prose-invert max-w-none"
                >
                  {streamingMessage}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}

          {/* Loading indicator */}
          {isLoading && !streamingMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center p-4"
            >
              <Loader2 className="animate-spin" size={24} />
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 text-red-200"
            >
              <AlertCircle size={20} />
              <span>{error}</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-white/10 p-4">
          <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
            {/* File preview */}
            {previewUrl && (
              <div className="relative w-fit">
                <img
                  src={previewUrl}
                  alt="Upload preview"
                  className="max-h-32 rounded-lg"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full bg-white/5 rounded-lg p-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || (!inputMessage.trim() && !selectedFile)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
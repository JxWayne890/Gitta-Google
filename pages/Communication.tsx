
import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { StoreContext } from '../store';
import { 
    Search, Plus, MessageSquare, Users, MoreVertical, Send, 
    Paperclip, Smile, Phone, Video, X, ArrowLeft, ChevronLeft,
    Bot, Sparkles, Zap, ExternalLink, Check, CheckCheck, Image as ImageIcon,
    Mic, MapPin, Trash2
} from 'lucide-react';
import { formatDistanceToNow, format, isSameDay, isToday, isYesterday } from 'date-fns';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { UserRole, Chat, ChatMessage, InvoiceStatus, JobStatus, Client, Job, Quote, QuoteStatus, Invoice } from '../../types';
import { Link } from 'react-router-dom';

// --- UTILITY COMPONENTS ---

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none w-fit shadow-sm">
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
  </div>
);

const MessageStatusIcon = ({ isRead }: { isRead: boolean }) => {
  if (isRead) {
    return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
  }
  return <Check className="w-3.5 h-3.5 text-slate-400" />;
};

const DateSeparator = ({ date }: { date: Date }) => {
  let label = format(date, 'MMMM d, yyyy');
  if (isToday(date)) label = 'Today';
  if (isYesterday(date)) label = 'Yesterday';

  return (
    <div className="flex items-center justify-center my-6">
      <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
        {label}
      </div>
    </div>
  );
};

// --- RICH TEXT RENDERER ---
const RichMessage: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');

    const parseBold = (text: string) => {
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            parts.push(<strong key={match.index} className="font-bold">{match[1]}</strong>);
            lastIndex = boldRegex.lastIndex;
        }
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }
        return parts.length > 0 ? parts : text;
    };

    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                if (!line.trim()) return <br key={i} />;

                const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                const parts = [];
                let lastIndex = 0;
                let match;

                while ((match = linkRegex.exec(line)) !== null) {
                    if (match.index > lastIndex) {
                        parts.push(parseBold(line.substring(lastIndex, match.index)));
                    }
                    parts.push(
                        <Link 
                            key={`${i}-${match.index}`} 
                            to={match[2]} 
                            className="text-indigo-200 underline font-bold inline-flex items-center gap-0.5 hover:text-white"
                        >
                            {match[1]} <ExternalLink className="w-3 h-3" />
                        </Link>
                    );
                    lastIndex = linkRegex.lastIndex;
                }
                if (lastIndex < line.length) {
                    parts.push(parseBold(line.substring(lastIndex)));
                }

                return <p key={i} className="leading-relaxed">{parts}</p>;
            })}
        </div>
    );
};

export const Communication: React.FC = () => {
  const store = useContext(StoreContext);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Create Group State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [store?.messages.length, selectedChatId, isAiTyping]);

  if (!store) return null;

  const { 
      chats, messages, users, currentUser, sendMessage, createChat, deleteChat,
      jobs, clients, addJob, addClient, assignJob,
      inventoryProducts, inventoryRecords, addQuote, createInvoice,
      cancelJob, quotes, invoices
  } = store;

  const AI_CHAT_ID = 'ai-assistant-chat';
  const isAISelected = selectedChatId === AI_CHAT_ID;

  // --- QUICK ACTIONS ---
  const QUICK_REPLIES = [
      "On my way! 🚗",
      "I've arrived at the site. 📍",
      "Job completed. ✅",
      "Running 10 mins late. ⏰",
      "Can we reschedule?"
  ];

  const handleQuickReply = (text: string) => {
      if (!selectedChatId) return;
      sendMessage(selectedChatId, text);
      if (isAISelected) runAgenticWorkflow(text);
  };

  // --- AGENTIC AI ENGINE ---
  const runAgenticWorkflow = async (input: string) => {
      setIsAiTyping(true);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate typing delay

      const lowerInput = input.toLowerCase();
      let responseParts: string[] = [];
      let handled = false;

      const reply = (lines: string[]) => {
          store.sendMessage(AI_CHAT_ID, lines.join('\n'), 'ai-bot');
          handled = true;
      };

      // 1. Revenue
      if (!handled && lowerInput.match(/(?:projected|weekly|week|this week)\s+revenue/i)) {
          const total = jobs.reduce((sum, job) => sum + job.items.reduce((s, i) => s + i.total, 0), 0);
          responseParts.push(`💰 **Weekly Revenue Projection**`);
          responseParts.push(`Based on active jobs, projected revenue is **$${total.toLocaleString()}**.`);
          reply(responseParts);
      }
      // 2. Default
      else {
          responseParts.push("I can help you run your business. Try asking about **Revenue**, **Schedules**, or **Inventory**.");
          reply(responseParts);
      }

      setIsAiTyping(false);
  };

  // --- DATA PREP (DERIVED) ---
  const chatsWithData = useMemo(() => {
      return chats.map(chat => {
          // 1. Get messages for this chat
          const chatMessages = messages.filter(m => m.chatId === chat.id);
          
          // 2. Sort to get the last message
          const sortedMessages = [...chatMessages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          let lastMessage = sortedMessages[0];

          // 3. Fallback: If no messages in store, use the 'lastMessage' property from the chat object (for mock data)
          if (!lastMessage && chat.lastMessage) {
              lastMessage = chat.lastMessage;
          }

          // 4. Calculate unread count (Messages NOT sent by me AND NOT read by me)
          const unreadCount = chatMessages.filter(m => 
              m.senderId !== currentUser.id && 
              !m.readBy.includes(currentUser.id)
          ).length;

          return { ...chat, lastMessage, derivedUnreadCount: unreadCount };
      });
  }, [chats, messages, currentUser.id]);

  const sortedChats = [...chatsWithData].sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return timeB - timeA;
  });

  const regularChats = sortedChats.filter(c => c.id !== AI_CHAT_ID);
  
  const activeChat = isAISelected 
    ? { id: AI_CHAT_ID, type: 'DIRECT', participantIds: ['ai-bot'] } 
    : chats.find(c => c.id === selectedChatId);
    
  const activeMessages = messages
    .filter(m => m.chatId === (isAISelected ? AI_CHAT_ID : selectedChatId))
    .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const getChatDetails = (chat: any) => {
      if (chat.id === AI_CHAT_ID) return { name: 'Gemini Assistant', avatar: null, isOnline: true, isBot: true, role: 'AI Agent' };
      if (chat.type === 'GROUP') return { name: chat.name, avatar: null, isOnline: false, role: 'Group' };
      const otherUserId = chat.participantIds.find((id: string) => id !== currentUser.id);
      const otherUser = users.find(u => u.id === otherUserId);
      return { 
          name: otherUser?.name || 'Unknown User', 
          avatar: otherUser?.avatarUrl, 
          isOnline: true, 
          role: otherUser?.role || 'User'
      };
  };

  const activeChatDetails = activeChat ? getChatDetails(activeChat) : null;

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageInput.trim() || !selectedChatId) return;
      
      const input = messageInput;
      sendMessage(selectedChatId, input);
      setMessageInput('');
      
      if (isAISelected) {
          runAgenticWorkflow(input);
      }
  };

  const handleCreateGroup = () => {
      if (!groupName || selectedMembers.length === 0) return;
      createChat(selectedMembers, groupName);
      setIsGroupModalOpen(false);
      setGroupName('');
      setSelectedMembers([]);
  };

  const toggleMemberSelection = (userId: string) => {
      if (selectedMembers.includes(userId)) {
          setSelectedMembers(selectedMembers.filter(id => id !== userId));
      } else {
          setSelectedMembers([...selectedMembers, userId]);
      }
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
          deleteChat(chatId);
          if (selectedChatId === chatId) {
              setSelectedChatId(null);
          }
      }
  };

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-100px)] flex flex-col md:flex-row bg-white dark:bg-slate-900 md:rounded-2xl md:border border-slate-200 dark:border-slate-800 md:shadow-xl overflow-hidden -mx-4 md:mx-0 mt-[-1rem] md:mt-0 relative">
        
        {/* LEFT COLUMN: Sidebar */}
        <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 md:border-r border-slate-200 dark:border-slate-800 flex-col bg-slate-50 dark:bg-slate-900 h-full z-20`}>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Inbox</h2>
                    {currentUser.role === UserRole.ADMIN && (
                        <button 
                            onClick={() => setIsGroupModalOpen(true)} 
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                            title="New Message"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search messages..." 
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                
                {/* AI Pinned Chat */}
                <div 
                    onClick={() => setSelectedChatId(AI_CHAT_ID)}
                    className={`px-4 py-4 cursor-pointer transition-all border-b border-slate-100 dark:border-slate-800 relative group
                        ${isAISelected ? 'bg-indigo-50/60 dark:bg-indigo-900/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    {isAISelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <h3 className="font-bold text-slate-900 dark:text-white">Gemini AI</h3>
                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full uppercase">Bot</span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-amber-400 fill-current" />
                                Ready to assist
                            </p>
                        </div>
                    </div>
                </div>

                {/* Regular Chat List */}
                {regularChats.map(chat => {
                    const details = getChatDetails(chat);
                    const isSelected = selectedChatId === chat.id;
                    const hasUnread = chat.derivedUnreadCount > 0;
                    
                    return (
                        <div 
                            key={chat.id}
                            onClick={() => setSelectedChatId(chat.id)}
                            className={`px-4 py-4 cursor-pointer transition-all border-b border-slate-100 dark:border-slate-800 relative group
                                ${isSelected ? 'bg-white dark:bg-slate-800 shadow-sm z-10 border-l-4 border-l-emerald-500 pl-3' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                    {details.avatar ? (
                                        <img src={details.avatar} className="w-12 h-12 rounded-full object-cover border border-slate-100 dark:border-slate-700" alt="" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg">
                                            {details.name[0]}
                                        </div>
                                    )}
                                    {details.isOnline && chat.type === 'DIRECT' && (
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`font-bold truncate text-sm ${hasUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>{details.name}</h3>
                                        <div className="flex items-center gap-2">
                                            {chat.lastMessage && (
                                                <span className={`text-[10px] ${hasUnread ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                                                    {formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: false })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-sm truncate max-w-[150px] ${hasUnread ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {chat.lastMessage ? (
                                                <>
                                                    {chat.lastMessage.senderId === currentUser.id && <span className="text-slate-400 mr-1 font-normal">You:</span>}
                                                    {chat.lastMessage.content}
                                                </>
                                            ) : (
                                                <span className="italic text-slate-400 dark:text-slate-500">No messages yet</span>
                                            )}
                                        </p>
                                        
                                        <div className="flex items-center gap-2">
                                            {hasUnread && (
                                                <span className="min-w-[1.25rem] h-5 px-1 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full shadow-sm animate-pulse">
                                                    {chat.derivedUnreadCount}
                                                </span>
                                            )}
                                            {/* DELETE BUTTON */}
                                            <button
                                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Chat"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* RIGHT COLUMN: Chat Area */}
        <div className={`${selectedChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white dark:bg-slate-900 relative`}>
            {selectedChatId ? (
                <>
                    {/* Chat Header */}
                    <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setSelectedChatId(null)}
                                className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            
                            <div className="relative">
                                {isAISelected ? (
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                ) : activeChatDetails?.avatar ? (
                                    <img src={activeChatDetails.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-100" alt="" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                        {activeChatDetails?.name[0]}
                                    </div>
                                )}
                                {activeChatDetails?.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>}
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                                    {activeChatDetails?.name}
                                    {isAISelected && <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isAISelected 
                                        ? (isAiTyping ? 'Thinking...' : 'Automated Agent') 
                                        : activeChatDetails?.role}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-slate-400">
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><Phone className="w-5 h-5" /></button>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><Video className="w-5 h-5" /></button>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#fafafa] dark:bg-[#0f172a] scroll-smooth">
                        <div className="max-w-3xl mx-auto space-y-6">
                            
                            {/* Empty State for AI */}
                            {isAISelected && activeMessages.length === 0 && (
                                <div className="text-center py-10 opacity-75">
                                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
                                        <Sparkles className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gemini Assistant</h3>
                                    <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">Ask about your schedule, revenue, or inventory.</p>
                                </div>
                            )}

                            {activeMessages.map((msg, idx) => {
                                const isMe = msg.senderId === currentUser.id;
                                const isAi = msg.senderId === 'ai-bot';
                                const prevMsg = activeMessages[idx - 1];
                                const showDate = !prevMsg || !isSameDay(new Date(prevMsg.timestamp), new Date(msg.timestamp));
                                const isSequence = prevMsg && prevMsg.senderId === msg.senderId && !showDate;

                                return (
                                    <div key={msg.id}>
                                        {showDate && <DateSeparator date={new Date(msg.timestamp)} />}
                                        
                                        <div className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'} ${isSequence ? 'mt-1' : 'mt-4'}`}>
                                            {!isMe && !isSequence && (
                                                <div className="w-8 flex-col justify-end hidden sm:flex">
                                                    {isAi ? (
                                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm"><Bot className="w-4 h-4" /></div>
                                                    ) : activeChatDetails?.avatar ? (
                                                        <img src={activeChatDetails.avatar} className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">{activeChatDetails?.name[0]}</div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div className={`max-w-[85%] sm:max-w-[70%] group relative ${!isMe && isSequence ? 'sm:ml-11' : ''}`}>
                                                <div 
                                                    className={`px-4 py-2.5 shadow-sm text-sm relative leading-relaxed
                                                        ${isMe 
                                                            ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-sm' 
                                                            : isAi
                                                                ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white border border-slate-700/50 rounded-2xl rounded-tl-sm'
                                                                : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm'
                                                        }`}
                                                >
                                                    {isAi ? <RichMessage content={msg.content} /> : msg.content}
                                                </div>
                                                
                                                {/* Meta Data (Time + Read Receipt) */}
                                                <div className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <span>{format(new Date(msg.timestamp), 'h:mm a')}</span>
                                                    {isMe && <MessageStatusIcon isRead={msg.readBy.length > 1} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Typing Indicator */}
                            {isAiTyping && (
                                <div className="flex gap-3 mt-4">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0"><Bot className="w-4 h-4" /></div>
                                    <TypingIndicator />
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                        {/* Quick Actions */}
                        {!isAISelected && (
                            <div className="flex gap-2 overflow-x-auto pb-3 mb-1 hide-scrollbar">
                                {QUICK_REPLIES.map((reply, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleQuickReply(reply)}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors whitespace-nowrap border border-slate-200 dark:border-slate-700"
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                            <div className="flex gap-1 pb-2">
                                <button type="button" className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><Plus className="w-5 h-5" /></button>
                                <button type="button" className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ImageIcon className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center px-4 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white dark:focus-within:bg-slate-900 border border-transparent focus-within:border-emerald-500 transition-all">
                                <input 
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={isAISelected ? "Ask Gemini to check schedule..." : "Type a message..."}
                                    className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                />
                                <button type="button" className="ml-2 text-slate-400 hover:text-slate-600"><Smile className="w-5 h-5" /></button>
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={!messageInput.trim()}
                                className={`p-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none ${isAISelected ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'} text-white`}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </>
            ) : (
                // Empty State
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900">
                    <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6">
                        <MessageSquare className="w-10 h-10 opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Select a Conversation</h3>
                    <p className="text-sm max-w-xs text-center text-slate-500">
                        Choose a contact from the left to start messaging or use the <strong>Gemini Assistant</strong> for automated help.
                    </p>
                </div>
            )}
        </div>

        {/* Group Modal */}
        <Modal
            isOpen={isGroupModalOpen}
            onClose={() => setIsGroupModalOpen(false)}
            title="Create New Group"
            footer={
                <>
                    <Button variant="ghost" onClick={() => setIsGroupModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateGroup} disabled={!groupName || selectedMembers.length === 0}>Create Group</Button>
                </>
            }
        >
            <div className="space-y-4 p-2">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Group Name</label>
                    <input 
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g. Management Team"
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Select Members</label>
                    <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 custom-scrollbar">
                        {users.filter(u => u.id !== currentUser.id).map(user => (
                            <div 
                                key={user.id} 
                                onClick={() => toggleMemberSelection(user.id)}
                                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedMembers.includes(user.id) ? 'bg-emerald-50' : ''}`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedMembers.includes(user.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                                    {selectedMembers.includes(user.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <img src={user.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt="" />
                                <span className="font-medium text-slate-700 text-sm">{user.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    </div>
  );
};

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  MessageSquare,
  Send,
  Sparkles,
  Search,
  Wand2,
  RefreshCw,
  Inbox,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface ConversationItem {
  id: string;
  title: string;
  isGroup: boolean;
  otherUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
    headline?: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  updatedAt: string;
}

interface MessageItem {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: string;
  };
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messagesList, setMessagesList] = useState<MessageItem[]>([]);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAiImprover, setShowAiImprover] = useState(false);
  const [improving, setImproving] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages/conversations');
      const json = await res.json();
      if (json.success && json.data) {
        const convs = json.data.conversations || [];
        setConversations(convs);
        if (convs.length > 0 && !activeConvId) {
          setActiveConvId(convs[0].id);
        }
      }
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/conversations/${convId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setMessagesList(json.data.messages || []);
      } else {
        toast.error(json.error?.message || 'Failed to load messages');
      }
    } catch {
      toast.error('Error fetching messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesList]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeConvId || sending) return;

    setSending(true);
    const textToSend = messageText.trim();
    try {
      const res = await fetch(`/api/messages/conversations/${activeConvId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textToSend }),
      });
      const json = await res.json();
      if (json.success && json.data?.message) {
        setMessagesList((prev) => [...prev, json.data.message]);
        setMessageText('');
        fetchConversations();
      } else {
        toast.error(json.error?.message || 'Failed to send message');
      }
    } catch {
      toast.error('Network error sending message');
    } finally {
      setSending(false);
    }
  };

  const handleAiPolish = async (tone: 'professional' | 'friendly' | 'concise' | 'persuasive') => {
    if (!messageText.trim()) {
      toast.error('Type a draft message first');
      return;
    }

    setImproving(true);
    try {
      const res = await fetch('/api/ai/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, tone }),
      });
      const json = await res.json();
      if (json.success && json.data?.improved) {
        setMessageText(json.data.improved);
        setShowAiImprover(false);
        toast.success(`Message polished with ${tone} tone!`);
      } else {
        toast.error('AI message enhancement failed');
      }
    } catch {
      toast.error('AI message enhancement failed');
    } finally {
      setImproving(false);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true;
    const name = c.otherUser?.name || c.title;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <Card className="bg-white border-slate-200/90 rounded-3xl shadow-sm overflow-hidden h-[720px] flex flex-col md:flex-row">
          {/* Conversation List */}
          <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" /> Messages
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchConversations}
                  className="h-7 w-7 p-0"
                  title="Refresh Conversations"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingConversations ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 rounded-lg bg-white border border-slate-200 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>

              <div className="space-y-1.5 pt-2 overflow-y-auto max-h-[520px]">
                {loadingConversations ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading conversations...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <Inbox className="h-6 w-6 mx-auto mb-1 text-slate-300" />
                    No active conversations.
                  </div>
                ) : (
                  filteredConversations.map((c) => {
                    const isSelected = activeConvId === c.id;
                    const displayName = c.otherUser?.name || c.title;
                    const displayRole = c.otherUser?.role || 'MEMBER';
                    return (
                      <div
                        key={c.id}
                        onClick={() => setActiveConvId(c.id)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-white border border-emerald-300 shadow-sm'
                            : 'hover:bg-white/80'
                        }`}
                      >
                        <Avatar src={c.otherUser?.avatarUrl} fallback={displayName} size="md" />
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{displayName}</h4>
                            <span className="text-[10px] text-slate-400">
                              {c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 my-0.5">
                            {displayRole}
                          </Badge>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {c.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 text-center">
              Direct Platform Messaging
            </div>
          </div>

          {/* Active Chat Window */}
          <div className="flex-1 flex flex-col justify-between bg-white">
            {activeConv ? (
              <>
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={activeConv.otherUser?.avatarUrl}
                      fallback={activeConv.otherUser?.name || activeConv.title}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {activeConv.otherUser?.name || activeConv.title}
                        </h3>
                        {activeConv.otherUser?.role && (
                          <Badge variant="outline" className="text-[10px] bg-slate-100">
                            {activeConv.otherUser.role}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {activeConv.otherUser?.headline || activeConv.otherUser?.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fetchMessages(activeConv.id)}
                    className="h-8 w-8 p-0"
                    title="Refresh Messages"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingMessages ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {loadingMessages ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading messages...
                    </div>
                  ) : messagesList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Send the first message to start this discussion.
                    </div>
                  ) : (
                    messagesList.map((m) => {
                      const isMe = m.senderId === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed shadow-sm ${
                              isMe
                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                : 'bg-slate-100 border border-slate-200/80 text-slate-800 rounded-tl-none'
                            }`}
                          >
                            <p>{m.content}</p>
                            <p
                              className={`text-[9px] text-right mt-1 ${
                                isMe ? 'text-emerald-100' : 'text-slate-500'
                              }`}
                            >
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* AI Tone Improver */}
                {showAiImprover && (
                  <div className="p-3 bg-emerald-50 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Polish tone with AI:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(['professional', 'friendly', 'concise', 'persuasive'] as const).map(
                        (tone) => (
                          <button
                            key={tone}
                            disabled={improving}
                            onClick={() => handleAiPolish(tone)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-[11px] text-slate-700 capitalize font-medium shadow-sm cursor-pointer"
                          >
                            {tone}
                          </button>
                        )
                      )}
                      <button
                        onClick={() => setShowAiImprover(false)}
                        className="text-slate-400 hover:text-slate-600 ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Input Toolbar */}
                <div className="p-3 bg-white border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAiImprover(!showAiImprover)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        showAiImprover
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 border border-slate-200 text-emerald-700 hover:bg-slate-200'
                      }`}
                      title="Improve Message with AI"
                    >
                      <Wand2 className="h-4 w-4" />
                    </button>

                    <input
                      type="text"
                      placeholder="Type a message or click wand to polish with AI..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                    />

                    <Button
                      size="sm"
                      variant="default"
                      disabled={sending || !messageText.trim()}
                      onClick={handleSendMessage}
                      className="gap-1 px-4 shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" /> Send
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-base font-semibold text-slate-700">No Conversation Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Select a conversation from the left or connect with a mentor or employer to begin.
                </p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

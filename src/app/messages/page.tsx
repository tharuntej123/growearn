'use client';

import React, { useState } from 'react';
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
  CheckCheck,
  Wand2,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';

interface ConversationItem {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations] = useState<ConversationItem[]>([
    {
      id: 'c-1',
      name: 'Dr. Marcus Vance',
      role: 'MENTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      lastMessage: 'Looking forward to our Spring Security architecture session tomorrow at 7 PM IST.',
      time: '10:45 AM',
      unread: 1,
    },
    {
      id: 'c-2',
      name: 'Nexus Dynamics Hiring Team',
      role: 'EMPLOYER',
      avatarUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
      lastMessage: 'We reviewed your AI-generated proposal for the Next.js role and would like to schedule an interview.',
      time: 'Yesterday',
      unread: 0,
    },
  ]);

  const [activeConv, setActiveConv] = useState<ConversationItem>(conversations[0]);
  const [messageText, setMessageText] = useState('');
  const [messagesList, setMessagesList] = useState([
    {
      id: 'm-1',
      sender: 'them',
      text: 'Hi Alex! I reviewed your project repository for Spring Boot microservices. Great foundation with the JPA mappings.',
      time: '10:30 AM',
    },
    {
      id: 'm-2',
      sender: 'them',
      text: 'Looking forward to our Spring Security architecture session tomorrow at 7 PM IST.',
      time: '10:45 AM',
    },
  ]);

  const [showAiImprover, setShowAiImprover] = useState(false);
  const [improving, setImproving] = useState(false);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      sender: 'me',
      text: messageText.trim(),
      time: 'Just now',
    };
    setMessagesList((prev) => [...prev, newMsg]);
    setMessageText('');
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
      if (json.success && json.data) {
        setMessageText(json.data.improved);
        setShowAiImprover(false);
        toast.success(`Message polished with ${tone} tone!`);
      }
    } catch {
      toast.error('AI message enhancement failed');
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <Card className="bg-white border-slate-200/90 rounded-3xl shadow-sm overflow-hidden h-[700px] flex flex-col md:flex-row">
          <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">Direct Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full h-8 rounded-lg bg-white border border-slate-200 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>

              <div className="space-y-1.5 pt-2">
                {conversations.map((c) => {
                  const isSelected = activeConv?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveConv(c)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-white border border-emerald-300 shadow-sm'
                          : 'hover:bg-white/80'
                      }`}
                    >
                      <Avatar src={c.avatarUrl} fallback={c.name} size="md" />
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{c.name}</h4>
                          <span className="text-[10px] text-slate-400">{c.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.lastMessage}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 text-center">
              🔒 End-to-end encrypted career communication
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between bg-white">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={activeConv?.avatarUrl} fallback={activeConv?.name} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{activeConv?.name}</h3>
                    <Badge variant="outline" className="text-[10px] bg-slate-100">{activeConv?.role}</Badge>
                  </div>
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Online
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messagesList.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed shadow-sm ${
                      m.sender === 'me'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-100 border border-slate-200/80 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <p>{m.text}</p>
                    <p className={`text-[9px] text-right mt-1 ${m.sender === 'me' ? 'text-emerald-100' : 'text-slate-500'}`}>{m.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {showAiImprover && (
              <div className="p-3 bg-emerald-50 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Polish tone with AI:
                </span>
                <div className="flex items-center gap-1.5">
                  {(['professional', 'friendly', 'concise', 'persuasive'] as const).map((tone) => (
                    <button
                      key={tone}
                      disabled={improving}
                      onClick={() => handleAiPolish(tone)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-[11px] text-slate-700 capitalize font-medium shadow-sm"
                    >
                      {tone}
                    </button>
                  ))}
                  <button onClick={() => setShowAiImprover(false)} className="text-slate-400 hover:text-slate-600 ml-1">✕</button>
                </div>
              </div>
            )}

            <div className="p-3 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiImprover(!showAiImprover)}
                  className={`p-2 rounded-xl transition-colors ${
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
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                />

                <Button size="sm" variant="default" onClick={handleSendMessage} className="gap-1 px-4 shadow-sm">
                  <Send className="h-3.5 w-3.5" /> Send
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

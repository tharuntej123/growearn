'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Sparkles,
  Send,
  BrainCircuit,
  MessageSquare,
  Bot,
  User as UserIcon,
  CheckCircle2,
  Copy,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  actions?: string[];
  intent?: string;
}

function parseInline(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return tokens.map((tok, i) => {
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px]"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    return tok;
  });
}

function FormattedMessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-slate-800">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          let lang = '';
          let code = '';
          if (
            ['text', 'java', 'sql', 'typescript', 'javascript', 'python', 'bash', 'json'].includes(
              lines[0].trim().toLowerCase()
            )
          ) {
            lang = lines[0].trim();
            code = lines.slice(1).join('\n');
          } else {
            code = lines.join('\n');
          }

          return (
            <div
              key={index}
              className="my-2.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-sm"
            >
              {lang && (
                <div className="px-3 py-1 bg-slate-900 text-[10px] uppercase font-mono text-emerald-400 font-semibold border-b border-slate-800 flex items-center justify-between">
                  <span>{lang}</span>
                </div>
              )}
              <pre className="p-3.5 font-mono text-xs overflow-x-auto text-emerald-300 leading-normal">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lineIdx} className="h-1" />;

              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lineIdx} className="text-sm sm:text-base font-bold text-slate-900 mt-3 mb-1">
                    {parseInline(trimmed.slice(4))}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3
                    key={lineIdx}
                    className="text-base sm:text-lg font-bold text-slate-950 mt-4 mb-1 border-b border-slate-200 pb-1"
                  >
                    {parseInline(trimmed.slice(3))}
                  </h3>
                );
              }
              if (trimmed === '---') {
                return <hr key={lineIdx} className="my-3 border-slate-200" />;
              }
              if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span className="flex-1">{parseInline(trimmed.slice(2))}</span>
                  </div>
                );
              }

              return (
                <p key={lineIdx} className="leading-relaxed">
                  {parseInline(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'career_chat' | 'message_improver'>('career_chat');

  const userFirstName = user?.name ? user.name.split(' ')[0] : 'there';

  // Career Chat State: Clean initial state with NO unprompted suggestions
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: `Hello ${userFirstName}! I am your Groearn AI Career Assistant. How can I help you today? You can ask me technical questions (like "What is a REST API?"), request structured career roadmaps (like "Give me a roadmap for Backend Developer"), or analyze your skills.`,
      actions: [],
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Message Improver State
  const [rawMessage, setRawMessage] = useState('hi can u tell me about this job and how much u pay');
  const [improvedResult, setImprovedResult] = useState<any>(null);
  const [selectedTone, setSelectedTone] = useState<
    'professional' | 'friendly' | 'concise' | 'persuasive' | 'grammar_fix'
  >('professional');
  const [isImproving, setIsImproving] = useState(false);

  const handleSendMessage = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: json.data.response,
          actions: json.data.recommendedActions || [],
          intent: json.data.intent,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorText = json.error?.message || 'AI Assistant could not process your query.';
        const aiErrorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `⚠️ ${errorText} Please try asking again or rephrase your question.`,
          actions: [],
        };
        setMessages((prev) => [...prev, aiErrorMsg]);
        toast.error(errorText);
      }
    } catch {
      toast.error('AI Assistant response error');
    } finally {
      setIsSending(false);
    }
  };

  const handleImproveMessage = async () => {
    if (!rawMessage.trim()) return;
    setIsImproving(true);
    try {
      const res = await fetch('/api/ai/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: rawMessage, tone: selectedTone }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setImprovedResult(json.data);
        toast.success('Message enhanced with AI!');
      } else {
        toast.error(json.error?.message || 'Message improvement failed');
      }
    } catch {
      toast.error('Message improvement failed');
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-emerald-600 animate-pulse" />
              <h1 className="text-2xl sm:3xl font-bold text-slate-900 tracking-tight">
                Groearn AI Assistant
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Grounded in your actual profile competencies, database jobs/courses, and technical software engineering knowledge.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-white border border-slate-200 p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('career_chat')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'career_chat'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grounded Chat
            </button>
            <button
              onClick={() => setActiveTab('message_improver')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'message_improver'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Message Polisher
            </button>
          </div>
        </div>

        {/* Tab 1: Career Advisor Chat */}
        {activeTab === 'career_chat' && (
          <Card className="bg-white border-slate-200/90 rounded-3xl p-5 shadow-sm flex flex-col h-[680px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${
                    m.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.sender === 'ai' && (
                    <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl max-w-2xl lg:max-w-3xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {m.sender === 'user' ? (
                      <div className="whitespace-pre-line leading-relaxed font-medium">{m.text}</div>
                    ) : (
                      <FormattedMessageContent content={m.text} />
                    )}

                    {/* Quick action buttons only if explicitly provided */}
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-1.5">
                        {m.actions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (act === 'Open Onboarding') {
                                window.location.href = '/onboarding';
                              } else {
                                handleSendMessage(act);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 text-[11px] text-emerald-800 font-medium transition-colors shadow-sm"
                          >
                            💡 {act}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {m.sender === 'user' && (
                    <Avatar src={user?.avatarUrl} fallback={user?.name || 'U'} size="sm" />
                  )}
                </div>
              ))}
            </div>

            {/* Input Form */}
            <div className="pt-4 border-t border-slate-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Ask a question or request a roadmap (e.g. 'Give me a roadmap for Backend Developer', 'What is a REST API?')..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  disabled={isSending}
                  className="bg-white"
                />
                <Button type="submit" variant="default" isLoading={isSending} className="shrink-0 gap-1.5 shadow-sm">
                  <Send className="h-4 w-4" /> Ask
                </Button>
              </form>
            </div>
          </Card>
        )}

        {/* Tab 2: Message Polisher */}
        {activeTab === 'message_improver' && (
          <Card className="bg-white border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-emerald-600" /> AI Message Improver & Tone Polisher
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Paste draft messages to clients, mentors, or applicants. Choose your desired tone and let AI polish your communication.
              </p>
            </div>

            <div className="space-y-4">
              {/* Tone Selection Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Select Target Tone:</label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { id: 'professional', label: '👔 Professional' },
                    { id: 'friendly', label: '😊 Friendly & Warm' },
                    { id: 'concise', label: '⚡ Concise & Direct' },
                    { id: 'persuasive', label: '🎯 Persuasive Value' },
                    { id: 'grammar_fix', label: '✍️ Grammar & Clarity' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTone(t.id as any)}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${
                        selectedTone === t.id
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Draft Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Draft Message:</label>
                <textarea
                  rows={4}
                  value={rawMessage}
                  onChange={(e) => setRawMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>

              <Button variant="default" onClick={handleImproveMessage} isLoading={isImproving} className="gap-2 shadow-sm">
                <Sparkles className="h-4 w-4" /> Enhance Message with AI
              </Button>

              {/* Result Preview */}
              {improvedResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      ✨ AI Polished Result ({improvedResult.tone}):
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(improvedResult.improved);
                        toast.success('Copied to clipboard');
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-semibold"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                  </div>

                  <p className="text-sm text-slate-900 font-medium p-3 rounded-xl bg-white border border-emerald-200 leading-relaxed shadow-sm">
                    {improvedResult.improved}
                  </p>

                  <p className="text-[11px] text-slate-600 italic">
                    Reasoning: {improvedResult.explanation}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}


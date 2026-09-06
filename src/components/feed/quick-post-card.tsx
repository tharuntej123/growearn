'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Send, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface QuickPostCardProps {
  onPostCreated?: (post: any) => void;
  placeholder?: string;
}

export function QuickPostCard({ onPostCreated, placeholder }: QuickPostCardProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('GENERAL');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  if (!user) return null;

  const roleDisplay = user.role === 'EMPLOYER' ? 'Company' : user.role.charAt(0) + user.role.slice(1).toLowerCase();

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please write some content to share');
      return;
    }

    setIsPosting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          postType,
          mediaUrl: mediaUrl.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.post) {
        toast.success('Post published to Groearn community feed!');
        setContent('');
        setMediaUrl('');
        setShowMediaInput(false);
        if (onPostCreated) {
          onPostCreated(json.data.post);
        }
      } else {
        toast.error(json.error?.message || 'Failed to publish post');
      }
    } catch {
      toast.error('Network error. Could not publish post.');
    } finally {
      setIsPosting(false);
    }
  };

  const defaultPlaceholder =
    user.role === 'LEARNER' || (user.role as string) === 'STUDENT'
      ? 'Share what you are learning today, ask a technical question, or post a milestone...'
      : user.role === 'MENTOR'
      ? 'Share an architectural tip, mentorship availability, or technical insight...'
      : user.role === 'EMPLOYER' || (user.role as string) === 'COMPANY'
      ? 'Announce open job roles, company culture updates, or project opportunities...'
      : 'Share a contract win, technical case study, or open availability...';

  return (
    <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar src={user.avatarUrl} fallback={user.name} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{user.name}</span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold">
                {roleDisplay}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-xs">{user.headline || 'Community Member'}</p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400">
          <MessageSquare className="h-3.5 w-3.5" /> Community Post
        </span>
      </div>

      <form onSubmit={handleCreatePost} className="space-y-3">
        <textarea
          rows={3}
          placeholder={placeholder || defaultPlaceholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition-all"
        />

        {showMediaInput && (
          <input
            type="url"
            placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowMediaInput(!showMediaInput)}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-medium transition-colors ${
                showMediaInput ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add Image</span>
            </button>

            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="GENERAL">General Post</option>
              <option value="LEARNING">Learning Progress</option>
              <option value="PROJECT">Project Showcase</option>
              <option value="HIRING">Hiring / Opportunity</option>
            </select>
          </div>

          <Button
            type="submit"
            size="sm"
            variant="default"
            isLoading={isPosting}
            disabled={!content.trim()}
            className="gap-1.5 px-4 font-semibold shadow-xs"
          >
            <Send className="h-3.5 w-3.5" /> Post
          </Button>
        </div>
      </form>
    </Card>
  );
}

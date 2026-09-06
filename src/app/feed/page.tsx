'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Heart,
  MessageSquare,
  Share2,
  Sparkles,
  Send,
  PlusCircle,
  TrendingUp,
  Award,
  Briefcase,
  Layers,
  Filter,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface PostItem {
  id: string;
  content: string;
  postType: string;
  mediaUrl?: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    headline?: string | null;
    role: string;
  };
  likes: { userId: string }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    author: { name: string; avatarUrl?: string | null };
  }[];
  feedScore?: number;
}

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [activeTab, setActiveTab] = useState<'for_you' | 'following' | 'latest'>('for_you');
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New post state
  const [newContent, setNewContent] = useState('');
  const [postType, setPostType] = useState('GENERAL');
  const [isPosting, setIsPosting] = useState(false);

  // Active comment box
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts?tab=${activeTab}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPosts(json.data.posts || []);
        setIsPersonalized(json.data.isPersonalized || false);
      }
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsPosting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent, postType }),
      });
      const json = await res.json();
      if (json.success && json.data?.post) {
        setPosts([json.data.post, ...posts]);
        setNewContent('');
        toast.success('Post published to professional feed!');
      } else {
        toast.error(json.error?.message || 'Failed to post');
      }
    } catch {
      toast.error('Error posting update');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error('Please log in to like posts');
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setPosts(
          posts.map((p) => {
            if (p.id === postId) {
              const liked = json.data.liked;
              return {
                ...p,
                likesCount: liked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
                likes: liked ? [...p.likes, { userId: user.id }] : p.likes.filter((l) => l.userId !== user.id),
              };
            }
            return p;
          })
        );
      }
    } catch {
      toast.error('Action failed');
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim() || !user) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });
      const json = await res.json();
      if (json.success && json.data?.comment) {
        setPosts(
          posts.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                commentsCount: p.commentsCount + 1,
                comments: [json.data.comment, ...p.comments],
              };
            }
            return p;
          })
        );
        setCommentText('');
        setCommentingPostId(null);
        toast.success('Comment added');
      }
    } catch {
      toast.error('Failed to post comment');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAF9]">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Create Post Card */}
        <Card className="p-5 sm:p-6 bg-white border-slate-200/90 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <Avatar src={user?.avatarUrl} fallback={user?.name || 'User'} size="md" />
            <div className="flex-1 space-y-3">
              <textarea
                rows={3}
                placeholder="Share a career achievement, production architecture milestone, or hiring update..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    aria-label="Select post type"
                    className="bg-white border border-slate-200 text-xs text-slate-700 rounded-lg h-8 px-2.5 shadow-sm"
                  >
                    <option value="GENERAL">General Post</option>
                    <option value="ACHIEVEMENT">🏆 Milestone / Achievement</option>
                    <option value="PROJECT">🚀 Project Launch</option>
                    <option value="HIRING">💼 Job / Hiring Announcement</option>
                  </select>
                </div>

                <Button
                  size="sm"
                  variant="default"
                  onClick={handleCreatePost}
                  isLoading={isPosting}
                  disabled={!newContent.trim()}
                  className="gap-1.5 px-5 shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" /> Publish
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Tab Switcher: For You vs Following vs Latest */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'for_you', label: '✨ For You (AI-Personalized)' },
              { id: 'following', label: '👥 Following' },
              { id: 'latest', label: '🕒 Latest' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === t.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'for_you' && isPersonalized && (
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
              Ranked by your skills & target role
            </Badge>
          )}
        </div>

        {/* Posts Feed List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No posts available in this section. Be the first to publish an update!
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const isLiked = user && post.likes?.some((l) => l.userId === user.id);
              return (
                <Card
                  key={post.id}
                  className="p-5 sm:p-6 bg-white border-slate-200/90 rounded-3xl shadow-sm space-y-4"
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar src={post.author.avatarUrl} fallback={post.author.name} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{post.author.name}</h4>
                          <Badge variant="outline" className="text-[10px] bg-slate-50">{post.author.role}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{post.author.headline || 'Groearn Member'}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>

                    {post.postType !== 'GENERAL' && (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                        {post.postType}
                      </Badge>
                    )}
                  </div>

                  {/* Post Content */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        isLiked ? 'text-rose-600 font-bold' : 'hover:text-slate-900'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likesCount} Likes</span>
                    </button>

                    <button
                      onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}
                      className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.commentsCount} Comments</span>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Post link copied to clipboard');
                      }}
                      className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                    >
                      <Share2 className="h-4 w-4" /> Share
                    </button>
                  </div>

                  {/* Comments Section */}
                  {commentingPostId === post.id && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                        />
                        <Button size="sm" variant="default" onClick={() => handleComment(post.id)} className="shadow-sm">
                          Reply
                        </Button>
                      </div>

                      {/* Comments list */}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {post.comments?.map((c) => (
                          <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                            <span className="font-bold text-slate-900">{c.author.name}</span>
                            <p className="text-slate-600">{c.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

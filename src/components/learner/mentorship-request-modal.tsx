'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { MentorUI } from '@/types/ui';

interface MentorshipRequestModalProps {
  mentor: MentorUI | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  topic: string;
  setTopic: (t: string) => void;
  message: string;
  setMessage: (m: string) => void;
  preferredTime: string;
  setPreferredTime: (p: string) => void;
  isSubmitting: boolean;
}

export function MentorshipRequestModal({
  mentor,
  onClose,
  onSubmit,
  topic,
  setTopic,
  message,
  setMessage,
  preferredTime,
  setPreferredTime,
  isSubmitting,
}: MentorshipRequestModalProps) {
  if (!mentor) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Avatar src={mentor.avatarUrl} fallback={mentor.name} size="sm" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Request Mentorship</h3>
              <p className="text-xs text-slate-500">with {mentor.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mentorship Topic / Focus Area</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Architecture review of Spring Boot microservices"
              required
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Message & Learning Goals</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you want to achieve, questions you have, or code you want reviewed..."
              rows={4}
              required
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time / Availability (Optional)</label>
            <Input
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              placeholder="e.g. Weekdays 7 PM IST or Weekends"
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              {isSubmitting ? 'Sending...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


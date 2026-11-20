'use client';

import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, loading = false, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1 || loading}
          onClick={() => onPageChange(Math.max(1, page - 1))} className="h-8 px-3">
          Previous
        </Button>
        <Button size="sm" variant="outline" disabled={page >= totalPages || loading}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))} className="h-8 px-3">
          Next
        </Button>
      </div>
    </div>
  );
}

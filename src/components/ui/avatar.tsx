import * as React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({
  src,
  alt = 'Avatar',
  fallback = 'U',
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg font-semibold',
    xl: 'h-20 w-20 text-2xl font-bold',
  };

  const initials = fallback
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 text-slate-200 shadow-sm',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="80px"
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

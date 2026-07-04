'use client';

import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarVariant = 'circle' | 'rounded' | 'square';
type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

interface AvatarProps {
  /** Full name for initials fallback */
  name?: string;
  /** Image URL */
  src?: string;
  /** Size variant */
  size?: AvatarSize;
  /** Shape variant */
  variant?: AvatarVariant;
  /** Online presence status */
  status?: AvatarStatus;
  /** Notification badge count */
  badge?: number;
  /** Custom Tailwind classes */
  className?: string;
  /** Alt text for image */
  alt?: string;
  /** Click handler */
  onClick?: () => void;
}

interface AvatarGroupProps {
  avatars: Array<{ name?: string; src?: string }>;
  size?: AvatarSize;
  max?: number;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<AvatarSize, { container: string; text: string; statusDot: string; badge: string }> = {
  xs:  { container: 'h-6 w-6',   text: 'text-[10px]', statusDot: 'h-1.5 w-1.5', badge: 'text-[8px] min-w-[14px] h-3.5 -top-1 -right-1' },
  sm:  { container: 'h-8 w-8',   text: 'text-xs',     statusDot: 'h-2 w-2',     badge: 'text-[9px] min-w-[16px] h-4 -top-1 -right-1' },
  md:  { container: 'h-10 w-10', text: 'text-sm',     statusDot: 'h-2.5 w-2.5', badge: 'text-[10px] min-w-[18px] h-4.5 -top-1 -right-1' },
  lg:  { container: 'h-12 w-12', text: 'text-base',   statusDot: 'h-3 w-3',     badge: 'text-xs min-w-[20px] h-5 -top-1 -right-1' },
  xl:  { container: 'h-16 w-16', text: 'text-lg',     statusDot: 'h-3.5 w-3.5', badge: 'text-xs min-w-[22px] h-5 -top-0.5 -right-0.5' },
  '2xl': { container: 'h-20 w-20', text: 'text-xl',  statusDot: 'h-4 w-4',     badge: 'text-sm min-w-[24px] h-6 top-0 -right-1' },
};

const VARIANT_CLASSES: Record<AvatarVariant, string> = {
  circle:  'rounded-full',
  rounded: 'rounded-xl',
  square:  'rounded-none',
};

const STATUS_COLORS: Record<AvatarStatus, string> = {
  online:  'bg-[#10B981] ring-2 ring-[#0A1E3A]',
  away:    'bg-[#FFD700] ring-2 ring-[#0A1E3A]',
  busy:    'bg-[#E85A2A] ring-2 ring-[#0A1E3A]',
  offline: 'bg-slate-500 ring-2 ring-[#0A1E3A]',
};

/** Deterministic color from name initials */
const GRADIENT_PALETTES = [
  'from-[#1E68E5] to-[#00E5AB]',
  'from-[#FFD700] to-[#E85A2A]',
  'from-[#00E5AB] to-[#1E68E5]',
  'from-[#E85A2A] to-[#FFD700]',
  'from-[#10B981] to-[#1E68E5]',
  'from-[#FFD700] to-[#10B981]',
  'from-[#E85A2A] to-[#00E5AB]',
  'from-[#1E68E5] to-[#E85A2A]',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getGradient(name: string): string {
  const charCode = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return GRADIENT_PALETTES[charCode % GRADIENT_PALETTES.length];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

/**
 * Enterprise Avatar component with image, initials fallback, status dots, and badge.
 *
 * @example
 * <Avatar name="Akul Dravin" size="md" status="online" />
 * <Avatar src="/profile.jpg" name="Jane Doe" size="lg" badge={3} />
 */
export function Avatar({
  name = 'User',
  src,
  size = 'md',
  variant = 'circle',
  status,
  badge,
  className = '',
  alt,
  onClick,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = SIZE_CLASSES[size];
  const variantClass = VARIANT_CLASSES[variant];
  const showInitials = !src || imgError;
  const initials = getInitials(name);
  const gradient = getGradient(name);

  const Tag = onClick ? 'button' : 'div';
  const interactiveClass = onClick
    ? 'cursor-pointer hover:opacity-90 hover:scale-105 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#00E5AB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1E3A]'
    : '';

  return (
    <Tag
      className={['relative inline-flex shrink-0', sizeClass.container, className].join(' ')}
      onClick={onClick}
      aria-label={alt || name}
      {...(onClick ? { type: 'button' } : {})}
    >
      {/* Avatar image or initials */}
      <div
        className={[
          'flex h-full w-full items-center justify-center overflow-hidden select-none',
          variantClass,
          interactiveClass,
          showInitials
            ? `bg-gradient-to-br ${gradient}`
            : 'bg-white/10',
        ].join(' ')}
      >
        {showInitials ? (
          <span
            className={['font-black text-white tracking-tight', sizeClass.text].join(' ')}
            aria-hidden="true"
          >
            {initials}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt || name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Status indicator */}
      {status && (
        <span
          className={[
            'absolute bottom-0 right-0 block rounded-full',
            sizeClass.statusDot,
            STATUS_COLORS[status],
          ].join(' ')}
          aria-label={`Status: ${status}`}
          role="img"
        />
      )}

      {/* Notification badge */}
      {badge !== undefined && badge > 0 && (
        <span
          className={[
            'absolute flex items-center justify-center rounded-full bg-[#E85A2A] px-1 font-black text-white ring-2 ring-[#0A1E3A]',
            sizeClass.badge,
          ].join(' ')}
          aria-label={`${badge} notifications`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Tag>
  );
}

// ─── Avatar Group ─────────────────────────────────────────────────────────────

/**
 * Stacked avatar group for displaying multiple users.
 *
 * @example
 * <AvatarGroup avatars={[{ name: 'Alice' }, { name: 'Bob' }, { src: '/c.jpg', name: 'Carol' }]} max={3} />
 */
export function AvatarGroup({ avatars, size = 'md', max = 4, className = '' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={['flex items-center', className].join(' ')}
      role="group"
      aria-label={`${avatars.length} team members`}
    >
      {visible.map((avatar, i) => (
        <div
          key={i}
          className="-ml-2 first:ml-0 ring-2 ring-[#0A1E3A] rounded-full"
          style={{ zIndex: visible.length - i }}
        >
          <Avatar name={avatar.name} src={avatar.src} size={size} />
        </div>
      ))}

      {overflow > 0 && (
        <div
          className={[
            '-ml-2 flex items-center justify-center rounded-full bg-white/10 border border-white/20 ring-2 ring-[#0A1E3A] backdrop-blur-md',
            sizeClass.container,
          ].join(' ')}
          aria-label={`${overflow} more members`}
        >
          <span className={['font-bold text-slate-300', sizeClass.text].join(' ')}>
            +{overflow}
          </span>
        </div>
      )}
    </div>
  );
}

export default Avatar;

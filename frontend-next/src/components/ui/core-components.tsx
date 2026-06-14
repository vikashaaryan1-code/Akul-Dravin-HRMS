'use client';

import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PREMIUM BUTTON COMPONENT (CyberGlass 2.0)
 * Responsive gradient with glassmorphism, smooth transitions
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-500 to-magenta-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5',
    secondary: 'bg-slate-800 text-white border border-slate-600 hover:border-indigo-400 hover:bg-slate-700',
    ghost: 'text-cyan-400 border border-slate-600 hover:bg-slate-800 hover:border-cyan-400',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg hover:shadow-xl',
  };

  return (
    <button
      className={clsx(
        'btn rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * GLASS CARD COMPONENT
 * Layered glass effect with subtle hover animations
 */
export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'glass-card backdrop-blur-xl bg-slate-900/40 border border-slate-700/20 rounded-lg p-6 hover:border-indigo-500/30 transition-all',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

/**
 * STATUS BADGE COMPONENT
 * Semantic color coding with subtle background
 */
export function Badge({ variant = 'info', children, className }: BadgeProps) {
  const colors = {
    success: 'bg-emerald-950/40 text-emerald-300 border border-emerald-700/30',
    warning: 'bg-amber-950/40 text-amber-300 border border-amber-700/30',
    error: 'bg-rose-950/40 text-rose-300 border border-rose-700/30',
    info: 'bg-indigo-950/40 text-indigo-300 border border-indigo-700/30',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider',
        colors[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  className?: string;
}

/**
 * LOADING SPINNER COMPONENT
 * Animated gradient spinner for async operations
 */
export function LoadingSpinner({ size = 'md', variant = 'primary', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const colors = {
    primary: 'border-indigo-500/20 border-t-indigo-500',
    secondary: 'border-slate-600 border-t-cyan-400',
  };

  return (
    <div
      className={clsx('rounded-full animate-spin', sizes[size], colors[variant], className)}
    />
  );
}

/**
 * SKELETON LOADER COMPONENT
 * Placeholder for loading states
 */
export function SkeletonLoader({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gradient-to-r from-slate-800 to-slate-700/50 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}

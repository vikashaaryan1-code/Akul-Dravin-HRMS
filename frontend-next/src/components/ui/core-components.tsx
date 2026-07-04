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
 primary: 'bg-gradient-to-r from-[#00E5AB] to-[#1E68E5] text-[#051124] shadow-[0_4px_20px_rgba(0,229,171,0.3),inset_0_2px_10px_rgba(255,255,255,0.4)] hover:shadow-[0_8px_30px_rgba(30,104,229,0.5)] hover:-translate-y-0.5 border border-white/20',
 secondary: 'bg-[#051124]/80 text-white border border-[#1E68E5]/30 hover:border-[#00E5AB]/60 hover:bg-[#0A1E3A] shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
 ghost: 'text-[#00E5AB] border border-transparent hover:bg-white/5 hover:border-white/10',
 danger: 'bg-gradient-to-r from-red-600/80 to-rose-600/80 text-white shadow-[0_4px_14px_rgba(220,38,38,0.2)] hover:shadow-[0_8px_22px_rgba(225,29,72,0.4)] border border-red-500/30',
 };

 return (
 <button
 className={clsx(
 'btn rounded-lg font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed',
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
 'glass-card backdrop-blur-xl bg-[#051124]/80 border border-white/10 rounded-xl p-6 hover:border-[#00E5AB]/40 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] relative overflow-hidden',
 className,
 )}
 {...props}
 >
 <div className="absolute inset-0 bg-gradient-to-br from-[#1E68E5]/5 to-transparent pointer-events-none" />
 <div className="relative z-10">
   {children}
 </div>
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
 success: 'bg-[#00E5AB]/10 text-[#00E5AB] border border-[#00E5AB]/30 shadow-[0_0_10px_rgba(0,229,171,0.2)]',
 warning: 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 shadow-[0_0_10px_rgba(255,215,0,0.2)]',
 error: 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
 info: 'bg-[#1E68E5]/10 text-[#2B7AFF] border border-[#1E68E5]/30 shadow-[0_0_10px_rgba(30,104,229,0.2)]',
 };

 return (
 <span
 className={clsx(
 'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md',
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
 primary: 'border-[#1E68E5]/20 border-t-[#00E5AB]',
 secondary: 'border-white/10 border-t-[#1E68E5]',
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
 className="h-4 bg-gradient-to-r from-[#0A1E3A] to-[#11284A] rounded-lg animate-pulse border border-white/5"
 />
 ))}
 </div>
 );
}

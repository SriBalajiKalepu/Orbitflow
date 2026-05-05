import React, { useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, children, size = 'md', className
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative w-full glass rounded-2xl shadow-2xl',
              'border border-[hsl(var(--border))]',
              sizeClasses[size],
              className
            )}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
                <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── Input Component ──────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[hsl(var(--foreground))]">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))]',
              'px-3 py-2.5 text-sm text-[hsl(var(--foreground))]',
              'placeholder:text-[hsl(var(--muted-foreground))]',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent',
              'transition-all duration-200',
              icon && 'pl-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    return (
      <div className="space-y-1">
        {label && <label htmlFor={textareaId} className="text-sm font-medium text-[hsl(var(--foreground))]">{label}</label>}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))]',
            'px-3 py-2.5 text-sm text-[hsl(var(--foreground))] resize-none',
            'placeholder:text-[hsl(var(--muted-foreground))]',
            'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent',
            'transition-all duration-200',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    return (
      <div className="space-y-1">
        {label && <label htmlFor={selectId} className="text-sm font-medium text-[hsl(var(--foreground))]">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))]',
            'px-3 py-2.5 text-sm text-[hsl(var(--foreground))]',
            'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent',
            'transition-all duration-200 cursor-pointer',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md', isLoading, icon, className, disabled, ...props
}) => (
  <button
    className={cn(
      'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      {
        'gradient-primary text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]':
          variant === 'primary',
        'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--muted))]':
          variant === 'secondary',
        'hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]': variant === 'ghost',
        'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30': variant === 'danger',
        'border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]':
          variant === 'outline',
        'px-2.5 py-1.5 text-xs': size === 'xs',
        'px-3 py-2 text-sm': size === 'sm',
        'px-4 py-2.5 text-sm': size === 'md',
        'px-6 py-3 text-base': size === 'lg',
      },
      className
    )}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading ? (
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    ) : icon}
    {children}
  </button>
);

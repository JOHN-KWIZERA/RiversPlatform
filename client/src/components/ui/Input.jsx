import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(function Input({ label, error, hint, className, leftElement, rightElement, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#1a1a2e]">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {leftElement && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftElement}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'input-field',
            leftElement && 'pl-9',
            rightElement && 'pr-9',
            error && 'border-red-400 focus:ring-red-400',
            className
          )}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightElement}
          </span>
        )}
      </div>
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Input;

export const Select = forwardRef(function Select({ label, error, className, children, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#1a1a2e]">{label}{props.required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <select
        ref={ref}
        className={cn('input-field appearance-none cursor-pointer', error && 'border-red-400', className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, hint, className, rows = 4, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#1a1a2e]">{label}{props.required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <textarea
        ref={ref}
        rows={rows}
        className={cn('input-field resize-none', error && 'border-red-400', className)}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export default function Button({
  children,
  href,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
}: ButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-lg font-semibold transition-all duration-200';
  const primaryStyles = disabled
    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
    : 'bg-[var(--pink-accent)] text-white hover:bg-[var(--pink-accent-dark)]';
  const secondaryStyles = disabled
    ? 'bg-transparent border-2 border-gray-700 text-gray-400 cursor-not-allowed'
    : 'bg-transparent border-2 border-[var(--pink-accent)] text-[var(--pink-accent)] hover:bg-[var(--pink-accent)] hover:text-white';

  const styles = `${baseStyles} ${variant === 'primary' ? primaryStyles : secondaryStyles} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={styles} disabled={disabled}>
      {children}
    </button>
  );
}


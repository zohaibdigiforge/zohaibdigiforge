import React from 'react';

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  query,
  className = '',
  highlightClassName = 'font-black text-[#28B9FF] underline decoration-[#28B9FF]/50 bg-[#0D6EFD]/20 px-0.5 rounded',
}) => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || !text) {
    return <span className={className}>{text}</span>;
  }

  // Break query into terms for sub-matching
  const terms = trimmedQuery
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isMatch = terms.some((t) => t.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <span key={i} className={highlightClassName}>
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
};

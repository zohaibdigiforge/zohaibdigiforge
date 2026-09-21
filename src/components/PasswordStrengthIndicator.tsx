import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  if (!password) return null;

  // Evaluation criteria
  const hasMinLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  // Calculate score based on criteria
  let score = 0;
  if (password.length > 0) {
    if (hasMinLength) score += 1;
    if (hasUppercase && hasLowercase) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecialChar) score += 1;
    // Extra point for exceptional length
    if (password.length >= 10 && score >= 3) score += 1;
  }

  // Determine strength label, color, and description
  let strengthLabel = '';
  let romanUrduLabel = '';
  let colorClass = '';
  let bgClass = '';
  let barsCount = 0;

  switch (score) {
    case 0:
    case 1:
      strengthLabel = 'Very Weak';
      romanUrduLabel = 'Bohat Kamzoor';
      colorClass = 'text-rose-500';
      bgClass = 'bg-rose-500';
      barsCount = 1;
      break;
    case 2:
      strengthLabel = 'Weak';
      romanUrduLabel = 'Kamzoor';
      colorClass = 'text-amber-500';
      bgClass = 'bg-amber-500';
      barsCount = 2;
      break;
    case 3:
      strengthLabel = 'Fair';
      romanUrduLabel = 'Theek Hai';
      colorClass = 'text-yellow-500';
      bgClass = 'bg-yellow-500';
      barsCount = 3;
      break;
    case 4:
      strengthLabel = 'Good';
      romanUrduLabel = 'Achha Hai';
      colorClass = 'text-[#28B9FF]';
      bgClass = 'bg-[#28B9FF]';
      barsCount = 4;
      break;
    case 5:
    default:
      strengthLabel = 'Strong';
      romanUrduLabel = 'Bohot Mazboot';
      colorClass = 'text-emerald-500';
      bgClass = 'bg-emerald-500';
      barsCount = 5;
      break;
  }

  const requirements = [
    { label: 'Minimum 6 characters / Kam az kam 6 haroof', met: hasMinLength },
    { label: 'Capital & small letters / Baray aur chotay haroof', met: hasUppercase && hasLowercase },
    { label: 'Numbers (0-9) / Adaad', met: hasNumber },
    { label: 'Special character (e.g. @, #, $) / Khas nishan', met: hasSpecialChar },
  ];

  return (
    <div className="mt-2.5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 animate-in fade-in duration-200">
      {/* Strength Label Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {score >= 4 ? (
            <ShieldCheck className={`w-4 h-4 ${colorClass}`} />
          ) : (
            <ShieldAlert className={`w-4 h-4 ${colorClass}`} />
          )}
          <span className="text-xs font-bold text-slate-300">
            Strength / Mazbooti:
          </span>
        </div>
        <span className={`text-xs font-extrabold tracking-wide ${colorClass}`}>
          {strengthLabel} <span className="text-[10px] font-medium opacity-80">({romanUrduLabel})</span>
        </span>
      </div>

      {/* Strength Segments */}
      <div className="flex gap-1.5 mb-3.5">
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              index <= barsCount ? bgClass : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Requirement List */}
      <div className="space-y-1.5 border-t border-slate-800/60 pt-2.5">
        {requirements.map((req, idx) => (
          <div key={idx} className="flex items-start gap-2 text-[10px] leading-tight">
            <span className={`p-0.5 rounded-full shrink-0 mt-0.5 ${
              req.met ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}>
              {req.met ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : (
                <X className="w-3 h-3 stroke-[2.5]" />
              )}
            </span>
            <span className={`font-semibold ${req.met ? 'text-slate-300' : 'text-slate-500'}`}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

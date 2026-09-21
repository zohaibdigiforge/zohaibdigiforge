import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  Sparkles
} from 'lucide-react';
import { incrementProductShareInDb } from '../services/firestoreService';

interface SocialShareBarProps {
  title: string;
  shareUrl?: string;
  priceFormatted?: string;
  productId?: string;
  type?: 'product' | 'resource';
  compact?: boolean;
  variant?: 'standard' | 'compact' | 'sidebar' | 'banner';
  className?: string;
  onShareTrack?: (platform: string) => void;
}

export const SocialShareBar: React.FC<SocialShareBarProps> = ({
  title,
  shareUrl,
  priceFormatted,
  productId,
  type = 'product',
  compact = false,
  variant,
  className = '',
  onShareTrack
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const activeVariant = variant || (compact ? 'compact' : 'standard');

  // Compute absolute URL
  const targetUrl = React.useMemo(() => {
    if (shareUrl) {
      if (shareUrl.startsWith('http://') || shareUrl.startsWith('https://')) {
        return shareUrl;
      }
      return `${window.location.origin}${shareUrl.startsWith('/') ? '' : '/'}${shareUrl}`;
    }
    const origin = window.location.origin;
    if (productId) {
      return `${origin}/?product=${encodeURIComponent(productId)}`;
    }
    return window.location.href;
  }, [shareUrl, title, productId, type]);

  // Construct message text
  const rawShareText = priceFormatted
    ? `Check out "${title}" on Zohaib DigiForge (${priceFormatted}): ${targetUrl}`
    : `Check out "${title}" on Zohaib DigiForge: ${targetUrl}`;

  const trackShare = (platform: string) => {
    if (productId) {
      incrementProductShareInDb(productId, platform).catch(() => {});
    }
    if (onShareTrack) {
      onShareTrack(platform);
    }
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    trackShare('whatsapp');
    const waUrl = `https://wa.me/?text=${encodeURIComponent(rawShareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Native Web Share API (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        trackShare('native_share');
        await navigator.share({
          title: title,
          text: priceFormatted ? `${title} — ${priceFormatted}` : title,
          url: targetUrl
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Share failed:', err);
        }
      }
    } else {
      handleWhatsAppShare();
    }
  };

  // Copy Direct Link
  const handleCopyLink = async () => {
    try {
      trackShare('copy_link');
      await navigator.clipboard.writeText(targetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = targetUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Facebook Share
  const handleFacebookShare = () => {
    trackShare('facebook');
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  // Twitter/X Share
  const handleTwitterShare = () => {
    trackShare('twitter');
    const tweetText = `Check out "${title}" on @zohaibdigiforge!`;
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(targetUrl)}`;
    window.open(twUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  // LinkedIn Share
  const handleLinkedinShare = () => {
    trackShare('linkedin');
    const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}`;
    window.open(liUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  // Telegram Share
  const handleTelegramShare = () => {
    trackShare('telegram');
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(title)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // 1. COMPACT MODE (e.g., inside product cards or table rows)
  if (activeVariant === 'compact') {
    return (
      <div className={`flex items-center gap-1 shrink-0 ${className}`}>
        {/* WhatsApp Quick Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleWhatsAppShare();
          }}
          className="p-1 rounded-lg sm:rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-all cursor-pointer w-7 h-7 sm:w-7.5 sm:h-7.5 flex items-center justify-center shadow-sm shrink-0"
          title="Share via WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Copy Link Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCopyLink();
          }}
          className="p-1 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer w-7 h-7 sm:w-7.5 sm:h-7.5 flex items-center justify-center relative shadow-sm shrink-0"
          title={copiedLink ? 'Link copied!' : 'Copy link'}
        >
          {copiedLink ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    );
  }

  // 2. SIDEBAR VARIANT (Sleek, modern vertical sticky card for Resource Sidebar)
  if (activeVariant === 'sidebar') {
    return (
      <div className={`p-5 rounded-3xl bg-gradient-to-b from-slate-900/95 to-[#0b1120]/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-4 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#28B9FF]/10 border border-[#28B9FF]/30 flex items-center justify-center text-[#28B9FF]">
              <Share2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Share Article</h4>
              <p className="text-[10px] text-slate-400 font-medium">Spread knowledge</p>
            </div>
          </div>

          {hasNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-[#28B9FF] transition-colors"
              title="Native Device Share"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#28B9FF]" />
            </button>
          )}
        </div>

        {/* Primary WhatsApp Action */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0f7a6e] text-white font-extrabold text-xs shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 fill-current shrink-0" />
          <span>Share on WhatsApp</span>
        </button>

        {/* Secondary Social Channels Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Twitter / X */}
          <button
            type="button"
            onClick={handleTwitterShare}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-bold cursor-pointer group"
          >
            <Twitter className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors fill-current" />
            <span>Post on X</span>
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={handleLinkedinShare}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-[#0A66C2]/15 border border-slate-800 hover:border-[#0A66C2]/40 text-slate-300 hover:text-[#0A66C2] transition-all text-xs font-bold cursor-pointer group"
          >
            <Linkedin className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0A66C2] transition-colors fill-current" />
            <span>LinkedIn</span>
          </button>

          {/* Telegram */}
          <button
            type="button"
            onClick={handleTelegramShare}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-[#24A1DE]/15 border border-slate-800 hover:border-[#24A1DE]/40 text-slate-300 hover:text-[#24A1DE] transition-all text-xs font-bold cursor-pointer group"
          >
            <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#24A1DE] transition-colors" />
            <span>Telegram</span>
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={handleFacebookShare}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-[#1877F2]/15 border border-slate-800 hover:border-[#1877F2]/40 text-slate-300 hover:text-[#1877F2] transition-all text-xs font-bold cursor-pointer group"
          >
            <Facebook className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1877F2] transition-colors fill-current" />
            <span>Facebook</span>
          </button>
        </div>

        {/* Copy Link Input Bar */}
        <div className="pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <input
              type="text"
              readOnly
              value={targetUrl}
              className="flex-1 bg-transparent px-2 text-[10px] text-slate-400 font-mono outline-none truncate select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-[#28B9FF] text-slate-200 hover:text-slate-950'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. BANNER VARIANT (Full width, ultra-premium bottom article callout)
  if (activeVariant === 'banner') {
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d1527] to-slate-950 border border-[#28B9FF]/30 p-6 sm:p-8 shadow-2xl ${className}`}>
        {/* Glow Accent Background */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-[#28B9FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-[#0D6EFD]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Callout Text */}
          <div className="space-y-1.5 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#28B9FF]/10 border border-[#28B9FF]/20 text-[#28B9FF] text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Spread the Word</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Found this article helpful?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Share this guide with your developer network, teammates, and friends across social platforms.
            </p>
          </div>

          {/* Right Action Channels */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Primary WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0f7a6e] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-[#25D366]/20 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
              <span>WhatsApp Share</span>
            </button>

            {/* Quick Icon Strip */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleTwitterShare}
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Post on X (Twitter)"
              >
                <Twitter className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={handleLinkedinShare}
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-[#0A66C2]/20 border border-slate-800 hover:border-[#0A66C2]/40 text-slate-300 hover:text-[#0A66C2] transition-all cursor-pointer"
                title="Share on LinkedIn"
              >
                <Linkedin className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={handleTelegramShare}
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-[#24A1DE]/20 border border-slate-800 hover:border-[#24A1DE]/40 text-slate-300 hover:text-[#24A1DE] transition-all cursor-pointer"
                title="Share on Telegram"
              >
                <Send className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleFacebookShare}
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-[#1877F2]/20 border border-slate-800 hover:border-[#1877F2]/40 text-slate-300 hover:text-[#1877F2] transition-all cursor-pointer"
                title="Share on Facebook"
              >
                <Facebook className="w-4 h-4 fill-current" />
              </button>

              {/* Copy Link Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 py-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                  copiedLink
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Copy Direct Link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. STANDARD PROMINENT MODE (Default for Products, Resources, Modals)
  return (
    <div className={`p-4 sm:p-5 rounded-3xl bg-[#0D1527] border border-slate-800 space-y-3.5 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5 text-[#28B9FF]" />
          <span>Share this {type}</span>
        </span>

        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="text-[11px] font-bold text-[#28B9FF] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>More Apps</span>
          </button>
        )}
      </div>

      {/* Share Buttons Grid */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* 1. PRIMARY WHATSAPP BUTTON */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer min-h-[44px]"
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white shrink-0" />
          <span>Share on WhatsApp</span>
        </button>

        {/* SECONDARY ICON BUTTONS */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold min-h-[44px] ${
              copiedLink
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
            }`}
            title="Copy direct link"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline text-[11px]">Copy Link</span>
              </>
            )}
          </button>

          {/* Twitter / X */}
          <button
            type="button"
            onClick={handleTwitterShare}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Share on X (Twitter)"
            aria-label="Share on X"
          >
            <Twitter className="w-4 h-4 fill-current" />
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={handleLinkedinShare}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-[#0A66C2]/20 border border-slate-700 hover:border-[#0A66C2]/50 text-slate-300 hover:text-[#0A66C2] transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Share on LinkedIn"
            aria-label="Share on LinkedIn"
          >
            <Linkedin className="w-4 h-4 fill-current" />
          </button>

          {/* Telegram */}
          <button
            type="button"
            onClick={handleTelegramShare}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-[#24A1DE]/20 border border-slate-700 hover:border-[#24A1DE]/50 text-slate-300 hover:text-[#24A1DE] transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Share on Telegram"
            aria-label="Share on Telegram"
          >
            <Send className="w-4 h-4" />
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={handleFacebookShare}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-[#1877F2]/20 border border-slate-700 hover:border-[#1877F2]/50 text-slate-300 hover:text-[#1877F2] transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Share on Facebook"
            aria-label="Share on Facebook"
          >
            <Facebook className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Toast Feedback for Copy Link */}
      {copiedLink && (
        <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" />
          Direct link copied to your clipboard!
        </p>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Flame, 
  ExternalLink, 
  MousePointerClick, 
  Save, 
  ShieldCheck, 
  RefreshCw, 
  Eye,
  Settings,
  Link as LinkIcon,
  Radio,
  Users,
  MessageSquare,
  Globe,
  Sparkles,
  Star,
  Gift,
  Zap,
  ShoppingBag,
  Mail,
  AlertTriangle,
  Smile,
  Instagram,
  Youtube,
  Send,
  Facebook,
  CheckCircle2,
  Copy,
  GraduationCap,
  Lock
} from 'lucide-react';
import { JoinPageLink, JoinPageSettings, JoinLinkType } from '../types';
import { 
  getJoinPageLinksFromDb, 
  saveJoinPageLinkToDb, 
  deleteJoinPageLinkFromDb, 
  reorderJoinPageLinksInDb,
  getJoinPageSettingsFromDb,
  saveJoinPageSettingsToDb,
  INITIAL_JOIN_PAGE_LINKS,
  DEFAULT_JOIN_PAGE_SETTINGS
} from '../services/firestoreService';

interface JoinLinksAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreviewBioPage?: () => void;
}

const EMOJI_PRESETS = ['🔥', '📢', '👥', '🎓', '🔒', '🛍️', '🎁', '💎', '⭐', '🚀', '💬', '⚡', '📚', '💻', '🎯', '🏷️', '💸', '✨', '🏆'];

const LINK_TYPE_OPTIONS: { type: JoinLinkType; label: string; desc: string; defaultIcon: string; badge: string }[] = [
  { type: 'Store', label: '🛍️ Primary Store CTA', desc: 'Visually dominant hero CTA button leading to store', defaultIcon: 'ShoppingBag', badge: 'Official Store' },
  { type: 'WhatsApp Channel', label: '📢 WhatsApp Channel', desc: 'Green WhatsApp-branded card with Follow Channel badge', defaultIcon: 'Radio', badge: 'Follow Channel' },
  { type: 'WhatsApp Community', label: '👥 WhatsApp Community', desc: 'Green WhatsApp-branded card with Join Community badge', defaultIcon: 'Users', badge: 'Join Community' },
  { type: 'Website', label: 'Website / Store Route', desc: 'Standard button style for internal pages & external websites', defaultIcon: 'Globe', badge: 'Explore' },
  { type: 'Social', label: 'Social Media Group', desc: 'Sub-row expandable social handles (@zohaibdigiforge)', defaultIcon: 'Globe', badge: 'Follow' },
  { type: 'Newsletter', label: 'Newsletter Capture', desc: 'Inline email signup box', defaultIcon: 'Mail', badge: 'Free Weekly Drops' },
  { type: 'Custom', label: 'Custom Destination', desc: 'Bespoke custom styling', defaultIcon: 'Zap', badge: 'Special' },
];

const ICON_OPTIONS = [
  { id: 'ShoppingBag', label: 'Shopping / Store', icon: ShoppingBag },
  { id: 'Radio', label: 'Radio / WhatsApp Channel', icon: Radio },
  { id: 'Users', label: 'Community / WhatsApp Group', icon: Users },
  { id: 'GraduationCap', label: 'Education / Courses', icon: GraduationCap },
  { id: 'Lock', label: 'Lock / Security', icon: Lock },
  { id: 'Flame', label: 'Flame / Hot', icon: Flame },
  { id: 'MessageSquare', label: 'Chat / WhatsApp', icon: MessageSquare },
  { id: 'Gift', label: 'Gift / Free Resource', icon: Gift },
  { id: 'Sparkles', label: 'Sparkles / VIP', icon: Sparkles },
  { id: 'Star', label: 'Star / Reviews', icon: Star },
  { id: 'Zap', label: 'Zap / Fast Project', icon: Zap },
  { id: 'Globe', label: 'Globe / Website', icon: Globe },
  { id: 'Mail', label: 'Mail / Newsletter', icon: Mail },
  { id: 'ShieldCheck', label: 'Shield / Official', icon: ShieldCheck }
];

export const JoinLinksAdminModal: React.FC<JoinLinksAdminModalProps> = ({
  isOpen,
  onClose,
  onPreviewBioPage
}) => {
  const [activeTab, setActiveTab] = useState<'links' | 'settings'>('links');
  const [links, setLinks] = useState<JoinPageLink[]>([]);
  const [settings, setSettings] = useState<JoinPageSettings>(DEFAULT_JOIN_PAGE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLink, setEditingLink] = useState<Partial<JoinPageLink>>({
    label: '',
    subtitle: '',
    url: 'resources',
    linkType: 'Website',
    icon: 'Flame',
    badge: '',
    isActive: true,
    isPrimary: false,
    order: 1
  });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [linksData, settingsData] = await Promise.all([
        getJoinPageLinksFromDb(),
        getJoinPageSettingsFromDb()
      ]);
      setLinks(linksData);
      setSettings(settingsData);
    } catch (e) {
      console.warn('Failed to load Join Page data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingLink({
      id: '',
      label: '🔥 Explore Digital Resources',
      subtitle: '50+ Courses, dev kits & software toolkits with instant access',
      url: 'resources',
      linkType: 'Website',
      icon: 'Flame',
      badge: 'Most Popular',
      badgeColor: 'bg-emerald-500/20 text-[#22C55E] border-emerald-500/30',
      isActive: true,
      isPrimary: links.length === 0,
      order: links.length + 1,
      clickCount: 0,
      clicks: 0
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (link: JoinPageLink) => {
    setEditingLink({ ...link });
    setIsEditing(true);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink.label?.trim() || !editingLink.url?.trim()) {
      showStatus('error', 'Offer-led Label and Destination URL are required');
      return;
    }

    try {
      const linkId = editingLink.id || 'join-' + Date.now();
      
      // If marking this as primary, remove primary from other links
      let updatedList = [...links];
      if (editingLink.isPrimary) {
        for (const l of updatedList) {
          if (l.id !== linkId && l.isPrimary) {
            await saveJoinPageLinkToDb({ ...l, isPrimary: false });
          }
        }
      }

      const linkToSave: JoinPageLink = {
        id: linkId,
        label: editingLink.label.trim(),
        subtitle: editingLink.subtitle?.trim() || '',
        url: editingLink.url.trim(),
        linkType: editingLink.linkType || 'Website',
        icon: editingLink.icon || 'Globe',
        order: editingLink.order || updatedList.length + 1,
        isActive: editingLink.isActive ?? true,
        isPrimary: editingLink.isPrimary ?? false,
        clickCount: editingLink.clickCount ?? editingLink.clicks ?? 0,
        clicks: editingLink.clickCount ?? editingLink.clicks ?? 0,
        badge: editingLink.badge?.trim() || undefined,
        badgeColor: editingLink.badgeColor || undefined,
        updatedAt: new Date().toISOString()
      };

      await saveJoinPageLinkToDb(linkToSave);
      await loadData();
      setIsEditing(false);
      showStatus('success', 'Link saved successfully to Firestore!');
    } catch (err) {
      showStatus('error', 'Failed to save link');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this link from the Join Us hub?')) return;
    try {
      await deleteJoinPageLinkFromDb(id);
      await loadData();
      showStatus('success', 'Link deleted');
    } catch (err) {
      showStatus('error', 'Failed to delete link');
    }
  };

  const handleToggleActive = async (link: JoinPageLink) => {
    try {
      const updated = { ...link, isActive: !link.isActive };
      await saveJoinPageLinkToDb(updated);
      setLinks(prev => prev.map(l => l.id === link.id ? updated : l));
      showStatus('success', `Link ${updated.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      showStatus('error', 'Failed to toggle active status');
    }
  };

  const handleSetPrimary = async (targetId: string) => {
    try {
      const updatedList = links.map(l => ({
        ...l,
        isPrimary: l.id === targetId
      }));

      for (const l of updatedList) {
        await saveJoinPageLinkToDb(l);
      }
      setLinks(updatedList);
      showStatus('success', 'Primary Hero CTA updated!');
    } catch (err) {
      showStatus('error', 'Failed to update primary CTA');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;

    const newLinks = [...links];
    const [moved] = newLinks.splice(index, 1);
    newLinks.splice(targetIndex, 0, moved);

    const reindexed = newLinks.map((item, idx) => ({ ...item, order: idx + 1 }));
    setLinks(reindexed);

    try {
      await reorderJoinPageLinksInDb(reindexed);
      showStatus('success', 'Order updated');
    } catch (e) {
      showStatus('error', 'Failed to save new order');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveJoinPageSettingsToDb(settings);
      showStatus('success', 'Join Page settings saved live!');
    } catch (err) {
      showStatus('error', 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all Join Us links to official Zohaib DigiForge presets? (This will restore standard links)')) return;
    try {
      for (const l of INITIAL_JOIN_PAGE_LINKS) {
        await saveJoinPageLinkToDb(l);
      }
      await loadData();
      showStatus('success', 'Reset to default curated links successfully');
    } catch (err) {
      showStatus('error', 'Failed to reset defaults');
    }
  };

  const activeLinksCount = links.filter(l => l.isActive).length;
  const totalClicksCount = links.reduce((sum, l) => sum + (l.clickCount || l.clicks || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0D6EFD] to-[#28B9FF] p-0.5 shadow-md shadow-[#0D6EFD]/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-[#28B9FF]">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Join Us Hub Control Center
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#0D6EFD]/20 text-[#28B9FF] border border-[#0D6EFD]/30">
                  Dynamic Linktree Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage public Linktree-style bio page (`/join`), headers, links, and click analytics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPreviewBioPage && (
              <button
                onClick={onPreviewBioPage}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                title="Preview public /join page"
              >
                <Eye className="w-3.5 h-3.5 text-[#28B9FF]" />
                <span>Live View</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 bg-slate-900/50 flex items-center gap-6">
          <button
            onClick={() => setActiveTab('links')}
            className={`py-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'links'
                ? 'border-[#0D6EFD] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4 text-[#28B9FF]" />
            <span>Links &amp; CTAs ({links.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-[#0D6EFD] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>Profile &amp; Header Settings</span>
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className={`p-3 text-xs font-semibold text-center ${
            statusMessage.type === 'success' ? 'bg-[#22C55E]/15 text-[#22C55E] border-b border-[#22C55E]/30' : 'bg-rose-500/15 text-rose-400 border-b border-rose-500/30'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ═══════════════════════════════════════════════════
              TAB 1: LINKS MANAGEMENT
          ═══════════════════════════════════════════════════ */}
          {activeTab === 'links' && (
            <div className="space-y-5">
              
              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-slate-400">Total Active Links</div>
                    <div className="text-lg font-black text-white flex items-center gap-2">
                      <span>{activeLinksCount}</span>
                      <span className="text-[10px] font-bold text-slate-500">/ {links.length} total</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[#0D6EFD]/20 text-[#28B9FF] flex items-center justify-center">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-slate-400">Total Click Count</div>
                    <div className="text-lg font-black text-[#22C55E] flex items-center gap-1.5">
                      <MousePointerClick className="w-4 h-4" />
                      <span>{totalClicksCount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#22C55E] flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-slate-400">Hero Primary CTA</div>
                    <div className="text-xs font-bold text-amber-400 truncate max-w-[150px]">
                      {links.find(l => l.isPrimary)?.label || 'None set'}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                </div>
              </div>

              {/* Research-backed UX Warning: Max 8 Active Links */}
              {activeLinksCount > 8 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-amber-200">
                      Conversion Warning: You have {activeLinksCount} active links
                    </p>
                    <p className="text-slate-300 text-[11px]">
                      Best-converting Linktree-style pages show <strong>maximum 8 links</strong> to prevent choice paralysis. Extra links still display, but consider deactivating older links.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs text-slate-400">
                  Drag or use arrows to change button hierarchy. Top link with <strong>Primary</strong> tag gets the hero highlight.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetDefaults}
                    className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                    title="Reset to default curated list"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    onClick={handleOpenAdd}
                    className="px-4 py-2 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-all shadow-md shadow-[#0D6EFD]/20 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Link</span>
                  </button>
                </div>
              </div>

              {/* Links List / Table */}
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Loading Join Page links from Firestore...
                </div>
              ) : links.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 text-sm">No links found. Add your first link button!</p>
                  <button
                    onClick={handleOpenAdd}
                    className="px-4 py-2 rounded-xl bg-[#0D6EFD] text-white text-xs font-bold"
                  >
                    + Add First Link
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {links.map((link, index) => {
                    const isWhatsApp = link.linkType === 'WhatsApp Channel' || link.linkType === 'WhatsApp Community';
                    return (
                      <div
                        key={link.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          link.isPrimary
                            ? 'bg-gradient-to-r from-[#0D6EFD]/15 via-slate-900 to-slate-900 border-[#0D6EFD]/60 shadow-lg shadow-[#0D6EFD]/10'
                            : link.isActive
                            ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/40 border-slate-900 opacity-60'
                        }`}
                      >
                        {/* Left: Reorder & Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          
                          {/* Order Buttons */}
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              disabled={index === 0}
                              onClick={() => handleMoveOrder(index, 'up')}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 disabled:cursor-not-allowed"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={index === links.length - 1}
                              onClick={() => handleMoveOrder(index, 'down')}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 disabled:cursor-not-allowed"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Link Card Content */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white truncate">
                                {link.label}
                              </span>

                              {/* Primary Pill */}
                              {link.isPrimary && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase flex items-center gap-1">
                                  <Flame className="w-2.5 h-2.5 fill-amber-300" />
                                  Hero Primary CTA
                                </span>
                              )}

                              {/* Link Type Badge */}
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                isWhatsApp
                                  ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}>
                                {link.linkType || 'Website'}
                              </span>

                              {link.badge && (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                  link.badgeColor || 'bg-blue-500/20 text-[#28B9FF] border-blue-500/30'
                                }`}>
                                  {link.badge}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 truncate">
                              {link.subtitle || link.url}
                            </p>

                            <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-0.5">
                              <span className="font-mono text-slate-400">
                                Target: {link.url}
                              </span>
                              <span>•</span>
                              <span className="text-[#22C55E] font-bold flex items-center gap-1">
                                <MousePointerClick className="w-3 h-3" />
                                {(link.clickCount || link.clicks || 0).toLocaleString()} taps
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          
                          {/* Set Primary Button */}
                          {!link.isPrimary && (
                            <button
                              onClick={() => handleSetPrimary(link.id)}
                              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 text-[11px] font-semibold border border-slate-700 transition-colors"
                              title="Make this the top primary hero CTA"
                            >
                              <Star className="w-3 h-3" />
                              <span>Make Primary</span>
                            </button>
                          )}

                          {/* Active Toggle Switch */}
                          <button
                            onClick={() => handleToggleActive(link)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                              link.isActive
                                ? 'bg-emerald-500/20 text-[#22C55E] border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                            }`}
                            title={link.isActive ? 'Active (Click to Hide)' : 'Hidden (Click to Show)'}
                          >
                            {link.isActive ? 'Active' : 'Hidden'}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(link)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="Edit Link Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-colors"
                            title="Delete Link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              TAB 2: PROFILE & HEADER SETTINGS
          ═══════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              {/* Live Preview Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0D6EFD]/10 to-slate-950 border border-slate-800 text-center space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#28B9FF]">
                  Live Header Preview
                </div>

                {/* Avatar */}
                <div className="relative inline-block mx-auto">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0D6EFD] via-[#28B9FF] to-[#22C55E] p-0.5 shadow-lg shadow-[#0D6EFD]/20">
                    <div className="w-full h-full bg-[#0A0F1D] rounded-full flex items-center justify-center overflow-hidden">
                      {settings.profilePhoto ? (
                        <img 
                          src={settings.profilePhoto} 
                          alt="Profile Preview" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-2xl font-black text-white">D</span>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#0A0F1D] p-0.5 rounded-full border border-slate-800">
                    <div className="w-5 h-5 bg-[#22C55E] rounded-full flex items-center justify-center text-slate-950">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-white text-[#22C55E]" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white">
                    {settings.headline || 'Zohaib DigiForge'}
                  </h3>
                  <p className="text-xs font-semibold text-[#28B9FF] mt-0.5">
                    {settings.subheadline || 'Empowering Learning. Powering Success.'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    {settings.tagline || 'Digital resources, free hacks & tools for students who don\'t want to overpay.'}
                  </p>
                </div>
              </div>

              {/* Settings Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Profile Photo */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Profile Photo / Logo Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.profilePhoto}
                      onChange={(e) => setSettings({ ...settings, profilePhoto: e.target.value })}
                      placeholder="/icon.png or https://..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#0D6EFD]"
                    />
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, profilePhoto: '/icon.webp' })}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                    >
                      Use /icon.webp
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, profilePhoto: '/logo.webp' })}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                    >
                      Use /logo.webp
                    </button>
                  </div>
                </div>

                {/* Headline */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Headline / Brand Title
                  </label>
                  <input
                    type="text"
                    value={settings.headline}
                    onChange={(e) => setSettings({ ...settings, headline: e.target.value })}
                    placeholder="Zohaib DigiForge"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#0D6EFD]"
                    required
                  />
                </div>

                {/* Subheadline */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Subheadline / Handle
                  </label>
                  <input
                    type="text"
                    value={settings.subheadline}
                    onChange={(e) => setSettings({ ...settings, subheadline: e.target.value })}
                    placeholder="@zohaibdigiforge • Empowering Learning. Powering Success."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#0D6EFD]"
                  />
                </div>

                {/* Tagline / Hook */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Tagline / Value Proposition Hook
                  </label>
                  <textarea
                    rows={2}
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    placeholder="Digital resources, free hacks & tools for students who don't want to overpay."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#0D6EFD]"
                  />
                </div>
              </div>

              {/* Social Channels Config */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#28B9FF]" />
                  <span>Bottom Social Icons Bar URLs</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Instagram URL</label>
                    <input
                      type="text"
                      value={settings.socials?.instagram || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        socials: { ...settings.socials, instagram: e.target.value }
                      })}
                      placeholder="https://instagram.com/zohaibdigiforge"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">WhatsApp Chat / Channel URL</label>
                    <input
                      type="text"
                      value={settings.socials?.whatsapp || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        socials: { ...settings.socials, whatsapp: e.target.value }
                      })}
                      placeholder="https://wa.me/923406070632"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">YouTube URL</label>
                    <input
                      type="text"
                      value={settings.socials?.youtube || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        socials: { ...settings.socials, youtube: e.target.value }
                      })}
                      placeholder="https://youtube.com/@zohaibdigiforge"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Telegram Community URL</label>
                    <input
                      type="text"
                      value={settings.socials?.telegram || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        socials: { ...settings.socials, telegram: e.target.value }
                      })}
                      placeholder="https://t.me/zohaibdigiforge"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Save Settings CTA */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-3 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-[#22C55E]/20 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? 'Saving Settings...' : 'Save Profile & Header Settings'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* ═════════════════════════════════════════════════════
            ADD / EDIT LINK DRAWER MODAL
        ═════════════════════════════════════════════════════ */}
        {isEditing && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-[#28B9FF]" />
                  <span>{editingLink.id ? 'Edit Link Button' : 'Add New Link Button'}</span>
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveLink} className="space-y-4">
                
                {/* Emoji Chips for Offer-Led Label */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Offer-led Label (Click Emoji to Add)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap pb-1">
                    {EMOJI_PRESETS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          const current = editingLink.label || '';
                          setEditingLink({ ...editingLink, label: `${emoji} ${current.replace(/^[^\s]+\s*/, '')}` });
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editingLink.label || ''}
                    onChange={(e) => setEditingLink({ ...editingLink, label: e.target.value })}
                    placeholder="🔥 Explore Digital Resources"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#0D6EFD]"
                    required
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Subtitle / Value Hook
                  </label>
                  <input
                    type="text"
                    value={editingLink.subtitle || ''}
                    onChange={(e) => setEditingLink({ ...editingLink, subtitle: e.target.value })}
                    placeholder="50+ Courses, dev kits & software tools with instant access"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#0D6EFD]"
                  />
                </div>

                {/* Link Type & Destination URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Link Type
                    </label>
                    <select
                      value={editingLink.linkType || 'Website'}
                      onChange={(e) => {
                        const newType = e.target.value as JoinLinkType;
                        const match = LINK_TYPE_OPTIONS.find(o => o.type === newType);
                        setEditingLink({
                          ...editingLink,
                          linkType: newType,
                          icon: match?.defaultIcon || editingLink.icon || 'Globe',
                          badge: match?.badge || editingLink.badge
                        });
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#0D6EFD]"
                    >
                      {LINK_TYPE_OPTIONS.map(opt => (
                        <option key={opt.type} value={opt.type}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Icon Selector
                    </label>
                    <select
                      value={editingLink.icon || 'Globe'}
                      onChange={(e) => setEditingLink({ ...editingLink, icon: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#0D6EFD]"
                    >
                      {ICON_OPTIONS.map(ico => (
                        <option key={ico.id} value={ico.id}>
                          {ico.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Destination URL with Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      Destination URL / Internal Route
                    </label>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span>Presets:</span>
                      <button
                        type="button"
                        onClick={() => setEditingLink({ ...editingLink, url: 'resources' })}
                        className="text-[#28B9FF] hover:underline"
                      >
                        resources
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setEditingLink({ ...editingLink, url: 'membership' })}
                        className="text-[#28B9FF] hover:underline"
                      >
                        membership
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setEditingLink({ ...editingLink, url: 'reviews' })}
                        className="text-[#28B9FF] hover:underline"
                      >
                        reviews
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editingLink.url || ''}
                    onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                    placeholder="resources OR https://chat.whatsapp.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#0D6EFD]"
                    required
                  />
                </div>

                {/* Badge text */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Badge Pill Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingLink.badge || ''}
                    onChange={(e) => setEditingLink({ ...editingLink, badge: e.target.value })}
                    placeholder="Most Popular, 100% Free, VIP Pass, Follow Channel"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#0D6EFD]"
                  />
                </div>

                {/* Toggles: Active & Primary */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  
                  {/* Primary CTA Toggle */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 fill-amber-300" />
                        <span>Set as Primary Hero CTA</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Rendered larger with glowing gradient at the very top. Only ONE link can be primary.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingLink.isPrimary || false}
                      onChange={(e) => setEditingLink({ ...editingLink, isPrimary: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0D6EFD] bg-slate-900 border-slate-700"
                    />
                  </label>

                  {/* Active Toggle */}
                  <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-800/80">
                    <div>
                      <div className="text-xs font-bold text-white">
                        Active on Public Page
                      </div>
                      <div className="text-[11px] text-slate-400">
                        When unchecked, the link will be hidden from visitors.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingLink.isActive ?? true}
                      onChange={(e) => setEditingLink({ ...editingLink, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0D6EFD] bg-slate-900 border-slate-700"
                    />
                  </label>
                </div>

                {/* Form CTA Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold shadow-md shadow-[#0D6EFD]/20"
                  >
                    Save Link Button
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

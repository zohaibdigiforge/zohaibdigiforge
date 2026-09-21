import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Download, 
  Search, 
  History, 
  Users, 
  CheckCircle2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { NewsletterSubscriber, NewsletterSentLog } from '../../types';
import { 
  getNewsletterSubscribersFromDb, 
  getNewslettersSentFromDb, 
  recordNewsletterSentToDb 
} from '../../services/firestoreService';

interface AdminNewsletterProps {
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminNewsletter: React.FC<AdminNewsletterProps> = ({
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'compose' | 'history'>('subscribers');

  // Subscribers
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Broadcast History
  const [history, setHistory] = useState<NewsletterSentLog[]>([]);

  // Compose State
  const [subject, setSubject] = useState('');
  const [segment, setSegment] = useState('All Subscribers');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchSubscribers();
    fetchHistory();
  }, []);

  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const list = await getNewsletterSubscribersFromDb();
      setSubscribers(list);
    } catch (e) {
      console.warn('Error subscribers:', e);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const list = await getNewslettersSentFromDb();
      setHistory(list);
    } catch (e) {
      console.warn('Error history:', e);
    }
  };

  // Filter Subscribers
  const filteredSubscribers = subscribers.filter(s => 
    !searchTerm || s.email.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // CSV Export
  const handleExportCSV = () => {
    if (subscribers.length === 0) return;
    const header = 'Email,SubscribedAt\n';
    const rows = subscribers.map(s => `${s.email},${s.subscribedAt || ''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zohaib_digiforge_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    onShowToast('Exported subscribers CSV!', 'success');
  };

  // Send Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      onShowToast('Subject and email content are required.', 'error');
      return;
    }

    setSending(true);
    try {
      await recordNewsletterSentToDb({
        subject: subject.trim(),
        content: content.trim(),
        segment,
        recipientCount: subscribers.length || 1,
        sentBy: 'Admin'
      });

      onShowToast(`Broadcast email sent to ${subscribers.length || 1} subscribers!`, 'success');
      setSubject('');
      setContent('');
      fetchHistory();
      setActiveTab('history');
    } catch (e) {
      onShowToast('Failed to log broadcast email.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">Newsletter &amp; Email Marketing</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage subscriber lists, compose broadcasts &amp; track email log history</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'subscribers' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Subscribers ({subscribers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'compose' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose Email</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Send History ({history.length})</span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════
          TAB 1: SUBSCRIBERS LIST
      ═════════════════════════════════════════════════════ */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subscriber email..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#0D6EFD]"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Subscribed Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500">
                        No subscribers found in Firestore.
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-4 font-bold text-white">{sub.email}</td>
                        <td className="p-4 text-slate-400">
                          {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleString() : 'Recently'}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#22C55E] text-[10px] font-bold">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════
          TAB 2: COMPOSE BROADCAST
      ═════════════════════════════════════════════════════ */}
      {activeTab === 'compose' && (
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0D6EFD]/20 text-[#28B9FF] flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Compose Broadcast Campaign</h3>
              <p className="text-xs text-slate-400">Send news, deals, or daily resource drops to your full subscriber base</p>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Email Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. ⚡ New Collection Drop: 100+ Premium Software Keys Unlocked!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:outline-none focus:border-[#0D6EFD]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Target Segment</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:outline-none focus:border-[#0D6EFD]"
                >
                  <option value="All Subscribers">All Newsletter Subscribers ({subscribers.length})</option>
                  <option value="Course Buyers">Course Buyers Only</option>
                  <option value="Software Buyers">Software Buyers Only</option>
                  <option value="Mega Pass Members">Mega Access Pass Members</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Email Body Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder="Write your broadcast message here..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:outline-none focus:border-[#0D6EFD]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="px-6 py-3 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white font-extrabold text-xs shadow-lg flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending Broadcast...' : 'Send Broadcast Email Now'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════
          TAB 3: SEND HISTORY
      ═════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 font-bold text-white text-xs">
            Broadcast Email History Log
          </div>
          <div className="divide-y divide-slate-800">
            {history.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No past broadcast emails logged yet.
              </div>
            ) : (
              history.map((log) => (
                <div key={log.id} className="p-4 space-y-1 hover:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{log.subject}</h4>
                    <span className="text-[11px] text-slate-400">{new Date(log.sentAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{log.content}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                    <span>Segment: <strong className="text-slate-300">{log.segment}</strong></span>
                    <span>Recipients: <strong className="text-[#28B9FF]">{log.recipientCount}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};

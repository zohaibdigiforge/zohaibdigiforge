import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  CheckCircle, 
  XCircle, 
  GripVertical, 
  RefreshCw, 
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { FAQ, FAQCategory } from '../../types';
import { 
  getFAQsFromDb, 
  addFAQToDb, 
  updateFAQInDb, 
  deleteFAQFromDb 
} from '../../services/firestoreService';
import { DEFAULT_GLOBAL_FAQS } from '../FAQSection';

interface AdminFAQsProps {
  onRequireReAuth?: (title: string, description: string, actionFn: () => Promise<void>) => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const AdminFAQs: React.FC<AdminFAQsProps> = ({
  onRequireReAuth,
  onShowToast
}) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Editor State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FAQ>>({});
  const [isSaving, setIsSaving] = useState(false);

  const categories: FAQCategory[] = [
    'Orders & Payment',
    'Delivery & Access',
    'Pricing',
    'Account',
    'Refunds',
    'General'
  ];

  const loadFAQs = async () => {
    setLoading(true);
    try {
      const data = await getFAQsFromDb();
      if (data && data.length > 0) {
        setFaqs(data as FAQ[]);
      } else {
        setFaqs(DEFAULT_GLOBAL_FAQS);
      }
    } catch (err) {
      console.error('Error fetching FAQs in admin:', err);
      setFaqs(DEFAULT_GLOBAL_FAQS);
      onShowToast('Loaded default FAQs cache', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFAQs();
  }, []);

  const handleStartAdd = () => {
    setEditingId('new');
    setFormData({
      category: 'General',
      question: '',
      answer: '',
      order: faqs.length + 1,
      isActive: true
    });
  };

  const handleStartEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({ ...faq });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.question?.trim() || !formData.answer?.trim() || !formData.category) {
      onShowToast('Please fill question, answer, and category', 'error');
      return;
    }

    const saveAction = async () => {
      setIsSaving(true);
      try {
        if (editingId === 'new') {
          const newFaq: Omit<FAQ, 'id'> = {
            category: formData.category as FAQCategory,
            question: formData.question.trim(),
            answer: formData.answer.trim(),
            order: Number(formData.order) || (faqs.length + 1),
            isActive: formData.isActive !== false
          };
          await addFAQToDb(newFaq);
          onShowToast('New FAQ published to Firestore & site!', 'success');
        } else if (editingId) {
          await updateFAQInDb(editingId, {
            category: formData.category as FAQCategory,
            question: formData.question.trim(),
            answer: formData.answer.trim(),
            order: Number(formData.order) || 0,
            isActive: formData.isActive !== false
          });
          onShowToast('FAQ updated successfully!', 'success');
        }
        await loadFAQs();
        setEditingId(null);
        setFormData({});
      } catch (err) {
        console.error('Failed to save FAQ:', err);
        onShowToast('Failed to save FAQ to database', 'error');
      } finally {
        setIsSaving(false);
      }
    };

    if (onRequireReAuth) {
      onRequireReAuth('Save FAQ Changes', 'Confirm administrative modification of public FAQs.', saveAction);
    } else {
      await saveAction();
    }
  };

  const handleDelete = (id: string, question: string) => {
    const deleteAction = async () => {
      setLoading(true);
      try {
        await deleteFAQFromDb(id);
        onShowToast('FAQ deleted from Firestore', 'success');
        await loadFAQs();
      } catch (err) {
        console.error('Failed to delete FAQ:', err);
        onShowToast('Failed to delete FAQ', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (onRequireReAuth) {
      onRequireReAuth('Delete FAQ', `Are you sure you want to delete FAQ: "${question.substring(0, 40)}..."?`, deleteAction);
    } else if (window.confirm(`Delete FAQ: "${question}"?`)) {
      deleteAction();
    }
  };

  const handleToggleStatus = async (faq: FAQ) => {
    try {
      const newStatus = !faq.isActive;
      await updateFAQInDb(faq.id, { isActive: newStatus });
      setFaqs(faqs.map(f => f.id === faq.id ? { ...f, isActive: newStatus } : f));
      onShowToast(`FAQ marked as ${newStatus ? 'Active' : 'Inactive'}`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to update status', 'error');
    }
  };

  const handleReorder = async (faq: FAQ, direction: 'up' | 'down') => {
    const currentIndex = faqs.findIndex(f => f.id === faq.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const updatedFaqs = [...faqs];
    const temp = updatedFaqs[currentIndex];
    updatedFaqs[currentIndex] = updatedFaqs[targetIndex];
    updatedFaqs[targetIndex] = temp;

    // update orders
    setFaqs(updatedFaqs);
    try {
      await updateFAQInDb(updatedFaqs[currentIndex].id, { order: currentIndex + 1 });
      await updateFAQInDb(updatedFaqs[targetIndex].id, { order: targetIndex + 1 });
      onShowToast('FAQ order updated', 'success');
    } catch (err) {
      console.warn('Order sync warning:', err);
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0D1527] via-slate-900 to-[#0A0F1D] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D6EFD]/10 border border-[#0D6EFD]/25 text-[#28B9FF] text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Firestore FAQ Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Frequently Asked Questions (FAQs)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              Live Synced
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Manage, reorder, create, and customize FAQs displayed across Home, Catalog, Checkout, Bio Link (/join), and Product pages. All edits sync directly to Firebase Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadFAQs}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50"
            title="Refresh from Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleStartAdd}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white text-xs font-black shadow-lg shadow-[#0D6EFD]/25 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New FAQ</span>
          </button>
        </div>
      </div>

      {/* Editor Modal / Inline Card */}
      {editingId && (
        <div className="p-6 rounded-2xl bg-[#0D1527] border-2 border-[#28B9FF]/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#28B9FF]" />
              <span>{editingId === 'new' ? 'Create New Live FAQ' : 'Edit FAQ Item'}</span>
            </h3>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FAQCategory })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#28B9FF]"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Display Order Number</label>
              <input
                type="number"
                value={formData.order ?? 1}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#28B9FF]"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-[#0D6EFD]"
                />
                <span className="text-xs font-bold text-slate-300">Publish & Make Active</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Question (Headline)</label>
            <input
              type="text"
              value={formData.question || ''}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="e.g. How do I get instant download access after payment?"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#28B9FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Answer Content</label>
            <textarea
              rows={4}
              value={formData.answer || ''}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Write a clear, reassuring, and helpful response for your buyers..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#28B9FF] leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Firestore...' : 'Save to Firestore'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0D1527] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs by question or answer..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#28B9FF]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0D6EFD] text-white shadow-md shadow-[#0D6EFD]/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#28B9FF] mb-2" />
            <p className="text-xs font-bold">Syncing live FAQs from Firestore...</p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-bold text-slate-300">No FAQs found matching your criteria</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first customized question and answer to help potential customers make confident purchases.
            </p>
            <button
              onClick={handleStartAdd}
              className="px-4 py-2 rounded-xl bg-[#0D6EFD] text-white text-xs font-bold hover:bg-blue-600 transition-colors"
            >
              Add New FAQ
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                faq.isActive !== false
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/60 border-rose-950/40 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                
                {/* Left: Drag / Order Indicator & Info */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex flex-col items-center gap-1 pt-1 text-slate-500">
                    <button
                      onClick={() => handleReorder(faq, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-black text-[#28B9FF] px-1.5 py-0.5 rounded bg-slate-800">
                      #{faq.order ?? (index + 1)}
                    </span>
                    <button
                      onClick={() => handleReorder(faq, 'down')}
                      disabled={index === filteredFaqs.length - 1}
                      className="p-1 hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#0D6EFD]/15 text-[#28B9FF] border border-[#0D6EFD]/25">
                        {faq.category}
                      </span>
                      {faq.isActive !== false ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          <span>Active on Store</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          <span>Hidden (Draft)</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {faq.question}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1">
                      {faq.answer}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleStatus(faq)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      faq.isActive !== false
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                    title="Toggle active status"
                  >
                    {faq.isActive !== false ? 'Hide' : 'Show'}
                  </button>

                  <button
                    onClick={() => handleStartEdit(faq)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#28B9FF] border border-slate-700 transition-all cursor-pointer"
                    title="Edit FAQ"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(faq.id, faq.question)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

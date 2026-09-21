import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Upload, 
  FileText, 
  FolderPlus, 
  CheckCircle2, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Home,
  Eye,
  EyeOff,
  X,
  Tag,
  Hash,
  ArrowUpDown,
  Palette,
  Folder,
  Globe,
  ExternalLink,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Product, Category, Subcategory } from '../../types';
import { 
  saveProductToDb, 
  deleteProductFromDb, 
  saveCategoryToDb, 
  deleteCategoryFromDb,
  saveSubcategoryToDb,
  deleteSubcategoryFromDb
} from '../../services/firestoreService';
import { usePricing } from '../../context/PricingContext';
import { ImageUploadDropzone } from './ImageUploadDropzone';

interface AdminResourcesProps {
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  onRequireReAuth: (actionTitle: string, actionDesc: string, actionFn: () => Promise<void>) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onRefreshData: () => void;
  onNavigateTab?: (tab: string) => void;
}

const PRESET_ICONS = ['📦', '🎓', '🎨', '📐', '💻', '📚', '🔧', '⚡', '🚀', '💎', '🔥', '⚙️', '📱', '🎬', '🌐'];

const PRESET_GRADIENTS = [
  { label: 'Blue Sky', value: 'from-blue-600/20 to-purple-600/20' },
  { label: 'DigiForge Cyan', value: 'from-[#0D6EFD]/20 to-[#28B9FF]/20' },
  { label: 'Emerald Mint', value: 'from-emerald-600/20 to-teal-600/20' },
  { label: 'Amber Flame', value: 'from-amber-500/20 to-orange-600/20' },
  { label: 'Royal Violet', value: 'from-purple-600/20 to-pink-600/20' }
];

export const AdminResources: React.FC<AdminResourcesProps> = ({
  products,
  categories,
  subcategories,
  onRequireReAuth,
  onShowToast,
  onRefreshData,
  onNavigateTab
}) => {
  const { formatCombinedPrice, formatCombinedProductPrice, pricing } = usePricing();
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'subcategories' | 'tags' | 'csv'>('products');

  // Tag Management State
  const [tagSearch, setTagSearch] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [editingTagModal, setEditingTagModal] = useState<{ isOpen: boolean; oldName: string; newName: string }>({
    isOpen: false,
    oldName: '',
    newName: ''
  });

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const tagName = newTagInput.trim().replace(/^#/, '');
    onShowToast(`Tag "${tagName}" created successfully! You can now assign it to any resource.`, 'success');
    setNewTagInput('');
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const { oldName, newName } = editingTagModal;
    if (!newName.trim() || !oldName) return;
    const trimmedNew = newName.trim().replace(/^#/, '');

    try {
      let updatedCount = 0;
      for (const prod of products) {
        if (prod.tags && prod.tags.includes(oldName)) {
          const updatedTags = prod.tags.map(t => (t === oldName ? trimmedNew : t));
          const uniqueTags = Array.from(new Set(updatedTags));
          const updatedProd = { ...prod, tags: uniqueTags };
          await saveProductToDb(updatedProd, false);
          updatedCount++;
        }
      }
      onShowToast(`Tag "${oldName}" renamed to "${trimmedNew}" across ${updatedCount} resources!`, 'success');
      setEditingTagModal({ isOpen: false, oldName: '', newName: '' });
      onRefreshData();
    } catch (err: any) {
      onShowToast(`Error updating tag: ${err.message}`, 'error');
    }
  };

  const handleDeleteTag = (tagName: string) => {
    onRequireReAuth(
      `Delete Tag "${tagName}"`,
      `This will remove the tag #${tagName} from all associated digital resources.`,
      async () => {
        let updatedCount = 0;
        for (const prod of products) {
          if (prod.tags && prod.tags.includes(tagName)) {
            const updatedTags = prod.tags.filter(t => t !== tagName);
            const updatedProd = { ...prod, tags: updatedTags };
            await saveProductToDb(updatedProd, false);
            updatedCount++;
          }
        }
        onShowToast(`Tag "${tagName}" deleted from ${updatedCount} resources!`, 'success');
        onRefreshData();
      }
    );
  };

  // Search & Pagination for Products
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Search for Categories & Subcategories
  const [categorySearch, setCategorySearch] = useState('');
  const [subcategorySearch, setSubcategorySearch] = useState('');
  const [subcategoryCategoryFilter, setSubcategoryCategoryFilter] = useState<string>('all');

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [featuresText, setFeaturesText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({
    title: '',
    categoryId: 'courses',
    subcategoryId: 'dev-courses',
    pricePKR: 499,
    priceUSD: 2.5,
    originalPricePKR: 1999,
    originalPriceUSD: 9.99,
    shortDescription: '',
    fullDescription: '',
    description: '',
    downloadUrl: '',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    fileFormat: 'ZIP Archive / Google Drive',
    fileSize: '2.4 GB',
    deliveryMethod: 'Instant Download',
    badge: 'New',
    stockQuantity: undefined,
    isNew: true,
    isBestseller: false,
    isFeatured: false,
    showOnHome: true
  });

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category>>({
    name: '',
    slug: '',
    icon: '📦',
    description: '',
    order: 1,
    featuredColor: 'from-[#0D6EFD]/20 to-[#28B9FF]/20'
  });

  // Subcategory Modal State
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Partial<Subcategory>>({
    name: '',
    slug: '',
    categoryId: '',
    description: '',
    order: 1
  });

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);
  const [isGeneratingAISeo, setIsGeneratingAISeo] = useState(false);

  // Filter Products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const matchTitle = p.title.toLowerCase().includes(term);
      const matchDesc = p.description?.toLowerCase().includes(term);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Filter Categories
  const filteredCategories = categories.filter(c => {
    const term = categorySearch.toLowerCase().trim();
    if (!term) return true;
    return c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term);
  });

  // Filter Subcategories
  const filteredSubcategories = subcategories.filter(s => {
    if (subcategoryCategoryFilter !== 'all' && s.categoryId !== subcategoryCategoryFilter) return false;
    const term = subcategorySearch.toLowerCase().trim();
    if (!term) return true;
    return s.name.toLowerCase().includes(term) || s.slug.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term);
  });

  // ═══════════════════════════════════════════════════════════════
  // PRODUCT ACTIONS
  // ═══════════════════════════════════════════════════════════════
  const handleOpenAddProduct = () => {
    const defaultCat = categories[0]?.id || 'courses';
    const defaultSub = subcategories.find(s => s.categoryId === defaultCat)?.id || '';
    setEditingProduct({
      title: '',
      categoryId: defaultCat,
      subcategoryId: defaultSub,
      pricePKR: 499,
      priceUSD: 2.5,
      originalPricePKR: 1999,
      originalPriceUSD: 9.99,
      shortDescription: '',
      fullDescription: '',
      description: '',
      downloadUrl: '',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      fileFormat: 'ZIP Archive / Google Drive',
      fileSize: '2.4 GB Total',
      deliveryMethod: 'Instant Download',
      badge: 'New',
      stockQuantity: undefined,
      isNew: true,
      isBestseller: false,
      isFeatured: false,
      showOnHome: true,
      slug: '',
      metaTitle: '',
      metaDescription: '',
      focusKeyword: '',
      previewImages: [],
      previewNote: ''
    });
    setFeaturesText('Complete High-Resolution Master Assets & Source Files\nLifetime Google Drive Archive Access\nStep-by-Step Setup Video & Documentation Guides\n100% Commercial & Personal Use License Rights\nFree Lifetime Automatic Product Updates\nDedicated WhatsApp Support Assistance');
    setTagsText('React, Fullstack, Source Code, Google Drive');
    setKeywordsText('digital, download, resource, bundle');
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    const imgUrl = prod.thumbnail || prod.image || '';
    setEditingProduct({
      ...prod,
      image: imgUrl,
      thumbnail: imgUrl,
      shortDescription: prod.shortDescription || prod.description || '',
      fullDescription: prod.fullDescription || prod.description || '',
      fileFormat: prod.fileFormat || 'ZIP Archive / Google Drive',
      fileSize: prod.fileSize || '2.4 GB',
      deliveryMethod: prod.deliveryMethod || 'Instant Download',
      badge: prod.badge || '',
      showOnHome: prod.showOnHome !== false,
      slug: prod.slug || '',
      metaTitle: prod.metaTitle || '',
      metaDescription: prod.metaDescription || '',
      focusKeyword: prod.focusKeyword || '',
      previewImages: prod.previewImages || [],
      previewNote: prod.previewNote || ''
    });
    setFeaturesText((prod.features && prod.features.length > 0) ? prod.features.join('\n') : 'Complete High-Resolution Master Assets & Source Files\nLifetime Google Drive Archive Access\nStep-by-Step Setup Video & Documentation Guides\n100% Commercial & Personal Use License Rights\nFree Lifetime Automatic Product Updates');
    setTagsText(prod.tags && prod.tags.length > 0 ? prod.tags.join(', ') : '');
    setKeywordsText(prod.searchKeywords && prod.searchKeywords.length > 0 ? prod.searchKeywords.join(', ') : '');
    setProductModalOpen(true);
  };

  const handleAutoGenerateSEO = async () => {
    if (!editingProduct.title?.trim()) {
      onShowToast('Please enter a Product Title first.', 'error');
      return;
    }
    const cleanTitle = editingProduct.title.trim();
    setIsGeneratingAISeo(true);

    try {
      const res = await fetch('/api/ai/generate-product-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle,
          category: editingProduct.categoryId || 'courses',
          pricePKR: editingProduct.pricePKR || 279,
          existingDescription: editingProduct.shortDescription || editingProduct.description || '',
          existingFeatures: featuresText ? featuresText.split('\n').filter(Boolean) : []
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        const seo = json.data;
        setEditingProduct(prev => ({
          ...prev,
          slug: seo.slug || prev.slug,
          metaTitle: seo.metaTitle || prev.metaTitle,
          metaDescription: seo.metaDescription || prev.metaDescription,
          focusKeyword: seo.focusKeyword || prev.focusKeyword,
          shortDescription: prev.shortDescription || seo.shortDescription || prev.description
        }));

        if (seo.searchKeywords && Array.isArray(seo.searchKeywords) && !keywordsText.trim()) {
          setKeywordsText(seo.searchKeywords.join(', '));
        }

        const isLive = json.isAiGenerated;
        onShowToast(
          isLive 
            ? '✨ Highly Qualified Gemini 3.8 Flash AI SEO & Copy generated!' 
            : '⚡ Smart High-Precision SEO generated!',
          'success'
        );
      } else {
        throw new Error(json.error || 'Failed to generate SEO');
      }
    } catch (err: any) {
      console.warn('AI SEO generation fallback used:', err);
      // Fallback deterministic generation
      const generatedSlug = cleanTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);

      const priceStr = editingProduct.pricePKR && Number(editingProduct.pricePKR) > 0 
        ? `Rs. ${editingProduct.pricePKR}` 
        : `Rs. ${pricing.flatPricePKR || 279}`;
      let genMetaTitle = `${cleanTitle} (${priceStr}) | DigiForge`;
      if (genMetaTitle.length > 60) {
        genMetaTitle = `${cleanTitle.slice(0, 38)}... (${priceStr}) | DigiForge`;
      }

      const summary = editingProduct.shortDescription || editingProduct.description || cleanTitle;
      const baseSnippet = summary.length > 75 ? summary.slice(0, 75).trim() + '...' : summary.trim();
      const genMetaDesc = `Get ${cleanTitle} for ${priceStr}. ${baseSnippet} Instant Google Drive access & lifetime license at Zohaib DigiForge.`.slice(0, 155);
      const genFocusKeyword = cleanTitle.split(' ').slice(0, 3).join(' ').toLowerCase();

      setEditingProduct(prev => ({
        ...prev,
        slug: prev.slug?.trim() || generatedSlug,
        metaTitle: genMetaTitle,
        metaDescription: genMetaDesc,
        focusKeyword: prev.focusKeyword?.trim() || genFocusKeyword
      }));

      onShowToast('⚡ Smart SEO Meta Title, Description & Slug generated!', 'success');
    } finally {
      setIsGeneratingAISeo(false);
    }
  };

  const handleToggleHomeVisibility = async (prod: Product) => {
    const newShowOnHome = prod.showOnHome === false ? true : false;
    try {
      const updatedProd: Product = {
        ...prod,
        showOnHome: newShowOnHome,
        updatedAt: new Date().toISOString()
      };
      await saveProductToDb(updatedProd, false);
      onShowToast(
        `"${prod.title}" is now ${newShowOnHome ? 'VISIBLE on' : 'HIDDEN from'} Homepage!`,
        'success'
      );
      onRefreshData();
    } catch (err) {
      console.error('Error toggling home visibility:', err);
      onShowToast('Failed to update home visibility in Firestore.', 'error');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct.title?.trim()) {
      onShowToast('Product title is required.', 'error');
      return;
    }

    try {
      const pId = editingProduct.id || 'prod-' + Date.now();
      const parsedFeatures = featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const parsedTags = tagsText
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const parsedKeywords = keywordsText
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const imgUrl = editingProduct.thumbnail || editingProduct.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

      const isProTool = editingProduct.categoryId === 'pro-tools';
      const productToSave: Product = {
        id: pId,
        title: editingProduct.title.trim(),
        categoryId: editingProduct.categoryId || 'courses',
        subcategoryId: editingProduct.subcategoryId || '',
        pricePKR: editingProduct.pricePKR !== undefined && Number(editingProduct.pricePKR) > 0 ? Number(editingProduct.pricePKR) : undefined,
        priceUSD: editingProduct.priceUSD !== undefined && Number(editingProduct.priceUSD) > 0 
          ? Number(editingProduct.priceUSD) 
          : (editingProduct.pricePKR && Number(editingProduct.pricePKR) > 0 
              ? Number((Number(editingProduct.pricePKR) / (pricing.flatPricePKR || 279)).toFixed(2)) 
              : undefined),
        originalPricePKR: editingProduct.originalPricePKR ? Number(editingProduct.originalPricePKR) : undefined,
        originalPriceUSD: editingProduct.originalPriceUSD ? Number(editingProduct.originalPriceUSD) : undefined,
        shortDescription: editingProduct.shortDescription || editingProduct.description || '',
        fullDescription: editingProduct.fullDescription || editingProduct.description || '',
        description: editingProduct.fullDescription || editingProduct.shortDescription || editingProduct.description || '',
        downloadUrl: editingProduct.downloadUrl?.trim() || '',
        image: imgUrl,
        thumbnail: imgUrl,
        fileFormat: editingProduct.fileFormat?.trim() || 'ZIP Archive / Google Drive',
        fileSize: editingProduct.fileSize?.trim() || 'Instant Access',
        deliveryMethod: (editingProduct.deliveryMethod as any) || 'Instant Download',
        badge: (editingProduct.badge as any) || undefined,
        features: parsedFeatures,
        tags: parsedTags,
        searchKeywords: parsedKeywords,
        slug: editingProduct.slug?.trim() || undefined,
        metaTitle: editingProduct.metaTitle?.trim() || undefined,
        metaDescription: editingProduct.metaDescription?.trim() || undefined,
        focusKeyword: editingProduct.focusKeyword?.trim() || undefined,
        previewImages: editingProduct.previewImages && editingProduct.previewImages.length > 0 ? editingProduct.previewImages : undefined,
        previewNote: editingProduct.previewNote?.trim() || undefined,
        stockQuantity: editingProduct.stockQuantity !== undefined && editingProduct.stockQuantity !== null && String(editingProduct.stockQuantity) !== '' ? Number(editingProduct.stockQuantity) : undefined,
        isNew: !!editingProduct.isNew,
        isBestseller: !!editingProduct.isBestseller,
        isFeatured: !!editingProduct.isFeatured,
        showOnHome: editingProduct.showOnHome !== false,
        updatedAt: new Date().toISOString()
      };

      const isNewProd = !editingProduct.id;
      await saveProductToDb(productToSave, isNewProd);
      onShowToast(`Product "${productToSave.title}" saved & email alert dispatched!`, 'success');
      setProductModalOpen(false);
      onRefreshData();
    } catch (e) {
      console.error('Error saving product:', e);
      onShowToast('Error saving product to Firestore.', 'error');
    }
  };

  const handleDeleteProduct = (pId: string, title: string) => {
    onRequireReAuth(
      `Delete Product "${title}"`,
      `Are you sure you want to permanently delete this digital resource product from Firestore?`,
      async () => {
        try {
          await deleteProductFromDb(pId);
          onShowToast(`Product "${title}" deleted`, 'success');
          onRefreshData();
        } catch (e) {
          onShowToast('Error deleting product', 'error');
        }
      }
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY ACTIONS (CRUD)
  // ═══════════════════════════════════════════════════════════════
  const handleOpenAddCategory = () => {
    setEditingCategory({
      id: '',
      name: '',
      slug: '',
      icon: '📦',
      description: '',
      order: (categories.length || 0) + 1,
      featuredColor: 'from-[#0D6EFD]/20 to-[#28B9FF]/20'
    });
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory({
      ...cat,
      order: cat.order || 1,
      featuredColor: cat.featuredColor || 'from-[#0D6EFD]/20 to-[#28B9FF]/20'
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory.name?.trim()) {
      onShowToast('Category name is required.', 'error');
      return;
    }

    try {
      const generatedSlug = editingCategory.slug?.trim() || editingCategory.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
      const cId = editingCategory.id || generatedSlug || 'cat-' + Date.now();

      const categoryToSave: Category = {
        id: cId,
        name: editingCategory.name.trim(),
        slug: generatedSlug,
        icon: editingCategory.icon?.trim() || '📦',
        description: editingCategory.description?.trim() || '',
        order: editingCategory.order ? Number(editingCategory.order) : 1,
        featuredColor: editingCategory.featuredColor || 'from-[#0D6EFD]/20 to-[#28B9FF]/20'
      };

      await saveCategoryToDb(categoryToSave);
      onShowToast(`Category "${categoryToSave.name}" saved successfully!`, 'success');
      setCategoryModalOpen(false);
      onRefreshData();
    } catch (e) {
      console.error('Error saving category:', e);
      onShowToast('Error saving category to Firestore.', 'error');
    }
  };

  const handleDeleteCategory = (catId: string, name: string) => {
    const linkedProds = products.filter(p => p.categoryId === catId || p.categoryId === name.toLowerCase().replace(/ /g, '-'));
    const linkedSubs = subcategories.filter(s => s.categoryId === catId);
    
    let warningMsg = '';
    if (linkedProds.length > 0 || linkedSubs.length > 0) {
      warningMsg = ` (Note: ${linkedProds.length} products & ${linkedSubs.length} subcategories currently belong to this category).`;
    }

    onRequireReAuth(
      `Delete Category "${name}"`,
      `Are you sure you want to permanently delete category "${name}"?${warningMsg}`,
      async () => {
        try {
          await deleteCategoryFromDb(catId);
          onShowToast(`Category "${name}" deleted successfully!`, 'success');
          onRefreshData();
        } catch (e) {
          console.error('Error deleting category:', e);
          onShowToast('Error deleting category from Firestore.', 'error');
        }
      }
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // SUBCATEGORY ACTIONS (CRUD)
  // ═══════════════════════════════════════════════════════════════
  const handleOpenAddSubcategory = () => {
    const defaultCatId = categories[0]?.id || '';
    setEditingSubcategory({
      id: '',
      name: '',
      slug: '',
      categoryId: defaultCatId,
      description: '',
      order: (subcategories.length || 0) + 1
    });
    setSubcategoryModalOpen(true);
  };

  const handleOpenEditSubcategory = (sub: Subcategory) => {
    setEditingSubcategory({
      ...sub,
      order: sub.order || 1
    });
    setSubcategoryModalOpen(true);
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory.name?.trim()) {
      onShowToast('Subcategory name is required.', 'error');
      return;
    }
    if (!editingSubcategory.categoryId) {
      onShowToast('Parent category selection is required.', 'error');
      return;
    }

    try {
      const generatedSlug = editingSubcategory.slug?.trim() || editingSubcategory.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
      const sId = editingSubcategory.id || generatedSlug || 'subcat-' + Date.now();

      const subcategoryToSave: Subcategory = {
        id: sId,
        categoryId: editingSubcategory.categoryId,
        name: editingSubcategory.name.trim(),
        slug: generatedSlug,
        description: editingSubcategory.description?.trim() || '',
        order: editingSubcategory.order ? Number(editingSubcategory.order) : 1
      };

      await saveSubcategoryToDb(subcategoryToSave);
      onShowToast(`Subcategory "${subcategoryToSave.name}" saved successfully!`, 'success');
      setSubcategoryModalOpen(false);
      onRefreshData();
    } catch (e) {
      console.error('Error saving subcategory:', e);
      onShowToast('Error saving subcategory to Firestore.', 'error');
    }
  };

  const handleDeleteSubcategory = (subId: string, name: string) => {
    const linkedProds = products.filter(p => p.subcategoryId === subId);
    let warningMsg = '';
    if (linkedProds.length > 0) {
      warningMsg = ` (Note: ${linkedProds.length} products currently belong to this subcategory).`;
    }

    onRequireReAuth(
      `Delete Subcategory "${name}"`,
      `Are you sure you want to delete subcategory "${name}"?${warningMsg}`,
      async () => {
        try {
          await deleteSubcategoryFromDb(subId);
          onShowToast(`Subcategory "${name}" deleted successfully!`, 'success');
          onRefreshData();
        } catch (e) {
          console.error('Error deleting subcategory:', e);
          onShowToast('Error deleting subcategory from Firestore.', 'error');
        }
      }
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // CSV IMPORT
  // ═══════════════════════════════════════════════════════════════
  const handleBulkCsvImport = async () => {
    if (!csvText.trim()) {
      onShowToast('Paste valid CSV content first.', 'error');
      return;
    }

    setImportingCsv(true);
    try {
      const lines = csvText.trim().split('\n');
      let count = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && line.toLowerCase().includes('title'))) continue; // skip header

        const parts = line.split(',');
        if (parts.length >= 2) {
          const title = parts[0]?.trim().replace(/^"|"$/g, '');
          const pricePKR = Number(parts[1]?.trim()) || 499;
          const categoryId = parts[2]?.trim().toLowerCase() || 'courses';
          const downloadUrl = parts[3]?.trim() || '';

          const pId = 'csv-prod-' + Date.now() + '-' + i;
          const prod: Product = {
            id: pId,
            title,
            pricePKR,
            priceUSD: Math.round(pricePKR / 200 * 100) / 100 || 2.5,
            categoryId,
            subcategoryId: 'dev-courses',
            description: `Imported resource ${title}`,
            downloadUrl,
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
            isNew: true
          };

          await saveProductToDb(prod, true);
          count++;
        }
      }

      onShowToast(`Bulk imported ${count} products to Firestore!`, 'success');
      setCsvText('');
      onRefreshData();
    } catch (e) {
      onShowToast('Error during bulk CSV import.', 'error');
    } finally {
      setImportingCsv(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">Resources &amp; Catalog Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage digital products, categories, subcategories &amp; bulk CSV batch import</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'products' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Products ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'categories' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subcategories')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'subcategories' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Subcategories ({subcategories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tags')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tags' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Tags Manager</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'csv' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk CSV Import</span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════
          TAB 1: PRODUCTS TABLE & CRUD
      ═════════════════════════════════════════════════════ */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search product title..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#0D6EFD]"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-[#0D6EFD]"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2.5 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Resource</span>
            </button>
          </div>

          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                    <th className="p-4">Resource</th>
                    <th className="p-4">Category / Subcat</th>
                    <th className="p-4">Specs (Format &amp; Size)</th>
                    <th className="p-4">Price (PKR)</th>
                    <th className="p-4">Home Display</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Badges &amp; Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No resources found matching search filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.thumbnail || prod.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-950"
                            />
                            <div className="min-w-0 max-w-xs">
                              <div className="font-bold text-white truncate">{prod.title}</div>
                              <div className="text-[10px] text-slate-400 truncate flex items-center gap-2">
                                <span>{prod.downloadUrl ? '🔗 Cloud Link Configured' : '⚠️ No Download Link'}</span>
                                <span className="px-1.5 py-0.5 rounded bg-[#25D366]/10 text-[#25D366] font-bold border border-[#25D366]/20 inline-flex items-center gap-0.5">
                                  🔗 {prod.shareCount || 0} shares
                                </span>
                              </div>
                              {prod.tags && prod.tags.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {prod.tags.slice(0, 3).map((tag, idx) => (
                                    <span key={idx} className="px-1.5 py-0.2 bg-slate-800 border border-slate-700/60 rounded text-[9px] text-[#28B9FF] font-medium">
                                      #{tag}
                                    </span>
                                  ))}
                                  {prod.tags.length > 3 && (
                                    <span className="text-[9px] text-slate-500 font-medium">+{prod.tags.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-semibold block w-fit">
                            {prod.categoryId}
                          </span>
                          {prod.subcategoryId && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {prod.subcategoryId}
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="text-[11px] font-medium text-slate-200">
                            {prod.fileFormat || 'ZIP Archive'}
                          </div>
                          <div className="text-[10px] text-amber-300 font-mono">
                            {prod.fileSize || 'Instant Access'}
                          </div>
                        </td>

                        <td className="p-4 font-black text-[#28B9FF] text-xs">
                          <div>{formatCombinedProductPrice(prod)}</div>
                          {prod.categoryId === 'pro-tools' ? (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                              ⚡ Cat 6 Custom Rate
                            </span>
                          ) : (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-medium">
                              Flat Rs. 279 / $1
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleToggleHomeVisibility(prod)}
                            className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold inline-flex items-center gap-1.5 transition-all shadow-sm ${
                              prod.showOnHome !== false
                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-[#22C55E]'
                                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400'
                            }`}
                            title={prod.showOnHome !== false ? 'Click to hide this product from Homepage' : 'Click to show this product on Homepage'}
                          >
                            {prod.showOnHome !== false ? (
                              <>
                                <Home className="w-3.5 h-3.5 text-[#22C55E]" />
                                <span>Shown on Home</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                                <span>Hidden from Home</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="p-4 text-slate-300">
                          {prod.stockQuantity === undefined ? (
                            <span className="text-[#22C55E] font-bold">Unlimited</span>
                          ) : (
                            <span className="font-mono font-bold text-amber-300">{prod.stockQuantity} Left</span>
                          )}
                        </td>

                        <td className="p-4 space-x-1">
                          {prod.badge && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase">
                              {prod.badge}
                            </span>
                          )}
                          {prod.isNew && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#22C55E] text-[9px] font-black">
                              NEW
                            </span>
                          )}
                          {prod.isBestseller && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-black">
                              HOT
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.title)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>Page {currentPage} of {totalPages}</div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════
          TAB 2: CATEGORIES CRUD MANAGEMENT
      ═════════════════════════════════════════════════════ */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Filter category name or slug..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#0D6EFD]"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
              <div className="text-xs text-slate-400 font-semibold hidden md:block">
                Total: {filteredCategories.length} Categories
              </div>
            </div>

            <button
              onClick={handleOpenAddCategory}
              className="px-4 py-2 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.length === 0 ? (
              <div className="col-span-full p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-500">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-sm font-semibold">No categories found in Firestore.</p>
                <p className="text-xs mt-1">Click "+ Create Category" to add your first store category.</p>
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const linkedProductCount = products.filter(p => p.categoryId === cat.id || p.categoryId === cat.slug || p.categoryId === cat.name.toLowerCase().replace(/ /g, '-')).length;
                const linkedSubcatCount = subcategories.filter(s => s.categoryId === cat.id).length;

                return (
                  <div key={cat.id} className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl hover:border-slate-700 transition-all group overflow-hidden">
                    {/* Background color gradient accent */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.featuredColor || 'from-[#0D6EFD]/10 to-[#28B9FF]/10'} opacity-30 pointer-events-none rounded-3xl`} />

                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center text-2xl shadow-inner shrink-0">
                          {cat.icon || '📦'}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 font-mono">
                            Order: #{cat.order || 1}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-white group-hover:text-[#28B9FF] transition-colors">{cat.name}</h4>
                        <p className="text-[11px] font-mono text-[#0D6EFD] mt-0.5">slug: /{cat.slug || cat.id}</p>
                        {cat.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-bold">
                          {linkedProductCount} Products
                        </span>
                        <span className="px-2 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-amber-300 font-bold">
                          {linkedSubcatCount} Subcats
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                          title="Edit Category"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════
          TAB 3: SUBCATEGORIES CRUD MANAGEMENT
      ═════════════════════════════════════════════════════ */}
      {activeTab === 'subcategories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  value={subcategorySearch}
                  onChange={(e) => setSubcategorySearch(e.target.value)}
                  placeholder="Filter subcategory title..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#0D6EFD]"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>

              <select
                value={subcategoryCategoryFilter}
                onChange={(e) => setSubcategoryCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-[#0D6EFD]"
              >
                <option value="all">All Parent Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAddSubcategory}
              className="px-4 py-2 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Subcategory</span>
            </button>
          </div>

          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                    <th className="p-4">Subcategory Name &amp; Slug</th>
                    <th className="p-4">Parent Category</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Order</th>
                    <th className="p-4">Linked Products</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredSubcategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No subcategories found in Firestore.
                      </td>
                    </tr>
                  ) : (
                    filteredSubcategories.map((sub) => {
                      const parentCat = categories.find(c => c.id === sub.categoryId);
                      const linkedProdCount = products.filter(p => p.subcategoryId === sub.id).length;

                      return (
                        <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white text-sm">{sub.name}</div>
                            <div className="text-[11px] font-mono text-[#0D6EFD]">slug: /{sub.slug || sub.id}</div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 border border-slate-700">
                              <span>{parentCat?.icon || '📦'}</span>
                              <span>{parentCat?.name || sub.categoryId}</span>
                            </span>
                          </td>

                          <td className="p-4 text-slate-400 max-w-xs truncate">
                            {sub.description || <span className="text-slate-600 italic">No description</span>}
                          </td>

                          <td className="p-4 text-slate-300 font-mono">
                            #{sub.order || 1}
                          </td>

                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[#22C55E] text-[11px] font-bold">
                              {linkedProdCount} Items
                            </span>
                          </td>

                          <td className="p-4 text-right space-x-1.5">
                            <button
                              onClick={() => handleOpenEditSubcategory(sub)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="Edit Subcategory"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                              title="Delete Subcategory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════
          TAB 4: BULK CSV IMPORT
      ═════════════════════════════════════════════════════ */}
      {activeTab === 'csv' && (
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Bulk Batch Product CSV Import</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Paste CSV formatted text to add dozens of digital resources at once for daily collection drops. Format per line: <code className="text-[#28B9FF] font-mono">Title, PricePKR, CategoryId, DownloadUrl</code>
          </p>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Title,PricePKR,CategoryId,DownloadUrl\nComplete Python Masterclass 2026,499,courses,https://drive.google.com/file/1...\nAdobe Premiere FX Presets Pack,499,templates,https://drive.google.com/file/2...`}
            rows={10}
            className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-[#0D6EFD]"
          />

          <button
            onClick={handleBulkCsvImport}
            disabled={importingCsv}
            className="px-6 py-3 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white font-black text-xs shadow-lg flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{importingCsv ? 'Processing Import...' : 'Import CSV Products Now'}</span>
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════
          CREATE / EDIT CATEGORY MODAL
      ═════════════════════════════════════════════════════ */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0D1527] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0D6EFD]" />
                  <span>{editingCategory.id ? 'Edit Category' : 'Create New Category'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Define category title, icon, color gradient &amp; display ordering.</p>
              </div>
              <button 
                type="button"
                onClick={() => setCategoryModalOpen(false)} 
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Category Name *</label>
                <input
                  type="text"
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ 
                    ...editingCategory, 
                    name: e.target.value,
                    slug: editingCategory.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')
                  })}
                  placeholder="e.g. Developer Courses &amp; Bootcamps"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#0D6EFD] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">URL Slug</label>
                  <input
                    type="text"
                    value={editingCategory.slug || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    placeholder="e.g. courses"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 font-mono focus:border-[#0D6EFD] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Display Order</label>
                  <input
                    type="number"
                    value={editingCategory.order || 1}
                    onChange={(e) => setEditingCategory({ ...editingCategory, order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#0D6EFD] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Category Icon (Emoji or SVG Name)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={editingCategory.icon || '📦'}
                    onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    placeholder="e.g. 🎓 or GraduationCap"
                    className="w-20 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-base text-center focus:border-[#0D6EFD] focus:outline-none"
                  />
                  <div className="flex-1 flex gap-1 items-center flex-wrap overflow-x-auto p-1 bg-slate-950 border border-slate-800 rounded-xl">
                    {PRESET_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setEditingCategory({ ...editingCategory, icon: emoji })}
                        className="p-1 text-sm hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Card Color Gradient Theme</label>
                <select
                  value={editingCategory.featuredColor || 'from-[#0D6EFD]/20 to-[#28B9FF]/20'}
                  onChange={(e) => setEditingCategory({ ...editingCategory, featuredColor: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1"
                >
                  {PRESET_GRADIENTS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Short description of resources inside this category..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#0D6EFD] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-black shadow-lg shadow-[#0D6EFD]/25 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════
          CREATE / EDIT SUBCATEGORY MODAL
      ═════════════════════════════════════════════════════ */}
      {subcategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0D1527] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-[#0D6EFD]" />
                  <span>{editingSubcategory.id ? 'Edit Subcategory' : 'Create New Subcategory'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Link a subcategory to a parent store category.</p>
              </div>
              <button 
                type="button"
                onClick={() => setSubcategoryModalOpen(false)} 
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Parent Category *</label>
                <select
                  value={editingSubcategory.categoryId || ''}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, categoryId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#0D6EFD] focus:outline-none"
                  required
                >
                  <option value="">Select Parent Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon || '📦'} {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Subcategory Name *</label>
                <input
                  type="text"
                  value={editingSubcategory.name || ''}
                  onChange={(e) => setEditingSubcategory({ 
                    ...editingSubcategory, 
                    name: e.target.value,
                    slug: editingSubcategory.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')
                  })}
                  placeholder="e.g. Web Development Bootcamps"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#0D6EFD] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">URL Slug</label>
                  <input
                    type="text"
                    value={editingSubcategory.slug || ''}
                    onChange={(e) => setEditingSubcategory({ ...editingSubcategory, slug: e.target.value })}
                    placeholder="e.g. web-dev"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 font-mono focus:border-[#0D6EFD] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Display Order</label>
                  <input
                    type="number"
                    value={editingSubcategory.order || 1}
                    onChange={(e) => setEditingSubcategory({ ...editingSubcategory, order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#0D6EFD] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  value={editingSubcategory.description || ''}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, description: e.target.value })}
                  placeholder="Overview of items within this subcategory..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#0D6EFD] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubcategoryModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-black shadow-lg shadow-[#0D6EFD]/25 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Subcategory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE/EDIT PRODUCT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#0D1527] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#28B9FF]" />
                  <span>{editingProduct.id ? 'Edit Resource Product' : 'Add New Digital Resource'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure all product page specifications, format, size, drive download links &amp; inclusions.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setProductModalOpen(false)} 
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              
              {/* SECTION 1: CORE DETAILS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#28B9FF] uppercase tracking-wider">
                  1. General Information
                </h4>
                
                <div>
                  <label className="text-xs font-semibold text-slate-300">Product Title *</label>
                  <input
                    type="text"
                    value={editingProduct.title || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    placeholder="e.g. Master React & Node.js Fullstack Course 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#0D6EFD] focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Category</label>
                    <select
                      value={editingProduct.categoryId}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        const sub = subcategories.find(s => s.categoryId === newCat)?.id || '';
                        setEditingProduct({ ...editingProduct, categoryId: newCat, subcategoryId: sub });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Subcategory</label>
                    <select
                      value={editingProduct.subcategoryId || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, subcategoryId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1"
                    >
                      <option value="">General / Default</option>
                      {subcategories
                        .filter(s => s.categoryId === editingProduct.categoryId)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Badge / Tag</label>
                    <select
                      value={editingProduct.badge || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, badge: (e.target.value as any) || undefined })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1"
                    >
                      <option value="">No Badge</option>
                      <option value="Bestseller">Bestseller</option>
                      <option value="New">New</option>
                      <option value="Popular">Popular</option>
                      <option value="Hot Deal">Hot Deal</option>
                      <option value="Featured">Featured</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TECHNICAL SPECS & DELIVERY */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <h4 className="text-xs font-black text-[#22C55E] uppercase tracking-wider">
                  2. Product Format, Size &amp; Delivery Method
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">File Format (e.g. MP4, ZIP, Figma)</label>
                    <input
                      type="text"
                      value={editingProduct.fileFormat || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fileFormat: e.target.value })}
                      placeholder="e.g. MP4 (1080p Full HD) / ZIP Archive"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#22C55E] focus:outline-none"
                    />
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {['ZIP Archive', 'MP4 (1080p)', 'Figma + PSD', 'PDF & Notion'].map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, fileFormat: fmt })}
                          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white"
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">File Size (e.g. 45.2 GB, 2.4 GB)</label>
                    <input
                      type="text"
                      value={editingProduct.fileSize || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fileSize: e.target.value })}
                      placeholder="e.g. 45.2 GB Total or 2.4 GB"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#22C55E] focus:outline-none"
                    />
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {['45.2 GB', '12.8 GB', '2.4 GB', '850 MB', 'Instant Access'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, fileSize: sz })}
                          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white"
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Delivery Method</label>
                    <select
                      value={editingProduct.deliveryMethod || 'Instant Download'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, deliveryMethod: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1"
                    >
                      <option value="Instant Download">Instant Download</option>
                      <option value="Instant License Key">Instant License Key</option>
                      <option value="Dashboard Invite">Dashboard Invite</option>
                      <option value="WhatsApp Direct">WhatsApp Direct</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Google Drive / Resource Download Link</label>
                  <input
                    type="text"
                    value={editingProduct.downloadUrl || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, downloadUrl: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/... or direct download link"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#0D6EFD] focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Customers receive this exact download URL upon order payment approval and in their dashboard.
                  </p>
                </div>
              </div>

              {/* SECTION 3: PRICING & STOCK */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    3. Pricing, Custom Rates &amp; Stock Limit
                  </h4>
                  {editingProduct.categoryId === 'pro-tools' ? (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-cyan-500/30">
                      ⚡ Category 6: Pro Tools (Custom Pricing Active)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[#22C55E] text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                      Categories 1–5: Flat Store Rate (Rs. 279 / $1)
                    </span>
                  )}
                </div>

                {editingProduct.categoryId === 'pro-tools' ? (
                  /* CATEGORY 6: PRO TOOLS CUSTOM PRICING INPUTS */
                  <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/50 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyan-300 font-bold">Category 6 Custom Selling Rate</span>
                      <span className="text-[11px] text-slate-400 font-mono">1 USD = {pricing.flatPricePKR || 279} PKR</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Price in PKR (Rs.) *</label>
                        <input
                          type="number"
                          value={editingProduct.pricePKR !== undefined ? editingProduct.pricePKR : ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            const rate = pricing.flatPricePKR || 279;
                            const autoUSD = val ? Number((val / rate).toFixed(2)) : undefined;
                            setEditingProduct({
                              ...editingProduct,
                              pricePKR: val,
                              priceUSD: autoUSD
                            });
                          }}
                          placeholder="e.g. 499, 799, 999, 1499"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-cyan-700/60 text-white text-xs mt-1 focus:border-cyan-400 focus:outline-none font-bold"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-300">Price in USD ($) *</label>
                          {editingProduct.pricePKR && (
                            <button
                              type="button"
                              onClick={() => {
                                const rate = pricing.flatPricePKR || 279;
                                const pkr = Number(editingProduct.pricePKR) || 279;
                                setEditingProduct({
                                  ...editingProduct,
                                  priceUSD: Number((pkr / rate).toFixed(2))
                                });
                              }}
                              className="text-[10px] text-cyan-400 hover:underline"
                            >
                              Auto Calc @ 279/USD
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={editingProduct.priceUSD !== undefined ? editingProduct.priceUSD : ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, priceUSD: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="e.g. 1.79, 3.58"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-cyan-700/60 text-white text-xs mt-1 focus:border-cyan-400 focus:outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CATEGORIES 1-5: FLAT STORE PRICING NOTICE */
                  <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Universal Flat Rate (Categories 1–5)</div>
                      <div className="text-xs font-black text-emerald-400 mt-0.5">
                        {formatCombinedPrice()}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      Managed in Site Settings → Pricing (279 Rs / 1$)
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Original Slashed Price (PKR)</label>
                    <input
                      type="number"
                      value={editingProduct.originalPricePKR || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, originalPricePKR: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="e.g. 1999 (Shows discount %)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Original Slashed Price (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.originalPriceUSD || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, originalPriceUSD: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="e.g. 9.99"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Stock Limit (Leave blank for Unlimited)</label>
                  <input
                    type="number"
                    value={editingProduct.stockQuantity !== undefined ? editingProduct.stockQuantity : ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockQuantity: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Leave empty for Unlimited Digital Downloads"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1"
                  />
                </div>
              </div>

              {/* SECTION 4: THUMBNAIL / IMAGE (DRAG & DROP + CLOUDINARY) */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider">
                  4. Thumbnail &amp; Showcase Image (Drag &amp; Drop / Cloudinary)
                </h4>

                <ImageUploadDropzone
                  value={editingProduct.thumbnail || editingProduct.image || ''}
                  onChange={(newUrl) => {
                    setEditingProduct({
                      ...editingProduct,
                      thumbnail: newUrl,
                      image: newUrl
                    });
                  }}
                  label="Upload or Drag & Drop Product Thumbnail"
                />
              </div>

              {/* SECTION 4B: SAMPLE PREVIEW SCREENSHOTS & NOTE */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#28B9FF] uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#28B9FF]" />
                    <span>4b. Sample Preview Screenshots &amp; Note (Trust Builder)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">2-5 Screenshots</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Preview Caption / Note</label>
                  <input
                    type="text"
                    value={editingProduct.previewNote || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, previewNote: e.target.value })}
                    placeholder="e.g. Sample pages from the actual PDF / Inside Look of the OS"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Sample Preview Screenshots</label>
                  
                  {editingProduct.previewImages && editingProduct.previewImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                      {editingProduct.previewImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-800 group h-20 bg-slate-950">
                          <img src={imgUrl} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editingProduct.previewImages || []).filter((_, i) => i !== idx);
                              setEditingProduct({ ...editingProduct, previewImages: updated });
                            }}
                            className="absolute top-1 right-1 p-1 rounded-lg bg-rose-500/90 text-white hover:bg-rose-600 transition-colors"
                            title="Remove Preview Image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <ImageUploadDropzone
                    value=""
                    onChange={(newUrl) => {
                      if (!newUrl) return;
                      const currentList = editingProduct.previewImages || [];
                      setEditingProduct({
                        ...editingProduct,
                        previewImages: [...currentList, newUrl]
                      });
                    }}
                    label="Upload or Drag & Drop Preview Screenshot (Cloudinary)"
                    helperText="Each uploaded image is added to the preview gallery for this product."
                  />
                </div>
              </div>

              {/* SECTION 5: DESCRIPTIONS & INCLUSIONS */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                  5. Descriptions &amp; What You Receive Inside
                </h4>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Short Summary Description</label>
                  <textarea
                    value={editingProduct.shortDescription || editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value, description: e.target.value })}
                    placeholder="Short 2-3 sentence overview displayed on product hero and listing cards..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Detailed Full Description (Overview Tab)</label>
                  <textarea
                    value={editingProduct.fullDescription || editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, fullDescription: e.target.value })}
                    placeholder="Complete detailed scope, what is included, curriculum, tools required..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>What You Receive Inside (1 Item Per Line)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Shows green checkmarks on product page</span>
                  </label>
                  <textarea
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    placeholder={`Complete Master High-Resolution Assets\nLifetime Google Drive Archive Access\nStep-by-Step Setup Video & Documentation Guides\n100% Commercial & Personal Use License Rights\nFree Lifetime Automatic Product Updates`}
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 font-mono leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-[#0D6EFD]" />
                      <span>Product Tags &amp; Search Keywords</span>
                    </span>
                    <span className="text-[10px] text-[#28B9FF] font-medium">Click presets below or type custom tag</span>
                  </label>

                  {/* Active Selected Tags Chips */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 min-h-[50px] space-y-2">
                    {(() => {
                      const currentTagsList = tagsText.split(',').map(t => t.trim()).filter(Boolean);
                      return (
                        <>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {currentTagsList.length === 0 ? (
                              <span className="text-xs text-slate-500 italic">No tags selected yet. Pick presets below or type custom tag...</span>
                            ) : (
                              currentTagsList.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-xl bg-[#0D6EFD]/20 border border-[#0D6EFD]/40 text-[#28B9FF] text-xs font-semibold flex items-center gap-1.5 group animate-in fade-in"
                                >
                                  <span>#{tag}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const filtered = currentTagsList.filter((_, i) => i !== idx);
                                      setTagsText(filtered.join(', '));
                                    }}
                                    className="p-0.5 rounded-md hover:bg-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
                                    title={`Remove tag "${tag}"`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>

                          {/* Manual Input Field for Adding Custom Tags */}
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                            <input
                              type="text"
                              value={tagsText}
                              onChange={(e) => setTagsText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const parts = tagsText.split(',').map(t => t.trim()).filter(Boolean);
                                  setTagsText(parts.join(', '));
                                }
                              }}
                              placeholder="Type custom tags separated by comma (e.g. Next.js, AI Prompts, Docker)..."
                              className="w-full bg-transparent text-white text-xs placeholder-slate-600 focus:outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const parts = tagsText.split(',').map(t => t.trim()).filter(Boolean);
                                setTagsText(parts.join(', '));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-bold shrink-0 border border-slate-800"
                            >
                              Format Tags
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Categorized Quick Presets */}
                  <div className="mt-3 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 block">Quick Preset Categories (Click to toggle):</span>
                    
                    {/* Category 1: Tech & Coding */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">💻 Development &amp; Tech</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['React', 'Node.js', 'Python', 'Fullstack', 'Source Code', 'Tailwind CSS', 'Next.js', 'TypeScript', 'Flutter', 'Laravel'].map((preset) => {
                          const currentTags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
                          const isSelected = currentTags.includes(preset);
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setTagsText(currentTags.filter(t => t !== preset).join(', '));
                                } else {
                                  setTagsText([...currentTags, preset].join(', '));
                                }
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all flex items-center gap-1 border ${
                                isSelected
                                  ? 'bg-[#0D6EFD] text-white border-[#0D6EFD] shadow-sm font-bold'
                                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              <span>{isSelected ? '✓' : '+'}</span>
                              <span>{preset}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category 2: Design & Graphics */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">🎨 Design &amp; Assets</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Figma', 'Photoshop PSD', 'Illustrator AI', 'Canva', 'UI/UX Kit', 'Icon Pack', '3D Model', 'Preset FX'].map((preset) => {
                          const currentTags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
                          const isSelected = currentTags.includes(preset);
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setTagsText(currentTags.filter(t => t !== preset).join(', '));
                                } else {
                                  setTagsText([...currentTags, preset].join(', '));
                                }
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all flex items-center gap-1 border ${
                                isSelected
                                  ? 'bg-purple-600 text-white border-purple-500 shadow-sm font-bold'
                                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              <span>{isSelected ? '✓' : '+'}</span>
                              <span>{preset}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category 3: Courses & Docs */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">📚 Education &amp; Templates</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Masterclass', 'Video Course', 'E-Book PDF', 'Notion Template', 'Cheatsheet', 'Google Drive', 'Commercial License'].map((preset) => {
                          const currentTags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
                          const isSelected = currentTags.includes(preset);
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setTagsText(currentTags.filter(t => t !== preset).join(', '));
                                } else {
                                  setTagsText([...currentTags, preset].join(', '));
                                }
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all flex items-center gap-1 border ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-bold'
                                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              <span>{isSelected ? '✓' : '+'}</span>
                              <span>{preset}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Search Engine Keywords Input */}
                  <div className="pt-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-[#28B9FF]" />
                        <span>Search Engine Keywords &amp; Synonyms</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Comma separated for typo tolerance &amp; autocomplete</span>
                    </label>
                    <input
                      type="text"
                      value={keywordsText}
                      onChange={(e) => setKeywordsText(e.target.value)}
                      placeholder="e.g. psd, graphic design, editing suite, photoshop templates, adobe, course"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-[#0D6EFD] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: GOOGLE SEO & SERP PREVIEW */}
              <div className="space-y-3.5 pt-3 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-[#28B9FF] border border-blue-500/30">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
                        <span>6. Google Search Engine Optimization (SEO)</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-[#28B9FF] text-[9px] font-black tracking-normal">
                          SERP Preview
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Customize how this product ranks and looks in Google &amp; Bing search results
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoGenerateSEO}
                    disabled={isGeneratingAISeo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-[11px] font-bold shadow-md shadow-blue-500/20 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Automatically write optimized Meta Title, Description, and clean URL Slug using Gemini 3.8 Flash"
                  >
                    {isGeneratingAISeo ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                        <span>AI Analyzing &amp; Writing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                        <span>✨ Gemini AI Auto SEO</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Focus Keyword */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Primary Target / Focus Keyword</span>
                      <span className="text-[10px] text-slate-500">Main Google query</span>
                    </label>
                    <input
                      type="text"
                      value={editingProduct.focusKeyword || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, focusKeyword: e.target.value })}
                      placeholder="e.g. canva pro lifetime, python course pakistan, figma kit"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#0D6EFD] focus:outline-none"
                    />
                  </div>

                  {/* Clean URL Slug */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Clean URL Slug</label>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingProduct.title) {
                            const cleanSlug = editingProduct.title
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/^-+|-+$/g, '')
                              .slice(0, 60);
                            setEditingProduct({ ...editingProduct, slug: cleanSlug });
                          }
                        }}
                        className="text-[10px] text-blue-400 hover:underline"
                      >
                        Auto Slug
                      </button>
                    </div>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono select-none">/product/</span>
                      <input
                        type="text"
                        value={editingProduct.slug || ''}
                        onChange={(e) => {
                          const sanitized = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-_]/g, '-');
                          setEditingProduct({ ...editingProduct, slug: sanitized });
                        }}
                        placeholder="e.g. python-automation-scripts"
                        className="w-full pl-20 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-[#0D6EFD] focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Meta Title */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Google SEO Meta Title (Headline)</label>
                    {(() => {
                      const len = (editingProduct.metaTitle || '').length;
                      const isOptimal = len >= 40 && len <= 60;
                      return (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          len === 0 ? 'text-slate-500 bg-slate-900' :
                          isOptimal ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60' :
                          'text-amber-400 bg-amber-950/60 border border-amber-800/60'
                        }`}>
                          {len} / 60 chars {isOptimal && '✓ Optimal'}
                        </span>
                      );
                    })()}
                  </div>
                  <input
                    type="text"
                    value={editingProduct.metaTitle || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, metaTitle: e.target.value })}
                    placeholder="e.g. Python Automation Scripts Bundle (Rs. 279) | Zohaib DigiForge"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#0D6EFD] focus:outline-none"
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Google SEO Meta Description (Snippet)</label>
                    {(() => {
                      const len = (editingProduct.metaDescription || '').length;
                      const isOptimal = len >= 120 && len <= 160;
                      return (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          len === 0 ? 'text-slate-500 bg-slate-900' :
                          isOptimal ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60' :
                          'text-amber-400 bg-amber-950/60 border border-amber-800/60'
                        }`}>
                          {len} / 160 chars {isOptimal && '✓ Optimal'}
                        </span>
                      );
                    })()}
                  </div>
                  <textarea
                    value={editingProduct.metaDescription || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, metaDescription: e.target.value })}
                    placeholder="e.g. Download Complete Python Lead Generation & Web Scraping Scripts for Rs. 279. Verified Google Drive instant download with lifetime access at Zohaib DigiForge."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:border-[#0D6EFD] focus:outline-none"
                  />
                </div>

                {/* LIVE GOOGLE SEARCH SERP PREVIEW BOX */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold border-b border-slate-900 pb-1.5">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Google Search Result Preview (Google SERP)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">google.com/search</span>
                  </div>

                  {/* Google Snippet Card */}
                  <div className="p-3 rounded-xl bg-white text-slate-900 shadow-sm border border-slate-200 font-sans select-none max-w-full overflow-hidden">
                    {/* URL Breadcrumb */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded-full bg-[#0D6EFD] flex items-center justify-center text-[9px] text-white font-bold">
                        Z
                      </div>
                      <div className="text-[11px] text-slate-700 truncate leading-none">
                        <span className="font-semibold text-slate-900">Zohaib DigiForge</span>
                        <span className="text-slate-400 mx-1">›</span>
                        <span className="text-slate-500">product</span>
                        <span className="text-slate-400 mx-1">›</span>
                        <span className="text-slate-600 font-mono">{editingProduct.slug || editingProduct.id || 'prod-item'}</span>
                      </div>
                    </div>

                    {/* Google Blue Headline */}
                    <div className="text-[#1a0dab] hover:underline text-[15px] font-medium leading-snug cursor-pointer line-clamp-1">
                      {editingProduct.metaTitle || (editingProduct.title ? `${editingProduct.title} (Instant Download) | Zohaib DigiForge` : 'Product Title - Instant Download | Zohaib DigiForge')}
                    </div>

                    {/* Rich snippet review + price */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 my-0.5 flex-wrap">
                      <span className="text-[#e37400] font-bold flex items-center gap-0.5">
                        ★★★★★ <span className="text-slate-700 font-semibold ml-0.5">4.9</span>
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-emerald-700 font-semibold">
                        {editingProduct.pricePKR && Number(editingProduct.pricePKR) > 0 
                          ? `Rs. ${editingProduct.pricePKR}` 
                          : `Rs. ${pricing.flatPricePKR || 279}`}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">In stock</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">Instant Google Drive</span>
                    </div>

                    {/* Meta Description snippet */}
                    <p className="text-[12px] text-[#4d5156] leading-relaxed line-clamp-2 mt-0.5">
                      {editingProduct.metaDescription || editingProduct.shortDescription || editingProduct.description || 'Download premium verified digital resources, courses, templates, and softwares with instant delivery.'}
                    </p>
                  </div>

                  {/* Urdu & English Tips */}
                  <div className="pt-1.5 flex items-start gap-2 text-[10px] text-slate-400 leading-normal">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-300">SEO Tip:</strong> Product title me price aur main keyword (jaise <code className="text-blue-300">Canva Pro Lifetime</code> ya <code className="text-blue-300">Next.js Course</code>) likhne se Google Search me click-through rate (CTR) double hojata hai. Auto SEO button se aik click me optimal tags banayein!
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 7: VISIBILITY & HOMEPAGE DISPLAY FLAGS */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                {/* HOMEPAGE TOGGLE BANNER */}
                <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      editingProduct.showOnHome !== false 
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-[#22C55E]' 
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Show on Homepage Display</span>
                        {editingProduct.showOnHome !== false ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#22C55E] text-[10px] font-black">
                            ACTIVE ON HOME
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-semibold">
                            HIDDEN FROM HOME
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Controls whether this product appears on the main Homepage category rows and sliders
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={editingProduct.showOnHome !== false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, showOnHome: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22C55E]"></div>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-6 px-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!editingProduct.isNew}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isNew: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-[#0D6EFD]"
                    />
                    <span>Mark as New Resource</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!editingProduct.isBestseller}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isBestseller: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-amber-500"
                    />
                    <span>Highlight as Bestseller</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!editingProduct.isFeatured}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-purple-500"
                    />
                    <span>Feature on Top Showcase</span>
                  </label>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-black shadow-lg shadow-[#0D6EFD]/25 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Digital Resource to Firestore</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════
          TAB 4: TAGS MANAGEMENT (CRUD)
      ═════════════════════════════════════════════════════ */}
      {activeTab === 'tags' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#0D6EFD]" />
                <span>Global Tag Management &amp; CRUD</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Create new tags, search tags across resources, rename tags instantly across all products, or delete unused tags.
              </p>
            </div>

            <form onSubmit={handleCreateTag} className="flex items-center gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="New tag name (e.g. AI Prompt)..."
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#0D6EFD]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tag</span>
              </button>
            </form>
          </div>

          {/* Search Tags */}
          <div className="relative max-w-md">
            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Search existing tags..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#0D6EFD]"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>

          {/* Tags Grid / Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const tagCounts = new Map<string, number>();
              products.forEach(p => {
                if (p.tags && Array.isArray(p.tags)) {
                  p.tags.forEach(t => {
                    const trimmed = t.trim();
                    if (trimmed) {
                      tagCounts.set(trimmed, (tagCounts.get(trimmed) || 0) + 1);
                    }
                  });
                }
              });

              ['React', 'Node.js', 'Python', 'Fullstack', 'Source Code', 'Tailwind CSS', 'Next.js', 'TypeScript', 'Figma', 'Photoshop PSD', 'Masterclass', 'Notion Template', 'Commercial License'].forEach(t => {
                if (!tagCounts.has(t)) {
                  tagCounts.set(t, 0);
                }
              });

              const filteredTags = Array.from(tagCounts.entries()).filter(([tagName]) =>
                tagName.toLowerCase().includes(tagSearch.toLowerCase())
              );

              if (filteredTags.length === 0) {
                return (
                  <div className="col-span-full text-center py-12 text-slate-500 text-xs italic">
                    No matching tags found.
                  </div>
                );
              }

              return filteredTags.map(([tagName, count]) => (
                <div key={tagName} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#0D6EFD]/10 border border-[#0D6EFD]/30 flex items-center justify-center text-[#28B9FF] shrink-0 font-bold text-xs">
                      #
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{tagName}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{count} {count === 1 ? 'Resource' : 'Resources'} using tag</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setEditingTagModal({ isOpen: true, oldName: tagName, newName: tagName })}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-[#0D6EFD] text-slate-300 hover:text-white transition-colors"
                      title="Edit Tag Name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tagName)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                      title="Delete Tag"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* EDIT TAG MODAL */}
      {editingTagModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#0D6EFD]" />
                <span>Edit Tag: "#{editingTagModal.oldName}"</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTagModal({ isOpen: false, oldName: '', newName: '' })}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTag} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">New Tag Name *</label>
                <input
                  type="text"
                  value={editingTagModal.newName}
                  onChange={(e) => setEditingTagModal({ ...editingTagModal, newName: e.target.value })}
                  placeholder="Enter updated tag name..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:outline-none focus:border-[#0D6EFD]"
                  autoFocus
                />
                <p className="text-[10px] text-slate-500 mt-1">This will update the tag name across all digital resources instantly.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTagModal({ isOpen: false, oldName: '', newName: '' })}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-all shadow-md"
                >
                  Save &amp; Update All
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

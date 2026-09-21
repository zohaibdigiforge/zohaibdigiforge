import Fuse from 'fuse.js';
import { Product, Category, Subcategory } from '../types';

export interface SearchProductResult {
  item: Product;
  score?: number;
  matches?: Array<{
    key: string;
    value: string;
    indices: ReadonlyArray<[number, number]>;
  }>;
  categoryName?: string;
  subcategoryName?: string;
}

export interface SearchCategoryResult {
  category: Category;
  type: 'category';
}

export interface SearchSubcategoryResult {
  subcategory: Subcategory;
  parentCategory?: Category;
  type: 'subcategory';
}

export interface CombinedSearchResults {
  products: SearchProductResult[];
  categories: SearchCategoryResult[];
  subcategories: SearchSubcategoryResult[];
  totalMatches: number;
  isFuzzyFallback?: boolean;
}

const RECENT_SEARCHES_KEY = 'zdf_recent_searches_v2';
const MAX_RECENT_SEARCHES = 5;

// LocalStorage helpers for recent searches
export const getRecentSearches = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    return [];
  }
};

export const addRecentSearch = (query: string): string[] => {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return getRecentSearches();

  const current = getRecentSearches().filter(
    (q) => q.toLowerCase() !== trimmed.toLowerCase()
  );
  const updated = [trimmed, ...current].slice(0, MAX_RECENT_SEARCHES);

  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
  return updated;
};

export const clearRecentSearches = (): string[] => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore storage errors
  }
  return [];
};

export const removeRecentSearch = (queryToRemove: string): string[] => {
  const current = getRecentSearches().filter(
    (q) => q.toLowerCase() !== queryToRemove.toLowerCase()
  );
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(current));
  } catch {
    // Ignore
  }
  return current;
};

// Perform fuzzy search over products, categories, subcategories
export const performFuzzySearch = (
  query: string,
  products: Product[],
  categories: Category[],
  subcategories: Subcategory[],
  options?: {
    maxProductResults?: number;
    maxCategoryResults?: number;
    threshold?: number;
  }
): CombinedSearchResults => {
  const trimmedQuery = query.trim().toLowerCase();
  const normalizedQuery = trimmedQuery.replace(/^[#@]+/, '').trim() || trimmedQuery;

  if (!trimmedQuery) {
    return {
      products: [],
      categories: [],
      subcategories: [],
      totalMatches: 0,
    };
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const subcategoryMap = new Map(subcategories.map((s) => [s.id, s]));

  // Enriched products array with category/subcategory titles & keywords string
  const enrichedProducts = products.map((p) => {
    const cat = categoryMap.get(p.categoryId);
    const sub = subcategoryMap.get(p.subcategoryId);
    const keywordsStr = p.searchKeywords ? p.searchKeywords.join(' ') : '';
    const tagsStr = p.tags ? p.tags.join(' ') : '';
    const hashtagsStr = p.tags ? p.tags.map(t => `#${t.replace(/\s+/g, '')}`).join(' ') : '';

    return {
      ...p,
      categoryName: cat?.name || '',
      subcategoryName: sub?.name || '',
      keywordsStr,
      tagsStr: `${tagsStr} ${hashtagsStr}`,
    };
  });

  // 1. Search Products using Fuse.js
  const productFuse = new Fuse(enrichedProducts, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'keywordsStr', weight: 0.25 },
      { name: 'tagsStr', weight: 0.2 },
      { name: 'categoryName', weight: 0.1 },
      { name: 'subcategoryName', weight: 0.05 },
      { name: 'shortDescription', weight: 0.05 },
    ],
    threshold: options?.threshold ?? 0.38, // 0.38 gives high typo-tolerance
    distance: 100,
    ignoreLocation: true,
    minMatchCharLength: 1,
    includeMatches: true,
    includeScore: true,
  });

  const fuseProductResults = productFuse.search(normalizedQuery);
  const maxProducts = options?.maxProductResults ?? 50;

  const productResults: SearchProductResult[] = fuseProductResults
    .slice(0, maxProducts)
    .map((res) => ({
      item: res.item,
      score: res.score,
      matches: res.matches as any,
      categoryName: res.item.categoryName,
      subcategoryName: res.item.subcategoryName,
    }));

  // 2. Search Categories
  const categoryFuse = new Fuse(categories, {
    keys: ['name', 'description', 'slug'],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });
  const matchingCategories: SearchCategoryResult[] = categoryFuse
    .search(trimmedQuery)
    .slice(0, options?.maxCategoryResults ?? 3)
    .map((res) => ({
      category: res.item,
      type: 'category',
    }));

  // 3. Search Subcategories
  const subcategoryFuse = new Fuse(subcategories, {
    keys: ['name', 'description', 'slug'],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });
  const matchingSubcategories: SearchSubcategoryResult[] = subcategoryFuse
    .search(trimmedQuery)
    .slice(0, 3)
    .map((res) => ({
      subcategory: res.item,
      parentCategory: categoryMap.get(res.item.categoryId),
      type: 'subcategory',
    }));

  const totalMatches =
    productResults.length +
    matchingCategories.length +
    matchingSubcategories.length;

  return {
    products: productResults,
    categories: matchingCategories,
    subcategories: matchingSubcategories,
    totalMatches,
    isFuzzyFallback: false,
  };
};

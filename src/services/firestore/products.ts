import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { 
  Category, 
  Subcategory, 
  Product, 
  BundleOffer, 
  CollectionOffer, 
  MegaPassOffer, 
  ToolBundleOffer 
} from '../../types';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_SUBCATEGORIES, 
  INITIAL_BUNDLES,
  INITIAL_COLLECTIONS,
  INITIAL_MEGA_PASS,
  INITIAL_TOOL_BUNDLES
} from '../../data/mockData';

let categoriesCache: Category[] | null = null;
let subcategoriesCache: Subcategory[] | null = null;
let productsCache: Product[] | null = null;
let bundlesCache: BundleOffer[] | null = null;
let collectionsCache: CollectionOffer[] | null = null;
let megaPassCache: MegaPassOffer | null = null;
let toolBundlesCache: ToolBundleOffer[] | null = null;

export const seedInitialDataIfEmpty = async () => {
  try {
    const catCol = collection(db, 'categories');
    const catSnap = await getDocs(catCol);
    if (catSnap.empty) {
      console.log('Seeding initial categories to Firestore...');
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }
    }

    const subCol = collection(db, 'subcategories');
    const subSnap = await getDocs(subCol);
    if (subSnap.empty) {
      console.log('Seeding initial subcategories to Firestore...');
      for (const sub of INITIAL_SUBCATEGORIES) {
        await setDoc(doc(db, 'subcategories', sub.id), sub);
      }
    }

    const bundleCol = collection(db, 'bundles');
    const bundleSnap = await getDocs(bundleCol);
    if (bundleSnap.empty) {
      console.log('Seeding initial bundles to Firestore...');
      for (const bundle of INITIAL_BUNDLES) {
        await setDoc(doc(db, 'bundles', bundle.id), bundle);
      }
    }

    const collectionsCol = collection(db, 'collections');
    const collectionsSnap = await getDocs(collectionsCol);
    if (collectionsSnap.empty) {
      console.log('Seeding initial collections to Firestore...');
      for (const col of INITIAL_COLLECTIONS) {
        await setDoc(doc(db, 'collections', col.id), col);
      }
    }

    const megaPassDocRef = doc(db, 'mega_pass', 'lifetime_flagship');
    const megaPassSnap = await getDoc(megaPassDocRef);
    if (!megaPassSnap.exists()) {
      console.log('Seeding initial mega pass to Firestore...');
      await setDoc(megaPassDocRef, INITIAL_MEGA_PASS);
    }

    const toolBundlesCol = collection(db, 'tool_bundles');
    const toolBundlesSnap = await getDocs(toolBundlesCol);
    if (toolBundlesSnap.empty) {
      console.log('Seeding initial tool bundles to Firestore...');
      for (const tb of INITIAL_TOOL_BUNDLES) {
        await setDoc(doc(db, 'tool_bundles', tb.id), tb);
      }
    }
  } catch (err) {
    console.warn('Firestore seeding check skipped (using fallback):', err);
  }
};

export const getBundlesFromDb = async (): Promise<BundleOffer[]> => {
  if (bundlesCache && bundlesCache.length > 0) {
    return bundlesCache;
  }
  try {
    const colRef = collection(db, 'bundles');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items: BundleOffer[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as BundleOffer);
      });
      bundlesCache = items;
      return items;
    }
  } catch (err) {
    console.warn('Firestore bundles read error:', err);
  }
  bundlesCache = [];
  return [];
};

export const getCollectionsFromDb = async (): Promise<CollectionOffer[]> => {
  if (collectionsCache && collectionsCache.length > 0) {
    return collectionsCache;
  }
  try {
    const colRef = collection(db, 'collections');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items: CollectionOffer[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as CollectionOffer);
      });
      collectionsCache = items;
      return items;
    }
  } catch (err) {
    console.warn('Firestore collections read error:', err);
  }
  collectionsCache = [];
  return [];
};

export const getMegaPassFromDb = async (): Promise<MegaPassOffer> => {
  if (megaPassCache) {
    return megaPassCache;
  }
  try {
    const docRef = doc(db, 'mega_pass', 'lifetime_flagship');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() } as MegaPassOffer;
      megaPassCache = data;
      return data;
    }
  } catch (err) {
    console.warn('Firestore mega pass read error:', err);
  }
  megaPassCache = INITIAL_MEGA_PASS;
  return INITIAL_MEGA_PASS;
};

export const getToolBundlesFromDb = async (): Promise<ToolBundleOffer[]> => {
  if (toolBundlesCache && toolBundlesCache.length > 0) {
    return toolBundlesCache;
  }
  try {
    const colRef = collection(db, 'tool_bundles');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items: ToolBundleOffer[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ToolBundleOffer);
      });
      INITIAL_TOOL_BUNDLES.forEach(initItem => {
        if (!items.some(i => i.id === initItem.id || i.name.toLowerCase() === initItem.name.toLowerCase())) {
          items.push(initItem);
        }
      });
      toolBundlesCache = items;
      return items;
    }
  } catch (err) {
    console.warn('Firestore tool bundles read error:', err);
  }
  toolBundlesCache = INITIAL_TOOL_BUNDLES;
  return INITIAL_TOOL_BUNDLES;
};

export const getCategoriesFromDb = async (): Promise<Category[]> => {
  if (categoriesCache && categoriesCache.length > 0) {
    return categoriesCache;
  }
  try {
    const cached = typeof window !== 'undefined' ? localStorage.getItem('zdf_cached_categories') : null;
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        categoriesCache = parsed;
      }
    }
  } catch {}

  try {
    const colRef = collection(db, 'categories');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items: Category[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });
      INITIAL_CATEGORIES.forEach(initCat => {
        if (!items.some(c => c.id === initCat.id || c.slug === initCat.slug || c.name.toLowerCase() === initCat.name.toLowerCase())) {
          items.push(initCat);
        }
      });
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      categoriesCache = items;
      try {
        if (typeof window !== 'undefined') localStorage.setItem('zdf_cached_categories', JSON.stringify(items));
      } catch {}
      return items;
    }
  } catch (err) {
    console.warn('Firestore categories read error:', err);
  }
  categoriesCache = INITIAL_CATEGORIES;
  return INITIAL_CATEGORIES;
};

export const getSubcategoriesFromDb = async (): Promise<Subcategory[]> => {
  if (subcategoriesCache && subcategoriesCache.length > 0) {
    return subcategoriesCache;
  }
  try {
    const cached = typeof window !== 'undefined' ? localStorage.getItem('zdf_cached_subcategories') : null;
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        subcategoriesCache = parsed;
      }
    }
  } catch {}

  try {
    const colRef = collection(db, 'subcategories');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items: Subcategory[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Subcategory);
      });
      INITIAL_SUBCATEGORIES.forEach(initSub => {
        if (!items.some(s => s.id === initSub.id || s.slug === initSub.slug || s.name.toLowerCase() === initSub.name.toLowerCase())) {
          items.push(initSub);
        }
      });
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      subcategoriesCache = items;
      try {
        if (typeof window !== 'undefined') localStorage.setItem('zdf_cached_subcategories', JSON.stringify(items));
      } catch {}
      return items;
    }
  } catch (err) {
    console.warn('Firestore subcategories read error:', err);
  }
  subcategoriesCache = INITIAL_SUBCATEGORIES;
  return INITIAL_SUBCATEGORIES;
};

export const getProductsFromDb = async (): Promise<Product[]> => {
  if (productsCache !== null) {
    return productsCache;
  }

  try {
    const cached = typeof window !== 'undefined' ? localStorage.getItem('zdf_cached_products') : null;
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        productsCache = parsed;
        return productsCache;
      }
    }
  } catch {}

  try {
    const productsCol = collection(db, 'products');
    const snapshot = await getDocs(productsCol);
    const items: Product[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as Product);
    });
    productsCache = items;
    try {
      if (typeof window !== 'undefined') localStorage.setItem('zdf_cached_products', JSON.stringify(items));
    } catch {}
    return items;
  } catch (err) {
    console.warn('Firestore products read error:', err);
  }
  productsCache = [];
  return [];
};

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  try {
    const productsCol = collection(db, 'products');
    return onSnapshot(productsCol, (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      productsCache = items;
      try {
        if (typeof window !== 'undefined') localStorage.setItem('zdf_cached_products', JSON.stringify(items));
      } catch {}
      callback(items);
    }, (error) => {
      console.warn('Live products onSnapshot warning:', error);
    });
  } catch (e) {
    console.warn('Live products subscribe error:', e);
    return () => {};
  }
};

export const subscribeToCategories = (callback: (categories: Category[]) => void) => {
  try {
    const colRef = collection(db, 'categories');
    return onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const items: Category[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as Category);
        });
        INITIAL_CATEGORIES.forEach(initCat => {
          if (!items.some(c => c.id === initCat.id || c.slug === initCat.slug || c.name.toLowerCase() === initCat.name.toLowerCase())) {
            items.push(initCat);
          }
        });
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        categoriesCache = items;
        try {
          if (typeof window !== 'undefined') localStorage.setItem('zdf_cached_categories', JSON.stringify(items));
        } catch {}
        callback(items);
      }
    }, (err) => {
      console.warn('Live categories onSnapshot warning:', err);
    });
  } catch (e) {
    return () => {};
  }
};

export const subscribeToSubcategories = (callback: (subcategories: Subcategory[]) => void) => {
  try {
    const colRef = collection(db, 'subcategories');
    return onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const items: Subcategory[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as Subcategory);
        });
        INITIAL_SUBCATEGORIES.forEach(initSub => {
          if (!items.some(s => s.id === initSub.id || s.slug === initSub.slug || s.name.toLowerCase() === initSub.name.toLowerCase())) {
            items.push(initSub);
          }
        });
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        subcategoriesCache = items;
        try {
          if (typeof window !== 'undefined') localStorage.setItem('zdf_cached_subcategories', JSON.stringify(items));
        } catch {}
        callback(items);
      }
    }, (err) => {
      console.warn('Live subcategories onSnapshot warning:', err);
    });
  } catch (e) {
    return () => {};
  }
};

export const saveProductToDb = async (product: Product, isNewProduct: boolean = true): Promise<void> => {
  try {
    await setDoc(doc(db, 'products', product.id), product, { merge: true });
  } catch (err) {
    console.warn('Firestore save product offline notice:', err);
  }

  if (productsCache) {
    const idx = productsCache.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      productsCache[idx] = product;
    } else {
      productsCache.unshift(product);
    }
    try {
      localStorage.setItem('zdf_cached_products', JSON.stringify(productsCache));
    } catch (e) {}
  }
};

export const deleteProductFromDb = async (productId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    console.warn('Firestore delete product offline notice:', err);
  }

  if (productsCache) {
    productsCache = productsCache.filter(p => p.id !== productId);
    try {
      localStorage.setItem('zdf_cached_products', JSON.stringify(productsCache));
    } catch (e) {}
  }
};

export const incrementProductShareInDb = async (productId: string, platform: string = 'general'): Promise<number> => {
  try {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      shares: increment(1)
    });
  } catch (e) {}

  if (productsCache) {
    const prod = productsCache.find(p => p.id === productId);
    if (prod) {
      prod.shares = (prod.shares || 0) + 1;
      return prod.shares;
    }
  }
  return 1;
};

export const saveCategoryToDb = async (category: Category): Promise<void> => {
  try {
    await setDoc(doc(db, 'categories', category.id), category, { merge: true });
  } catch (err) {
    console.warn('Firestore save category offline notice:', err);
  }

  if (categoriesCache) {
    const idx = categoriesCache.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      categoriesCache[idx] = category;
    } else {
      categoriesCache.push(category);
    }
    try {
      localStorage.setItem('zdf_cached_categories', JSON.stringify(categoriesCache));
    } catch (e) {}
  }
};

export const deleteCategoryFromDb = async (categoryId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (err) {
    console.warn('Firestore delete category offline notice:', err);
  }

  if (categoriesCache) {
    categoriesCache = categoriesCache.filter(c => c.id !== categoryId);
    try {
      localStorage.setItem('zdf_cached_categories', JSON.stringify(categoriesCache));
    } catch (e) {}
  }
};

export const saveSubcategoryToDb = async (subcategory: Subcategory): Promise<void> => {
  try {
    await setDoc(doc(db, 'subcategories', subcategory.id), subcategory, { merge: true });
  } catch (err) {
    console.warn('Firestore save subcategory offline notice:', err);
  }

  if (subcategoriesCache) {
    const idx = subcategoriesCache.findIndex(s => s.id === subcategory.id);
    if (idx >= 0) {
      subcategoriesCache[idx] = subcategory;
    } else {
      subcategoriesCache.push(subcategory);
    }
    try {
      localStorage.setItem('zdf_cached_subcategories', JSON.stringify(subcategoriesCache));
    } catch (e) {}
  }
};

export const deleteSubcategoryFromDb = async (subcategoryId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'subcategories', subcategoryId));
  } catch (err) {
    console.warn('Firestore delete subcategory offline notice:', err);
  }

  if (subcategoriesCache) {
    subcategoriesCache = subcategoriesCache.filter(s => s.id !== subcategoryId);
    try {
      localStorage.setItem('zdf_cached_subcategories', JSON.stringify(subcategoriesCache));
    } catch (e) {}
  }
};

export const getAllProductsForBackupFromDb = getProductsFromDb;

export const cleanUpLegacyProductPricesDb = async (): Promise<number> => {
  return 0;
};

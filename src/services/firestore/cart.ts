import { db, auth } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { CouponDiscount, CartItem, AbandonedCart, PaymentMethodSetting } from '../../types';

export const AVAILABLE_COUPONS: Record<string, CouponDiscount> = {
  'DIGIFORGE10': {
    code: 'DIGIFORGE10',
    percentage: 10,
    description: '10% Off Instant Discount on Entire Digital Cart'
  },
  'WELCOME20': {
    code: 'WELCOME20',
    percentage: 20,
    description: '20% Off New Creator Welcome Privilege'
  },
  'ZDF50': {
    code: 'ZDF50',
    fixedPKR: 50,
    fixedUSD: 0.25,
    description: 'Rs. 50 Instant Discount'
  }
};

export const validateCouponCode = (
  code: string, 
  subtotalPKR: number, 
  subtotalUSD: number,
  cartItems: CartItem[] = [],
  customCouponsList: CouponDiscount[] = []
): { 
  valid: boolean; 
  discount?: CouponDiscount; 
  discountAmountPKR: number; 
  discountAmountUSD: number; 
  error?: string;
  eligibleItemTitles?: string[];
} => {
  const normalized = code.trim().toUpperCase();
  
  let coupon = customCouponsList.find(c => c.code.toUpperCase().trim() === normalized);
  if (!coupon) {
    coupon = AVAILABLE_COUPONS[normalized];
  }

  if (!coupon && (normalized.startsWith('ZDF-') || normalized.startsWith('REF-') || normalized.length >= 6)) {
    const storedReferral = localStorage.getItem(`zdf_ref_${normalized}`);
    if (storedReferral || normalized.startsWith('ZDF-')) {
      const refData = storedReferral ? JSON.parse(storedReferral) : null;
      coupon = {
        code: normalized,
        percentage: 15,
        description: `15% Off Friend Referral Privilege (${normalized})`,
        isReferral: true,
        referrerUid: refData?.referrerUid,
        referrerName: refData?.referrerName
      };
    }
  }

  if (!coupon) {
    return {
      valid: false,
      discountAmountPKR: 0,
      discountAmountUSD: 0,
      error: 'Invalid or expired promo coupon code.'
    };
  }

  // Exclude Pro Tools category from discount calculations
  const nonProToolsItems = cartItems.filter(item => item.category !== 'pro-tools');
  
  if (cartItems.length > 0 && nonProToolsItems.length === 0) {
    return {
      valid: false,
      discountAmountPKR: 0,
      discountAmountUSD: 0,
      error: 'Discount coupons and referral rewards are not applicable to Pro Tools purchases.'
    };
  }

  const effectiveSubtotalPKR = nonProToolsItems.reduce((acc, item) => acc + (item.pricePKR || 0) * (item.quantity || 1), 0);
  const effectiveSubtotalUSD = Number(nonProToolsItems.reduce((acc, item) => acc + (item.priceUSD || 0) * (item.quantity || 1), 0).toFixed(2));

  if (coupon.minOrderAmountPKR && effectiveSubtotalPKR < coupon.minOrderAmountPKR) {
    return {
      valid: false,
      discountAmountPKR: 0,
      discountAmountUSD: 0,
      error: `Minimum order amount of Rs. ${coupon.minOrderAmountPKR} (excluding Pro Tools) required for code ${coupon.code}.`
    };
  }

  let eligibleSubtotalPKR = effectiveSubtotalPKR;
  let eligibleSubtotalUSD = effectiveSubtotalUSD;
  const eligibleItemTitles: string[] = [];

  if (coupon.eligibleProductIds && coupon.eligibleProductIds.length > 0) {
    const matchingItems = nonProToolsItems.filter(item => coupon!.eligibleProductIds!.includes(item.productId || ''));
    if (matchingItems.length === 0) {
      return {
        valid: false,
        discountAmountPKR: 0,
        discountAmountUSD: 0,
        error: `Promo code ${coupon.code} is not applicable to any non-Pro Tools items currently in your cart.`
      };
    }
    eligibleSubtotalPKR = matchingItems.reduce((acc, it) => acc + (it.pricePKR || 0) * (it.quantity || 1), 0);
    eligibleSubtotalUSD = matchingItems.reduce((acc, it) => acc + (it.priceUSD || 0) * (it.quantity || 1), 0);
    matchingItems.forEach(it => eligibleItemTitles.push(it.title));
  } else if (coupon.eligibleCategories && coupon.eligibleCategories.length > 0) {
    const matchingItems = nonProToolsItems.filter(item => coupon!.eligibleCategories!.includes(item.category || ''));
    if (matchingItems.length === 0) {
      return {
        valid: false,
        discountAmountPKR: 0,
        discountAmountUSD: 0,
        error: `Promo code ${coupon.code} is only valid for specific item categories in your cart.`
      };
    }
    eligibleSubtotalPKR = matchingItems.reduce((acc, it) => acc + (it.pricePKR || 0) * (it.quantity || 1), 0);
    eligibleSubtotalUSD = matchingItems.reduce((acc, it) => acc + (it.priceUSD || 0) * (it.quantity || 1), 0);
    matchingItems.forEach(it => eligibleItemTitles.push(it.title));
  }

  let discountAmountPKR = 0;
  let discountAmountUSD = 0;

  if (coupon.percentage) {
    discountAmountPKR = Math.round((eligibleSubtotalPKR * coupon.percentage) / 100);
    discountAmountUSD = Number(((eligibleSubtotalUSD * coupon.percentage) / 100).toFixed(2));
  } else if (coupon.fixedPKR && coupon.fixedUSD) {
    discountAmountPKR = Math.min(coupon.fixedPKR, eligibleSubtotalPKR);
    discountAmountUSD = Math.min(coupon.fixedUSD, eligibleSubtotalUSD);
  }

  return {
    valid: true,
    discount: coupon,
    discountAmountPKR,
    discountAmountUSD,
    eligibleItemTitles: eligibleItemTitles.length > 0 ? eligibleItemTitles : undefined
  };
};

export const getCouponsFromDb = async (): Promise<CouponDiscount[]> => {
  try {
    const colRef = collection(db, 'coupons');
    const snap = await getDocs(colRef);
    const items: CouponDiscount[] = [];
    snap.forEach((docSnap) => {
      items.push({ code: docSnap.id, ...docSnap.data() } as CouponDiscount);
    });
    return items;
  } catch (err) {
    console.warn('Error fetching coupons:', err);
    return [
      { code: 'STUDENT10', percentage: 10, description: '10% OFF for Students' },
      { code: 'DIGI50', fixedPKR: 50, fixedUSD: 0.25, description: 'Rs. 50 Instant Discount' },
      { code: 'VIP20', percentage: 20, description: '20% VIP Member Coupon' }
    ];
  }
};

export const saveCouponToDb = async (coupon: CouponDiscount): Promise<void> => {
  try {
    const code = coupon.code.toUpperCase().trim();
    const docRef = doc(db, 'coupons', code);
    await setDoc(docRef, {
      ...coupon,
      code,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Error saving coupon:', err);
    throw err;
  }
};

export const deleteCouponFromDb = async (couponCode: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'coupons', couponCode.toUpperCase().trim()));
  } catch (err) {
    console.error('Error deleting coupon:', err);
    throw err;
  }
};

export const getAbandonedCartsFromDb = async (): Promise<AbandonedCart[]> => {
  try {
    const colRef = collection(db, 'abandoned_carts');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    const items: AbandonedCart[] = [];
    snap.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as AbandonedCart);
    });
    return items;
  } catch (err) {
    console.warn('Error fetching abandoned carts:', err);
    return [];
  }
};

export const saveAbandonedCartToDb = async (cart: Partial<AbandonedCart>): Promise<void> => {
  try {
    const cartId = cart.id || 'cart-' + Date.now();
    const docRef = doc(db, 'abandoned_carts', cartId);
    await setDoc(docRef, {
      ...cart,
      id: cartId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Error saving abandoned cart:', err);
  }
};

export const deleteAbandonedCartFromDb = async (cartId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'abandoned_carts', cartId));
  } catch (err) {
    console.error('Error deleting abandoned cart:', err);
  }
};

export const getCartFromDb = async (uid: string): Promise<CartItem[]> => {
  if (!uid) return [];
  // Silently restore from local storage backup if user is not authenticated in Firebase Auth
  if (!auth.currentUser || (auth.currentUser.uid !== uid && !auth.currentUser.email?.includes('zohaibdigiforge@gmail.com'))) {
    try {
      const local = localStorage.getItem(`zdf_cart_backup_${uid}`);
      if (local) return JSON.parse(local);
    } catch {}
    return [];
  }
  try {
    const docRef = doc(db, 'user_carts', uid);
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const items = (snap.data().items || []) as CartItem[];
      // Keep local backup fresh
      try { localStorage.setItem(`zdf_cart_backup_${uid}`, JSON.stringify(items)); } catch {}
      return items;
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    // Offline or network unavailable: silently restore from local storage backup
    if (err?.code === 'unavailable' || errMsg.includes('offline') || errMsg.includes('Failed to get document')) {
      try {
        const local = localStorage.getItem(`zdf_cart_backup_${uid}`);
        if (local) return JSON.parse(local);
      } catch {}
      return [];
    }
    console.warn('Error fetching user cart from Firestore:', err);
  }
  return [];
};

export const saveCartToDb = async (arg1: string | CartItem[], arg2?: string | CartItem[]): Promise<void> => {
  let uid: string | undefined;
  let items: CartItem[] = [];
  if (typeof arg1 === 'string') {
    uid = arg1;
    if (Array.isArray(arg2)) items = arg2;
  } else if (Array.isArray(arg1)) {
    items = arg1;
    if (typeof arg2 === 'string') uid = arg2;
  }
  if (!uid) return;
  // Always update local cache instantly
  try { localStorage.setItem(`zdf_cart_backup_${uid}`, JSON.stringify(items)); } catch {}

  // Only sync to Firestore if user is authenticated in Firebase Auth
  if (!auth.currentUser || (auth.currentUser.uid !== uid && !auth.currentUser.email?.includes('zohaibdigiforge@gmail.com'))) {
    return;
  }

  try {
    const docRef = doc(db, 'user_carts', uid);
    await setDoc(docRef, { items, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (!errMsg.includes('offline') && !errMsg.includes('unavailable')) {
      console.warn('Error saving cart to Firestore:', err);
    }
  }
};

export const syncCartOnLogin = async (uid: string, localItems: CartItem[]): Promise<CartItem[]> => {
  if (!uid) return localItems;
  const dbItems = await getCartFromDb(uid);
  if (dbItems.length === 0 && localItems.length > 0) {
    await saveCartToDb(uid, localItems);
    return localItems;
  }
  return dbItems.length > 0 ? dbItems : localItems;
};


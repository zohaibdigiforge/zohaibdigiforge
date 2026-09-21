import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { 
  SitePricingSettings, 
  SiteSettings, 
  ContactInquiry, 
  LegalPageData, 
  LegalDocId, 
  JoinPageSettings,
  JoinPageLink,
  NewsletterSubscriber,
  Testimonial,
  PaymentMethodSetting
} from '../../types';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  supportEmail: 'zohaibdigiforge@gmail.com',
  whatsappNumber: '+923406070632',
  businessHours: '24/7 Digital Delivery Engine Active',
  storeNotice: '⚡ Instant Digital Delivery Active 24/7 across Pakistan & Globally!',
  currencySymbol: 'Rs.'
};

export const DEFAULT_LEGAL_DATA: Record<string, LegalPageData> = {
  refund: {
    id: 'refund',
    title: 'Refund & Return Policy',
    lastUpdated: 'May 2024',
    content: `At Zohaib DigiForge, we strive for 100% customer satisfaction. Because digital products, software tools, premium source code, and online resources are delivered immediately upon order verification, digital downloads are non-returnable once access links are generated and delivered.

However, if you experience technical difficulties, invalid links, or corrupted downloads, our support team will immediately re-verify your order and provide working replacement links or alternative solutions within 24 hours.`
  },
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    lastUpdated: 'May 2024',
    content: `Zohaib DigiForge is committed to safeguarding your privacy. We collect minimal personal data—specifically your name, email address, and transaction details—strictly for order processing, digital delivery, and account verification.

We do not sell, rent, or distribute customer details to third parties. All payments are verified securely via transaction IDs or authorized gateways. Your account and digital download history remain strictly confidential.`
  },
  terms: {
    id: 'terms',
    title: 'Terms & Conditions',
    lastUpdated: 'May 2024',
    content: `Welcome to Zohaib DigiForge. By accessing our platform, purchasing digital courses or kits, or using our free tools, you agree to comply with our Terms of Service.

All digital assets, templates, software source code, and educational content are provided for individual or commercial project usage according to your license tier. Unauthorized redistribution or re-selling of raw assets is strictly prohibited.`
  }
};

export const DEFAULT_SITE_PRICING: SitePricingSettings = {
  flatPricePKR: 279,
  flatPriceUSD: 1,
  lastUpdated: new Date().toISOString()
};

export const getSitePricingFromDb = async (): Promise<SitePricingSettings> => {
  try {
    const docRef = doc(db, 'siteSettings', 'pricing');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        flatPricePKR: Number(data.flatPricePKR) || 279,
        flatPriceUSD: Number(data.flatPriceUSD) || 1,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      };
    }
    return DEFAULT_SITE_PRICING;
  } catch (err) {
    console.warn('Firestore sitePricing read fallback:', err);
    return DEFAULT_SITE_PRICING;
  }
};

export const subscribeSitePricing = (
  callback: (pricing: SitePricingSettings) => void
) => {
  try {
    const docRef = doc(db, 'siteSettings', 'pricing');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          callback({
            flatPricePKR: Number(data.flatPricePKR) || 279,
            flatPriceUSD: Number(data.flatPriceUSD) || 1,
            lastUpdated: data.lastUpdated || new Date().toISOString()
          });
        } else {
          callback(DEFAULT_SITE_PRICING);
        }
      },
      (err) => {
        console.warn('Real-time site pricing subscription error:', err);
        callback(DEFAULT_SITE_PRICING);
      }
    );
  } catch (err) {
    console.warn('Failed to attach site pricing listener:', err);
    callback(DEFAULT_SITE_PRICING);
    return () => {};
  }
};

export const updateSitePricingInDb = async (newPricing: {
  flatPricePKR: number;
  flatPriceUSD: number;
}): Promise<SitePricingSettings> => {
  const updated: SitePricingSettings = {
    flatPricePKR: Number(newPricing.flatPricePKR) || 279,
    flatPriceUSD: Number(newPricing.flatPriceUSD) || 1,
    lastUpdated: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'siteSettings', 'pricing');
    await setDoc(docRef, updated, { merge: true });
  } catch (err) {
    console.warn('Failed to update site pricing in Firestore:', err);
  }

  localStorage.setItem('zdf_site_pricing', JSON.stringify(updated));
  return updated;
};

export const getSiteSettingsFromDb = async (): Promise<SiteSettings> => {
  try {
    const docRef = doc(db, 'siteSettings', 'general');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_SITE_SETTINGS, ...docSnap.data() } as SiteSettings;
    }
  } catch (err) {
    console.warn('Firestore siteSettings read fallback:', err);
  }
  return DEFAULT_SITE_SETTINGS;
};

export const updateSiteSettingsInDb = async (settings: SiteSettings): Promise<SiteSettings> => {
  try {
    const docRef = doc(db, 'siteSettings', 'general');
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    console.warn('Failed to update site settings in Firestore:', err);
  }
  return settings;
};

export const submitContactInquiryDb = async (
  inquiry: Omit<ContactInquiry, 'id' | 'createdAt' | 'status'>
): Promise<ContactInquiry> => {
  let newInquiry: ContactInquiry = {
    ...inquiry,
    id: 'INQ-' + Date.now().toString(36).toUpperCase(),
    status: 'new',
    createdAt: new Date().toISOString()
  };

  try {
    const apiRes = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInquiry)
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.inquiry) {
        newInquiry = data.inquiry;
      }
    }
  } catch (apiErr) {
    console.warn('[INQUIRY-ENGINE] Backend inquiry submit notice:', apiErr);
  }

  try {
    const inquiriesCol = collection(db, 'contactInquiries');
    await setDoc(doc(inquiriesCol, newInquiry.id), newInquiry, { merge: true });
  } catch (err) {
    console.warn('Saved contact inquiry to local fallback store:', err);
  }

  try {
    const existingRaw = localStorage.getItem('zdf_contact_inquiries');
    const existing: ContactInquiry[] = existingRaw ? JSON.parse(existingRaw) : [];
    existing.unshift(newInquiry);
    localStorage.setItem('zdf_contact_inquiries', JSON.stringify(existing));
  } catch (e) {
    console.warn('LocalStorage inquiry write skipped:', e);
  }

  return newInquiry;
};

export const getContactInquiriesFromDb = async (): Promise<ContactInquiry[]> => {
  try {
    const apiRes = await fetch('/api/inquiries');
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data.inquiries) && data.inquiries.length > 0) {
        return data.inquiries;
      }
    }
  } catch (e) {}

  try {
    const inquiriesCol = collection(db, 'contactInquiries');
    const snapshot = await getDocs(inquiriesCol);
    if (!snapshot.empty) {
      const list: ContactInquiry[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ContactInquiry);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list;
    }
  } catch (err) {
    console.warn('Firestore contactInquiries list fallback:', err);
  }

  const existingRaw = localStorage.getItem('zdf_contact_inquiries');
  return existingRaw ? JSON.parse(existingRaw) : [];
};

export const trackServiceInquiryDb = async (queryTerm: string): Promise<ContactInquiry | null> => {
  const term = queryTerm.trim().toLowerCase();
  if (!term) return null;

  try {
    const apiRes = await fetch(`/api/inquiries/track/${encodeURIComponent(queryTerm.trim())}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.inquiry) {
        return data.inquiry as ContactInquiry;
      }
    }
  } catch (apiErr) {
    console.warn('[INQUIRY-ENGINE] Server tracking lookup fallback:', apiErr);
  }

  const existingRaw = localStorage.getItem('zdf_contact_inquiries');
  if (existingRaw) {
    const existing: ContactInquiry[] = JSON.parse(existingRaw);
    const matched = existing.find(
      inq => inq.id.toLowerCase() === term || (inq.email && inq.email.toLowerCase() === term)
    );
    if (matched) return matched;
  }

  try {
    const { where, query } = await import('firebase/firestore');
    const col = collection(db, 'contactInquiries');
    const q = query(col, where('id', '==', queryTerm.trim()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ContactInquiry;
    }
  } catch (err) {
    console.warn('Firestore service inquiry lookup error:', err);
  }

  return null;
};


const legalPagesCache: Record<string, LegalPageData> = {};

export const getLegalPageFromDb = async (pageId: LegalDocId): Promise<LegalPageData> => {
  if (legalPagesCache[pageId]) {
    return legalPagesCache[pageId];
  }

  try {
    const docRef = doc(db, 'legalPages', pageId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as LegalPageData;
      legalPagesCache[pageId] = data;
      return data;
    }
    const defaultPage = DEFAULT_LEGAL_DATA[pageId];
    if (defaultPage) {
      legalPagesCache[pageId] = defaultPage;
      return defaultPage;
    }
  } catch (err) {
    console.warn(`Firestore read fallback for legal page ${pageId}:`, err);
  }

  const fallback = DEFAULT_LEGAL_DATA[pageId] || DEFAULT_LEGAL_DATA['refund'];
  legalPagesCache[pageId] = fallback;
  return fallback;
};

export const saveLegalPageToDb = async (pageData: LegalPageData): Promise<void> => {
  const updatedPage = {
    ...pageData,
    lastUpdated: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  };

  try {
    const docRef = doc(db, 'legalPages', pageData.id);
    await setDoc(docRef, updatedPage);
    legalPagesCache[pageData.id] = updatedPage;
  } catch (err) {
    console.error('Error updating legal page in Firestore:', err);
    throw err;
  }
};

export const DEFAULT_JOIN_PAGE_SETTINGS: JoinPageSettings = {
  profilePhoto: '/logo.webp',
  headline: 'Zohaib DigiForge',
  subheadline: 'Empowering Learning. Powering Success.',
  tagline: 'Digital resources, free hacks & tools for students who don\'t want to overpay.',
  socials: {
    instagram: 'https://instagram.com/zohaibdigiforge',
    tiktok: 'https://tiktok.com/@zohaibdigiforge',
    whatsapp: 'https://wa.me/923406070632?text=Hi%20Zohaib%20DigiForge!%20I%20found%20you%20via%20your%20bio%20link.',
    youtube: 'https://youtube.com/@zohaibdigiforge',
    telegram: 'https://t.me/zohaibdigiforge',
    facebook: 'https://facebook.com/zohaibdigiforge',
    x: 'https://x.com/zohaibdigiforge'
  }
};

let joinSettingsCache: JoinPageSettings | null = null;

export const getJoinPageSettingsFromDb = async (): Promise<JoinPageSettings> => {
  if (joinSettingsCache) {
    return joinSettingsCache;
  }

  try {
    const docRef = doc(db, 'joinPageSettings', 'default');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as JoinPageSettings;
      joinSettingsCache = { ...DEFAULT_JOIN_PAGE_SETTINGS, ...data };
      try {
        localStorage.setItem('zdf_join_settings', JSON.stringify(joinSettingsCache));
      } catch (e) {}
      return joinSettingsCache;
    }
    joinSettingsCache = DEFAULT_JOIN_PAGE_SETTINGS;
    return DEFAULT_JOIN_PAGE_SETTINGS;
  } catch (err) {
    console.warn('Firestore joinPageSettings fallback:', err);
    try {
      const cached = localStorage.getItem('zdf_join_settings');
      if (cached) {
        joinSettingsCache = JSON.parse(cached);
        return joinSettingsCache!;
      }
    } catch (e) {}
    joinSettingsCache = DEFAULT_JOIN_PAGE_SETTINGS;
    return DEFAULT_JOIN_PAGE_SETTINGS;
  }
};

export const saveJoinPageSettingsToDb = async (settings: JoinPageSettings): Promise<JoinPageSettings> => {
  const settingsToSave: JoinPageSettings = {
    ...settings,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'joinPageSettings', 'default'), settingsToSave, { merge: true });
  } catch (err) {
    console.warn('Save join settings offline fallback:', err);
  }

  joinSettingsCache = settingsToSave;
  try {
    localStorage.setItem('zdf_join_settings', JSON.stringify(settingsToSave));
  } catch (e) {}

  return settingsToSave;
};

export const subscribeNewsletterDb = async (email: string): Promise<boolean> => {
  const sub: NewsletterSubscriber = {
    email,
    subscribedAt: new Date().toISOString()
  };

  try {
    const newsletterCol = collection(db, 'newsletter_subscribers');
    await addDoc(newsletterCol, sub);
  } catch (err) {
    console.warn('Saved subscriber to local fallback state:', err);
  }

  const subs = JSON.parse(localStorage.getItem('zdf_subscribers') || '[]');
  subs.push(sub);
  localStorage.setItem('zdf_subscribers', JSON.stringify(subs));

  return true;
};

export const getNewsletterSubscribersFromDb = async (): Promise<NewsletterSubscriber[]> => {
  try {
    const colRef = collection(db, 'newsletter_subscribers');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const items: NewsletterSubscriber[] = [];
      snap.forEach((docSnap) => items.push({ ...docSnap.data() } as NewsletterSubscriber));
      return items;
    }
  } catch (err) {
    console.warn('Newsletter subscribers read error:', err);
  }
  return JSON.parse(localStorage.getItem('zdf_subscribers') || '[]');
};

export const getNewslettersSentFromDb = async (): Promise<any[]> => {
  try {
    const colRef = collection(db, 'newsletter_logs');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const items: any[] = [];
      snap.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
      return items;
    }
  } catch (e) {}
  return [];
};

export const recordNewsletterSentToDb = async (log: any): Promise<any> => {
  const newLog = {
    ...log,
    id: 'nl-' + Date.now(),
    sentAt: new Date().toISOString()
  };
  try {
    const colRef = collection(db, 'newsletter_logs');
    await addDoc(colRef, newLog);
  } catch (e) {}
  return newLog;
};


export const addTestimonialDb = async (testimonialData: Omit<Testimonial, 'id' | 'date'>): Promise<Testimonial> => {
  const newTestimonial: Testimonial = {
    ...testimonialData,
    id: 'test-' + Date.now(),
    date: 'Just now'
  };

  try {
    const col = collection(db, 'testimonials');
    await addDoc(col, newTestimonial);
  } catch (err) {
    console.warn('Saved testimonial locally:', err);
  }

  const existing = JSON.parse(localStorage.getItem('zdf_testimonials') || '[]');
  existing.unshift(newTestimonial);
  localStorage.setItem('zdf_testimonials', JSON.stringify(existing));

  return newTestimonial;
};

export const DEFAULT_PAYMENT_METHODS_CONFIG: PaymentMethodSetting[] = [
  { id: 'JazzCash', name: 'JazzCash Mobile Account', accountName: 'Muhammad Zohaib Shahzad', accountNumber: '03406070632', instructions: 'Send amount via JazzCash App or *786# and upload transaction ID', isActive: true },
  { id: 'EasyPaisa', name: 'EasyPaisa Mobile Account', accountName: 'Muhammad Zohaib Shahzad', accountNumber: '03406070632', instructions: 'Send amount via EasyPaisa App or *786# and upload transaction ID', isActive: true },
  { id: 'NayaPay', name: 'NayaPay Wallet Account', accountName: 'Muhammad Zohaib Shahzad', accountNumber: '03406070632', instructions: 'Send amount via NayaPay App to 03406070632', isActive: true },
  { id: 'UPaisa', name: 'UPaisa Mobile Account', accountName: 'Muhammad Zohaib Shahzad', accountNumber: '03406070632', instructions: 'Send amount via UPaisa App or *786# to 03406070632', isActive: true },
  { id: 'Bank Transfer', name: 'Bank Transfer (Meezan / Raast)', accountName: 'Muhammad Zohaib Shahzad', accountNumber: '03406070632', instructions: 'Transfer via any Banking App / Raast ID to 03406070632', isActive: true },
  { id: 'Binance Crypto', name: 'USDT Crypto (TRC20 / Binance Pay)', accountName: 'Muhammad Zohaib Shahzad (Binance Pay ID: 1217380568)', accountNumber: '1217380568', instructions: 'Send USDT TRC20 or Binance Pay ID: 1217380568 and upload transaction ID', isActive: true }
];

export const getPaymentMethodSettingsFromDb = async (): Promise<PaymentMethodSetting[]> => {
  try {
    const docRef = doc(db, 'siteSettings', 'paymentMethodsConfig');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().methods as PaymentMethodSetting[];
    }
    return DEFAULT_PAYMENT_METHODS_CONFIG;
  } catch (err) {
    console.warn('Fallback payment method settings:', err);
    return DEFAULT_PAYMENT_METHODS_CONFIG;
  }
};

export const savePaymentMethodSettingToDb = async (methods: PaymentMethodSetting[]): Promise<void> => {
  try {
    const docRef = doc(db, 'siteSettings', 'paymentMethodsConfig');
    await setDoc(docRef, { methods, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Error saving payment methods config:', err);
    throw err;
  }
};

export const getFAQsFromDb = async (): Promise<any[]> => {
  try {
    const colRef = collection(db, 'faqs');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items: any[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      return items;
    }
  } catch (err) {
    console.warn('Error reading FAQs from Firestore:', err);
  }
  return [];
};

export const saveFAQToDb = async (faq: any): Promise<void> => {
  try {
    const docRef = doc(db, 'faqs', faq.id);
    await setDoc(docRef, faq, { merge: true });
  } catch (err) {
    console.error('Error saving FAQ:', err);
  }
};

export const addFAQToDb = saveFAQToDb;

export const updateFAQInDb = async (faqIdOrData: string | any, updates?: any): Promise<void> => {
  try {
    if (typeof faqIdOrData === 'string') {
      const docRef = doc(db, 'faqs', faqIdOrData);
      await setDoc(docRef, updates || {}, { merge: true });
    } else if (faqIdOrData?.id) {
      const docRef = doc(db, 'faqs', faqIdOrData.id);
      await setDoc(docRef, faqIdOrData, { merge: true });
    }
  } catch (err) {
    console.error('Error updating FAQ:', err);
  }
};


export const deleteFAQFromDb = async (faqId: string): Promise<void> => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'faqs', faqId));
  } catch (err) {
    console.error('Error deleting FAQ:', err);
  }
};

export const INITIAL_JOIN_PAGE_LINKS: JoinPageLink[] = [
  {
    id: 'join-primary-store',
    label: '🛍️ Visit the Store',
    subtitle: 'Explore 50+ Courses, dev kits, bundles & student toolkits with instant access',
    url: 'resources',
    linkType: 'Store',
    icon: 'ShoppingBag',
    order: 0,
    isActive: true,
    isPrimary: true,
    clickCount: 2150,
    clicks: 2150,
    badge: 'Official Store',
    badgeColor: 'bg-emerald-500/20 text-[#22C55E] border-emerald-500/30'
  },
  {
    id: 'join-wa-community',
    label: '📢 WhatsApp Community Link',
    subtitle: 'Join the main DigiForge student & creator community on WhatsApp',
    url: 'https://chat.whatsapp.com/I3AIvUTGPkY9nrWU3iwhhm',
    linkType: 'WhatsApp Community',
    icon: 'Users',
    order: 1,
    isActive: true,
    isPrimary: false,
    clickCount: 1420,
    clicks: 1420,
    badge: 'Join Community',
    badgeColor: 'bg-emerald-500/20 text-[#22C55E] border-emerald-500/30'
  }
];

export const getJoinPageLinksFromDb = async (): Promise<JoinPageLink[]> => {
  try {
    const colRef = collection(db, 'joinPageLinks');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items: JoinPageLink[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as JoinPageLink);
      });
      items.sort((a, b) => a.order - b.order);
      return items;
    }
  } catch (err) {
    console.warn('Error reading join links from Firestore:', err);
  }
  return INITIAL_JOIN_PAGE_LINKS;
};

export const saveJoinPageLinksToDb = async (links: JoinPageLink[]): Promise<void> => {
  try {
    for (const link of links) {
      const docRef = doc(db, 'joinPageLinks', link.id);
      await setDoc(docRef, link, { merge: true });
    }
  } catch (err) {
    console.error('Error saving join links:', err);
  }
};

export const saveJoinPageLinkToDb = async (link: JoinPageLink): Promise<void> => {
  try {
    const docRef = doc(db, 'joinPageLinks', link.id);
    await setDoc(docRef, link, { merge: true });
  } catch (err) {
    console.error('Error saving join link:', err);
  }
};

export const reorderJoinPageLinksInDb = async (links: JoinPageLink[]): Promise<void> => {
  return saveJoinPageLinksToDb(links);
};


export const deleteJoinPageLinkFromDb = async (linkId: string): Promise<void> => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'joinPageLinks', linkId));
  } catch (err) {
    console.error('Error deleting join link:', err);
  }
};

export const trackJoinPageLinkClick = async (linkId: string): Promise<void> => {
  try {
    const { increment } = await import('firebase/firestore');
    const docRef = doc(db, 'joinPageLinks', linkId);
    await setDoc(docRef, { clicks: increment(1), clickCount: increment(1) }, { merge: true });
  } catch (err) {
    console.warn('Error tracking join page link click:', err);
  }
};



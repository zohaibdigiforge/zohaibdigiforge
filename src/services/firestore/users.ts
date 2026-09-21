import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile, UserRole, UserMembershipStatus, UserAccountStatus, UserReferralStats, Order } from '../../types';
import { recordAuditEvent } from './admin';

export const ADMIN_EMAIL = 'zohaibdigiforge@gmail.com';

export const isUserAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

export const syncUserProfileToDb = async (authUser: {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phone?: string | null;
  role?: UserRole;
  authProvider?: string;
  isEmailVerified?: boolean;
}): Promise<UserProfile> => {
  const email = (authUser.email || '').trim().toLowerCase();
  const isAdmin = isUserAdmin(email);
  const now = new Date().toISOString();
  const detectedProvider = authUser.authProvider || (email.includes('@gmail') ? 'google.com' : 'password');
  const deviceInfo = typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 140)}` : 'Web Browser';

  const userDocRef = doc(db, 'users', authUser.uid);
  
  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      const updatedProfile: UserProfile = {
        ...existing,
        uid: authUser.uid,
        email: email || existing.email,
        displayName: authUser.displayName || existing.displayName || email.split('@')[0] || 'DigiForge Member',
        photoURL: authUser.photoURL || existing.photoURL || '',
        phone: authUser.phone || existing.phone || '',
        role: isAdmin ? 'admin' : (existing.role || 'customer'),
        membershipStatus: existing.membershipStatus || 'free',
        status: existing.status || 'active',
        lastLoginAt: now,
        authProvider: existing.authProvider || detectedProvider,
        lastLoginMethod: detectedProvider,
        loginCount: (existing.loginCount || 1) + 1,
        deviceInfo: deviceInfo,
        isEmailVerified: authUser.isEmailVerified ?? existing.isEmailVerified ?? true
      };
      await setDoc(userDocRef, updatedProfile, { merge: true });

      recordAuditEvent({
        action: `Customer Signed In (${detectedProvider})`,
        category: 'auth',
        severity: 'info',
        actorEmail: email,
        actorName: updatedProfile.displayName,
        actorRole: updatedProfile.role,
        actorUid: authUser.uid,
        deviceInfo,
        details: { method: detectedProvider, loginCount: updatedProfile.loginCount }
      });

      return updatedProfile;
    } else {
      const newProfile: UserProfile = {
        uid: authUser.uid,
        email,
        displayName: authUser.displayName || email.split('@')[0] || 'DigiForge Member',
        photoURL: authUser.photoURL || '',
        phone: authUser.phone || '',
        role: isAdmin ? 'admin' : 'customer',
        membershipStatus: 'free',
        status: 'active',
        createdAt: now,
        lastLoginAt: now,
        authProvider: detectedProvider,
        lastLoginMethod: detectedProvider,
        loginCount: 1,
        deviceInfo: deviceInfo,
        isEmailVerified: authUser.isEmailVerified ?? true,
        ordersCount: 0,
      };
      await setDoc(userDocRef, newProfile);

      recordAuditEvent({
        action: `New User Registered & Signed In (${detectedProvider})`,
        category: 'auth',
        severity: 'success',
        actorEmail: email,
        actorName: newProfile.displayName,
        actorRole: newProfile.role,
        actorUid: authUser.uid,
        deviceInfo,
        details: { method: detectedProvider, isNewAccount: true }
      });

      return newProfile;
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (!errMsg.includes('offline') && !errMsg.includes('unavailable') && !errMsg.includes('Failed to get document')) {
      console.warn('Firestore user profile sync fallback (local state):', err);
    }
    return {
      uid: authUser.uid,
      email,
      displayName: authUser.displayName || email.split('@')[0] || 'DigiForge Member',
      photoURL: authUser.photoURL || '',
      role: isAdmin ? 'admin' : 'customer',
      membershipStatus: 'free',
      status: 'active',
      createdAt: now,
      lastLoginAt: now,
      authProvider: detectedProvider,
      lastLoginMethod: detectedProvider,
      loginCount: 1,
      deviceInfo,
      isEmailVerified: authUser.isEmailVerified ?? true,
      ordersCount: 0,
    };
  }
};

export const getUserProfileFromDb = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Error fetching user profile:', err);
  }
  return null;
};

export const subscribeToUsersFromDb = (callback: (users: UserProfile[]) => void) => {
  try {
    const usersCol = collection(db, 'users');
    return onSnapshot(usersCol, (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        users.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      });
      callback(users);
    }, (error) => {
      console.warn('Users listener notice, loading once:', error);
      getAllUsersFromDb().then(callback);
    });
  } catch (e) {
    getAllUsersFromDb().then(callback);
    return () => {};
  }
};

export const getAllUsersFromDb = async (): Promise<UserProfile[]> => {
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    const users: UserProfile[] = [];
    snap.forEach(d => {
      users.push({ uid: d.id, ...d.data() } as UserProfile);
    });
    if (users.length > 0) return users;
  } catch (e) {
    console.warn('Error reading users collection:', e);
  }
  
  try {
    const saved = sessionStorage.getItem('zdf_auth_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return [parsed as UserProfile];
    }
  } catch (e) {}
  return [];
};

export const updateUserRoleAndStatusInDb = async (
  uid: string, 
  updates: { role?: UserRole; membershipStatus?: UserMembershipStatus; status?: UserAccountStatus }
): Promise<boolean> => {
  if (!uid) return false;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, updates, { merge: true });
    return true;
  } catch (err) {
    console.warn('Error updating user role/status in Firestore:', err);
    return false;
  }
};

export const updateUserProfileInDb = async (uid: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  if (!uid) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, updates, { merge: true });
    
    try {
      const current = JSON.parse(sessionStorage.getItem('zdf_auth_user') || '{}');
      if (current && current.uid === uid) {
        const merged = { ...current, ...updates };
        sessionStorage.setItem('zdf_auth_user', JSON.stringify(merged));
      }
    } catch (e) {}

    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Error updating user profile in Firestore:', err);
  }
  return null;
};

export const deleteUserAccountFromDb = async (uid: string): Promise<boolean> => {
  if (!uid) return false;
  try {
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);
  } catch (err) {
    console.warn('Error deleting user account from Firestore:', err);
  }
  try {
    sessionStorage.removeItem('zdf_auth_user');
  } catch (e) {}
  return true;
};

export const triggerWelcomeEmail = async (customerEmail: string, customerName: string): Promise<void> => {
  try {
    await fetch('/api/auth/send-welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerEmail, customerName })
    });
  } catch (e) {
    console.warn('Welcome email trigger skipped or offline:', e);
  }
};

export const getUserReferralStatsFromDb = async (uid: string, userDisplayName?: string): Promise<UserReferralStats> => {
  const cleanPrefix = (userDisplayName || 'DIGI')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4) || 'ZDF';
  const cleanSuffix = uid.slice(0, 4).toUpperCase();
  const defaultCode = `ZDF-${cleanPrefix}${cleanSuffix}`;

  try {
    const docRef = doc(db, 'referral_profiles', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        referralCode: data.referralCode || defaultCode,
        totalReferredOrders: data.totalReferredOrders || 0,
        totalEarnedPKR: data.totalEarnedPKR || 0,
        totalEarnedUSD: data.totalEarnedUSD || 0,
        rewardPoints: data.rewardPoints || 0,
        discountPerkPercent: data.discountPerkPercent || 15,
        referredOrders: data.referredOrders || []
      };
    }
  } catch (err) {
    console.warn('Firestore referral profile fallback:', err);
  }

  try {
    const local = localStorage.getItem(`zdf_referral_${uid}`);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {}

  const initialStats: UserReferralStats = {
    referralCode: defaultCode,
    totalReferredOrders: 0,
    totalEarnedPKR: 0,
    totalEarnedUSD: 0,
    rewardPoints: 50,
    discountPerkPercent: 15,
    referredOrders: []
  };

  try {
    localStorage.setItem(`zdf_ref_${defaultCode}`, JSON.stringify({
      referrerUid: uid,
      referrerName: userDisplayName || 'ZDF Ambassador'
    }));
    localStorage.setItem(`zdf_referral_${uid}`, JSON.stringify(initialStats));
  } catch (e) {}

  return initialStats;
};

export const recordReferralOrderInDb = async (
  referrerUid: string,
  order: Order,
  rewardPKR: number = 50
): Promise<void> => {
  try {
    const docRef = doc(db, 'referral_profiles', referrerUid);
    const snap = await getDoc(docRef);
    const existing = snap.exists() ? snap.data() : {};

    const referredOrders = existing.referredOrders || [];
    referredOrders.unshift({
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.email || '',
      customerWhatsapp: order.whatsapp || '',
      amountPKR: order.totalAmountPKR,
      rewardEarnedPKR: rewardPKR,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });

    const updatedStats = {
      totalReferredOrders: (existing.totalReferredOrders || 0) + 1,
      totalEarnedPKR: (existing.totalEarnedPKR || 0) + rewardPKR,
      totalEarnedUSD: (existing.totalEarnedUSD || 0) + 2,
      rewardPoints: (existing.rewardPoints || 0) + 100,
      referredOrders
    };

    await setDoc(docRef, updatedStats, { merge: true });
  } catch (err) {
    console.warn('Firestore record referral order error:', err);
  }
};

export interface ReferralProfile {
  uid: string;
  referralCode: string;
  totalReferredOrders: number;
  totalEarnedPKR: number;
  totalEarnedUSD: number;
  rewardPoints: number;
  discountPerkPercent: number;
  referredOrders?: {
    orderId: string;
    customerName: string;
    customerEmail?: string;
    customerWhatsapp?: string;
    date?: string;
    createdAt?: string;
    amountPKR: number;
    rewardPKR?: number;
    rewardEarnedPKR?: number;
    status?: 'pending' | 'paid' | 'canceled';
  }[];
}

export const subscribeToReferralProfilesFromDb = (callback: (profiles: ReferralProfile[]) => void) => {
  try {
    const colRef = collection(db, 'referral_profiles');
    return onSnapshot(colRef, (snapshot) => {
      const profiles: ReferralProfile[] = [];
      snapshot.forEach(d => {
        profiles.push({ uid: d.id, ...d.data() } as ReferralProfile);
      });
      callback(profiles);
    }, (error) => {
      console.warn('Referrals real-time listener notice, fallback to get:', error);
      getAllReferralProfilesFromDb().then(callback);
    });
  } catch (e) {
    getAllReferralProfilesFromDb().then(callback);
    return () => {};
  }
};

export const getAllReferralProfilesFromDb = async (): Promise<ReferralProfile[]> => {
  try {
    const colRef = collection(db, 'referral_profiles');
    const snap = await getDocs(colRef);
    const profiles: ReferralProfile[] = [];
    snap.forEach(d => {
      profiles.push({ uid: d.id, ...d.data() } as ReferralProfile);
    });
    return profiles;
  } catch (err) {
    console.warn('Error reading referral profiles:', err);
    return [];
  }
};

export const updateReferralOrderStatusInDb = async (
  referrerUid: string,
  orderId: string,
  newStatus: 'pending' | 'paid' | 'canceled'
): Promise<boolean> => {
  if (!referrerUid || !orderId) return false;
  try {
    const docRef = doc(db, 'referral_profiles', referrerUid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;
    
    const data = snap.data();
    const referredOrders = data.referredOrders || [];
    
    let updated = false;
    const nextReferredOrders = referredOrders.map((ro: any) => {
      if (ro.orderId === orderId) {
        updated = true;
        return { ...ro, status: newStatus };
      }
      return ro;
    });
    
    if (!updated) return false;
    
    let totalEarnedPKR = 0;
    let totalReferredOrders = 0;
    nextReferredOrders.forEach((ro: any) => {
      const reward = ro.rewardPKR || ro.rewardEarnedPKR || 0;
      if (ro.status !== 'canceled') {
        totalEarnedPKR += reward;
        totalReferredOrders += 1;
      }
    });

    await setDoc(docRef, {
      referredOrders: nextReferredOrders,
      totalEarnedPKR,
      totalReferredOrders
    }, { merge: true });
    
    return true;
  } catch (err) {
    console.warn('Error updating referral order status:', err);
    return false;
  }
};

export const deleteReferralOrderFromDb = async (
  referrerUid: string,
  orderId: string
): Promise<boolean> => {
  if (!referrerUid || !orderId) return false;
  try {
    const docRef = doc(db, 'referral_profiles', referrerUid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;
    
    const data = snap.data();
    const referredOrders = data.referredOrders || [];
    
    const nextReferredOrders = referredOrders.filter((ro: any) => ro.orderId !== orderId);
    
    let totalEarnedPKR = 0;
    let totalReferredOrders = 0;
    nextReferredOrders.forEach((ro: any) => {
      const reward = ro.rewardPKR || ro.rewardEarnedPKR || 0;
      if (ro.status !== 'canceled') {
        totalEarnedPKR += reward;
        totalReferredOrders += 1;
      }
    });

    await setDoc(docRef, {
      referredOrders: nextReferredOrders,
      totalEarnedPKR,
      totalReferredOrders
    }, { merge: true });
    
    return true;
  } catch (err) {
    console.warn('Error deleting referral order:', err);
    return false;
  }
};

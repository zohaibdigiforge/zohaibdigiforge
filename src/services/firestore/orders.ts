import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc, query, where, orderBy, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Order, CheckoutFeedback } from '../../types';
import { recordReferralOrderInDb } from './users';

export const triggerOrderEmail = async (orderData: Order): Promise<void> => {
  try {
    await fetch('/api/checkout/send-order-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: orderData })
    });
  } catch (e) {
    console.warn('Order confirmation email trigger skipped or offline:', e);
  }
};

export const createOrderInDb = async (orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> => {
  const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const processedItems = (orderData.items || []).map(item => ({
    ...item,
    expiresAt: item.expiresAt || defaultExpiry,
    reminderSent: false
  }));

  let newOrder: Order = {
    ...orderData,
    items: processedItems,
    id: 'ZDF-' + Math.floor(100000 + Math.random() * 900000),
    createdAt: new Date().toISOString()
  };

  try {
    const apiRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder })
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.order) {
        newOrder = data.order;
      }
    }
  } catch (apiErr) {
    console.warn('[ORDER-ENGINE] Backend API order persistence notice:', apiErr);
  }

  try {
    const ordersCol = collection(db, 'orders');
    await setDoc(doc(ordersCol, newOrder.id), newOrder, { merge: true });
  } catch (err) {
    console.warn('Firestore offline/unconfigured, local and server storage active:', err);
  }

  try {
    const existingOrdersRaw = localStorage.getItem('zdf_user_orders');
    const existingOrders: Order[] = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];
    const existIdx = existingOrders.findIndex(o => o.id === newOrder.id);
    if (existIdx >= 0) {
      existingOrders[existIdx] = newOrder;
    } else {
      existingOrders.unshift(newOrder);
    }
    localStorage.setItem('zdf_user_orders', JSON.stringify(existingOrders));
  } catch (lsErr) {
    console.warn('LocalStorage save error:', lsErr);
  }

  try {
    const itemNames = processedItems.map(i => i.title).join(', ');
    await fetch('/api/notifications/admin-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_placed',
        title: `📦 New Order Placed: #${newOrder.id}`,
        message: `${newOrder.customerName} (${newOrder.email}) placed an order for: ${itemNames}. Total: Rs. ${newOrder.totalAmountPKR}`,
        customerName: newOrder.customerName,
        customerEmail: newOrder.email,
        timestamp: new Date().toISOString()
      })
    });
  } catch (e) {
    console.warn('Failed to dispatch admin order alert notification:', e);
  }

  try {
    await triggerOrderEmail(newOrder);
  } catch (e) {
    console.warn('Failed to trigger order emails:', e);
  }

  try {
    import('../googleSheetsService').then(async ({ getSavedSheetsConfig, getCachedAccessToken, appendSingleOrderToSheet }) => {
      const config = getSavedSheetsConfig();
      const token = getCachedAccessToken();
      if (config && config.spreadsheetId && token && config.autoSyncOnChanges) {
        await appendSingleOrderToSheet(config.spreadsheetId, token, newOrder);
        console.log('⚡ Order synced directly to Google Sheet:', newOrder.id);
      }
    }).catch(() => {});
  } catch (e) {}

  return newOrder;
};

export const trackOrderFromDb = async (queryTerm: string): Promise<Order | null> => {
  const term = queryTerm.trim().toLowerCase();
  if (!term) return null;

  try {
    const apiRes = await fetch(`/api/orders/track/${encodeURIComponent(queryTerm.trim())}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.order) {
        return data.order as Order;
      }
    }
  } catch (apiErr) {
    console.warn('[ORDER-ENGINE] Server order tracking lookup fallback:', apiErr);
  }

  const existingOrdersRaw = localStorage.getItem('zdf_user_orders');
  if (existingOrdersRaw) {
    const existingOrders: Order[] = JSON.parse(existingOrdersRaw);
    const matched = existingOrders.find(
      o => o.id.toLowerCase() === term || (o.whatsapp && o.whatsapp.replace(/\D/g, '').includes(term.replace(/\D/g, ''))) || (o.email && o.email.toLowerCase() === term)
    );
    if (matched) return matched;
  }

  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('id', '==', queryTerm.trim()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Order;
    }
  } catch (err) {
    console.warn('Firestore lookup error:', err);
  }

  return null;
};

export const getOrderByIdFromDb = async (orderId: string): Promise<Order | null> => {
  if (!orderId) return null;
  return await trackOrderFromDb(orderId);
};

export const saveCheckoutFeedbackToDb = async (feedbackData: {
  orderId: string;
  rating: number;
  ratingEmoji: string;
  customerName?: string;
  email?: string;
  notes?: string;
}): Promise<CheckoutFeedback> => {
  const newFeedback: CheckoutFeedback = {
    ...feedbackData,
    id: `fb-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  try {
    const colRef = collection(db, 'checkoutFeedback');
    await addDoc(colRef, newFeedback);
  } catch (err) {
    console.warn('Saved checkout feedback to local memory:', err);
  }

  try {
    const existing = JSON.parse(localStorage.getItem('zdf_checkout_feedbacks') || '[]');
    existing.unshift(newFeedback);
    localStorage.setItem('zdf_checkout_feedbacks', JSON.stringify(existing));
  } catch (e) {}

  return newFeedback;
};

export const linkOrderToUserInDb = async (orderId: string, uid: string, email: string): Promise<void> => {
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('id', '==', orderId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        userId: uid,
        email: email
      });
    }
  } catch (err) {
    console.warn('Firestore link order to user error:', err);
  }

  try {
    const existingOrdersRaw = localStorage.getItem('zdf_user_orders');
    if (existingOrdersRaw) {
      const existingOrders: Order[] = JSON.parse(existingOrdersRaw);
      const updated = existingOrders.map(o => {
        if (o.id.toLowerCase() === orderId.toLowerCase()) {
          return { ...o, email, userId: uid };
        }
        return o;
      });
      localStorage.setItem('zdf_user_orders', JSON.stringify(updated));
    }
  } catch (e) {}
};

export const getUserOrdersFromDb = async (uid?: string, email?: string): Promise<Order[]> => {
  if (!uid && !email) return [];
  const normalizedEmail = (email || '').trim().toLowerCase();
  const matchedOrders: Order[] = [];
  const seenIds = new Set<string>();
  
  try {
    const ordersCol = collection(db, 'orders');
    if (uid) {
      const qUser = query(ordersCol, where('userId', '==', uid));
      const snapUser = await getDocs(qUser);
      snapUser.forEach(docSnap => {
        const data = { id: docSnap.id, ...docSnap.data() } as Order;
        if (!seenIds.has(data.id)) {
          seenIds.add(data.id);
          matchedOrders.push(data);
        }
      });
    }

    if (normalizedEmail) {
      const qEmail = query(ordersCol, where('email', '==', normalizedEmail));
      const snapEmail = await getDocs(qEmail);
      snapEmail.forEach(docSnap => {
        const data = { id: docSnap.id, ...docSnap.data() } as Order;
        if (!seenIds.has(data.id)) {
          seenIds.add(data.id);
          matchedOrders.push(data);
        }
      });
    }
  } catch (err) {
    console.warn('Error querying user orders from Firestore:', err);
  }
  
  try {
    const localOrders: Order[] = JSON.parse(localStorage.getItem('zdf_user_orders') || '[]');
    localOrders.forEach(o => {
      const matchUser = uid && o.userId === uid;
      const matchEmail = normalizedEmail && o.email?.trim().toLowerCase() === normalizedEmail;
      if ((matchUser || matchEmail) && !seenIds.has(o.id)) {
        seenIds.add(o.id);
        matchedOrders.push(o);
        if (uid && !o.userId) {
          o.userId = uid;
        }
      }
    });
  } catch (e) {}

  matchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return matchedOrders;
};

export const subscribeToOrdersFromDb = (onUpdate: (orders: Order[]) => void) => {
  let isSubscribed = true;

  const fetchFromBackend = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.orders && isSubscribed) {
          onUpdate(data.orders);
        }
      }
    } catch (e) {}
  };

  fetchFromBackend();

  const intervalId = setInterval(fetchFromBackend, 8000);

  let unsubFirestore = () => {};
  try {
    const colRef = collection(db, 'orders');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    unsubFirestore = onSnapshot(q, (snapshot) => {
      const ordersList: Order[] = [];
      snapshot.forEach((docSnap) => {
        ordersList.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      if (isSubscribed) {
        onUpdate(ordersList);
      }
    }, (err) => {
      console.warn('Firestore orders snapshot notice (using backend polling fallback):', err);
    });
  } catch (err) {}

  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
    if (typeof unsubFirestore === 'function') unsubFirestore();
  };
};

export const updateOrderNotesInDb = async (orderId: string, notes: string): Promise<void> => {
  try {
    await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
  } catch (e) {}

  try {
    const docRef = doc(db, 'orders', orderId);
    await setDoc(docRef, { notes }, { merge: true });
  } catch (err) {
    console.warn('Firestore update order notes notice:', err);
  }
};

export const bulkVerifyOrdersInDb = async (orderIds: string[]): Promise<void> => {
  for (const id of orderIds) {
    try {
      await fetch(`/api/orders/${encodeURIComponent(id)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Payment Verified' })
      });
    } catch (e) {}

    try {
      await setDoc(doc(db, 'orders', id), { status: 'Payment Verified' }, { merge: true });
    } catch (err) {
      console.warn('Firestore bulk verify notice:', err);
    }
  }
};

const processReferralOnDelivery = async (orderId: string, orderData?: Partial<Order>): Promise<void> => {
  try {
    const { getDoc, doc, setDoc } = await import('firebase/firestore');
    const orderDocRef = doc(db, 'orders', orderId);
    const snap = await getDoc(orderDocRef);
    if (snap.exists()) {
      const fullOrder = { ...snap.data(), ...orderData } as Order;
      
      // Check if it's a referral order, and has NOT been recorded/entered yet
      if (fullOrder.referrerUid && !fullOrder.referralRecorded) {
        console.log(`[REFERRAL-ON-DELIVERY] Processing referral for Order ${orderId}, Referrer: ${fullOrder.referrerUid}`);
        
        // Record it in the referrer's database
        const rewardAmount = fullOrder.referrerRewardPKR || Math.max(100, Math.round(fullOrder.totalAmountPKR * 0.10));
        await recordReferralOrderInDb(fullOrder.referrerUid, fullOrder, rewardAmount);
        
        // Mark as recorded so it doesn't double-register if status is toggled again
        await setDoc(orderDocRef, { referralRecorded: true }, { merge: true });
        console.log(`[REFERRAL-ON-DELIVERY] Successfully recorded referral in database!`);
      }
    }
  } catch (err) {
    console.warn('[REFERRAL-ON-DELIVERY] Error processing referral reward on order delivery:', err);
  }
};

export const attachDownloadLinkAndDeliverOrderInDb = async (
  order: Order, 
  downloadLink: string
): Promise<void> => {
  const existingLinks = order.downloadLinks || [];
  const updatedLinks = Array.from(new Set([...existingLinks, downloadLink]));

  try {
    await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Access Delivered',
        downloadLinks: updatedLinks,
        extraUpdates: { reviewPromptSent: true }
      })
    });
  } catch (e) {
    console.warn('Backend order delivery update notice:', e);
  }

  try {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, {
      status: 'Access Delivered',
      downloadLinks: updatedLinks,
      reviewPromptSent: true
    }, { merge: true });

    // Process referral record on successful delivery!
    await processReferralOnDelivery(order.id, { status: 'Access Delivered', downloadLinks: updatedLinks });
  } catch (err) {
    console.warn('Firestore order delivery notice:', err);
  }
};

export const cancelOrderInDb = async (orderId: string, reason: string): Promise<void> => {
  try {
    await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Cancelled',
        notes: `Cancelled: ${reason}`
      })
    });
  } catch (e) {}

  try {
    const docRef = doc(db, 'orders', orderId);
    await setDoc(docRef, {
      status: 'Cancelled',
      notes: `Cancelled: ${reason}`
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore cancel order notice:', err);
  }
};

export const updateOrderStatusInDb = async (
  orderId: string,
  newStatus: Order['status'],
  extraUpdates?: Partial<Order>
): Promise<Order | null> => {
  let targetOrder: Order | null = null;

  try {
    const apiRes = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, extraUpdates })
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.order) {
        targetOrder = data.order;
      }
    }
  } catch (apiErr) {
    console.warn('[ORDER-ENGINE] Backend status update notice:', apiErr);
  }

  try {
    const currentOrders = JSON.parse(localStorage.getItem('zdf_user_orders') || '[]');
    const targetIndex = currentOrders.findIndex((o: Order) => o.id.toLowerCase() === orderId.toLowerCase());
    if (targetIndex >= 0) {
      currentOrders[targetIndex] = {
        ...currentOrders[targetIndex],
        ...(targetOrder || {}),
        status: newStatus,
        ...extraUpdates
      };
      targetOrder = currentOrders[targetIndex];
      localStorage.setItem('zdf_user_orders', JSON.stringify(currentOrders));
    }
  } catch (e) {}

  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await setDoc(orderDocRef, { status: newStatus, ...extraUpdates }, { merge: true });

    // Process referral if status transitioned to a delivered state!
    if (newStatus === 'Access Delivered' || newStatus === 'Completed') {
      await processReferralOnDelivery(orderId, { status: newStatus, ...extraUpdates });
    }
  } catch (e) {
    console.warn('Firestore update order status fallback:', e);
  }

  return targetOrder;
};

export const updateOrderExpiryInDb = async (orderId: string, itemIndex: number, newExpiresAt: string): Promise<boolean> => {
  try {
    const existingOrdersRaw = localStorage.getItem('zdf_user_orders');
    if (existingOrdersRaw) {
      const orders: Order[] = JSON.parse(existingOrdersRaw);
      const target = orders.find(o => o.id === orderId);
      if (target && target.items && target.items[itemIndex]) {
        target.items[itemIndex].expiresAt = newExpiresAt;
        target.items[itemIndex].reminderSent = false;
        localStorage.setItem('zdf_user_orders', JSON.stringify(orders));
      }
    }

    const q = query(collection(db, 'orders'), where('id', '==', orderId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docRef = doc(db, 'orders', snapshot.docs[0].id);
      const orderData = snapshot.docs[0].data() as Order;
      if (orderData && orderData.items && orderData.items[itemIndex]) {
        orderData.items[itemIndex].expiresAt = newExpiresAt;
        orderData.items[itemIndex].reminderSent = false;
        await updateDoc(docRef, { items: orderData.items });
      }
    }
    return true;
  } catch (err) {
    console.error('Error updating order expiry:', err);
    return false;
  }
};

export const getAllOrdersForBackupFromDb = async (): Promise<Order[]> => {
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: Order[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Order));
    if (list.length > 0) return list;
  } catch (err) {
    console.warn('Error querying all orders from Firestore:', err);
  }

  try {
    const local = JSON.parse(localStorage.getItem('zdf_orders') || '[]');
    if (Array.isArray(local) && local.length > 0) return local;
  } catch (e) {}

  return [];
};

export const clearAllOrdersFromDb = async (): Promise<boolean> => {
  try {
    await fetch('/api/orders/clear-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {}

  try {
    const ordersCol = collection(db, 'orders');
    const snap = await getDocs(ordersCol);
    for (const docSnap of snap.docs) {
      await deleteDoc(doc(db, 'orders', docSnap.id));
    }
  } catch (err) {
    console.warn('Firestore orders clear notice:', err);
  }

  try {
    localStorage.removeItem('zdf_user_orders');
    localStorage.removeItem('zdf_orders');
  } catch (e) {}

  return true;
};

export const deleteOrderFromDb = async (orderId: string): Promise<boolean> => {
  try {
    await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE'
    });
  } catch (e) {}

  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (err) {
    try {
      const q = query(collection(db, 'orders'), where('id', '==', orderId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'orders', d.id));
      }
    } catch (e) {}
  }

  try {
    const existing = JSON.parse(localStorage.getItem('zdf_user_orders') || '[]');
    const filtered = existing.filter((o: any) => o.id !== orderId);
    localStorage.setItem('zdf_user_orders', JSON.stringify(filtered));
  } catch (e) {}

  return true;
};

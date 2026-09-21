import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Order, Product, UserProfile } from '../types';

// In-memory token cache (DO NOT persist in localStorage per Google security guidelines)
let cachedAccessToken: string | null = null;
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

export interface GoogleSheetsSyncConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  connectedEmail: string;
  autoSyncOnChanges: boolean;
  lastSyncedAt?: string;
  lastSyncStatus?: 'success' | 'error' | 'syncing';
  lastSyncMessage?: string;
  syncedOrdersCount?: number;
}

const LOCAL_STORAGE_CONFIG_KEY = 'zdf_google_sheets_config';

export const getSavedSheetsConfig = (): GoogleSheetsSyncConfig | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const saveSheetsConfig = (cfg: GoogleSheetsSyncConfig) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.warn('Failed to save sheets config', e);
  }
};

export const clearSheetsConfig = () => {
  localStorage.removeItem(LOCAL_STORAGE_CONFIG_KEY);
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Initiates Google OAuth Sign-in with spreadsheets scope
 */
export const connectGoogleSheetsAuth = async (): Promise<{ email: string; token: string }> => {
  const provider = new GoogleAuthProvider();
  provider.addScope(SHEETS_SCOPE);
  // Prompt user to select account to avoid silent mis-matches
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  
  if (!credential?.accessToken) {
    throw new Error('Google did not return an access token for Sheets integration.');
  }

  cachedAccessToken = credential.accessToken;
  const email = result.user.email || 'Admin';
  return { email, token: cachedAccessToken };
};

/**
 * Creates a brand new Google Spreadsheet with dedicated tabs:
 * Orders, Order Items, Customers, Products, Summary
 */
export const createDedicatedSyncSpreadsheet = async (
  token: string,
  storeTitle = 'Zohaib DigiForge - Live Store Data'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const payload = {
    properties: {
      title: `${storeTitle} (${new Date().toLocaleDateString()})`
    },
    sheets: [
      {
        properties: {
          title: 'Live_Orders',
          gridProperties: { rowCount: 1000, columnCount: 20, frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Order_Items',
          gridProperties: { rowCount: 2000, columnCount: 15, frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Customers_Directory',
          gridProperties: { rowCount: 1000, columnCount: 12, frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Products_Catalog',
          gridProperties: { rowCount: 500, columnCount: 12, frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Live_Overview',
          gridProperties: { rowCount: 50, columnCount: 6 }
        }
      }
    ]
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to create Google Spreadsheet: ${res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { spreadsheetId, spreadsheetUrl };
};

/**
 * Synchronizes full dataset to the connected Google Spreadsheet
 */
export const syncAllDataToGoogleSheet = async (
  spreadsheetId: string,
  token: string,
  orders: Order[],
  products: Product[],
  users: UserProfile[]
): Promise<{ success: boolean; totalRowsSynced: number }> => {
  if (!spreadsheetId || !token) {
    throw new Error('Missing Google Spreadsheet ID or valid access token.');
  }

  // 1. Prepare Orders Header & Rows
  const ordersHeaders = [
    'Order ID',
    'Customer Name',
    'Email Address',
    'WhatsApp / Phone',
    'Total (PKR)',
    'Total (USD)',
    'Payment Method',
    'Order Status',
    'Discount Code',
    'Items Count',
    'First Product',
    'Download Links',
    'Admin Notes',
    'Created Date & Time'
  ];

  const orderRows = orders.map(o => {
    const firstItem = (o.items && o.items[0]?.title) || 'Standard Order';
    const downloadLinksStr = (o.downloadLinks && o.downloadLinks.join(' | ')) || '';
    return [
      o.id || '',
      o.customerName || 'Valued Customer',
      o.email || '',
      o.whatsapp || '',
      Number(o.totalAmountPKR || 0),
      Number(o.totalAmountUSD || 0),
      o.paymentMethod || 'Manual Transfer',
      (o.status || 'Pending Verification').toUpperCase(),
      o.couponCode || '',
      (o.items && o.items.length) || 1,
      firstItem,
      downloadLinksStr,
      o.notes || '',
      o.createdAt ? new Date(o.createdAt).toLocaleString() : ''
    ];
  });

  // 2. Prepare Order Items Breakdown Rows
  const orderItemsHeaders = [
    'Order ID',
    'Order Date',
    'Item / Course Title',
    'Item Type',
    'Price (PKR)',
    'Customer Email',
    'Expiry / Access',
    'Reminder Sent'
  ];

  const orderItemRows: any[][] = [];
  orders.forEach(o => {
    const oDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '';
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach(item => {
        orderItemRows.push([
          o.id,
          oDate,
          item.title || 'Product',
          item.type || 'product',
          Number(item.price || 0),
          o.email || '',
          item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Lifetime Access',
          item.reminderSent ? 'YES' : 'NO'
        ]);
      });
    }
  });

  // 3. Prepare Customers Directory
  const customersHeaders = [
    'User ID (UID)',
    'Full Name',
    'Email Address',
    'Phone / WhatsApp',
    'Role',
    'Membership',
    'Joined Date'
  ];

  const customerRows = users.map(u => [
    u.uid || '',
    u.displayName || 'Anonymous User',
    u.email || '',
    u.phone || '',
    u.role || 'customer',
    u.membershipStatus || 'free',
    u.createdAt ? new Date(u.createdAt).toLocaleString() : ''
  ]);

  // 4. Prepare Products Catalog
  const productsHeaders = [
    'Product ID',
    'Title',
    'Category ID',
    'Price (PKR)',
    'Price (USD)',
    'Badge',
    'File Format',
    'Rating',
    'Featured Status',
    'Download Link'
  ];

  const productRows = products.map(p => [
    p.id || '',
    p.title || '',
    p.categoryId || '',
    Number(p.pricePKR || 0),
    Number(p.priceUSD || 0),
    p.badge || '',
    p.fileFormat || 'ZIP',
    p.rating || 5,
    p.isFeatured ? 'YES' : 'NO',
    p.downloadUrl || ''
  ]);

  // 5. Prepare Live Overview Summary
  const totalRevPKR = orders.reduce((sum, o) => sum + (Number(o.totalAmountPKR) || 0), 0);
  const totalRevUSD = orders.reduce((sum, o) => sum + (Number(o.totalAmountUSD) || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Access Delivered').length;
  const pendingOrders = orders.filter(o => o.status === 'Pending Verification').length;

  const overviewData = [
    ['METRIC', 'VALUE', 'LAST UPDATED'],
    ['Store Name', 'Zohaib DigiForge Live Store', new Date().toLocaleString()],
    ['Total Recorded Orders', orders.length, ''],
    ['Completed & Delivered Orders', completedOrders, ''],
    ['Pending Verification Orders', pendingOrders, ''],
    ['Total Revenue (PKR)', `PKR ${totalRevPKR.toLocaleString()}`, ''],
    ['Total Revenue (USD)', `$${totalRevUSD.toLocaleString()}`, ''],
    ['Active Registered Customers', users.length, ''],
    ['Active Products Catalog', products.length, ''],
    ['Auto-Sync Status', 'ACTIVE REAL-TIME HOOK', 'Every order auto-updates here!']
  ];

  // Batch Update Values via Google Sheets API v4
  const updatePayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: 'Live_Orders!A1',
        values: [ordersHeaders, ...orderRows]
      },
      {
        range: 'Order_Items!A1',
        values: [orderItemsHeaders, ...orderItemRows]
      },
      {
        range: 'Customers_Directory!A1',
        values: [customersHeaders, ...customerRows]
      },
      {
        range: 'Products_Catalog!A1',
        values: [productsHeaders, ...productRows]
      },
      {
        range: 'Live_Overview!A1',
        values: overviewData
      }
    ]
  };

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatePayload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Sheets batchUpdate failed: ${res.statusText}`);
  }

  return {
    success: true,
    totalRowsSynced: orders.length + orderItemRows.length + users.length + products.length
  };
};

/**
 * Appends or updates a single Order row in real-time when a new order happens
 */
export const appendSingleOrderToSheet = async (
  spreadsheetId: string,
  token: string,
  order: Order
): Promise<boolean> => {
  try {
    const downloadLinksStr = (order.downloadLinks && order.downloadLinks.join(' | ')) || '';
    const firstItem = (order.items && order.items[0]?.title) || 'Digital Asset';

    const row = [
      order.id || '',
      order.customerName || 'Valued Customer',
      order.email || '',
      order.whatsapp || '',
      Number(order.totalAmountPKR || 0),
      Number(order.totalAmountUSD || 0),
      order.paymentMethod || 'Manual Transfer',
      (order.status || 'Pending Verification').toUpperCase(),
      order.couponCode || '',
      (order.items && order.items.length) || 1,
      firstItem,
      downloadLinksStr,
      order.notes || '',
      order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString()
    ];

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Live_Orders!A:N:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [row]
      })
    });

    return res.ok;
  } catch (err) {
    console.warn('Real-time order sheet append error:', err);
    return false;
  }
};

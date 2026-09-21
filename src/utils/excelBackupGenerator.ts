import { 
  Order, 
  Product, 
  UserProfile, 
  Review, 
  AuditLog, 
  SecurityThreat, 
  Category, 
  Subcategory 
} from '../types';

export interface BackupDataset {
  backupTimestamp: string;
  triggerType: 'automated_nightly' | 'manual_admin';
  databaseId?: string;
  orders: Order[];
  products: Product[];
  users: UserProfile[];
  reviews: Review[];
  auditLogs: AuditLog[];
  threats: SecurityThreat[];
  categories?: Category[];
  subcategories?: Subcategory[];
}

/**
 * Builds a multi-sheet Excel Workbook with rich, structured worksheets
 * covering the complete Firestore dataset and user order transactions.
 */
export async function createMasterBackupWorkbook(dataset: BackupDataset): Promise<any> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const totalRevenuePKR = dataset.orders.reduce((sum, o) => sum + (Number(o.totalAmountPKR) || 0), 0);
  const totalRevenueUSD = dataset.orders.reduce((sum, o) => sum + (Number(o.totalAmountUSD) || 0), 0);
  const completedOrders = dataset.orders.filter(o => o.status === 'Completed' || o.status === 'Access Delivered').length;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. EXECUTIVE SUMMARY SHEET
  // ─────────────────────────────────────────────────────────────────────────────
  const summaryRows = [
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'ZOHAIB DIGIFORGE - MASTER DATA SNAPSHOT', 'METRIC VALUE': '', 'NOTES': '' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Snapshot Timestamp', 'METRIC VALUE': dataset.backupTimestamp, 'NOTES': 'ISO 8601' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Trigger Mechanism', 'METRIC VALUE': dataset.triggerType === 'automated_nightly' ? 'Automated Nightly Cloud Cron' : 'Manual Administrator Export', 'NOTES': 'Data redundancy audit' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Firestore Database ID', 'METRIC VALUE': dataset.databaseId || 'ai-studio-zohaibdigiforge-078ffbc8-6fe0-4d09-9943-4f07a3df3a5c', 'NOTES': 'Google Cloud Firestore' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Total Customer Orders', 'METRIC VALUE': dataset.orders.length, 'NOTES': 'Master order transaction records' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Verified / Delivered Orders', 'METRIC VALUE': completedOrders, 'NOTES': 'Paid and delivered digital products' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Total Store Revenue (PKR)', 'METRIC VALUE': `Rs. ${totalRevenuePKR.toLocaleString()}`, 'NOTES': 'Gross transaction volume in PKR' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Total Store Revenue (USD)', 'METRIC VALUE': `$${totalRevenueUSD.toLocaleString()}`, 'NOTES': 'Gross transaction volume in USD' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Total Registered Customers', 'METRIC VALUE': dataset.users.length, 'NOTES': 'User accounts & profiles' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Catalog Digital Products', 'METRIC VALUE': dataset.products.length, 'NOTES': 'Templates, tools, workflows' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Verified Customer Reviews', 'METRIC VALUE': dataset.reviews.length, 'NOTES': 'Testimonials and feedback' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Intercepted Threats / WAF', 'METRIC VALUE': dataset.threats.length, 'NOTES': 'Deep packet inspections logged' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Audit Trail Logs Archived', 'METRIC VALUE': dataset.auditLogs.length, 'NOTES': 'Administrative compliance records' },
    { 'SYSTEM CLOUD BACKUP SUMMARY': 'Redundancy Protection Level', 'METRIC VALUE': 'EXCEL DISK + FIRESTORE CLOUD', 'NOTES': 'Zero data loss guarantee' }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 38 },
    { wch: 45 },
    { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Summary');

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ORDERS MASTER SHEET
  // ─────────────────────────────────────────────────────────────────────────────
  const ordersMasterRows = dataset.orders.map((o) => {
    const itemsSummary = (o.items || []).map(i => `${i.title} (x1)`).join('; ');
    const downloadUrls = (o.downloadLinks || []).join(', ');

    return {
      'Order ID': o.id,
      'Order Date': o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A',
      'Customer Name': o.customerName || 'N/A',
      'Email Address': o.email || 'N/A',
      'WhatsApp Number': o.whatsapp || 'N/A',
      'Payment Method': o.paymentMethod || 'N/A',
      'Status': o.status || 'Pending Verification',
      'Total Amount (PKR)': Number(o.totalAmountPKR) || 0,
      'Total Amount (USD)': Number(o.totalAmountUSD) || 0,
      'Subtotal (PKR)': Number(o.subtotalPKR) || Number(o.totalAmountPKR) || 0,
      'Discount (PKR)': Number(o.discountPKR) || 0,
      'Coupon Code': o.couponCode || 'None',
      'Items Count': o.items?.length || 0,
      'Purchased Products Summary': itemsSummary || 'Digital Product',
      'Download / Asset Access URLs': downloadUrls || 'Sent via email/WhatsApp',
      'Admin Internal Notes': o.notes || ''
    };
  });

  const wsOrders = XLSX.utils.json_to_sheet(ordersMasterRows.length > 0 ? ordersMasterRows : [
    { 'Order ID': 'No orders recorded yet' }
  ]);
  wsOrders['!cols'] = [
    { wch: 20 },
    { wch: 22 },
    { wch: 24 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 45 },
    { wch: 40 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders_Master');

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. ORDER LINE ITEMS BREAKDOWN SHEET
  // ─────────────────────────────────────────────────────────────────────────────
  const lineItemRows: any[] = [];
  dataset.orders.forEach((o) => {
    (o.items || []).forEach((item, idx) => {
      lineItemRows.push({
        'Order ID': o.id,
        'Item Index': idx + 1,
        'Customer Name': o.customerName,
        'Customer Email': o.email,
        'Product / Tool ID': item.productId,
        'Product Title': item.title,
        'Item Type': item.type,
        'Price (PKR)': Number(item.price) || 0,
        'License / Tool Expiry Date': item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Lifetime Access',
        'Expiry Reminder Sent': item.reminderSent ? 'YES' : 'NO'
      });
    });
  });

  const wsLineItems = XLSX.utils.json_to_sheet(lineItemRows.length > 0 ? lineItemRows : [
    { 'Order ID': 'No line items recorded' }
  ]);
  wsLineItems['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 24 },
    { wch: 28 },
    { wch: 20 },
    { wch: 35 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsLineItems, 'Order_Items_Breakdown');

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. USERS & CUSTOMERS DIRECTORY SHEET
  // ─────────────────────────────────────────────────────────────────────────────
  const userRows = dataset.users.map((u: any) => {
    return {
      'User ID (UID)': u.uid,
      'Full Name': u.displayName || u.name || 'Anonymous User',
      'Email Address': u.email || 'N/A',
      'WhatsApp / Phone': u.phone || u.whatsapp || 'N/A',
      'Role': u.role || 'customer',
      'Account Status': u.status || 'active',
      'Membership Status': u.membershipStatus || 'free',
      'Referral Code': u.referralCode || 'N/A',
      'Total Orders Placed': u.ordersCount || u.orderCount || 0,
      'Total Spent (PKR)': Number(u.totalSpentPKR) || 0,
      'Reward Points': u.rewardPoints || 0,
      'Registration Date': u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A',
      'Last Active': u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'N/A'
    };
  });

  const wsUsers = XLSX.utils.json_to_sheet(userRows.length > 0 ? userRows : [
    { 'User ID (UID)': 'No users recorded yet' }
  ]);
  wsUsers['!cols'] = [
    { wch: 28 },
    { wch: 24 },
    { wch: 30 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsUsers, 'Users_Customers');

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. PRODUCTS & DIGITAL ASSETS CATALOG SHEET
  // ─────────────────────────────────────────────────────────────────────────────
  const productRows = dataset.products.map((p) => {
    return {
      'Product ID': p.id,
      'Title': p.title,
      'Category ID': p.categoryId,
      'Subcategory ID': p.subcategoryId,
      'Price (PKR)': Number(p.pricePKR) || 0,
      'Price (USD)': Number(p.priceUSD) || 0,
      'Original Price (PKR)': Number(p.originalPricePKR) || 0,
      'Rating': p.rating || 5.0,
      'Reviews Count': p.reviewCount || 0,
      'Badge': p.badge || (p.isBestseller ? 'Bestseller' : p.isNew ? 'New' : 'Standard'),
      'File Format': p.fileFormat || 'ZIP / Digital Package',
      'Delivery Method': p.deliveryMethod || 'Instant Download',
      'Direct Download URL': p.downloadUrl || 'Protected by User Account',
      'Short Description': p.shortDescription || p.description?.slice(0, 100) || '',
      'Tags': Array.isArray(p.tags) ? p.tags.join(', ') : '',
      'Created Date': p.createdAt || 'N/A'
    };
  });

  const wsProducts = XLSX.utils.json_to_sheet(productRows.length > 0 ? productRows : [
    { 'Product ID': 'No products in catalog' }
  ]);
  wsProducts['!cols'] = [
    { wch: 18 },
    { wch: 35 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 40 },
    { wch: 40 },
    { wch: 25 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Products_Catalog');

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. CUSTOMER REVIEWS & FEEDBACK SHEET
  // ─────────────────────────────────────────────────────────────────────────────
  const reviewRows = dataset.reviews.map((r: any) => {
    return {
      'Review ID': r.id,
      'Product ID': r.productId,
      'Product Title': r.productTitle || 'Store General',
      'Author Name': r.userName || r.author || 'Anonymous',
      'Rating (Stars)': r.rating,
      'Review Feedback': r.reviewText || r.comment || '',
      'Verified Customer': (r.isVerifiedPurchase ?? r.verifiedPurchase) ? 'YES' : 'NO',
      'Status': r.status || 'approved',
      'Submitted Date': r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'
    };
  });

  const wsReviews = XLSX.utils.json_to_sheet(reviewRows.length > 0 ? reviewRows : [
    { 'Review ID': 'No reviews recorded' }
  ]);
  wsReviews['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 32 },
    { wch: 22 },
    { wch: 14 },
    { wch: 45 },
    { wch: 18 },
    { wch: 14 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsReviews, 'Reviews_Feedback');

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. CYBER THREATS & WAF INTERCEPTIONS SHEET
  // ─────────────────────────────────────────────────────────────────────────────
  const threatRows = dataset.threats.map((t) => {
    return {
      'Threat ID': t.id,
      'Timestamp': t.timestamp ? new Date(t.timestamp).toLocaleString() : 'N/A',
      'Threat Classification': t.threatType,
      'Attack Category': t.category,
      'Severity': t.severity,
      'Attacker IP Address': t.ipAddress,
      'Target HTTP Method': t.method,
      'Target Route': t.path,
      'WAF Action Taken': t.actionTaken || 'BLOCKED_403',
      'Status': t.status,
      'Malicious Payload Snippet': t.offendingPayload || '',
      'Threat Intelligence Details': t.details || ''
    };
  });

  const wsThreats = XLSX.utils.json_to_sheet(threatRows.length > 0 ? threatRows : [
    { 'Threat ID': 'No threats recorded - Clean WAF' }
  ]);
  wsThreats['!cols'] = [
    { wch: 24 },
    { wch: 22 },
    { wch: 35 },
    { wch: 22 },
    { wch: 12 },
    { wch: 20 },
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
    { wch: 14 },
    { wch: 45 },
    { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(wb, wsThreats, 'Cyber_Threats_Blocked');

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. AUDIT LOGS SHEET
  // ─────────────────────────────────────────────────────────────────────────────
  const auditRows = dataset.auditLogs.map((log: any) => {
    const detailsStr = typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '');
    return {
      'Log ID': log.id,
      'Timestamp': log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A',
      'Action': log.action,
      'Category': log.category,
      'Severity': log.severity,
      'Performed By': log.actorEmail || log.adminEmail || 'system',
      'Target Resource': log.targetId || log.targetType || log.targetResource || '',
      'Client IP': log.ipAddress || '127.0.0.1',
      'Details': detailsStr
    };
  });

  const wsAudit = XLSX.utils.json_to_sheet(auditRows.length > 0 ? auditRows : [
    { 'Log ID': 'No audit logs recorded' }
  ]);
  wsAudit['!cols'] = [
    { wch: 24 },
    { wch: 22 },
    { wch: 28 },
    { wch: 20 },
    { wch: 14 },
    { wch: 28 },
    { wch: 24 },
    { wch: 18 },
    { wch: 45 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit_Trail_Logs');

  return wb;
}

/**
 * Generates an Excel binary Buffer for Node.js server write / attachments.
 */
export async function generateBackupBuffer(dataset: BackupDataset): Promise<Buffer> {
  const XLSX = await import('xlsx');
  const wb = await createMasterBackupWorkbook(dataset);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generates a Blob for direct client-side browser download.
 */
export async function exportBackupToExcelBlob(dataset: BackupDataset): Promise<Blob> {
  const XLSX = await import('xlsx');
  const wb = await createMasterBackupWorkbook(dataset);
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

/**
 * Directly downloads the Excel sheet in the browser.
 */
export function triggerBrowserExcelDownload(blob: Blob, filename?: string): void {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const name = filename || `ZohaibDigiForge_Firestore_Backup_${dateStr}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

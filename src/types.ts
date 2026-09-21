export type Currency = 'PKR' | 'USD';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  order?: number;
  itemCount?: number;
  featuredColor?: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  order?: number;
  itemCount?: number;
}

export interface SitePricingSettings {
  flatPricePKR: number;
  flatPriceUSD: number;
  lastUpdated?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  subcategoryId: string;
  title: string;
  thumbnail?: string;
  image?: string;
  pricePKR?: number; // Legacy or snapshot field - flat price is managed in siteSettings/pricing
  priceUSD?: number; // Legacy or snapshot field - flat price is managed in siteSettings/pricing
  originalPricePKR?: number;
  originalPriceUSD?: number;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  showOnHome?: boolean;
  badge?: 'Bestseller' | 'New' | 'Popular' | 'Hot Deal' | 'Featured' | '18 Months VIP';
  shortDescription?: string;
  fullDescription?: string;
  description?: string;
  features?: string[];
  fileFormat?: string;
  deliveryMethod?: 'Instant Download' | 'Instant License Key' | 'Dashboard Invite' | 'WhatsApp Direct';
  fileSize?: string;
  downloadUrl?: string;
  searchKeywords?: string[];
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  slug?: string;
  previewImages?: string[];
  previewNote?: string;
  shareCount?: number;
  shares?: number;
  stockQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Backward compatibility alias
export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
  count: string;
  featuredColor: string;
}

export interface ProTool {
  id: string;
  name: string;
  logo: string;
  monthlyPricePKR: number;
  monthlyPriceUSD: number;
  duration: 'Monthly Access' | 'Yearly Access' | 'Lifetime Key' | '18 Months VIP';
  features: string[];
  instantDelivery: boolean;
  popular?: boolean;
}

export interface MembershipPlan {
  id: string;
  title: string;
  badge?: string;
  pricePKR: number;
  priceUSD: number;
  billingPeriod: 'Monthly' | 'Yearly' | 'One-Time';
  description: string;
  features: string[];
  highlight?: boolean;
}

// 4 Distinct Offer Types for the DigiForge Membership & Bundles Page
export interface BundleOffer {
  id: string;
  title: string;
  thumbnail?: string;
  includedProductIds?: string[];
  productIds?: string[];
  itemCount?: number;
  itemsCount?: number;
  pricePKR: number; // fixed 499
  priceUSD: number; // fixed 2.5
  worthPKR?: number; // e.g. 1500+
  worthUSD?: number; // e.g. 8+
  originalWorthPKR?: number;
  originalWorthUSD?: number;
  description: string;
  highlights?: string[];
  badge?: string;
  badgeText?: string;
  isPopular?: boolean;
  isActive?: boolean;
}

export interface CollectionOffer {
  id: string;
  categoryId: string;
  name: string;
  icon: string;
  pricePKR: number; // 599
  priceUSD: number; // 3
  billingPeriod: 'Monthly' | 'Yearly';
  dailyDropProductIds?: string[];
  previewThumbnails: string[];
  subscriberCount: number;
  description: string;
  microCopy?: string;
  todayDropTitle?: string;
}

export interface MegaPassOffer {
  id: string;
  title: string;
  badge: string;
  headline: string;
  subheadline: string;
  pricePKR: number; // 3000
  priceUSD: number; // 15
  billingPeriod: 'One-Time Payment';
  valueAnchor: string;
  features: string[];
  trustCopy: string;
  totalCatalogWorthPKR: number;
  totalCatalogWorthUSD: number;
}

export interface ToolBundleTool {
  name: string;
  logo: string;
  tag?: string;
}

export interface ToolBundleOffer {
  id: string;
  name: string;
  tools: ToolBundleTool[];
  toolCount: number;
  originalPricePKR: number;
  originalPriceUSD: number;
  bundlePricePKR: number;
  bundlePriceUSD: number;
  description: string;
  features: string[];
  popular?: boolean;
  savingsPercentage?: number;
}

export type PurchasableItem = 
  | Product 
  | ProTool 
  | BundleOffer 
  | CollectionOffer 
  | MegaPassOffer 
  | ToolBundleOffer
  | {
      id: string;
      title?: string;
      name?: string;
      pricePKR?: number;
      priceUSD?: number;
      monthlyPricePKR?: number;
      monthlyPriceUSD?: number;
      type?: string;
      thumbnail?: string;
      logo?: string;
      features?: string[];
      description?: string;
    };

export interface ServiceItem {
  id: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  iconName: string;
  startingPricePKR: number;
  startingPriceUSD: number;
  deliverables: string[];
  turnaroundTime: string;
  reviews: { author: string; rating: number; comment: string; role?: string; avatar?: string }[];
  category?: string;
  badge?: string;
  popular?: boolean;
  techStack?: string[];
  highlights?: string[];
  tiers?: {
    name: string;
    pricePKR: number;
    priceUSD: number;
    delivery: string;
    description: string;
    features: string[];
    isPopular?: boolean;
  }[];
  portfolioSamples?: {
    title: string;
    image: string;
    tag: string;
    metric?: string;
  }[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  rating: number;
  review: string;
  purchasedItem: string;
  date: string;
}

export interface CartItem {
  id?: string;
  productId: string;
  title: string;
  thumbnail: string;
  pricePKR: number;
  priceUSD: number;
  type: 'product' | 'bundle' | 'collection' | 'toolBundle' | 'megaPass' | 'tool' | 'service';
  quantity?: number;
  fileFormat?: string;
  deliveryMethod?: string;
  badge?: string;
  category?: string;
  features?: string[];
  isSubscription?: boolean;
  billingInterval?: string;
}

export interface CouponDiscount {
  code: string;
  percentage?: number; // e.g. 10 for 10%
  fixedPKR?: number;
  fixedUSD?: number;
  description: string;
  applicableScope?: 'all' | 'specific_products' | 'specific_categories';
  applicableProductIds?: string[];
  applicableProductTitles?: string[];
  applicableCategoryIds?: string[];
  eligibleProductIds?: string[];
  eligibleCategories?: string[];
  minOrderAmountPKR?: number;
  minOrderAmountUSD?: number;
  isReferral?: boolean;
  referrerUid?: string;
  referrerName?: string;
  expiryDate?: string;
  usageCount?: number;
}

export interface UserReferralStats {
  referralCode: string;
  totalReferredOrders: number;
  totalEarnedPKR: number;
  totalEarnedUSD: number;
  rewardPoints: number;
  discountPerkPercent: number;
  referredOrders?: {
    orderId: string;
    customerName: string;
    date: string;
    amountPKR: number;
    rewardPKR: number;
  }[];
}

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  email: string;
  whatsapp: string;
  items: { 
    productId: string; 
    title: string; 
    price: number; 
    type: 'product' | 'tool' | 'membership' | 'service' | 'bundle' | 'collection' | 'toolBundle' | 'megaPass';
    thumbnail?: string;
    expiresAt?: string; // ISO string for tool/membership expiry date managed by admin
    reminderSent?: boolean; // True if 3-day expiry email reminder was sent
  }[];
  totalAmountPKR: number;
  totalAmountUSD: number;
  subtotalPKR?: number;
  subtotalUSD?: number;
  discountPKR?: number;
  discountUSD?: number;
  couponCode?: string;
  paymentMethod: 'JazzCash' | 'EasyPaisa' | 'NayaPay' | 'UPaisa' | 'SadaPay' | 'Bank Transfer' | 'Binance Crypto';
  status: 'Pending Verification' | 'Payment Verified' | 'Access Delivered' | 'Completed';
  createdAt: string;
  downloadLinks?: string[];
  notes?: string;
  reviewPromptSent?: boolean;
  reviewSubmitted?: boolean;
  reviewId?: string;
  referrerUid?: string;
  referrerRewardPKR?: number;
  referralRecorded?: boolean;
}

export interface AdminNotification {
  id: string;
  type: 'login' | 'signup' | 'add_to_cart' | 'order_placed' | 'tool_purchased' | 'expiry_reminder';
  title: string;
  message: string;
  customerName?: string;
  customerEmail?: string;
  timestamp: string;
  read?: boolean;
}

export interface CheckoutFeedback {
  id?: string;
  orderId: string;
  rating: number; // 1 (Poor) to 4 (Awesome)
  ratingEmoji: string;
  customerName?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface NewsletterSubscriber {
  email: string;
  subscribedAt: string;
}

export type ContactInquiryType = 
  | 'Order/Delivery Issue' 
  | 'Resource Question' 
  | 'Membership/Bundles' 
  | 'Custom Service Request' 
  | 'Partnership/Other';

export interface ContactInquiry {
  id?: string;
  name: string;
  email: string;
  inquiryType: ContactInquiryType;
  message: string;
  whatsapp?: string;
  status: 'new' | 'replied' | 'pending';
  createdAt: string;
}

export interface SiteSettings {
  whatsappNumber: string;
  whatsappDisplay?: string;
  whatsappResponseTime?: string;
  email?: string;
  supportEmail?: string;
  businessHours?: string;
  storeNotice?: string;
  currencySymbol?: string;
  socials?: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    x?: string;
    telegram?: string;
    threads?: string;
    handle?: string;
  };
}

export type LegalDocId = 'refund' | 'privacy' | 'terms';

export interface LegalStep {
  step: number;
  title: string;
  desc: string;
}

export interface LegalSection {
  id: string;
  title: string;
  shortTitle?: string;
  content: string;
  bullets?: string[];
  subsections?: {
    subtitle: string;
    subcontent: string;
    subbullets?: string[];
  }[];
  steps?: LegalStep[];
  callout?: {
    type: 'info' | 'warning' | 'success';
    text: string;
  };
}

export interface LegalPageData {
  id: LegalDocId;
  title: string;
  eyebrow?: string;
  intro?: string;
  lastUpdated: string;
  content?: string;
  sections?: LegalSection[];
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  orderId: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  userLocation?: string;
  productId: string;
  productTitle: string;
  productThumbnail?: string;
  productCategory?: string;
  rating: number; // 1 - 5
  reviewText: string;
  comment?: string;
  photoUrl?: string;
  status: ReviewStatus;
  createdAt: string;
  approvedAt?: string;
  adminNote?: string;
  helpfulCount?: number;
  isVerifiedPurchase: boolean;
}
export type UserRole = "customer" | "admin" | "super_admin";
export type UserMembershipStatus = 'free' | 'bundle' | 'collection' | 'mega_pass' | 'pro';
export type UserAccountStatus = 'active' | 'suspended' | 'pending';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  membershipStatus?: UserMembershipStatus;
  status?: UserAccountStatus;
  createdAt: string;
  lastLoginAt: string;
  phone?: string;
  whatsapp?: string;
  ordersCount?: number;
  newsletterSubscribed?: boolean;
  
  // Login credentials & session details for Admin monitoring
  authProvider?: string; // 'google.com' | 'password' | 'guest' | string;
  loginCount?: number;
  lastLoginMethod?: string;
  deviceInfo?: string;
  ipAddress?: string;
  isEmailVerified?: boolean;
  totalSpentPKR?: number;
  totalSpentUSD?: number;
}

export type AuditLogCategory = 'auth' | 'order' | 'admin' | 'security' | 'catalog' | 'system';
export type AuditLogSeverity = 'info' | 'success' | 'warning' | 'danger';

export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ThreatCategory = 
  | 'SQL_INJECTION'
  | 'NOSQL_INJECTION'
  | 'XSS_ATTACK'
  | 'PATH_TRAVERSAL'
  | 'VULNERABILITY_SCANNER'
  | 'DOS_FLOOD'
  | 'MALICIOUS_PAYLOAD'
  | 'BRUTE_FORCE'
  | 'SUSPICIOUS_PROBE';

export interface SecurityThreat {
  id: string;
  timestamp: string;
  threatType: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  ipAddress: string;
  userAgent?: string;
  method: string;
  path: string;
  offendingPayload?: string;
  actionTaken: 'BLOCKED_403' | 'RATE_LIMITED_429' | 'SANITIZED' | 'LOGGED_ALERT';
  status: 'active' | 'resolved' | 'banned_ip';
  location?: string;
  details?: string;
}

export interface SecurityStats {
  totalThreatsBlocked: number;
  criticalExploits: number;
  sqlInjectionsBlocked: number;
  xssBlocked: number;
  scannersBlocked: number;
  bannedIpsCount: number;
  lastThreatAt?: string;
  wafActive: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: AuditLogCategory;
  severity: AuditLogSeverity;
  actorEmail?: string;
  actorName?: string;
  actorRole?: UserRole | 'system' | 'guest' | string;
  actorUid?: string;
  ipAddress?: string;
  deviceInfo?: string;
  details?: Record<string, any> | string;
  targetId?: string;
  targetType?: string;
}

export type AuditLogEvent = AuditLog;

export type JoinLinkType = 'Website' | 'WhatsApp Channel' | 'WhatsApp Community' | 'Social' | 'Newsletter' | 'Custom' | 'Store';

export interface JoinPageLink {
  id: string;
  label: string; // offer-led label with emoji, e.g. "🔥 Explore Digital Resources"
  subtitle?: string; // e.g. "50+ Courses, bundles & software"
  url: string; // internal route or external URL
  linkType?: JoinLinkType;
  icon?: string; // e.g. 'Flame', 'MessageSquare', 'Users', 'Radio', 'Globe', 'ShoppingBag', etc.
  order: number;
  isActive: boolean;
  isPrimary: boolean; // marks the one dominant hero CTA
  clickCount?: number; // Click analytics counter
  clicks?: number; // legacy alias
  badge?: string; // e.g. "100% Free", "VIP Pass", "4.9 ★", "Follow Channel", "Join Community"
  badgeColor?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JoinPageSettings {
  profilePhoto: string;
  headline: string;
  subheadline: string;
  tagline: string;
  socials?: {
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
    youtube?: string;
    telegram?: string;
    facebook?: string;
    x?: string;
  };
  updatedAt?: string;
}

export interface AbandonedCart {
  id: string;
  userId?: string;
  email: string;
  whatsapp?: string;
  customerName?: string;
  items: CartItem[];
  totalAmountPKR: number;
  totalAmountUSD: number;
  paymentMethod?: string;
  status: 'abandoned' | 'recovered' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodSetting {
  id: string;
  name: string;
  accountName?: string;
  accountNumber?: string;
  instructions?: string;
  isActive: boolean;
}

export interface NewsletterSentLog {
  id: string;
  subject: string;
  content: string;
  segment: string;
  recipientCount: number;
  sentAt: string;
  sentBy: string;
}



export type FAQCategory = 'Orders & Payment' | 'Delivery & Access' | 'Pricing' | 'Account' | 'Refunds' | 'General';
export interface FAQ {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export type ServiceType = 
  | 'Custom Web Applications & Modern Portals'
  | 'Desktop Applications & Native Productivity Tools'
  | 'UI/UX Design Systems & Digital Branding'
  | 'Complete Full-Stack Digital Product'
  | 'AI Automation Services & Workflow'
  | 'Turn Your Traditional Business Into Digitalization'
  | 'Website Development'
  | 'Desktop Applications'
  | 'UI/UX & Branding'
  | 'Cloud & Backend Architecture'
  | 'Custom Automation & Scripting'
  | 'Full-Stack Solution'
  | 'Other Custom Project';

export type ServiceBudgetRange = 
  | 'Under Rs. 25,000 / $100'
  | 'Rs. 25,000 - 50,000 / $100 - $200'
  | 'Rs. 50,000 - 150,000 / $200 - $500'
  | 'Rs. 150,000+ / $500+'
  | "Custom / Let's Discuss";

export type ServiceTimeline = 
  | 'Urgent (1-2 Weeks)'
  | 'Standard (2-4 Weeks)'
  | 'Flexible (1-2 Months)'
  | 'Long-Term Contract';

export type ServiceInquiryStatus = 
  | 'New'
  | 'Contacted'
  | 'Quoted'
  | 'In Progress'
  | 'Completed'
  | 'Archived';

export interface ServiceInquiry {
  id: string;
  name: string;
  email: string;
  phoneOrWhatsApp?: string;
  serviceType: string;
  budgetRange: string;
  timeline: string;
  projectDescription: string;
  status: ServiceInquiryStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
}

export interface CloudBackupRecord {
  id: string;
  filename: string;
  timestamp: string;
  triggerType: 'automated_nightly' | 'manual_admin';
  fileSizeBytes: number;
  fileSizeFormatted: string;
  recordCounts: {
    orders: number;
    products: number;
    users: number;
    reviews: number;
    auditLogs: number;
    threats: number;
    total: number;
  };
  status: 'completed' | 'failed';
  downloadUrl?: string;
  sheetsIncluded?: string[];
  checksum?: string;
  details?: string;
  dataBase64?: string; // Optional client-side snapshot storage
}

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

export interface BackupSystemSettings {
  autoBackupEnabled: boolean;
  scheduledTime: string; // e.g. "02:00"
  emailNotification: boolean;
  notifyEmail: string; // "zohaibdigiforge@gmail.com"
  retentionDays: number; // e.g. 30
  lastRunTimestamp?: string;
  nextScheduledRun?: string;
  totalBackupsCount?: number;
  systemStatus: 'ACTIVE_ARMED' | 'PAUSED';
  googleSheetsSync?: GoogleSheetsSyncConfig;
}


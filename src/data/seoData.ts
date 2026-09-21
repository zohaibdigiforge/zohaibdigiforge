export interface PageSEOConfig {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  schemaType?: 'WebSite' | 'CollectionPage' | 'AboutPage' | 'ContactPage' | 'FAQPage' | 'ItemPage' | 'Article';
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export const SEO_KEYWORDS = {
  primary: [
    'Zohaib DigiForge',
    'DigiForge digital resources',
    'digital resources store Pakistan',
    'Rs 279 digital products',
    '$1 digital store',
    'Zohaib digital marketplace',
    'flat price digital assets',
    'verified pro tools Pakistan'
  ],
  coreProduct: [
    'affordable digital resources Pakistan',
    'cheap online courses Pakistan',
    'digital resources Rs 279',
    '$1 digital products',
    'flat price digital store',
    'premium tools cheap price',
    'digital marketplace Pakistan',
    'online courses low price Pakistan',
    'graphic design templates Pakistan',
    'cheap ebooks Pakistan',
    'software resources download Pakistan',
    'verified download links Google Drive',
    'instant delivery digital assets',
    'buy digital products with JazzCash EasyPaisa'
  ],
  categorySpecific: {
    'courses': [
      'online courses Pakistan',
      'cheap skill courses',
      'affordable video courses',
      'cybersecurity course Pakistan',
      'web development bootcamp Urdu Hindi',
      'AI prompt engineering masterclass',
      'full stack developer course cheap',
      'Python data science tutorials download',
      'freelancing skills course 2026',
      'digital marketing masterclass Pakistan'
    ],
    'graphics-assets': [
      'graphic design assets download',
      'premium graphics cheap price',
      '3D icons and illustrations pack',
      'Figma UI kits Pakistan',
      'social media marketing templates bundle',
      'Photoshop PSD templates editable',
      'vector logos typography bundles',
      'Canva editable graphic kits'
    ],
    'templates': [
      'digital templates Pakistan',
      'design templates download',
      'Notion all in one workspace template',
      'Framer SaaS landing templates',
      'financial spreadsheet templates Excel',
      'resume and CV modern templates',
      'pitch deck PowerPoint templates',
      'client proposal contract templates'
    ],
    'softwares': [
      'premium software cheap price Pakistan',
      'software resources download',
      'Adobe Creative Cloud collections',
      'video editing suites pro',
      'developer productivity tools',
      'Windows utility software pack',
      'plugins and extensions bundle',
      'AI audio enhancer software'
    ],
    'ebooks': [
      'cheap ebooks Pakistan',
      'affordable ebooks download PDF',
      'digital product playbooks 2026',
      'online business monetization guides',
      'programming coding ebooks download',
      'passive income blueprints for creators'
    ],
    'pro-tools': [
      'pro tools cheap price Pakistan',
      'premium tools subscription Pakistan',
      'Canva Pro lifetime access buy',
      'ChatGPT Plus shared seat Pakistan',
      'CapCut Pro lifetime PC',
      'Midjourney AI prompt access',
      'Grammarly Premium student discount',
      'Figma Pro subscription cheap'
    ]
  } as Record<string, string[]>,
  longTail: [
    'where to buy cheap digital courses in Pakistan',
    'affordable resources for students Pakistan',
    'digital products under 300 rupees',
    'one dollar digital products store worldwide',
    'JazzCash EasyPaisa digital products instant download',
    'buy digital courses with JazzCash',
    'instant delivery digital resources Pakistan',
    'how to buy Canva Pro in Pakistan without credit card',
    'best digital tools for freelancers Pakistan',
    'verified Google Drive digital asset downloads'
  ],
  founderStory: [
    'Muhammad Zohaib Shahzad',
    'Muhammad Zohaib Shahzad founder of Zohaib DigiForge',
    'Muhammad Zohaib Shahzad owner of Zohaib DigiForge',
    'affordable learning for middle class students',
    'student-friendly digital store Pakistan',
    'quality resources for students Pakistan',
    'Zohaib DigiForge founder mission',
    'democratizing digital skills and tools'
  ],
  paymentTrust: [
    'JazzCash digital products instant',
    'EasyPaisa online store digital',
    'Binance USDT payment digital products',
    'secure digital resources Pakistan',
    'Nayapay Sadapay accepted digital store',
    '100% money back guarantee on non-functional links'
  ]
};

export const STATIC_PAGES_SEO: Record<string, PageSEOConfig> = {
  home: {
    title: 'Zohaib DigiForge — Empowering Learning, Powering Success | Digital Resources & Pro Tools | Flat Rs. 279 Store',
    description: 'Digital resources and pro tools for students, professionals, and creators — courses, templates, graphics, e-books, and software, each priced at Rs. 279 / $1.',
    keywords: [...SEO_KEYWORDS.primary, ...SEO_KEYWORDS.coreProduct.slice(0, 5), 'flat Rs 279 store', 'Pakistani digital store'],
    canonical: '/',
    schemaType: 'WebSite',
    ogType: 'website',
    breadcrumbs: [{ name: 'Home', url: '/' }]
  },
  resources: {
    title: 'Browse All Digital Resources & Pro Tools | Zohaib DigiForge',
    description: 'Browse our complete catalog of courses, templates, graphics assets, e-books, software, and pro tools. Every resource priced at Rs. 279 / $1, delivered instantly.',
    keywords: [...SEO_KEYWORDS.coreProduct, ...SEO_KEYWORDS.primary],
    canonical: '/resources',
    schemaType: 'CollectionPage',
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Digital Resources', url: '/resources' }
    ]
  },
  services: {
    title: 'Custom Engineering, Web Development & Desktop Software Services | Zohaib DigiForge',
    description: 'Need something custom built? Beyond ready-made resources — we design, develop, and build custom web applications, desktop software, automation scripts, and UI/UX solutions tailored to your project.',
    keywords: [
      ...SEO_KEYWORDS.primary,
      'custom web development Pakistan',
      'desktop software development',
      'custom automation scripts Python',
      'UI UX design Figma Pakistan',
      'custom digital services quote',
      'Zohaib DigiForge custom software',
      'bespoke software engineer Pakistan'
    ],
    canonical: '/services',
    schemaType: 'ItemPage',
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Custom Services', url: '/services' }
    ]
  },
  about: {
    title: 'Our Story — Why We Built DigiForge | Zohaib DigiForge',
    description: 'Learn the story behind Zohaib DigiForge, founded and owned by Muhammad Zohaib Shahzad — built to make quality digital resources accessible and affordable for every student and creator in Pakistan and worldwide.',
    keywords: [...SEO_KEYWORDS.founderStory, ...SEO_KEYWORDS.primary, 'affordable digital skills'],
    canonical: '/about',
    schemaType: 'AboutPage',
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'About Us', url: '/about' }
    ]
  },
  contact: {
    title: 'Contact Us & WhatsApp Support — Get Help Fast | Zohaib DigiForge',
    description: 'Have a question about an order, a resource, or custom request? Reach us on WhatsApp — we typically respond within 3 hours.',
    keywords: [...SEO_KEYWORDS.paymentTrust, 'DigiForge WhatsApp support', 'customer service Pakistan'],
    canonical: '/contact',
    schemaType: 'ContactPage',
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Contact', url: '/contact' }
    ]
  },
  faq: {
    title: 'Frequently Asked Questions & Answers | Zohaib DigiForge',
    description: 'Find clear answers on pricing, delivery, accepted payment methods (JazzCash, EasyPaisa, Binance), and refunds at Zohaib DigiForge.',
    keywords: ['DigiForge FAQ', 'payment methods JazzCash EasyPaisa', 'instant delivery FAQ', 'digital store questions'],
    canonical: '/faq',
    schemaType: 'FAQPage',
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'FAQ', url: '/faq' }
    ]
  },
  refund: {
    title: 'Refund Policy & Guarantee | Zohaib DigiForge',
    description: "Review Zohaib DigiForge's refund policy for digital resources, bundles, and memberships — 100% money back guarantee on non-functional links.",
    keywords: ['refund policy digital products', 'DigiForge money back terms', 'customer guarantee'],
    canonical: '/refund',
    schemaType: 'ItemPage',
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Legal', url: '/terms' },
      { name: 'Refund Policy', url: '/refund' }
    ]
  },
  privacy: {
    title: 'Privacy Policy & Data Security | Zohaib DigiForge',
    description: 'Learn how Zohaib DigiForge collects, uses, and protects your personal information when you shop or create an account.',
    keywords: ['privacy policy', 'user data security', 'DigiForge terms'],
    canonical: '/privacy',
    schemaType: 'ItemPage',
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Legal', url: '/terms' },
      { name: 'Privacy Policy', url: '/privacy' }
    ]
  },
  terms: {
    title: 'Terms of Service & Licensing Conditions | Zohaib DigiForge',
    description: 'The terms and conditions governing the use of Zohaib DigiForge, including purchases, digital licensing, and account use.',
    keywords: ['terms of service', 'licensing agreement', 'digital assets rights'],
    canonical: '/terms',
    schemaType: 'ItemPage',
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Legal', url: '/terms' },
      { name: 'Terms of Service', url: '/terms' }
    ]
  },
  auth: {
    title: 'Sign In or Create an Account | Zohaib DigiForge',
    description: 'Log in or join DigiForge to track orders, access your downloads, and manage your account in one place.',
    keywords: ['sign in', 'user account', 'customer downloads portal'],
    canonical: '/auth',
    noindex: true
  },
  cart: {
    title: 'Your Cart | Zohaib DigiForge',
    description: 'Review your selected resources before checkout — flat Rs. 279 / $1 pricing, no hidden fees.',
    keywords: ['shopping cart', 'checkout DigiForge'],
    canonical: '/cart',
    noindex: true
  },
  checkout: {
    title: 'Secure Checkout | Zohaib DigiForge',
    description: 'Complete your secure order for digital resources and pro tools at Zohaib DigiForge with instant Google Drive delivery.',
    keywords: ['secure checkout', 'JazzCash payment', 'EasyPaisa payment'],
    canonical: '/checkout',
    noindex: true
  },
  dashboard: {
    title: 'Customer Dashboard & Downloads | Zohaib DigiForge',
    description: 'Access your purchased digital files, download links, active pro subscriptions, and order tracking history in your Zohaib DigiForge account.',
    keywords: ['customer downloads', 'my orders', 'account dashboard'],
    canonical: '/dashboard',
    noindex: true
  },
  admin: {
    title: 'Admin Management Panel | Zohaib DigiForge',
    description: 'DigiForge administrative store manager and product inventory control.',
    keywords: ['admin'],
    canonical: '/admin',
    noindex: true
  },
  'join-us': {
    title: 'Join Our Community & Channels | Zohaib DigiForge',
    description: 'Connect with Zohaib DigiForge across WhatsApp channels, communities, and social platforms — free resources, deal drops, and daily updates.',
    keywords: ['WhatsApp community', 'DigiForge telegram', 'digital creators group Pakistan'],
    canonical: '/join-us',
    schemaType: 'ItemPage',
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Join Community', url: '/join-us' }
    ]
  },
  sitemap: {
    title: 'HTML Sitemap & Complete Directory | Zohaib DigiForge',
    description: 'Explore the full directory index of all pages, bespoke client services, digital product categories, and legal documents on Zohaib DigiForge.',
    keywords: ['sitemap', 'site directory', 'DigiForge page index', 'all services', 'all products'],
    canonical: '/sitemap',
    schemaType: 'ItemPage',
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Sitemap', url: '/sitemap' }
    ]
  },
  notFound: {
    title: 'Page Not Found | Zohaib DigiForge',
    description: "This page doesn't exist — but our resources, tools, and courses do. Let's get you back on track.",
    keywords: ['404 not found'],
    canonical: '/404',
    noindex: true
  }
};

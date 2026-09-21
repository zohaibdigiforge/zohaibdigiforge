import { Category, Subcategory, Product, ProTool, MembershipPlan, ServiceItem, Testimonial } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'courses',
    name: 'Courses',
    slug: 'courses',
    icon: 'GraduationCap',
    description: 'Master in-demand Cybersecurity, Artificial Intelligence, Web Development, Software Development, Trading , Youtube Automation and Digital Marketing and much more Courses.',
    order: 1,
    itemCount: 8,
    featuredColor: 'from-blue-600/20 to-cyan-500/10'
  },
  {
    id: 'graphics-assets',
    name: 'Graphics Assets',
    slug: 'graphics-assets',
    icon: 'Palette',
    description: 'Advanced Level Video Editing Assets, Graphics Designing Assets, Social Media Branding Bundles, Raw Data, Designing Templates and Much More.',
    order: 2,
    itemCount: 6,
    featuredColor: 'from-purple-600/20 to-pink-500/10'
  },
  {
    id: 'templates',
    name: 'Templates',
    slug: 'templates',
    icon: 'Layout',
    description: 'Notion, Wordpress, Shopify, Excel, Powerpoint, Font, Resume, Canva, Etsy, Pinterest, Evento, Coding , ChatGPT Prompts , Mid Journey Prompts, and much more Template.',
    order: 3,
    itemCount: 6,
    featuredColor: 'from-emerald-600/20 to-teal-500/10'
  },
  {
    id: 'softwares',
    name: 'Softwares',
    slug: 'softwares',
    icon: 'Cpu',
    description: 'All pro utilities, adobe collections, audio/video editing suites, designing softwares, Apk & Pro mobile Apps and much more.',
    order: 4,
    itemCount: 5,
    featuredColor: 'from-amber-600/20 to-orange-500/10'
  },
  {
    id: 'ebooks',
    name: 'E-Books',
    slug: 'e-books',
    icon: 'BookOpen',
    description: 'All Books About Digital Skills, Motivational, Self Improvement, Prompt Books, Urdu & English Mega Bundles, Digital Product Playbooks, Blueprints and much more.',
    order: 5,
    itemCount: 5,
    featuredColor: 'from-indigo-600/20 to-blue-500/10'
  },
  {
    id: 'pro-tools',
    name: 'Pro Tools',
    slug: 'pro-tools',
    icon: 'Wrench',
    description: 'Instant private & team subscriptions for Canva Pro, ChatGPT Plus, CapCut Pro & Gemini Pro , VPNs ,Linkedln and more much Tools .',
    order: 6,
    itemCount: 6,
    featuredColor: 'from-cyan-600/20 to-blue-600/10'
  }
];

export const INITIAL_SUBCATEGORIES: Subcategory[] = [
  // Courses
  { id: 'sub-courses-webdev', categoryId: 'courses', name: 'Web Development', slug: 'web-development', description: 'Full-stack React, Node.js, Next.js, and TypeScript project masterclasses.', order: 1, itemCount: 3 },
  { id: 'sub-courses-ai', categoryId: 'courses', name: 'AI & Prompting', slug: 'ai-prompting', description: 'Master generative AI, LLM prompting, and autonomous agent workflows.', order: 2, itemCount: 2 },
  { id: 'sub-courses-video', categoryId: 'courses', name: 'Video Editing & VFX', slug: 'video-editing', description: 'Premiere Pro, After Effects, and CapCut cinematic workflow courses.', order: 3, itemCount: 2 },
  { id: 'sub-courses-freelance', categoryId: 'courses', name: 'Freelancing & Agency', slug: 'freelancing', description: 'Upwork top-rated guides, client outreach scripts, and pricing strategies.', order: 4, itemCount: 1 },

  // Graphics Assets
  { id: 'sub-graphics-3d', categoryId: 'graphics-assets', name: '3D Icons & Assets', slug: '3d-icons', description: 'High-polygon 3D icon sets with transparent alpha backgrounds.', order: 1, itemCount: 2 },
  { id: 'sub-graphics-figma', categoryId: 'graphics-assets', name: 'Figma & UI Kits', slug: 'figma-ui-kits', description: 'Design systems, SaaS mobile and desktop UI kit components.', order: 2, itemCount: 2 },
  { id: 'sub-graphics-social', categoryId: 'graphics-assets', name: 'Social Media Bundles', slug: 'social-bundles', description: 'Ready-to-post Instagram, YouTube, and TikTok carousel templates.', order: 3, itemCount: 2 },

  // Templates
  { id: 'sub-templates-notion', categoryId: 'templates', name: 'Notion Workspaces', slug: 'notion-workspaces', description: 'Complete life OS, freelancing CRM, and agency project boards.', order: 1, itemCount: 3 },
  { id: 'sub-templates-framer', categoryId: 'templates', name: 'Framer & Webflow', slug: 'framer-webflow', description: 'Responsive portfolio and SaaS landing page templates.', order: 2, itemCount: 2 },
  { id: 'sub-templates-finance', categoryId: 'templates', name: 'Financial Spreadsheets', slug: 'financial-sheets', description: 'Automated revenue, expense, and tax calculation spreadsheets.', order: 3, itemCount: 1 },

  // Softwares
  { id: 'sub-softwares-editing', categoryId: 'softwares', name: 'Editing Suites', slug: 'editing-suites', description: 'Pro media editing, color grading LUTs, and audio clean-up plugins.', order: 1, itemCount: 2 },
  { id: 'sub-softwares-dev', categoryId: 'softwares', name: 'Developer Utilities', slug: 'dev-utilities', description: 'Terminal tools, API test suites, and database management helpers.', order: 2, itemCount: 2 },
  { id: 'sub-softwares-system', categoryId: 'softwares', name: 'System Boosters', slug: 'system-boosters', description: 'Windows/Mac RAM & performance optimizers and cache cleaners.', order: 3, itemCount: 1 },

  // E-Books
  { id: 'sub-ebooks-monetization', categoryId: 'ebooks', name: 'Monetization Guides', slug: 'monetization-guides', description: 'Step-by-step digital product creation and marketing blueprints.', order: 1, itemCount: 2 },
  { id: 'sub-ebooks-ai', categoryId: 'ebooks', name: 'AI Workflows', slug: 'ai-workflows', description: 'Practical 500+ prompt libraries and automation workflow handbooks.', order: 2, itemCount: 2 },
  { id: 'sub-ebooks-career', categoryId: 'ebooks', name: 'Tech Career Roadmaps', slug: 'career-roadmaps', description: 'Resume templates, technical interview guides, and salary negotiation tactics.', order: 3, itemCount: 1 },

  // Pro Tools
  { id: 'sub-protools-design', categoryId: 'pro-tools', name: 'Design Subscriptions', slug: 'design-subscriptions', description: 'Canva Pro Lifetime, Adobe Creative Cloud, and Envato Elements access.', order: 1, itemCount: 2 },
  { id: 'sub-protools-ai', categoryId: 'pro-tools', name: 'AI Pro Accounts', slug: 'ai-pro-accounts', description: 'ChatGPT Plus, Claude 3.5 Sonnet, and Midjourney private seats.', order: 2, itemCount: 2 },
  { id: 'sub-protools-video', categoryId: 'pro-tools', name: 'Video Creation Tools', slug: 'video-creation-tools', description: 'CapCut Pro Desktop & Mobile lifetime keys and ElevenLabs audio credits.', order: 3, itemCount: 2 }
];

export const INITIAL_PRODUCTS: Product[] = [];

// Re-export for compatibility
export const CATEGORIES_DATA = INITIAL_CATEGORIES.map(c => ({
  id: c.id,
  name: c.name,
  description: c.description,
  iconName: c.icon,
  count: `${c.itemCount}+ resources`,
  featuredColor: c.featuredColor || 'from-blue-600/20 to-cyan-500/10'
}));

export const PRODUCTS_DATA = INITIAL_PRODUCTS;

export const PRO_TOOLS_DATA: ProTool[] = [
  {
    id: 'tool-canva',
    name: 'Canva Pro Lifetime',
    logo: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=300&q=80',
    monthlyPricePKR: 499,
    monthlyPriceUSD: 3.49,
    duration: 'Lifetime Key',
    features: ['Activated on your OWN email', '100M+ Stock Photos & Videos', 'One-Click BG Remover', '30-Day Money Back Guarantee'],
    instantDelivery: true,
    popular: true
  },
  {
    id: 'tool-gemini-18m',
    name: 'Google Gemini Pro (18 Months VIP)',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    monthlyPricePKR: 1499,
    monthlyPriceUSD: 9.99,
    duration: '18 Months VIP',
    features: ['Full 18 Months Uninterrupted Access', 'Gemini 1.5 Pro 1M Token Context', 'Deep Research & Document Analysis', 'Instant WhatsApp Credential Delivery'],
    instantDelivery: true,
    popular: true
  },
  {
    id: 'tool-chatgpt',
    name: 'ChatGPT Plus GPT-4o',
    logo: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=300&q=80',
    monthlyPricePKR: 999,
    monthlyPriceUSD: 6.49,
    duration: 'Monthly Access',
    features: ['GPT-4o Multi-Modal Access', 'DALL-E 3 High-Res Generator', 'Advanced Data Analysis', 'Fast response during peak hours'],
    instantDelivery: true,
    popular: true
  },
  {
    id: 'tool-capcut',
    name: 'CapCut Pro Desktop & Mobile',
    logo: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=300&q=80',
    monthlyPricePKR: 799,
    monthlyPriceUSD: 4.99,
    duration: 'Lifetime Key',
    features: ['Pro Auto-Captions in 20+ Languages', 'Vocal Isolator & Noise Reducer', '4K 60FPS Export', 'VIP Animations & Transitions'],
    instantDelivery: true,
    popular: true
  },
  {
    id: 'tool-gemini-pro',
    name: 'Google Gemini Pro 1.5 Advanced',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    monthlyPricePKR: 899,
    monthlyPriceUSD: 5.99,
    duration: 'Monthly Access',
    features: ['Gemini 1.5 Pro 1M Token Context', 'Deep Research & Document Analysis', 'Google Docs & Drive AI Extensions', 'Instant WhatsApp Credential Delivery'],
    instantDelivery: true,
    popular: false
  }
];

export const MEMBERSHIP_PLANS_DATA: MembershipPlan[] = [
  {
    id: 'plan-starter',
    title: 'Explorer Pass',
    pricePKR: 999,
    priceUSD: 6.49,
    billingPeriod: 'Monthly',
    description: 'Perfect for students looking to jumpstart their digital product and learning journey.',
    features: [
      'Access to 20+ Free Core Courses',
      '20% Off All Store Purchases',
      'Canva Pro Invite Included',
      'Standard WhatsApp Support'
    ]
  },
  {
    id: 'plan-pro',
    title: 'Creator Guild VIP',
    badge: 'MOST POPULAR',
    highlight: true,
    pricePKR: 2499,
    priceUSD: 15.99,
    billingPeriod: 'Monthly',
    description: 'The ultimate toolset for freelancers, video editors, and agency builders.',
    features: [
      'Full Access to ALL 100+ Courses',
      '50% Off All Future Digital Drops',
      '2 Free Pro Tool Subscriptions / Month',
      'Weekly Exclusive Notion & Figma Bundles',
      'Priority VIP WhatsApp Group Mentorship'
    ]
  },
  {
    id: 'plan-lifetime',
    title: 'Lifetime Founder',
    badge: 'BEST VALUE',
    pricePKR: 8999,
    priceUSD: 54.99,
    billingPeriod: 'One-Time',
    description: 'One-time payment for perpetual access to everything DigiForge ever releases.',
    features: [
      'Lifetime Access to All Current & Future Assets',
      'Lifetime VIP Discord & WhatsApp Community',
      'Direct 1-on-1 Consultation with Zohaib',
      'Commercial Resell Rights on Select Templates'
    ]
  }
];

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'srv-web-saas',
    title: 'Website Solutions & SaaS Building',
    shortDesc: 'Custom high-performance websites, e-commerce stores, and multi-tenant SaaS platforms built with Next.js, React, and cloud backends.',
    fullDesc: 'We design and engineer bespoke web applications, high-converting landing pages, e-commerce storefronts, and production-ready SaaS platforms. Complete with authentication, local & international payment gateways (JazzCash, EasyPaisa, Stripe), SEO-optimized architecture, and sub-second loading speeds.',
    iconName: 'Code',
    category: 'web',
    badge: 'Flagship Service',
    popular: true,
    startingPricePKR: 9999,
    startingPriceUSD: 65.00,
    turnaroundTime: '3-5 Days',
    techStack: ['React 19', 'Next.js 15', 'TypeScript', 'Tailwind CSS', 'PostgreSQL / Supabase', 'JazzCash / EasyPaisa / Stripe'],
    highlights: [
      '100/100 Google PageSpeed & Mobile Performance',
      'Local & Global Payment Gateway Integration',
      'Full Source Code Ownership & Admin Panel',
      'Free Domain SSL & Deployment Included'
    ],
    deliverables: [
      'Bespoke Responsive Web / SaaS Platform Architecture',
      'Tailwind CSS UI with Motion Micro-Interactions',
      'Payment Gateway Integration (JazzCash, EasyPaisa, Stripe, Crypto)',
      'Database Schema, Authentication & User Role Control',
      'Free Deployment on Cloud Infrastructure with Custom Domain SSL',
      '30 Days Technical Warranty & Maintenance Included'
    ],
    tiers: [
      {
        name: 'Starter Website',
        pricePKR: 9999,
        priceUSD: 65.00,
        delivery: '3 Days',
        description: 'Single-page high-converting product/business landing site with WhatsApp integration and lead form.',
        features: ['Up to 5 Responsive Sections', 'WhatsApp & Lead Capture Form', 'SEO Meta Tags & Speed Setup', '1 Round of Revisions']
      },
      {
        name: 'Growth Web Solution',
        pricePKR: 24999,
        priceUSD: 149.00,
        delivery: '5-7 Days',
        description: 'Multi-page business website or store with dynamic CMS catalog and payment gateway.',
        features: ['Up to 8 Custom Pages', 'Dynamic Catalog / CMS', 'Local & Global Payment Gateways', 'Speed & SEO Optimization', '3 Rounds of Revisions'],
        isPopular: true
      },
      {
        name: 'Full SaaS Platform',
        pricePKR: 49999,
        priceUSD: 299.00,
        delivery: '10-14 Days',
        description: 'Full-stack SaaS application with user auth, subscription billing, database, dashboard, and admin portal.',
        features: ['User Auth & Role Control', 'Complete Database Architecture', 'Automated Subscription Billing', 'Admin Management Panel', '60 Days Priority Support']
      }
    ],
    portfolioSamples: [
      { title: 'TechFlow SaaS Dashboard', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80', tag: 'Next.js 15 SaaS', metric: '0.4s Speed Score' },
      { title: 'Apex Agency Web Portal', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80', tag: 'Web Solution', metric: '+310% Leads' }
    ],
    reviews: [
      { author: 'Hamza Khan (Karachi)', role: 'Founder, ApexMedia', rating: 5, comment: 'DigiForge built our agency web platform in 4 days. Blazing fast, beautiful UI, and got us 14 qualified leads in week one!' },
      { author: 'Saad Malik (Lahore)', role: 'Tech Lead, SwiftPay', rating: 5, comment: 'Exceptional TypeScript code quality and clean UI architecture. Delivered ahead of schedule.' }
    ]
  },
  {
    id: 'srv-digitalize-local',
    title: 'Digitalize Traditional Local Businesses',
    shortDesc: 'Transform offline stores, restaurants, services, and local vendors into modern digital powerhouses with online ordering, WhatsApp CRM, and Google Maps ranking.',
    fullDesc: 'Empower traditional brick-and-mortar businesses with automated digital systems. We convert physical stores, service shops, and local vendors into online leaders with digital QR catalogs, instant WhatsApp direct ordering, customer CRM, and top 3 Google Business Profile local SEO ranking.',
    iconName: 'Globe',
    category: 'digitalize',
    badge: 'High Local Impact',
    popular: true,
    startingPricePKR: 7999,
    startingPriceUSD: 49.00,
    turnaroundTime: '2-4 Days',
    techStack: ['WhatsApp Business API', 'Google Maps Local SEO', 'Digital QR Catalog', 'Automated CRM', 'JazzCash / EasyPaisa QR'],
    highlights: [
      'Instant WhatsApp Direct Order Ingestion',
      'Top 3 Local Google Maps Ranking Strategy',
      'Digital QR Code Menu & Price Cards',
      'Zero Technical Skill Required to Manage'
    ],
    deliverables: [
      'Mobile-Optimized Digital Catalog & Order Booking Site',
      'Direct WhatsApp Ordering & Auto-Receipt Engine',
      'Google Business Profile Setup & Local SEO Ranking Blueprint',
      'Custom Print-Ready QR Code Cards for In-Store Counter',
      'Automated Customer Loyalty & Follow-up Broadcast System',
      'Step-by-Step Video Training & 30 Days Local Business Support'
    ],
    tiers: [
      {
        name: 'Local Business Starter',
        pricePKR: 7999,
        priceUSD: 49.00,
        delivery: '2 Days',
        description: 'Quick digital setup with WhatsApp order button, digital menu/catalog, and Google Maps optimization.',
        features: ['Digital QR Menu / Product Catalog', 'Direct WhatsApp Order Ingestion', 'Google Maps Profile Verification', 'Printable QR Stand Design', '14 Days Support']
      },
      {
        name: 'Full Store Digitalization',
        pricePKR: 18999,
        priceUSD: 119.00,
        delivery: '4 Days',
        description: 'Complete digital transformation with online ordering, automated receipt generation, and customer CRM.',
        features: ['Custom Digital Web Storefront', 'Automated WhatsApp Order Bot', 'Google Local SEO Top 3 Setup', 'Automated Invoice Generation', 'Customer Database CRM', '30 Days Support'],
        isPopular: true
      },
      {
        name: 'Omni-Channel Local Enterprise',
        pricePKR: 34999,
        priceUSD: 219.00,
        delivery: '7 Days',
        description: 'Full automated infrastructure for multi-location stores or high-volume local service providers.',
        features: ['Multi-Branch Location Management', 'Automated Delivery & Rider Dispatch', 'Inventory & Stock Sync', 'Loyalty Rewards Program', '60 Days Dedicated Support']
      }
    ],
    portfolioSamples: [
      { title: 'Royal Foods QR Ordering System', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80', tag: 'Restaurant Digitalization', metric: '250+ Daily Orders' },
      { title: 'Metro Hardware Digital Store', image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80', tag: 'Local Business', metric: 'Top 3 Google Maps' }
    ],
    reviews: [
      { author: 'Usman Chaudhry (Faisalabad)', role: 'Owner, Metro Traders', rating: 5, comment: 'Digitizing our traditional hardware shop brought us 40+ new WhatsApp orders daily from local customers. Phenomenal results!' },
      { author: 'Chef Rashid (Rawalpindi)', role: 'Restaurant Owner', rating: 5, comment: 'The QR menu and direct WhatsApp ordering system saved us delivery app commission fees. Super easy for customers!' }
    ]
  }
];

export const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Muhammad Usman',
    role: 'Full-Stack Developer',
    location: 'Lahore, Pakistan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    review: 'The Web Dev Bootcamp and CapCut Pro access from DigiForge changed my freelance career. Earned back 10x the investment on my first Upwork client!',
    purchasedItem: 'Web Dev Bootcamp 2026',
    date: '2 days ago'
  },
  {
    id: 'test-2',
    name: 'Sara Danish',
    role: 'Content Creator & Designer',
    location: 'Karachi, Pakistan',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    review: 'Canva Pro lifetime was activated within 2 minutes of sending payment on EasyPaisa. Amazing support on WhatsApp from Zohaib!',
    purchasedItem: 'Canva Pro Lifetime',
    date: '1 week ago'
  },
  {
    id: 'test-3',
    name: 'Taimoor Shah',
    role: 'Agency Founder',
    location: 'Islamabad, Pakistan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    review: 'The Notion Creator OS is pure gold. My entire 6-person agency runs on this template now. Clean, fast, and super organized.',
    purchasedItem: 'Notion Creator OS 3.0',
    date: '2 weeks ago'
  },
  {
    id: 'test-4',
    name: 'Rashid Al-Mansoori',
    role: 'Digital Marketer',
    location: 'Dubai, UAE',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    review: 'Paid via Binance USDT and got instant download access. The quality of courses and prompt templates is international standard.',
    purchasedItem: 'AI Prompting Bible',
    date: '3 weeks ago'
  }
];

// ═════════════════════════════════════════════════════════════════════════════
// 4 DISTINCT OFFER TYPES FOR DIGIFORGE MEMBERSHIP & BUNDLES
// ═════════════════════════════════════════════════════════════════════════════

// 1. SECTION 1 — CURATED BUNDLES (Fixed Price: Rs. 499 / $2.5)
export const INITIAL_BUNDLES: import('../types').BundleOffer[] = [
  {
    id: 'bundle-freelancer-starter',
    title: 'Freelancer Starter Kit',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    itemCount: 6,
    pricePKR: 499,
    priceUSD: 2.5,
    worthPKR: 1800,
    worthUSD: 9.0,
    description: 'Everything you need to launch a high-earning freelance career: Upwork proposal scripts, client contract templates, invoicing sheets, portfolio kit, and outreach email mastery.',
    highlights: [
      'Upwork Top-Rated Proposal Scripts & Hooks',
      'Client Contract & Confidentiality NDA Templates',
      'Notion Freelance CRM & Project Pipeline 2026',
      'Professional Portfolio Deck & Automated Invoicing Kit'
    ],
    badge: 'Bestseller',
    isPopular: true
  },
  {
    id: 'bundle-trading-mastery',
    title: 'Trading Mastery Bundle',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    itemCount: 8,
    pricePKR: 499,
    priceUSD: 2.5,
    worthPKR: 2400,
    worthUSD: 12.0,
    description: 'Forex, Crypto & SMC Price Action master templates, risk-to-reward calculators, TradingView indicator setups, and psychological trading logs.',
    highlights: [
      'Smart Money Concepts (SMC) & Liquidity Blueprint',
      'Automated Risk, Position & Margin Calculator Sheets',
      'TradingView Pro Indicator Configs & Presets',
      'Daily Execution Journal & Backtesting Database'
    ],
    badge: 'Hot Deal',
    isPopular: true
  },
  {
    id: 'bundle-fullstack-dev',
    title: 'Full-Stack Dev Super Pack',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    itemCount: 7,
    pricePKR: 499,
    priceUSD: 2.5,
    worthPKR: 2200,
    worthUSD: 11.0,
    description: 'React 19 + Next.js 15 boilerplates, Tailwind UI components, Node.js authentication starter, and Docker production deployment scripts.',
    highlights: [
      'Next.js 15 SaaS Starter with Auth & Stripe/JazzCash',
      '50+ Prebuilt Accessible Tailwind CSS Blocks',
      'JWT, OAuth & Microservice Architecture Code',
      'API Security, Rate-Limiting & Docker Scripts'
    ],
    badge: 'Popular',
    isPopular: false
  },
  {
    id: 'bundle-uiux-arsenal',
    title: 'UI/UX Designer Arsenal',
    thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
    itemCount: 9,
    pricePKR: 499,
    priceUSD: 2.5,
    worthPKR: 2600,
    worthUSD: 13.0,
    description: 'Complete Figma design system, 500+ glassmorphic & 3D vector icons, responsive wireframe library, and pitch-ready client presentation decks.',
    highlights: [
      'Comprehensive Figma Design System with Variables',
      '500+ Ultra HD 3D Render Icons (Alpha PNG & OBJ)',
      'Mobile App Wireframe & Prototyping Component Kit',
      'Client Handoff Specification & Presentation Deck'
    ],
    badge: 'Designer Pick',
    isPopular: false
  },
  {
    id: 'bundle-video-creator-vault',
    title: 'Video Editor & Creator Vault',
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80',
    itemCount: 10,
    pricePKR: 499,
    priceUSD: 2.5,
    worthPKR: 2800,
    worthUSD: 14.0,
    description: 'Cinematic LUTs pack, 4K motion graphic overlays, viral Hormozi-style subtitle animation presets, and 1,000+ lossless SFX sound effects.',
    highlights: [
      '100+ Cinematic LUTs for Premiere, DaVinci & CapCut',
      'Animated Viral Subtitle & Caption Presets',
      '1,000+ Lossless Whooshes, Risers & Cinematic SFX',
      '4K Seamless Light Leaks, Film Grains & Overlays'
    ],
    badge: 'Creator Favorite',
    isPopular: true
  },
  {
    id: 'bundle-ai-automation-pack',
    title: 'AI Prompting & Automation Hub',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80',
    itemCount: 6,
    pricePKR: 499,
    priceUSD: 2.5,
    worthPKR: 1900,
    worthUSD: 9.5,
    description: '1,500+ tested prompts for ChatGPT, Claude & Midjourney, automated Make.com / Zapier webhook recipes, and custom AI persona prompt sheets.',
    highlights: [
      '1,500+ Copy-Paste Mega Prompts for Business & Copy',
      'Make.com & Zapier Automated Content Workflows',
      'Midjourney V6 Photorealism & Character Consistency Guide',
      'Autonomous AI Agent & Web Scraping Python Scripts'
    ],
    badge: 'AI Power',
    isPopular: false
  }
];

// 2. SECTION 2 — DAILY DROP COLLECTIONS (Rs. 599/mo · $3/mo)
export const INITIAL_COLLECTIONS: import('../types').CollectionOffer[] = [
  {
    id: 'collection-courses',
    categoryId: 'courses',
    name: 'Courses Collection',
    icon: 'GraduationCap',
    pricePKR: 599,
    priceUSD: 3.0,
    billingPeriod: 'Monthly',
    description: 'Get the latest curated video masterclasses on web development, freelancing, AI workflows, and video editing dropped straight to your private dashboard daily.',
    subscriberCount: 348,
    todayDropTitle: 'Full-Stack Next.js 15 & AI Micro-SaaS Blueprint',
    previewThumbnails: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=200&q=80'
    ]
  },
  {
    id: 'collection-templates',
    categoryId: 'templates',
    name: 'Templates Collection',
    icon: 'Layout',
    pricePKR: 599,
    priceUSD: 3.0,
    billingPeriod: 'Monthly',
    description: 'Fresh turnkey Notion life OS workspaces, Framer SaaS landing templates, agency client dashboards, and automated revenue tracking spreadsheets.',
    subscriberCount: 412,
    todayDropTitle: 'All-in-One Client Portal & Task Manager (Notion OS)',
    previewThumbnails: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=200&q=80'
    ]
  },
  {
    id: 'collection-graphics',
    categoryId: 'graphics-assets',
    name: 'Graphics Assets Collection',
    icon: 'Palette',
    pricePKR: 599,
    priceUSD: 3.0,
    billingPeriod: 'Monthly',
    description: 'Daily drops of 3D icons, Figma UI kits, social media carousel templates, grunge textures, and vector branding packs with commercial usage.',
    subscriberCount: 290,
    todayDropTitle: 'Neo-Brutalist 3D Tech Icon Pack (50+ Transparents)',
    previewThumbnails: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=200&q=80'
    ]
  },
  {
    id: 'collection-ebooks',
    categoryId: 'ebooks',
    name: 'E-Books Collection',
    icon: 'BookOpen',
    pricePKR: 599,
    priceUSD: 3.0,
    billingPeriod: 'Monthly',
    description: 'A new actionable monetization playbook, high-converting copy breakdown, or digital business roadmap added to your reading shelf every morning.',
    subscriberCount: 195,
    todayDropTitle: 'Zero-To-10k Agency Outreach Playbook (2026 Edition)',
    previewThumbnails: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=200&q=80'
    ]
  },
  {
    id: 'collection-software',
    categoryId: 'softwares',
    name: 'Software Collection',
    icon: 'Cpu',
    pricePKR: 599,
    priceUSD: 3.0,
    billingPeriod: 'Monthly',
    description: 'Developer utilities, video editing plugins, automated batch conversion scripts, and system performance boosters dropped daily.',
    subscriberCount: 220,
    todayDropTitle: 'Auto-Video Subtitle Sync CLI Tool for Windows/Mac',
    previewThumbnails: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80'
    ]
  }
];

// 3. SECTION 3 — THE MEGA PASS (Hero Flagship Lifetime Offer)
export const INITIAL_MEGA_PASS: import('../types').MegaPassOffer = {
  id: 'megapass-lifetime',
  title: 'The Mega Pass (Lifetime All-Access)',
  badge: 'LIFETIME ACCESS',
  headline: 'Own Everything. Forever.',
  subheadline: 'One payment. Every course, template, graphic, e-book, and software on DigiForge — yours for life, including everything we add after you join.',
  pricePKR: 3000,
  priceUSD: 15.0,
  billingPeriod: 'One-Time Payment',
  valueAnchor: "That's less than the price of 2 courses — for access to 100% of our catalog, today and forever.",
  features: [
    'Lifetime access to all current resources (all 6 categories)',
    'All future resources added automatically — no extra charge',
    'No monthly fees, no renewals',
    'Priority WhatsApp support direct with the DigiForge team',
    'Instant Private Google Drive & Cloud Vault access',
    'Full commercial & personal freelance licensing rights'
  ],
  trustCopy: 'One-time payment · Instant access · No recurring charges',
  totalCatalogWorthPKR: 48000,
  totalCatalogWorthUSD: 240.0
};

// 4. SECTION 4 — PRO TOOLS BUNDLES
export const INITIAL_TOOL_BUNDLES: import('../types').ToolBundleOffer[] = [
  {
    id: 'tool-bundle-creator',
    name: 'Creator Combo — Canva Pro + CapCut Pro',
    toolCount: 2,
    originalPricePKR: 1998,
    originalPriceUSD: 9.98,
    bundlePricePKR: 1299,
    bundlePriceUSD: 6.49,
    savingsPercentage: 35,
    tools: [
      { name: 'Canva Pro', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg', tag: 'Design' },
      { name: 'CapCut Pro', logo: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=100&q=80', tag: 'Video' }
    ],
    description: 'The essential creator toolkit. Unlimited graphics, stock media, brand kits, and desktop 4K video editing without watermarks.',
    features: [
      'Canva Pro Lifetime Brand Kit Access',
      'CapCut Pro 4K Desktop & Mobile Pass',
      'Instant WhatsApp Credential Delivery',
      'Full Commercial Usage License'
    ],
    popular: true
  },
  {
    id: 'tool-bundle-ai-power',
    name: 'AI Power Pack — ChatGPT + Gemini + Notion',
    toolCount: 3,
    originalPricePKR: 3500,
    originalPriceUSD: 17.50,
    bundlePricePKR: 1999,
    bundlePriceUSD: 9.99,
    savingsPercentage: 43,
    tools: [
      { name: 'ChatGPT Plus', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', tag: 'GPT-4o' },
      { name: 'Gemini Advanced', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80', tag: 'AI Pro' },
      { name: 'Notion AI', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png', tag: 'Workspace' }
    ],
    description: 'Triple your output with top-tier AI models and an intelligent workspace connected for maximum automation.',
    features: [
      'ChatGPT Plus Shared Turbo Seat',
      'Gemini 1.5 Pro Deep Reasoning Access',
      'Notion AI Unlimited Workspace',
      'Guaranteed 30-Day Uptime Replacement'
    ],
    popular: true
  },
  {
    id: 'tool-bundle-marketing',
    name: 'Ultimate Marketing Suite — SEMrush + QuillBot + Envato',
    toolCount: 3,
    originalPricePKR: 4200,
    originalPriceUSD: 21.00,
    bundlePricePKR: 2499,
    bundlePriceUSD: 12.49,
    savingsPercentage: 40,
    tools: [
      { name: 'SEMrush', logo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=100&q=80', tag: 'SEO' },
      { name: 'QuillBot Premium', logo: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=100&q=80', tag: 'Writing' },
      { name: 'Envato Elements', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80', tag: 'Assets' }
    ],
    description: 'Dominate search engine rankings, generate flawless copywriting, and download unlimited premium creative assets.',
    features: [
      'SEMrush Domain & Keyword Audit Tools',
      'QuillBot Unlimited Paraphraser',
      'Envato Elements Unlimited Downloads',
      'Instant Private Browser Access'
    ],
    popular: false
  },
  {
    id: 'tool-bundle-developer',
    name: 'Developer Power Trio — GitHub Copilot + Cursor Pro + ChatGPT',
    toolCount: 3,
    originalPricePKR: 3800,
    originalPriceUSD: 19.00,
    bundlePricePKR: 2199,
    bundlePriceUSD: 10.99,
    savingsPercentage: 42,
    tools: [
      { name: 'GitHub Copilot', logo: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=100&q=80', tag: 'Code' },
      { name: 'Cursor Pro', logo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=100&q=80', tag: 'Editor' },
      { name: 'ChatGPT 4o', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', tag: 'Logic' }
    ],
    description: 'Ship full-stack web applications and backend APIs 5x faster with AI pair-programming and smart code completion.',
    features: [
      'GitHub Copilot Active Token',
      'Cursor Pro Fast GPT-4o Autocomplete',
      'Dedicated Private API Access',
      'Instant Setup Guide Included'
    ],
    popular: false
  }
];

export const LIVE_TICKER_ITEMS = [
  { name: 'Usman from Lahore', item: 'CapCut Pro Desktop Pass', time: '2 mins ago' },
  { name: 'Fatima from Karachi', item: '100+ Notion Automation Templates', time: '5 mins ago' },
  { name: 'Zain from Islamabad', item: 'ChatGPT Plus Shared Pass', time: '8 mins ago' },
  { name: 'Bilal from Rawalpindi', item: 'Full-Stack Web Dev Bootcamp', time: '12 mins ago' },
  { name: 'Shahzaib from Faisalabad', item: 'Canva Pro Upgrade', time: '15 mins ago' }
];

import React, { useEffect } from 'react';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string | string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  schemaType?: 'WebSite' | 'CollectionPage' | 'AboutPage' | 'ContactPage' | 'FAQPage' | 'ItemPage' | 'Article';
  breadcrumbs?: BreadcrumbItem[];
  // Product specific rich schema
  productData?: {
    id: string;
    title: string;
    description: string;
    pricePKR?: number;
    priceUSD?: number;
    rating?: number;
    reviewCount?: number;
    image?: string;
    categoryId?: string;
    inStock?: boolean;
  };
  // FAQ specific rich schema
  faqList?: FAQItem[];
}

const DEFAULT_IMAGE = '/og-card.png';
const DEFAULT_KEYWORDS = [
  'Zohaib DigiForge',
  'DigiForge digital resources',
  'digital resources store Pakistan',
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
  'JazzCash EasyPaisa digital products',
  'instant delivery digital resources Pakistan',
  'Canva Pro Pakistan cheap',
  'CapCut Pro lifetime',
  'ChatGPT Plus shared seat Pakistan'
];

/**
 * Truncates text cleanly without cutting words in half if possible.
 */
export function truncateSEO(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  const trimmed = text.substring(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > maxLength * 0.7 ? trimmed.substring(0, lastSpace) : trimmed).trim() + '...';
}

/**
 * Generates SEO Title and Description formatted strictly according to brand specifications.
 */
export function formatProductSEOTitle(productTitle: string): string {
  const brandSuffix = ' | Zohaib DigiForge';
  const pricePrefix = ' — Rs. 279 / $1';
  const budgetForTitle = 60 - brandSuffix.length - pricePrefix.length;
  
  const cleanTitle = productTitle.length > budgetForTitle 
    ? truncateSEO(productTitle, budgetForTitle) 
    : productTitle;
    
  return `${cleanTitle}${pricePrefix}${brandSuffix}`;
}

export function formatProductSEODesc(productTitle: string): string {
  return `${productTitle} is available at Zohaib DigiForge for flat Rs. 279 / $1, with instant Google Drive & WhatsApp delivery. Verified & fully updated.`;
}

export function formatCategorySEOTitle(categoryName: string): string {
  return `${categoryName} — Digital Resources & Tools | Zohaib DigiForge`;
}

export function formatCategorySEODesc(categoryName: string, categoryDescription?: string): string {
  const desc = categoryDescription ? ` — ${categoryDescription.trim()}` : '';
  const raw = `Explore verified ${categoryName} on Zohaib DigiForge${desc}. Flat Rs. 279 / $1 per resource with instant lifetime access.`;
  return truncateSEO(raw, 160);
}

/**
 * Unified Pro-Grade <SEO /> / <MetaTags /> Component with Rich Schema.org JSON-LD injection.
 */
export const SEO: React.FC<SEOProps> = ({
  title = 'Zohaib DigiForge — Empowering Learning, Powering Success | Digital Resources & Pro Tools | Flat Rs. 279 Store',
  description = 'Digital resources and pro tools for students, professionals, and creators — courses, templates, graphics, e-books, and software, each priced at Rs. 279 / $1.',
  keywords,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  noindex = false,
  publishedTime,
  modifiedTime,
  author = 'Zohaib DigiForge Team',
  breadcrumbs,
  productData,
  faqList
}) => {
  useEffect(() => {
    // 1. Set Document Title
    document.title = title;

    // Helper to safely set or create <meta> tags
    const setMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to safely set or create <link> tags
    const setLinkTag = (rel: string, href: string, extraAttrs?: Record<string, string>) => {
      let element = document.querySelector(`link[rel="${rel}"][href="${href}"]`) || document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
      if (extraAttrs) {
        Object.entries(extraAttrs).forEach(([k, v]) => element?.setAttribute(k, v));
      }
    };

    // 2. Primary Meta Tags
    setMetaTag('name', 'description', description);

    // 3. Keywords
    let keywordString = '';
    if (Array.isArray(keywords)) {
      keywordString = Array.from(new Set([...keywords, ...DEFAULT_KEYWORDS.slice(0, 5)])).join(', ');
    } else if (typeof keywords === 'string' && keywords.trim().length > 0) {
      keywordString = keywords;
    } else {
      keywordString = DEFAULT_KEYWORDS.join(', ');
    }
    setMetaTag('name', 'keywords', keywordString);

    // 4. Search Engine Crawlers & Indexation Directives
    if (noindex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
      setMetaTag('name', 'googlebot', 'noindex, nofollow');
      setMetaTag('name', 'bingbot', 'noindex, nofollow');
    } else {
      setMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
      setMetaTag('name', 'googlebot', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
      setMetaTag('name', 'bingbot', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }

    // 5. Canonical URL & Hreflang Tags
    const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://www.zohaibdigiforge.store';
    const finalCanonical = canonical 
      ? (canonical.startsWith('http') ? canonical : `${currentOrigin}${canonical}`)
      : (typeof window !== 'undefined' ? `${currentOrigin}${window.location.pathname}${window.location.search}` : currentOrigin);
    
    setLinkTag('canonical', finalCanonical);

    // Hreflang alternates
    setLinkTag('alternate', finalCanonical, { hreflang: 'x-default' });
    setLinkTag('alternate', finalCanonical, { hreflang: 'en' });
    setLinkTag('alternate', finalCanonical, { hreflang: 'ur' });

    // 6. Open Graph Tags
    setMetaTag('property', 'og:site_name', 'Zohaib DigiForge');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', finalCanonical);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:image:alt', title);
    setMetaTag('property', 'og:locale', 'en_US');
    setMetaTag('property', 'og:locale:alternate', 'ur_PK');

    if (ogType === 'article') {
      if (publishedTime) setMetaTag('property', 'article:published_time', publishedTime);
      if (modifiedTime) setMetaTag('property', 'article:modified_time', modifiedTime);
      if (author) setMetaTag('property', 'article:author', author);
      setMetaTag('property', 'article:section', 'Technology');
    }

    if (ogType === 'product' && productData) {
      setMetaTag('property', 'product:price:amount', String(productData.pricePKR || 279));
      setMetaTag('property', 'product:price:currency', 'PKR');
      setMetaTag('property', 'product:availability', productData.inStock !== false ? 'in stock' : 'out of stock');
      setMetaTag('property', 'product:condition', 'new');
    }

    // 7. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:site', '@ZohaibDigiForge');
    setMetaTag('name', 'twitter:creator', '@ZohaibDigiForge');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);
    setMetaTag('name', 'twitter:image:alt', title);

    // 8. Application, Mobile & Geo Metadata
    setMetaTag('name', 'author', author);
    setMetaTag('name', 'publisher', 'Zohaib DigiForge');
    setMetaTag('name', 'theme-color', '#0B1120');
    setMetaTag('name', 'rating', 'General');
    setMetaTag('name', 'revisit-after', '1 days');
    setMetaTag('name', 'geo.region', 'PK');
    setMetaTag('name', 'geo.placename', 'Pakistan');
    setMetaTag('name', 'format-detection', 'telephone=no');

    // 9. Structured JSON-LD Schema Generator
    const schemaGraph: any[] = [
      // 9a. Organization & Online Store Schema
      {
        '@type': ['Organization', 'OnlineStore'],
        '@id': `${currentOrigin}/#organization`,
        'name': 'Zohaib DigiForge',
        'alternateName': 'DigiForge Store',
        'url': currentOrigin,
        'logo': {
          '@type': 'ImageObject',
          'url': `${currentOrigin}/logo.webp`,
          'caption': 'Zohaib DigiForge Official Logo',
          'width': '512',
          'height': '512'
        },
        'image': `${currentOrigin}/logo.webp`,
        'description': 'Empowering Learning, Powering Success. Premium digital resources, online courses, software toolkits, templates, and pro tools for flat Rs. 279 / $1.',
        'priceRange': 'PKR 279 - PKR 65000',
        'currenciesAccepted': 'PKR, USD',
        'paymentAccepted': 'JazzCash, EasyPaisa, SadaPay, NayaPay, Raast Bank Transfer, Binance Pay (USDT/Crypto)',
        'areaServed': [
          {
            '@type': 'Country',
            'name': 'Pakistan'
          },
          {
            '@type': 'AdministrativeArea',
            'name': 'Worldwide'
          }
        ],
        'founder': {
          '@type': 'Person',
          'name': 'M Zohaib Shahzad',
          'jobTitle': 'Founder & Lead Software Engineer',
          'url': `${currentOrigin}/about`
        },
        'contactPoint': [
          {
            '@type': 'ContactPoint',
            'telephone': '+923406070632',
            'contactType': 'customer support',
            'availableLanguage': ['English', 'Urdu'],
            'contactOption': 'TollFree',
            'email': 'zohaibdigiforge@gmail.com',
            'url': `${currentOrigin}/contact`
          }
        ],
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.9',
          'reviewCount': '320',
          'bestRating': '5',
          'worstRating': '1'
        },
        'sameAs': [
          'https://twitter.com/zohaibdigiforge',
          'https://linkedin.com/company/zohaibdigiforge',
          'https://github.com/zohaibdigiforge',
          'https://instagram.com/zohaibdigiforge',
          'https://youtube.com/@zohaibdigiforge',
          'https://wa.me/923406070632'
        ]
      },
      // 9b. WebSite Schema with SearchAction
      {
        '@type': 'WebSite',
        '@id': `${currentOrigin}/#website`,
        'url': currentOrigin,
        'name': 'Zohaib DigiForge',
        'alternateName': 'Zohaib DigiForge Marketplace',
        'description': description || 'Flat Rs. 279 / $1 Digital Resources Marketplace & Verified Pro Tools',
        'publisher': {
          '@id': `${currentOrigin}/#organization`
        },
        'inLanguage': ['en-US', 'ur-PK'],
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': `${currentOrigin}/resources?search={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      }
    ];

    // 9c. Dynamic Breadcrumbs Schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      schemaGraph.push({
        '@type': 'BreadcrumbList',
        '@id': `${finalCanonical}#breadcrumb`,
        'itemListElement': breadcrumbs.map((crumb, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'name': crumb.name,
          'item': crumb.url.startsWith('http') ? crumb.url : `${currentOrigin}${crumb.url}`
        }))
      });
    }

    // 9d. Product Rich Schema (if on product view)
    if (ogType === 'product' && productData) {
      schemaGraph.push({
        '@type': 'Product',
        '@id': `${finalCanonical}#product`,
        'name': productData.title,
        'image': [
          productData.image && productData.image.startsWith('http') 
            ? productData.image 
            : `${currentOrigin}${productData.image || ogImage}`
        ],
        'description': productData.description || description,
        'sku': productData.id,
        'mpn': productData.id,
        'brand': {
          '@type': 'Brand',
          'name': 'Zohaib DigiForge'
        },
        'category': productData.categoryId || 'Digital Products',
        'offers': {
          '@type': 'Offer',
          'url': finalCanonical,
          'priceCurrency': 'PKR',
          'price': productData.pricePKR || 279,
          'priceValidUntil': '2028-12-31',
          'itemCondition': 'https://schema.org/NewCondition',
          'availability': productData.inStock !== false 
            ? 'https://schema.org/InStock' 
            : 'https://schema.org/OutOfStock',
          'seller': {
            '@id': `${currentOrigin}/#organization`
          }
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': productData.rating ? Number(productData.rating).toFixed(1) : '4.9',
          'reviewCount': productData.reviewCount ? Math.max(productData.reviewCount, 15) : '48',
          'bestRating': '5',
          'worstRating': '1'
        }
      });
    }

    // 9f. FAQ Rich Schema (if on FAQ view or has faqList)
    if (faqList && faqList.length > 0) {
      schemaGraph.push({
        '@type': 'FAQPage',
        '@id': `${finalCanonical}#faq`,
        'mainEntity': faqList.map((item) => ({
          '@type': 'Question',
          'name': item.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.answer
          }
        }))
      });
    }

    // Inject JSON-LD Script tag
    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': schemaGraph
    };

    let scriptElement = document.getElementById('zdf-structured-data-jsonld');
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = 'zdf-structured-data-jsonld';
      scriptElement.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptElement);
    }
    scriptElement.textContent = JSON.stringify(structuredData);

    return () => {
      // Cleanup is optional since next render updates textContent
    };

  }, [
    title,
    description,
    keywords,
    canonical,
    ogImage,
    ogType,
    noindex,
    publishedTime,
    modifiedTime,
    author,
    breadcrumbs,
    productData,
    faqList
  ]);

  return null;
};

// Backwards compatibility and alternative alias
export const MetaTags = SEO;
export default SEO;

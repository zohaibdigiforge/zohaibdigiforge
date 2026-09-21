import { LegalPageData } from '../types';

export const DEFAULT_LEGAL_DATA: Record<string, LegalPageData> = {
  refund: {
    id: 'refund',
    title: 'Refund Policy',
    eyebrow: 'Fair & Transparent Terms',
    intro: 'Because DigiForge sells digital products, this policy works differently than a typical physical-goods return policy. Please read it carefully before purchasing.',
    lastUpdated: 'August 24, 2026',
    sections: [
      {
        id: 'general-policy',
        title: '1. General Policy',
        shortTitle: 'General Policy',
        content: 'Due to the instant, downloadable nature of digital products, all sales are considered final once a resource has been delivered or accessed. We are unable to offer refunds for change of mind, incorrect expectations about content, or failure to review the product description before purchase.',
        callout: {
          type: 'info',
          text: 'Digital items grant immediate access to proprietary source files, templates, and courses that cannot be "returned" once viewed or downloaded.'
        }
      },
      {
        id: 'eligible-refunds',
        title: '2. Eligible Refund Situations',
        shortTitle: 'Eligible Situations',
        content: 'We believe in fair trade and exceptional customer satisfaction. Refunds or free immediate replacements WILL be provided in the following verified situations:',
        bullets: [
          'You did not receive an access link or download folder after your payment was verified by our team.',
          'The file or archive is corrupted, broken, or fails to open despite following our step-by-step extraction guide.',
          'You received the wrong product (materially different from the specific item you checked out with).',
          'You were charged more than once for the exact same order (verified duplicate transaction).',
          'The product is significantly different from its description (materially misleading listing or missing core modules promised in the syllabus).'
        ],
        callout: {
          type: 'success',
          text: 'If a link is broken or access is blocked, our support concierge will provide a verified mirror download link on WhatsApp within 12 hours.'
        }
      },
      {
        id: 'not-eligible',
        title: '3. Not Eligible For Refund',
        shortTitle: 'Non-Refundable Cases',
        content: 'Refund requests will NOT be approved under the following circumstances:',
        bullets: [
          'Change of mind after payment or access credentials have been issued.',
          '"I didn\'t need it after all" or having already downloaded, extracted, or cloned the digital resource.',
          'Compatibility issues or hardware limitations not checked prior to purchase (e.g. software requiring macOS or high-end GPU when specs were listed).',
          'Membership or Collection subscriptions where the current billing cycle access has already been unlocked and utilized.',
          'Failure to provide proof of payment or invalid transaction reference IDs.'
        ]
      },
      {
        id: 'how-to-request',
        title: '4. How to Request a Refund or Replacement',
        shortTitle: 'How to Request',
        content: 'Follow these straightforward steps to submit your claim. Our team evaluates every request with fairness and human empathy.',
        steps: [
          {
            step: 1,
            title: 'Contact Our Concierge Within 48 Hours',
            desc: 'Message us on WhatsApp (03406070632) or email zohaibdigiforge@gmail.com within 48 hours of your purchase.'
          },
          {
            step: 2,
            title: 'Provide Your Order & Issue Details',
            desc: 'Include your ZDF Order ID (e.g. ZDF-123456), screenshot of payment proof, and a clear explanation or screenshot of the issue.'
          },
          {
            step: 3,
            title: 'Review & Troubleshooting (24–48 Hours)',
            desc: 'Our technical support team will review the issue and attempt to fix the link or provide a replacement mirror.'
          },
          {
            step: 4,
            title: 'Approval & Refund Reversal',
            desc: 'If approved, your refund is processed to your original payment method within 5–7 business days (PKR via JazzCash/EasyPaisa/Bank, or Binance USDT reversal for international orders).'
          }
        ]
      },
      {
        id: 'special-terms',
        title: '5. Membership, Collections & Mega Access — Special Terms',
        shortTitle: 'Special Passes & Bundles',
        content: 'Subscription tiers and high-value bundles carry specific protective conditions:',
        bullets: [
          'Bundle Purchases: Covered under the General Policy (final sale once delivery credentials and links are sent).',
          'Collection Subscriptions: You may cancel recurring auto-renewals at any time; however, partial refunds are not issued for the active monthly cycle already in use.',
          'Mega Access (Lifetime Pass): Eligible for a full refund only within 48 hours of purchase AND provided that fewer than 3 total resources have been downloaded from the shared cloud vault. Beyond that threshold, the access is deemed fully consumed.'
        ]
      },
      {
        id: 'contact-support',
        title: '6. Contact for Refund & Billing Issues',
        shortTitle: 'Contact Support',
        content: 'Have a billing query or need help opening your files? Reach out directly — we are here to ensure you get full value from every single resource.'
      }
    ]
  },

  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    eyebrow: 'Data Protection & Security',
    intro: 'This Privacy Policy explains what information Zohaib DigiForge collects, how we use it, and how we protect your personal and transaction data.',
    lastUpdated: 'August 24, 2026',
    sections: [
      {
        id: 'info-we-collect',
        title: '1. Information We Collect',
        shortTitle: 'Information Collected',
        content: 'We only collect essential information required to deliver your digital purchases and provide direct support:',
        bullets: [
          'Account Information: Name, email address, and authentication credentials securely encrypted via Google Firebase Authentication.',
          'Order & Transaction Records: Purchase history, order timestamps, and chosen payment method (JazzCash, EasyPaisa, Bank, Binance). We never store full credit/debit card numbers or bank PINs on our servers.',
          'Contact & Support Details: WhatsApp number (if provided for instant delivery), support ticket messages, and contact form inquiries.',
          'Usage & Platform Analytics: Pages visited, resources viewed, and download activity used solely in aggregate to improve platform speed and recommendations.',
          'Newsletter Subscription: Email address if you voluntarily subscribe to our free drops and weekly digital design assets.'
        ]
      },
      {
        id: 'how-we-use',
        title: '2. How We Use Your Information',
        shortTitle: 'How We Use Data',
        content: 'Your information is used strictly for legitimate commercial and operational purposes:',
        bullets: [
          'To process, verify, and deliver your digital download links and shared drive access.',
          'To populate your personalized Customer Dashboard with permanent purchase history.',
          'To respond to support inquiries, replacement key requests, and custom service estimates.',
          'To send transactional receipts, verification alerts, and opt-in newsletter freebies.',
          'To prevent fraudulent payment chargebacks, unauthorized account sharing, and platform abuse.'
        ]
      },
      {
        id: 'data-protection',
        title: '3. How We Protect Your Information',
        shortTitle: 'Data Protection',
        content: 'We employ industry-leading security practices to safeguard your personal records:',
        bullets: [
          'Enterprise Cloud Infrastructure: Stored securely using Google Cloud Firebase with strict access control rules.',
          'End-to-End Encryption: Passwords and sensitive session tokens are salted and hashed using cryptographic standards.',
          'Zero Stored Payment Credentials: All monetary transactions are processed directly by verified financial providers (JazzCash, EasyPaisa, Meezan/HBL Banks, Binance).'
        ],
        callout: {
          type: 'info',
          text: 'We enforce strict HTTPS encryption on 100% of website traffic, ensuring your browsing and checkout actions remain confidential.'
        }
      },
      {
        id: 'third-party-sharing',
        title: '4. Third-Party Sharing',
        shortTitle: 'Third-Party Sharing',
        content: 'We respect your trust. Zohaib DigiForge does NOT sell, rent, trade, or monetize your personal information to third parties or advertising networks.',
        bullets: [
          'We only share transactional data with payment processors solely to confirm payment legitimacy.',
          'We may disclose records only if legally mandated by law enforcement or competent judicial authorities under the laws of Pakistan.'
        ]
      },
      {
        id: 'cookies-tracking',
        title: '5. Cookies & Local Storage',
        shortTitle: 'Cookies & Storage',
        content: 'We use lightweight cookies and browser local storage strictly for essential platform functionality:',
        bullets: [
          'Session Persistence: Remembering your currency preference (PKR/USD) and active cart items across visits.',
          'Aggregated Analytics: Measuring general site traffic trends without identifying individual visitors personally.'
        ]
      },
      {
        id: 'your-rights',
        title: '6. Your Rights & Data Control',
        shortTitle: 'Your Rights',
        content: 'You maintain full control over your personal information at all times:',
        bullets: [
          'You may request to view, export, update, or permanently delete your account records by contacting our privacy officer.',
          'You can unsubscribe from promotional newsletters at any time with a single click using the footer link in any email.'
        ]
      },
      {
        id: 'children-privacy',
        title: '7. Children\'s Privacy',
        shortTitle: 'Children\'s Privacy',
        content: 'DigiForge is intended for students, freelance creators, and developers aged 13 and above. We do not knowingly collect personal identifiable information from children under 13 years of age.'
      },
      {
        id: 'policy-changes',
        title: '8. Changes to This Policy',
        shortTitle: 'Policy Updates',
        content: 'We may update this Privacy Policy periodically to reflect new services or regulatory standards. Any material changes will be highlighted via a prominent notice on our website.'
      },
      {
        id: 'privacy-contact',
        title: '9. Contact Us About Privacy',
        shortTitle: 'Contact Us',
        content: 'If you have questions about our data practices or wish to submit a data erasure request, please reach out directly.'
      }
    ]
  },

  terms: {
    id: 'terms',
    title: 'Terms & Conditions',
    eyebrow: 'Legal Agreement & User Terms',
    intro: 'By browsing, accessing, or purchasing from Zohaib DigiForge, you agree to comply with and be bound by the following terms. Please read them thoroughly.',
    lastUpdated: 'August 24, 2026',
    sections: [
      {
        id: 'about-digiforge',
        title: '1. About DigiForge',
        shortTitle: 'About DigiForge',
        content: 'Zohaib DigiForge is an independent digital resources, course curation, and professional tool marketplace created to provide accessible, fair-priced toolkits, design bundles, source codes, and development services to creators and students across Pakistan and worldwide.'
      },
      {
        id: 'account-registration',
        title: '2. Account Registration & Security',
        shortTitle: 'Account Registration',
        content: 'To access certain purchased materials or membership vaults, you may be required to maintain an account:',
        bullets: [
          'You must provide accurate, current, and complete information during checkout and account creation.',
          'You are solely responsible for maintaining the confidentiality of your login credentials.',
          'Individual Account Rule: One account per person. Account sharing, credential pooling, or reselling login access is strictly prohibited and results in immediate account revocation.'
        ]
      },
      {
        id: 'purchases-payment',
        title: '3. Purchases & Payment Terms',
        shortTitle: 'Purchases & Payment',
        content: 'All purchases made on the platform are subject to our verified payment workflow:',
        bullets: [
          'Pricing is displayed in Pakistani Rupees (PKR / Rs.) and US Dollars (USD / $) based on your chosen currency toggle.',
          'Accepted payment gateways include JazzCash, EasyPaisa, Pakistani Bank Wire (Meezan, HBL, Alfalah, UBL), SadaPay, NayaPay, and Binance USDT (Crypto).',
          'Order Verification: Orders are fulfilled once manual or automated transaction receipt verification is confirmed by our operations team.',
          'Price Adjustments: DigiForge reserves the right to modify prices, launch promotional sales, or revise bundle discounts at any time. The price at the exact moment of checkout applies.'
        ]
      },
      {
        id: 'license-usage',
        title: '4. License & Intellectual Property Usage Rights',
        shortTitle: 'License & Usage Rights',
        content: 'Purchasing digital resources grants specific limited licenses, NOT intellectual property ownership:',
        bullets: [
          'Personal & Commercial Use: You receive a non-exclusive, non-transferable license to use purchased templates, scripts, graphics, and code in your own personal or client projects.',
          'No Resale or Redistribution: You may NOT resell, sublicense, upload to public torrents, redistribute raw zip files, or repackage DigiForge assets as your own commercial digital product without express written authorization.',
          'Third-Party Subscriptions & Tools: Pro Tool accounts (such as Canva Pro, ChatGPT Plus, CapCut Pro) facilitate shared enterprise or team slots. Users must adhere to each platform\'s respective terms of service. DigiForge is an independent facilitator and not the primary software publisher.',
          'Violation Consequences: Any unauthorized redistribution or scraping of vault content will result in immediate lifetime blacklisting and potential legal recourse.'
        ],
        callout: {
          type: 'warning',
          text: 'Redistributing our curated Google Drive links to external groups will trigger automatic link revocation without refund.'
        }
      },
      {
        id: 'delivery-terms',
        title: '5. Digital Delivery Terms',
        shortTitle: 'Delivery Terms',
        content: 'Delivery of digital items is handled with speed and direct concierge oversight:',
        bullets: [
          'Delivery Channels: Verified download links and credentials are sent to your registered WhatsApp number, email address, and accessible via your Order Tracker.',
          'Delivery Timelines: Typically instant to 45 minutes after payment receipt verification. During high-volume periods, delivery may take up to 2 hours.',
          'Curated Collections: New assets in Daily Drop collections are published according to our dynamic schedule and added directly to your shared Google Drive vault.'
        ]
      },
      {
        id: 'refund-reference',
        title: '6. Refunds & Cancellations',
        shortTitle: 'Refund Reference',
        content: 'All refund inquiries, eligibility criteria, and claim workflows are strictly governed by our dedicated Refund Policy, incorporated herein by reference.'
      },
      {
        id: 'prohibited-conduct',
        title: '7. Prohibited User Conduct',
        shortTitle: 'Prohibited Conduct',
        content: 'While using DigiForge, you agree NOT to:',
        bullets: [
          'Submit falsified or doctored payment transaction screenshots.',
          'Initiate fraudulent chargebacks after successfully receiving digital downloads.',
          'Attempt unauthorized access to administrator dashboards, database endpoints, or another user\'s private order records.',
          'Use purchased automation scripts or code assets for malicious software distribution, spamming, or unlawful activities.'
        ]
      },
      {
        id: 'limitation-liability',
        title: '8. Limitation of Liability',
        shortTitle: 'Limitation of Liability',
        content: 'DigiForge assets and third-party tools are provided on an "AS IS" and "AS AVAILABLE" basis:',
        bullets: [
          'We do not guarantee that software or plugins will remain compatible with future unreleased operating system versions.',
          'DigiForge shall not be liable for indirect, incidental, or consequential damages resulting from project delays, lost revenue, or third-party service provider outages.'
        ]
      },
      {
        id: 'termination',
        title: '9. Account Termination',
        shortTitle: 'Account Termination',
        content: 'We reserve the right to immediately suspend, terminate, or restrict access to any account found in violation of these Terms & Conditions or engaging in abusive behavior towards our support team.'
      },
      {
        id: 'governing-law',
        title: '10. Governing Law & Jurisdiction',
        shortTitle: 'Governing Law',
        content: 'These Terms & Conditions shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan, without giving effect to any principles of conflicts of law.'
      },
      {
        id: 'terms-updates',
        title: '11. Changes to Terms',
        shortTitle: 'Changes to Terms',
        content: 'We reserve the right to modify these Terms at our sole discretion. Your continued use of the DigiForge platform after revisions are published constitutes binding acceptance of the updated terms.'
      },
      {
        id: 'terms-contact',
        title: '12. Contact Information',
        shortTitle: 'Contact Us',
        content: 'For questions regarding these Terms & Conditions or partnership licensing inquiries, please contact our support team.'
      }
    ]
  }
};

import { FAQ } from '../types';

export const DEFAULT_GLOBAL_FAQS: FAQ[] = [
  {
    id: 'faq-1',
    question: 'How do I receive my digital product or toolkit after purchase?',
    answer: 'Instant access! Once your payment is verified, your product download links, source code repositories, and license keys appear immediately on your Customer Dashboard and are sent securely to your registered email.',
    category: 'Delivery & Access',
    order: 1,
    isActive: true
  },
  {
    id: 'faq-2',
    question: 'Are your discount coupons and promotional deals 100% verified?',
    answer: 'Yes! Every single coupon deal, student discount, and software promo code listed on Zohaib DigiForge is manually tested and verified daily by our team to guarantee validity before publishing.',
    category: 'General',
    order: 2,
    isActive: true
  },
  {
    id: 'faq-3',
    question: 'What payment methods do you accept (PKR & USD)?',
    answer: 'We support multiple secure payment options including EasyPaisa, JazzCash, Direct Bank Transfer (HBL, Meezan Bank, etc.) for PKR currency, as well as International Credit and Debit cards for USD payments.',
    category: 'Orders & Payment',
    order: 3,
    isActive: true
  },
  {
    id: 'faq-4',
    question: 'How can I contact support if I face any issue with my download?',
    answer: 'We pride ourselves on lightning-fast customer support! You can message us directly on WhatsApp at +92 340 6070632 or reach out through our Contact Us page. We typically respond within 1-3 hours.',
    category: 'General',
    order: 4,
    isActive: true
  },
  {
    id: 'faq-5',
    question: 'Can I get a refund or replacement if a digital product has an issue?',
    answer: 'Yes, your satisfaction is our top priority. If you encounter unresolvable technical issues or corrupted download files with any purchased toolkit, our support team will assist you or provide a replacement.',
    category: 'Refunds',
    order: 5,
    isActive: true
  },
  {
    id: 'faq-6',
    question: 'Do you provide free resources and student developer guides?',
    answer: 'Absolutely! Explore our "Free Resources" category and Journal section where we regularly publish free student guides, development hacks, and source code boilerplates at zero cost.',
    category: 'General',
    order: 6,
    isActive: true
  }
];

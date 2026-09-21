import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency, SitePricingSettings } from '../types';
import { DEFAULT_SITE_PRICING } from '../data/pricingDefaults';

export { DEFAULT_SITE_PRICING };

interface PricingContextType {
  pricing: SitePricingSettings;
  flatPricePKR: number;
  flatPriceUSD: number;
  loading: boolean;
  formatPrice: (currency: Currency, valuePKR?: number, valueUSD?: number) => string;
  formatCombinedPrice: () => string;
  getPriceNumber: (currency: Currency) => number;
  updatePricing: (newPKR: number, newUSD: number) => Promise<SitePricingSettings>;
  cleanUpLegacyPrices: () => Promise<number>;
  getProductPriceNumber: (product: any, currency: Currency) => number;
  formatProductPrice: (product: any, currency: Currency) => string;
  formatCombinedProductPrice: (product: any) => string;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export const PricingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pricing, setPricing] = useState<SitePricingSettings>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('zdf_site_pricing') : null;
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return DEFAULT_SITE_PRICING;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    // Deferred import keeps the initial bundle lightweight and lightning-fast
    import('../services/firestoreService').then(({ subscribeSitePricing }) => {
      if (!isMounted) return;
      unsubscribe = subscribeSitePricing((livePricing) => {
        if (!isMounted) return;
        setPricing(livePricing);
        setLoading(false);
        try {
          localStorage.setItem('zdf_site_pricing', JSON.stringify(livePricing));
        } catch (e) {}
      });
    }).catch((err) => {
      console.warn('Deferred pricing subscription notice:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const formatPrice = (currency: Currency, valuePKR?: number, valueUSD?: number): string => {
    if (currency === 'PKR') {
      const val = typeof valuePKR === 'number' ? valuePKR : pricing.flatPricePKR;
      return `Rs. ${val.toLocaleString()}`;
    }
    const val = typeof valueUSD === 'number' ? valueUSD : pricing.flatPriceUSD;
    return `$${val % 1 === 0 ? val : val.toFixed(2)}`;
  };

  const formatCombinedPrice = (): string => {
    const usdVal = pricing.flatPriceUSD;
    const usdStr = usdVal % 1 === 0 ? usdVal.toString() : usdVal.toFixed(2);
    return `Rs. ${pricing.flatPricePKR.toLocaleString()} / $${usdStr}`;
  };

  const formatCombinedProductPrice = (product: any): string => {
    const numPKR = getProductPriceNumber(product, 'PKR');
    const numUSD = getProductPriceNumber(product, 'USD');
    const usdStr = numUSD % 1 === 0 ? numUSD.toString() : numUSD.toFixed(2);
    return `Rs. ${numPKR.toLocaleString()} / $${usdStr}`;
  };

  const getPriceNumber = (currency: Currency): number => {
    return currency === 'PKR' ? pricing.flatPricePKR : pricing.flatPriceUSD;
  };

  const getProductPriceNumber = (product: any, currency: Currency): number => {
    if (!product) {
      return currency === 'PKR' ? (pricing.flatPricePKR || 279) : (pricing.flatPriceUSD || 1);
    }

    if (currency === 'PKR') {
      if (typeof product.pricePKR === 'number' && product.pricePKR > 0) return product.pricePKR;
      if (typeof product.monthlyPricePKR === 'number' && product.monthlyPricePKR > 0) return product.monthlyPricePKR;
      return pricing.flatPricePKR || 279;
    }

    if (currency === 'USD') {
      if (typeof product.priceUSD === 'number' && product.priceUSD > 0) return product.priceUSD;
      if (typeof product.monthlyPriceUSD === 'number' && product.monthlyPriceUSD > 0) return product.monthlyPriceUSD;
      if (typeof product.pricePKR === 'number' && product.pricePKR > 0) {
        const rate = pricing.flatPricePKR || 279;
        return Number((product.pricePKR / rate).toFixed(2));
      }
      return pricing.flatPriceUSD || 1;
    }

    return currency === 'PKR' ? (pricing.flatPricePKR || 279) : (pricing.flatPriceUSD || 1);
  };

  const formatProductPrice = (product: any, currency: Currency): string => {
    const num = getProductPriceNumber(product, currency);
    return formatPrice(currency, currency === 'PKR' ? num : undefined, currency === 'USD' ? num : undefined);
  };

  const updatePricing = async (newPKR: number, newUSD: number) => {
    const { updateSitePricingInDb } = await import('../services/firestoreService');
    const updated = await updateSitePricingInDb({ flatPricePKR: newPKR, flatPriceUSD: newUSD });
    setPricing(updated);
    return updated;
  };

  const cleanUpLegacyPrices = async () => {
    const { cleanUpLegacyProductPricesDb } = await import('../services/firestoreService');
    return await cleanUpLegacyProductPricesDb();
  };

  return (
    <PricingContext.Provider
      value={{
        pricing,
        flatPricePKR: pricing.flatPricePKR,
        flatPriceUSD: pricing.flatPriceUSD,
        loading,
        formatPrice,
        formatCombinedPrice,
        getPriceNumber,
        getProductPriceNumber,
        formatProductPrice,
        formatCombinedProductPrice,
        updatePricing,
        cleanUpLegacyPrices
      }}
    >
      {children}
    </PricingContext.Provider>
  );
};

export const usePricing = (): PricingContextType => {
  const context = useContext(PricingContext);
  if (!context) {
    return {
      pricing: DEFAULT_SITE_PRICING,
      flatPricePKR: 279,
      flatPriceUSD: 1,
      loading: false,
      formatPrice: (currency: Currency, vPKR?: number, vUSD?: number) => {
        if (currency === 'PKR') return `Rs. ${(typeof vPKR === 'number' ? vPKR : 279).toLocaleString()}`;
        const u = typeof vUSD === 'number' ? vUSD : 1;
        return `$${u % 1 === 0 ? u : u.toFixed(2)}`;
      },
      formatCombinedPrice: () => 'Rs. 279 / $1',
      getPriceNumber: (currency: Currency) => (currency === 'PKR' ? 279 : 1),
      getProductPriceNumber: (product: any, currency: Currency) => (currency === 'PKR' ? (product?.pricePKR || 279) : (product?.priceUSD || 1)),
      formatProductPrice: (product: any, currency: Currency) => {
        const num = currency === 'PKR' ? (product?.pricePKR || 279) : (product?.priceUSD || 1);
        if (currency === 'PKR') return `Rs. ${num.toLocaleString()}`;
        return `$${num % 1 === 0 ? num : num.toFixed(2)}`;
      },
      formatCombinedProductPrice: (product: any) => {
        const pkr = product?.pricePKR || 279;
        const usd = product?.priceUSD || 1;
        return `Rs. ${pkr.toLocaleString()} / $${usd % 1 === 0 ? usd : usd.toFixed(2)}`;
      },
      updatePricing: async (pkr, usd) => {
        const { updateSitePricingInDb } = await import('../services/firestoreService');
        return updateSitePricingInDb({ flatPricePKR: pkr, flatPriceUSD: usd });
      },
      cleanUpLegacyPrices: async () => 0
    };
  }
  return context;
};

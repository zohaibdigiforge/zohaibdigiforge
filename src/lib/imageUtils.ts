/**
 * Optimizes image URLs for fast web performance & Core Web Vitals (LCP/FCP).
 * Automatically converts Unsplash URLs to optimized WebP format with appropriate width & quality.
 */
export function getOptimizedImageUrl(url?: string | null, targetWidth: number = 380, quality: number = 65): string {
  if (!url) return '/logo.webp';

  // Return webp version if referencing local png logos/icons
  if (url === '/logo.png' || url === '/Logo.png') return '/logo.webp';
  if (url === '/icon.png') return '/icon.webp';
  if (url === '/founder.png' || url === '/Founder.png') return '/founder.webp';
  if (url.includes('DigiForge%20AI%20Assistant.png') || url.includes('digiforge-ai-assistant.png')) return '/logo.webp';

  // Optimize Unsplash images dynamically
  if (url.includes('images.unsplash.com')) {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('auto', 'format');
      parsedUrl.searchParams.set('fit', 'crop');
      parsedUrl.searchParams.set('w', Math.min(targetWidth, 600).toString());
      parsedUrl.searchParams.set('q', Math.min(quality, 70).toString());
      parsedUrl.searchParams.set('fm', 'webp');
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }

  // Optimize Cloudinary images dynamically
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    try {
      if (!url.includes('f_auto') && !url.includes('q_auto')) {
        return url.replace('/upload/', `/upload/f_auto,q_auto,w_${Math.min(targetWidth, 800)}/`);
      }
    } catch {
      return url;
    }
  }

  return url;
}

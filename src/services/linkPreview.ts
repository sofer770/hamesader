import type { CategoryId, LinkPreview } from '../lib/types';

/**
 * Link metadata. In production, swap `localLinkPreview` for a server endpoint that fetches
 * the page's Open Graph tags (the browser can't do it directly because of CORS).
 */
export interface LinkPreviewService {
  preview(url: string): Promise<LinkPreview>;
}

interface SiteInfo {
  name: string;
  category: CategoryId;
  cover: string;
}

/** Well-known Israeli and international sites, used for instant previews and as a strong classification signal. */
export const KNOWN_SITES: Record<string, SiteInfo> = {
  'foody.co.il': { name: 'Foody', category: 'recipes', cover: 'food' },
  '10dakot.co.il': { name: '10 דקות', category: 'recipes', cover: 'food' },
  'allrecipes.com': { name: 'Allrecipes', category: 'recipes', cover: 'food' },
  'bishulim.co.il': { name: 'בישולים', category: 'recipes', cover: 'food' },
  'kitchen.co.il': { name: 'מטבח למהדרין', category: 'recipes', cover: 'food' },
  'ptitim.co.il': { name: 'פתיתים', category: 'recipes', cover: 'food' },
  'google.com/maps': { name: 'Google Maps', category: 'places', cover: 'map' },
  'maps.app.goo.gl': { name: 'Google Maps', category: 'places', cover: 'map' },
  'goo.gl/maps': { name: 'Google Maps', category: 'places', cover: 'map' },
  'waze.com': { name: 'Waze', category: 'places', cover: 'map' },
  'tripadvisor.com': { name: 'Tripadvisor', category: 'places', cover: 'map' },
  'tripadvisor.co.il': { name: 'Tripadvisor', category: 'places', cover: 'map' },
  'rest.co.il': { name: 'Rest', category: 'places', cover: 'map' },
  'ontopo.com': { name: 'Ontopo', category: 'places', cover: 'map' },
  'tabitisrael.co.il': { name: 'Tabit', category: 'places', cover: 'map' },
  'booking.com': { name: 'Booking.com', category: 'places', cover: 'map' },
  'airbnb.com': { name: 'Airbnb', category: 'places', cover: 'map' },
  'airbnb.co.il': { name: 'Airbnb', category: 'places', cover: 'map' },
  'ynet.co.il': { name: 'ynet', category: 'readlater', cover: 'news' },
  'haaretz.co.il': { name: 'הארץ', category: 'readlater', cover: 'news' },
  'mako.co.il': { name: 'mako', category: 'readlater', cover: 'news' },
  'walla.co.il': { name: 'וואלה', category: 'readlater', cover: 'news' },
  'calcalist.co.il': { name: 'כלכליסט', category: 'readlater', cover: 'news' },
  'globes.co.il': { name: 'גלובס', category: 'readlater', cover: 'news' },
  'themarker.com': { name: 'TheMarker', category: 'readlater', cover: 'news' },
  'geektime.co.il': { name: 'גיקטיים', category: 'readlater', cover: 'news' },
  'medium.com': { name: 'Medium', category: 'readlater', cover: 'news' },
  'wikipedia.org': { name: 'ויקיפדיה', category: 'readlater', cover: 'news' },
  'youtube.com': { name: 'YouTube', category: 'readlater', cover: 'video' },
  'youtu.be': { name: 'YouTube', category: 'readlater', cover: 'video' },
  'ted.com': { name: 'TED', category: 'readlater', cover: 'video' },
  'el-habriut.co.il': { name: 'המרכז לבריאות טבעית', category: 'readlater', cover: 'news' },
  'ksp.co.il': { name: 'KSP', category: 'shopping', cover: 'shop' },
  'ivory.co.il': { name: 'Ivory', category: 'shopping', cover: 'shop' },
  'bug.co.il': { name: 'באג', category: 'shopping', cover: 'shop' },
  'zap.co.il': { name: 'זאפ', category: 'shopping', cover: 'shop' },
  'amazon.com': { name: 'Amazon', category: 'shopping', cover: 'shop' },
  'aliexpress.com': { name: 'AliExpress', category: 'shopping', cover: 'shop' },
  'ebay.com': { name: 'eBay', category: 'shopping', cover: 'shop' },
  'ikea.co.il': { name: 'IKEA', category: 'shopping', cover: 'shop' },
  'shufersal.co.il': { name: 'שופרסל', category: 'shopping', cover: 'shop' },
  'instagram.com': { name: 'Instagram', category: 'other', cover: 'social' },
  'facebook.com': { name: 'Facebook', category: 'other', cover: 'social' },
  'tiktok.com': { name: 'TikTok', category: 'other', cover: 'video' },
};

export function lookupSite(url: string): (SiteInfo & { domain: string }) | undefined {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return undefined;
  }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  const hostPath = host + u.pathname;
  for (const [key, info] of Object.entries(KNOWN_SITES)) {
    if (key.includes('/') ? hostPath.startsWith(key) : host === key || host.endsWith('.' + key)) {
      // mako's food section is recipes, not news
      if (key === 'mako.co.il' && /food|recipe|מתכון/i.test(decodeURIComponent(u.pathname))) {
        return { ...info, category: 'recipes', cover: 'food', domain: host };
      }
      return { ...info, domain: host };
    }
  }
  return undefined;
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Turns "/recipes/creamy-mushroom-pasta-123" into "creamy mushroom pasta". */
export function titleFromPath(url: string): string | undefined {
  try {
    const u = new URL(url);
    const seg = decodeURIComponent(u.pathname)
      .split('/')
      .filter(Boolean)
      .reverse()
      .find((s) => /[\p{L}]{3,}/u.test(s) && (/[-_+]/.test(s) || /^[\p{L}]+$/u.test(s)) && !/\d{3,}/.test(s.replace(/[-_]\d+$/, '')) && !/^(article|articles|post|item|p|watch|recipe|recipes|maps|place)$/i.test(s));
    if (!seg) return undefined;
    const t = seg.replace(/\.(html?|php|aspx?)$/i, '').replace(/[-_+]+/g, ' ').replace(/\b\d{3,}\b/g, '').trim();
    return t.length >= 3 ? t : undefined;
  } catch {
    return undefined;
  }
}

export const localLinkPreview: LinkPreviewService = {
  async preview(url) {
    const site = lookupSite(url);
    const domain = site?.domain ?? domainOf(url);
    const siteName = site?.name ?? domain;
    return {
      url,
      domain,
      siteName,
      title: titleFromPath(url) ?? siteName,
      cover: site?.cover ?? 'web',
    };
  },
};

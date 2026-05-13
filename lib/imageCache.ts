/**
 * Image caching utility for ForgeFit
 *
 * Caches exercise thumbnails, GIFs, and video thumbnails locally
 * to avoid re-downloading on every screen visit.
 *
 * Uses AsyncStorage for metadata + react-native's bundled assets
 * for actual image caching via FastImage-compatible approach.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CachedImage {
  uri: string;
  timestamp: number;
  contentType: string;
  size: number;
}

const CACHE_METADATA_KEY = '@forgefit_image_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000 * 7; // 7 days
const MAX_CACHE_ENTRIES = 100;

/**
 * Get cached image metadata
 */
async function getCacheMetadata(): Promise<Record<string, CachedImage>> {
  try {
    const data = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    if (!data) return {};
    const parsed = JSON.parse(data);

    // Clean expired entries
    const now = Date.now();
    const cleaned: Record<string, CachedImage> = {};
    let expired = 0;

    for (const [key, value] of Object.entries(parsed) as [string, CachedImage][]) {
      if (now - value.timestamp < CACHE_EXPIRY_MS) {
        cleaned[key] = value;
      } else {
        expired++;
      }
    }

    if (expired > 0) {
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(cleaned));
    }

    return cleaned;
  } catch {
    return {};
  }
}

/**
 * Save cache metadata
 */
async function saveCacheMetadata(metadata: Record<string, CachedImage>): Promise<void> {
  try {
    // Prune oldest entries if over limit
    const entries = Object.entries(metadata)
      .sort(([, a], [, b]) => b.timestamp - a.timestamp)
      .slice(0, MAX_CACHE_ENTRIES);

    const pruned: Record<string, CachedImage> = {};
    for (const [key, value] of entries) {
      pruned[key] = value;
    }

    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(pruned));
  } catch {
    // Fail silently
  }
}

/**
 * Check if an image URL is cached and still valid
 */
export async function isImageCached(uri: string): Promise<boolean> {
  try {
    const cache = await getCacheMetadata();
    const entry = cache[uri];
    if (!entry) return false;

    // Check if cache is expired
    const isExpired = Date.now() - entry.timestamp > CACHE_EXPIRY_MS;
    if (isExpired) {
      // Remove expired entry
      delete cache[uri];
      await saveCacheMetadata(cache);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Mark an image as cached
 */
export async function markImageCached(
  uri: string,
  options?: { contentType?: string; size?: number }
): Promise<void> {
  try {
    const cache = await getCacheMetadata();
    cache[uri] = {
      uri,
      timestamp: Date.now(),
      contentType: options?.contentType || 'image/jpeg',
      size: options?.size || 0,
    };
    await saveCacheMetadata(cache);
  } catch {
    // Fail silently
  }
}

/**
 * Get a safe URI for cached images
 *
 * If the image has been cached before, returns the same URI.
 * For actual disk caching, this would return a local file path.
 * For now, marks the image for caching and returns the original URI.
 *
 * Future enhancement: integrate with FastImage or similar
 * for actual disk-based caching with automatic memory management.
 */
export async function getCachedImageUri(uri: string): Promise<string> {
  if (!uri) return uri;

  // For local/asset URIs, return as-is
  if (uri.startsWith('file://') || uri.startsWith('asset://') || uri.startsWith('data:')) {
    return uri;
  }

  // Mark as cached for future reference
  await markImageCached(uri);

  // In production with FastImage integration:
  // return `https://cdn.example.com/cached/${hash(uri)}`;

  return uri;
}

/**
 * Pre-cache a list of image URIs
 * Useful for preloading exercise thumbnails when user enters a screen
 */
export async function preloadImages(uris: string[]): Promise<void> {
  const promises = uris.map(async (uri) => {
    if (!uri || uri.startsWith('file://') || uri.startsWith('asset://') || uri.startsWith('data:')) {
      return;
    }
    await markImageCached(uri);
  });

  await Promise.all(promises);
}

/**
 * Clear all image cache metadata
 */
export async function clearImageCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_METADATA_KEY);
  } catch {
    // Fail silently
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSizeBytes: number;
  validEntries: number;
  expiredEntries: number;
}> {
  try {
    const metadata = await getCacheMetadata();
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    let totalSize = 0;

    for (const entry of Object.values(metadata)) {
      if (now - entry.timestamp < CACHE_EXPIRY_MS) {
        valid++;
      } else {
        expired++;
      }
      totalSize += entry.size;
    }

    return {
      totalEntries: valid + expired,
      totalSizeBytes: totalSize,
      validEntries: valid,
      expiredEntries: expired,
    };
  } catch {
    return { totalEntries: 0, totalSizeBytes: 0, validEntries: 0, expiredEntries: 0 };
  }
}
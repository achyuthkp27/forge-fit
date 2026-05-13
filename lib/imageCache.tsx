import { useState, useEffect, useCallback } from 'react';
import { Image, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useToast } from '../hooks/useToast';

// ─── Cache Configuration ────────────────────────────────

const CACHE_DIR = `${FileSystem.cacheDirectory}exercise-images/`;
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory cache to prevent duplicate downloads
const memoryCache = new Map<string, string>();
const pendingDownloads = new Map<string, Promise<string>>();

// ─── Cache Management ────────────────────────────────────

/**
 * Ensure the cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

/**
 * Get cache file path for a URL
 */
function getCachePath(url: string): string {
  const ext = url.split('.').pop() || 'png';
  const hash = url.split('').reduce((acc, c) => {
    acc = ((acc << 5) - acc + c.charCodeAt(0)) | 0;
    return acc;
  }, 0);
  return `${CACHE_DIR}${Math.abs(hash)}.${ext}`;
}

/**
 * Get size of a file in bytes
 */
async function getFileSize(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.size || 0;
  } catch {
    return 0;
  }
}

/**
 * Evict oldest files if cache exceeds max size
 */
async function evictCacheIfNeeded(): Promise<void> {
  try {
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    let totalSize = 0;
    const fileInfos: Array<{ path: string; size: number; mtime: number }> = [];

    for (const file of files) {
      const filePath = CACHE_DIR + file;
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists) {
        totalSize += info.size || 0;
        fileInfos.push({
          path: filePath,
          size: info.size || 0,
          mtime: info.modificationTime || 0,
        });
      }
    }

    if (totalSize > MAX_CACHE_SIZE) {
      // Sort by modification time (oldest first)
      fileInfos.sort((a, b) => a.mtime - b.mtime);

      // Remove oldest files until under capacity
      for (const file of fileInfos) {
        if (totalSize <= MAX_CACHE_SIZE * 0.8) break;
        await FileSystem.deleteAsync(file.path, { idempotent: true });
        totalSize -= file.size;
        const key = memoryCache.entries().next().value?.[0];
        if (key) memoryCache.delete(key);
      }
    }
  } catch {
    // Fail quietly
  }
}

/**
 * Clear expired cache entries
 */
async function clearExpiredCache(): Promise<void> {
  try {
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    const now = Date.now();

    for (const file of files) {
      const filePath = CACHE_DIR + file;
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists && now - (info.modificationTime || 0) > MAX_CACHE_AGE) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
    }
  } catch {
    // Fail quietly
  }
}

// ─── Core Download Function ──────────────────────────────

/**
 * Download and cache an image, returning a local URI.
 * Deduplicates concurrent downloads of the same URL.
 */
export async function cacheImage(url: string): Promise<string> {
  if (!url) return '';

  // Return from memory cache if available
  if (memoryCache.has(url)) {
    return memoryCache.get(url)!;
  }

  // Prevent duplicate downloads
  if (pendingDownloads.has(url)) {
    return pendingDownloads.get(url)!;
  }

  const downloadPromise = (async () => {
    try {
      const cachePath = getCachePath(url);
      const info = await FileSystem.getInfoAsync(cachePath);

      if (info.exists) {
        // Check if fresh (recently modified)
        const age = Date.now() - (info.modificationTime || 0);
        if (age < MAX_CACHE_AGE) {
          memoryCache.set(url, cachePath);
          return cachePath;
        }
        // Stale — re-download
        await FileSystem.deleteAsync(cachePath, { idempotent: true });
      }

      // Ensure directory exists
      await ensureCacheDir();

      // Download
      const { uri } = await FileSystem.downloadAsync(url, cachePath);
      memoryCache.set(url, uri);

      // Prune cache if needed
      await evictCacheIfNeeded();

      return uri;
    } catch (error) {
      // On failure, return the remote URL so the app still works
      console.warn(`[ImageCache] Failed to cache image: ${error}`);
      return url;
    } finally {
      pendingDownloads.delete(url);
    }
  })();

  pendingDownloads.set(url, downloadPromise);
  return downloadPromise;
}

// ─── Preloading ──────────────────────────────────────────

/**
 * Pre-cache multiple images in the background
 * Useful for preloading exercise thumbnails on screen mount
 */
export function preloadImages(urls: string[]): void {
  urls.forEach(url => {
    if (url && !memoryCache.has(url) && !pendingDownloads.has(url)) {
      cacheImage(url).catch(() => {});
    }
  });
}

/**
 * Clear all cached images and in-memory state
 */
export async function clearImageCache(): Promise<void> {
  try {
    memoryCache.clear();
    pendingDownloads.clear();
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
  } catch {
    // Fail quietly
  }
}

/**
 * Get cache statistics for debugging
 */
export async function getCacheStats(): Promise<{
  memoryEntries: number;
  diskFiles: number;
  cacheDirSize: number;
}> {
  let diskSize = 0;
  let diskFiles = 0;
  try {
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(CACHE_DIR + file);
      if (info.exists) {
        diskSize += info.size || 0;
        diskFiles++;
      }
    }
  } catch {
    // Directory may not exist yet
  }

  return {
    memoryEntries: memoryCache.size,
    diskFiles,
    cacheDirSize: diskSize,
  };
}

// ─── React Hook ──────────────────────────────────────────

interface CachedImageState {
  uri: string;
  loading: boolean;
  error: boolean;
}

/**
 * React hook for cached image loading with automatic cleanup
 */
export function useCachedImage(url: string): CachedImageState {
  const [state, setState] = useState<CachedImageState>({
    uri: '',
    loading: !!url,
    error: false,
  });

  const loadImage = useCallback(async (imageUrl: string) => {
    if (!imageUrl) {
      setState({ uri: '', loading: false, error: false });
      return;
    }

    setState(prev => prev.uri ? prev : { uri: '', loading: true, error: false });

    try {
      const localUri = await cacheImage(imageUrl);
      setState({ uri: localUri, loading: false, error: false });
    } catch {
      // Use remote URL as fallback
      setState({ uri: imageUrl, loading: false, error: true });
    }
  }, []);

  useEffect(() => {
    loadImage(url);
  }, [url, loadImage]);

  return state;
}

/**
 * Prefetch an image without rendering a component
 */
export function prefetchImage(url: string): void {
  if (url && !memoryCache.has(url) && !pendingDownloads.has(url)) {
    cacheImage(url).catch(() => {});
  }
}

// ─── Component Wrapper ───────────────────────────────────

interface Props {
  source: { uri: string };
  style?: any;
  fallback?: React.ReactNode;
  placeholder?: React.ReactNode;
}

/**
 * Drop-in replacement for Image that adds caching.
 *
 * Usage:
 *   <CachedImage source={{ uri: exercise.demoUrl }} style={styles.thumbnail} />
 */
export function CachedImage({ source, style, fallback, placeholder }: Props) {
  const { uri, loading, error } = useCachedImage(source?.uri || '');

  if (loading && placeholder) return placeholder;
  if (error && fallback) return fallback;

  if (!uri) return null;

  return <Image source={{ uri }} style={style} />;
}
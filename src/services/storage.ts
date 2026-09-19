import { ref, deleteObject } from 'firebase/storage';
import { storage, auth } from '../lib/firebase';

/**
 * Uploads an image file to Supabase Storage via our secure backend endpoint (/api/storage/upload).
 * The backend authenticates the admin via their Firebase ID-token and uses the server-side
 * secret key to store the file permanently in the public 'sagomaskan-images' bucket.
 */
export async function uploadToSupabaseStorage(
  fileOrDataUrl: File | string,
  folder: 'products' | 'categories' | 'hero' = 'products',
  customName?: string
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Du måste vara inloggad som administratör för att ladda upp bilder.');
  }

  const idToken = await currentUser.getIdToken();
  if (!idToken) {
    throw new Error('Kunde inte verifiera admin-inloggningen. Vänligen logga in igen.');
  }

  let baseName: string = folder;
  if (typeof fileOrDataUrl !== 'string' && fileOrDataUrl.name) {
    baseName = fileOrDataUrl.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  } else if (customName) {
    baseName = customName.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  // Optimize/standardize image to lightweight WebP blob before network transmission
  let blob: Blob;
  if (folder === 'products') {
    const res = await standardizeProductImageToBlob(fileOrDataUrl, 1200, 0.88);
    blob = res.blob;
  } else {
    const maxDim = folder === 'hero' ? 1600 : 1200;
    const res = await compressImageToBlob(fileOrDataUrl, maxDim, maxDim, 0.85);
    blob = res.blob;
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Kunde inte läsa bildfilen för uppladdning.'));
    reader.readAsDataURL(blob);
  });

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      image: dataUrl,
      filename: baseName,
      folder,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Uppladdning till Supabase misslyckades (HTTP ${response.status}).`);
  }

  const result = await response.json();
  if (!result.url || !result.url.startsWith('http')) {
    throw new Error('Supabase returnerade ingen giltig permanent bild-URL.');
  }

  return result.url;
}

/**
 * Standardizes a product image into a consistent square 1:1 format on warm neutral #FAF8F5.
 * - Maintains product proportions without stretching or distortion
 * - Contain logic ensures the full product is 100% visible (never cropped)
 * - Centers the product horizontally and vertically
 * - Provides consistent visual breathing room (~88% max content dimension)
 * - Compresses into lightweight, high-quality WebP
 */
export async function standardizeProductImageToBlob(
  fileOrDataUrl: File | string,
  targetSize = 1200,
  quality = 0.88
): Promise<{ blob: Blob; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Bildstandardiseringen tog för lång tid (timeout).'));
    }, 10000);

    const handleDataUrl = (dataUrl: string, originalMime = 'image/jpeg') => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onerror = async () => {
        clearTimeout(timeoutId);
        try {
          const res = await fetch(dataUrl);
          const fallbackBlob = await res.blob();
          resolve({ blob: fallbackBlob, mimeType: fallbackBlob.type || originalMime });
        } catch {
          reject(new Error('Kunde inte läsa in bilddata för standardisering.'));
        }
      };
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            clearTimeout(timeoutId);
            fetch(dataUrl).then(r => r.blob()).then(b => resolve({ blob: b, mimeType: originalMime }));
            return;
          }

          // 1. Fill square canvas with warm neutral background #FAF8F5 matching the webshop
          ctx.fillStyle = '#FAF8F5';
          ctx.fillRect(0, 0, targetSize, targetSize);

          // 2. Scale proportionally (contain) with generous breathing room (max ~88% of target size, leaves ~72px padding)
          const maxContentDim = targetSize * 0.88;
          const imgWidth = Math.max(1, img.width || 1);
          const imgHeight = Math.max(1, img.height || 1);
          const scale = Math.min(maxContentDim / imgWidth, maxContentDim / imgHeight);
          const drawWidth = Math.round(imgWidth * scale);
          const drawHeight = Math.round(imgHeight * scale);

          // 3. Center horizontally and vertically within the square frame
          const offsetX = Math.round((targetSize - drawWidth) / 2);
          const offsetY = Math.round((targetSize - drawHeight) / 2);

          // 4. Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

          // 5. Output WebP blob (fallback to JPEG if needed)
          canvas.toBlob(
            (webpBlob) => {
              if (webpBlob && webpBlob.size > 0) {
                clearTimeout(timeoutId);
                resolve({ blob: webpBlob, mimeType: 'image/webp' });
              } else {
                canvas.toBlob(
                  (jpegBlob) => {
                    clearTimeout(timeoutId);
                    if (jpegBlob) {
                      resolve({ blob: jpegBlob, mimeType: 'image/jpeg' });
                    } else {
                      fetch(dataUrl).then(r => r.blob()).then(b => resolve({ blob: b, mimeType: originalMime }));
                    }
                  },
                  'image/jpeg',
                  quality
                );
              }
            },
            'image/webp',
            quality
          );
        } catch {
          clearTimeout(timeoutId);
          fetch(dataUrl).then(r => r.blob()).then(b => resolve({ blob: b, mimeType: originalMime }));
        }
      };
      img.src = dataUrl;
    };

    if (typeof fileOrDataUrl === 'string') {
      handleDataUrl(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onerror = () => {
        clearTimeout(timeoutId);
        resolve({ blob: fileOrDataUrl, mimeType: fileOrDataUrl.type || 'image/jpeg' });
      };
      reader.onload = (e) => {
        handleDataUrl(e.target?.result as string, fileOrDataUrl.type || 'image/jpeg');
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

/**
 * Compresses an image File or data URL into an optimized Blob (WebP/JPEG)
 * to keep Storage transfers extremely fast, lightweight, and high quality.
 */
export async function compressImageToBlob(
  fileOrDataUrl: File | string,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85
): Promise<{ blob: Blob; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Bildoptimeringen tog för lång tid (timeout).'));
    }, 8000);

    const handleDataUrl = (dataUrl: string, originalMime = 'image/jpeg') => {
      const img = new Image();
      img.onerror = async () => {
        clearTimeout(timeoutId);
        try {
          const res = await fetch(dataUrl);
          const fallbackBlob = await res.blob();
          resolve({ blob: fallbackBlob, mimeType: fallbackBlob.type || originalMime });
        } catch {
          reject(new Error('Kunde inte avkoda bilddata.'));
        }
      };
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            clearTimeout(timeoutId);
            fetch(dataUrl).then(r => r.blob()).then(b => resolve({ blob: b, mimeType: originalMime }));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first for optimal size & quality
          canvas.toBlob(
            (webpBlob) => {
              if (webpBlob && webpBlob.size > 0) {
                clearTimeout(timeoutId);
                resolve({ blob: webpBlob, mimeType: 'image/webp' });
              } else {
                // Fallback to JPEG
                canvas.toBlob(
                  (jpegBlob) => {
                    clearTimeout(timeoutId);
                    if (jpegBlob) {
                      resolve({ blob: jpegBlob, mimeType: 'image/jpeg' });
                    } else {
                      fetch(dataUrl).then(r => r.blob()).then(b => resolve({ blob: b, mimeType: originalMime }));
                    }
                  },
                  'image/jpeg',
                  quality
                );
              }
            },
            'image/webp',
            quality
          );
        } catch {
          clearTimeout(timeoutId);
          fetch(dataUrl).then(r => r.blob()).then(b => resolve({ blob: b, mimeType: originalMime }));
        }
      };
      img.src = dataUrl;
    };

    if (typeof fileOrDataUrl === 'string') {
      handleDataUrl(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onerror = () => {
        clearTimeout(timeoutId);
        resolve({ blob: fileOrDataUrl, mimeType: fileOrDataUrl.type || 'image/jpeg' });
      };
      reader.onload = (e) => {
        handleDataUrl(e.target?.result as string, fileOrDataUrl.type || 'image/jpeg');
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

/**
 * Uploads a category image to Supabase Storage:
 * 1. Optimizes the image into a clean WebP blob.
 * 2. Uploads to Supabase Storage under `sagomaskan-images/categories/{timestamp}_{name}.webp`.
 * 3. Returns the permanent, public HTTPS URL.
 */
export async function uploadCategoryImage(fileOrDataUrl: File | string, customName?: string): Promise<string> {
  return await uploadToSupabaseStorage(fileOrDataUrl, 'categories', customName);
}

/**
 * Uploads a product image to Supabase Storage:
 * 1. Optimizes the image into a clean WebP blob.
 * 2. Uploads to Supabase Storage under `sagomaskan-images/products/{timestamp}_{name}.webp`.
 * 3. Returns the permanent, public HTTPS URL.
 */
export async function uploadProductImage(file: File): Promise<string> {
  return await uploadToSupabaseStorage(file, 'products');
}

/**
 * Uploads a hero image to Supabase Storage:
 * 1. Optimizes the image into a clean WebP blob.
 * 2. Uploads to Supabase Storage under `sagomaskan-images/hero/{timestamp}_{name}.webp`.
 * 3. Returns the permanent, public HTTPS URL.
 */
export async function uploadHeroImage(file: File): Promise<string> {
  return await uploadToSupabaseStorage(file, 'hero');
}

export async function uploadLogoImage(file: File): Promise<string> {
  return await uploadToSupabaseStorage(file, 'hero', 'logo');
}

export async function uploadAboutImage(file: File): Promise<string> {
  return await uploadToSupabaseStorage(file, 'hero', 'about_craft');
}

/**
 * Legacy wrapper: reroutes any call to the secure Supabase storage function.
 */
export async function uploadToServerStorage(
  blobOrDataUrl: Blob | string,
  filename: string,
  folder: 'categories' | 'hero' = 'categories'
): Promise<string> {
  return await uploadToSupabaseStorage(blobOrDataUrl as any, folder, filename);
}

/**
 * Deletes an old category image from Firebase Storage if it's hosted there.
 */
export async function deleteStorageImage(url: string): Promise<void> {
  if (!url || typeof url !== 'string' || !url.includes('firebasestorage.googleapis.com')) {
    return;
  }
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Could not remove previous storage image:', err);
  }
}

/**
 * Ensures any category image (even if previously provided as base64 data) is
 * securely converted and uploaded, returning a valid download URL.
 */
export async function ensureStorageCategoryImageUrl(imageUrl: string, categoryName?: string): Promise<string> {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('data:image')) {
    return await uploadCategoryImage(imageUrl, categoryName || 'migrated_category');
  }
  return imageUrl;
}

/**
 * Normalizes any hero image value (URL, path, or legacy filename) into a valid URL.
 */
export function normalizeHeroImageUrl(urlOrFilename?: string): string {
  if (!urlOrFilename || typeof urlOrFilename !== 'string') return '';
  const trimmed = urlOrFilename.trim();
  if (!trimmed) return '';

  // Already a full URL, data URL, or absolute path
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  // If it's a bare filename like "178906...webp"
  if (
    trimmed.endsWith('.webp') ||
    trimmed.endsWith('.jpg') ||
    trimmed.endsWith('.jpeg') ||
    trimmed.endsWith('.png')
  ) {
    return `/uploads/hero/${trimmed}`;
  }

  return trimmed;
}

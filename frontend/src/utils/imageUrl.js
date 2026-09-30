/**
 * Resolves the full display URL for a complaint image.
 * - Handles Cloudinary / HTTP / HTTPS URLs directly (e.g. https://res.cloudinary.com/...)
 * - Handles relative local paths (e.g. /uploads/complaint-xxx.jpg) safely by prepending backend URL
 * - Handles missing/empty image URLs gracefully
 */
export const getComplaintImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (typeof imagePath === 'object' && imagePath.url) {
    imagePath = imagePath.url;
  }
  if (typeof imagePath !== 'string') return '';
  const trimmed = imagePath.trim();
  if (!trimmed) return '';

  // Cloudinary / full external HTTP or HTTPS URLs (used directly)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Legacy relative paths (e.g. /uploads/...)
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
  let backendBase = '';
  if (envUrl) {
    // Strip trailing /api or trailing slashes to get clean backend domain
    backendBase = envUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return backendBase ? `${backendBase}${cleanPath}` : cleanPath;
};

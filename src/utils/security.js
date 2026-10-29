/**
 * security.js
 *
 * Security utilities for MedWeb:
 * - URL validation & sanitization (prevents XSS via javascript: URLs)
 * - File upload validation (prevents SVG XSS, path traversal, oversized payloads)
 * - Safe input length enforcement at trust boundaries
 */

/**
 * Validates and sanitizes a URL string before it is rendered into an href attribute.
 * Only HTTP and HTTPS protocols are permitted. Blocks javascript:, data:, vbscript:, etc.
 *
 * @param {string} url - Untrusted URL input
 * @param {string} fallback - Fallback value if URL is unsafe or invalid (default '')
 * @returns {string} Sanitized URL or fallback
 */
export function sanitizeUrl(url, fallback = '') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (trimmed.length === 0) return fallback;

  // Disallow javascript:, data:, vbscript:, file: protocols
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return fallback;
  }

  // Safe relative paths starting with '/' or '#'
  if ((trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) || trimmed.startsWith('#')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
  } catch {
    // Invalid URL structure
  }
  return fallback;
}

/**
 * Strict image file validator for clinical prescription uploads.
 * Disallows vector formats (SVG) which can execute script, empty files, and oversized files.
 *
 * @param {File} file
 * @param {object|number} options - Options object with maxBytes or number for maxBytes
 * @returns {{ ok: boolean, valid: boolean, error?: string }}
 */
export function validateImageFile(file, options = {}) {
  const maxBytes = typeof options === 'number'
    ? options
    : (options?.maxBytes || 10 * 1024 * 1024); // 10 MB default

  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

  if (!file || typeof file !== 'object') {
    return { ok: false, valid: false, error: 'No file provided.' };
  }

  if (typeof file.size !== 'number' || file.size <= 0) {
    return { ok: false, valid: false, error: 'The selected file is empty.' };
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, valid: false, error: `The selected image exceeds the ${maxMb} MB limit.` };
  }

  const mime = (file.type || '').toLowerCase();
  const name = String(file.name || '');
  const lastDot = name.lastIndexOf('.');
  const ext = lastDot !== -1 ? name.slice(lastDot).toLowerCase() : '';

  // Explicitly reject SVGs or vector/scriptable formats
  if (mime.includes('svg') || mime.includes('xml') || mime.includes('html') || ext === '.svg') {
    return {
      ok: false,
      valid: false,
      error: 'SVG files are not permitted for security reasons.',
    };
  }

  if (!allowedMimeTypes.includes(mime)) {
    return {
      ok: false,
      valid: false,
      error: 'Please upload a valid image file (PNG, JPG, JPEG, or WEBP).',
    };
  }

  if (!allowedExtensions.includes(ext)) {
    return {
      ok: false,
      valid: false,
      error: 'File extension does not match allowed image formats (PNG, JPG, JPEG, or WEBP).',
    };
  }

  return { ok: true, valid: true };
}

/**
 * Sanitizes a filename to prevent path traversal and strip sensitive characters.
 *
 * @param {string} filename
 * @returns {string} Safe base filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'upload';
  const trimmed = filename.trim();
  if (!trimmed) return 'upload';

  // Strip path separators and null bytes
  let safe = trimmed.replace(/[\0\r\n\t]/g, '');
  safe = safe.replace(/.*[/\\]/, ''); // Strip path components
  safe = safe.replace(/\.\.+/g, ''); // Strip .. traversal
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  if (!safe.replace(/[_.]/g, '')) return 'upload';
  return safe || 'upload';
}

/**
 * Enforces maximum character boundaries on user-supplied text.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string} Truncated string
 */
export function enforceMaxLength(text, maxLength = 2000) {
  if (!text || typeof text !== 'string') return '';
  return text.slice(0, maxLength);
}


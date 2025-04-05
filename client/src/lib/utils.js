/**
 * Utility functions for the Q&A Assistant application
 */

import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names with Tailwind CSS support
 * @param {...string} inputs Class names to combine
 * @returns {string} Combined class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date in a readable format
 * @param {Date|string|number} date - The date to format
 * @param {string} formatStr - The format string 
 * @returns {string} Formatted date
 */
export function formatDate(date, formatStr = 'PPP') {
  if (!date) return '';
  try {
    return format(new Date(date), formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Get relative time from now (e.g., "2 hours ago")
 * @param {Date|string|number} date - The date to format
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (error) {
    console.error('Error getting relative time:', error);
    return '';
  }
}

/**
 * Truncate text to a specific length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length 
 * @returns {string} Truncated text
 */
export function truncateText(text, length = 100) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

/**
 * Extract host name from URL
 * @param {string} url - URL to process
 * @returns {string} Hostname or original URL if invalid
 */
export function getHostFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
}

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely parse JSON with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed object or fallback
 */
export function safeJsonParse(jsonString, fallback = {}) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
}

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Remove HTML tags from a string
 * @param {string} html - String containing HTML
 * @returns {string} Plain text without HTML
 */
export function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}

/**
 * Extract text snippets surrounding a search term
 * @param {string} text - Full text to search in
 * @param {string} searchTerm - Term to find
 * @param {number} snippetLength - Max length of each snippet
 * @param {number} maxSnippets - Maximum number of snippets to return
 * @returns {string[]} Array of snippets
 */
export function extractSnippets(text, searchTerm, snippetLength = 100, maxSnippets = 2) {
  if (!text || !searchTerm) return [];
  
  const snippets = [];
  const lowerText = text.toLowerCase();
  const lowerSearchTerm = searchTerm.toLowerCase();
  let lastIndex = 0;
  
  while (snippets.length < maxSnippets) {
    const index = lowerText.indexOf(lowerSearchTerm, lastIndex);
    if (index === -1) break;
    
    const start = Math.max(0, index - Math.floor(snippetLength / 2));
    const end = Math.min(text.length, index + searchTerm.length + Math.floor(snippetLength / 2));
    
    let snippet = text.slice(start, end);
    
    // Add ellipsis if snippet doesn't start at beginning of text
    if (start > 0) snippet = '...' + snippet;
    
    // Add ellipsis if snippet doesn't end at end of text
    if (end < text.length) snippet = snippet + '...';
    
    snippets.push(snippet);
    lastIndex = index + searchTerm.length;
  }
  
  return snippets;
}

/**
 * Generate a random ID
 * @param {number} length - Length of the ID
 * @returns {string} Random ID
 */
export function generateId(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Check if device is mobile
 * @returns {boolean} True if on mobile device
 */
export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if string is valid JSON
 * @param {string} str - String to check
 * @returns {boolean} True if valid JSON
 */
export function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted string
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Highlight search terms in text
 * @param {string} text - Text to search in
 * @param {string} term - Term to highlight
 * @param {string} highlightClass - CSS class for highlighted text
 * @returns {string} HTML with highlights
 */
export function highlightSearchTerm(text, term, highlightClass = 'bg-yellow-200') {
  if (!text || !term) return text;
  
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
}

/**
 * Get query parameters from URL
 * @returns {Object} Object with query parameters
 */
export function getQueryParams() {
  if (typeof window === 'undefined') return {};
  
  const params = {};
  const queryString = window.location.search.substring(1);
  
  if (!queryString) return params;
  
  const pairs = queryString.split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  
  return params;
}

/**
 * Sets dark mode class based on user preference
 * @param {string} theme - Theme preference ('dark', 'light', or 'system')
 */
export function setThemeClass(theme = 'system') {
  if (typeof window === 'undefined') return;
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    // System preference
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

/**
 * Function to detect if element is in viewport
 * @param {HTMLElement} el - Element to check
 * @param {number} offset - Offset from viewport edges
 * @returns {boolean} True if element is in viewport
 */
export function isInViewport(el, offset = 0) {
  if (!el || typeof window === 'undefined') return false;
  
  const rect = el.getBoundingClientRect();
  
  return (
    rect.top >= 0 - offset &&
    rect.left >= 0 - offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
}